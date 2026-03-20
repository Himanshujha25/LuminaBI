const pool = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_lumina_key';

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
             return res.status(400).json({ error: "All fields are required" });
        }
        
        // check if user exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "Email is already registered" });
        }
        
        // hash password (8 rounds for better speed while maintaining security)
        const salt = await bcrypt.genSalt(8);

        const hashed = await bcrypt.hash(password, salt);
        
        // save user
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashed]
        );
        
        const user = result.rows[0];
        
        // log them in
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ token, user, message: "Registration successful" });
        console.log("User registered successfully");
        console.log(user);
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Server error during registration." });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
             return res.status(400).json({ error: "All fields are required" });
        }
        
        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length === 0) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        
        const user = existing.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ token, user: { id: user.id, name: user.name, email: user.email }, message: "Login successful" });
        console.log("User logged in successfully");
        console.log(user);
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error during login." });
    }
};

const getMe = async (req, res) => {
    try {
         const user = await pool.query(
             'SELECT id, name, email, bio, ai_keys, preferred_provider, notification_prefs, created_at FROM users WHERE id = $1',
             [req.user.id]
         );
         if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });
         res.json({ user: user.rows[0] });
    } catch(err) {
         res.status(500).json({ error: "Server error fetching user" });
    }
}

const updateProfile = async (req, res) => {
    try {
        const { name, bio } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
        const result = await pool.query(
            'UPDATE users SET name = $1, bio = $2 WHERE id = $3 RETURNING id, name, email, bio',
            [name.trim(), bio || '', req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Server error updating profile.' });
    }
};

const deleteAccount = async (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password is required to delete account.' });
    }

    const client = await pool.connect();

    try {
        // Verify password first
        const userResult = await client.query('SELECT password FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password. Account deletion cancelled.' });
        }

        await client.query('BEGIN'); // Start transaction

        // 1. Get all table names for datasets owned by this user
        const datasetsRes = await client.query(
            'SELECT table_name FROM datasets WHERE user_id = $1',
            [userId]
        );

        // 2. Physically DROP the SQL tables created from CSVs
        for (let row of datasetsRes.rows) {
            // We use DROP TABLE IF EXISTS. 
            // Note: Use "" around table name to handle case sensitivity in Postgres
            await client.query(`DROP TABLE IF EXISTS "${row.table_name}"`);
        }

        // 3. Delete DB rows (Cascade handles some, but let's be explicit)
        await client.query('DELETE FROM chat_histories WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM dashboards WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM datasets WHERE user_id = $1', [userId]);
        
        // 4. Finally, delete the user
        const finalRes = await client.query('DELETE FROM users WHERE id = $1', [userId]);

        if (finalRes.rowCount === 0) {
            throw new Error("User not found");
        }

        await client.query('COMMIT');
        res.json({ message: "Account and all associated data wiped successfully." });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Account Wipe Error:", err);
        res.status(500).json({ error: "Could not fully delete account. Please contact admin." });
    } finally {
        client.release();
    }
};

const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return res.status(400).json({ error: 'Both current and new password are required.' });
        if (newPassword.length < 8)
            return res.status(400).json({ error: 'New password must be at least 8 characters.' });

        const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

        const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
        if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect.' });

        const hashed = await bcrypt.hash(newPassword, 8);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
        res.json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('Update password error:', err);
        res.status(500).json({ error: 'Server error updating password.' });
    }
};

const updateKeys = async (req, res) => {
    try {
        const { ai_keys, preferred_provider } = req.body;
        const result = await pool.query(
            'UPDATE users SET ai_keys = $1, preferred_provider = $2 WHERE id = $3 RETURNING id, name, email, bio, ai_keys, preferred_provider, notification_prefs',
            [JSON.stringify(ai_keys || {}), preferred_provider || 'gemini', req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Update keys error:', err);
        res.status(500).json({ error: 'Server error updating AI keys.' });
    }
};

const updateNotifications = async (req, res) => {
    try {
        const prefs = req.body;
        const result = await pool.query(
            'UPDATE users SET notification_prefs = $1 WHERE id = $2 RETURNING id, notification_prefs',
            [JSON.stringify(prefs), req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error('Update notifications error:', err);
        res.status(500).json({ error: 'Server error updating notification preferences.' });
    }
};

const getBillingStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get datasets count
        const datasetsResult = await pool.query(
            'SELECT COUNT(*) as count FROM datasets WHERE user_id = $1',
            [userId]
        );
        
        // Get storage usage (sum of file sizes)
        const storageResult = await pool.query(
            'SELECT COALESCE(SUM(file_size), 0) as total_size FROM datasets WHERE user_id = $1',
            [userId]
        );
        
        // Get AI queries count
        const queriesResult = await pool.query(
            'SELECT COUNT(*) as count FROM chat_histories WHERE user_id = $1',
            [userId]
        );
        
        const datasetsCount = parseInt(datasetsResult.rows[0].count);
        const storageMB = Math.round(parseInt(storageResult.rows[0].total_size) / (1024 * 1024));
        const queriesCount = parseInt(queriesResult.rows[0].count);
        
        res.json({
            datasets: datasetsCount,
            storage: storageMB,
            queries: queriesCount
        });
    } catch (err) {
        console.error('Get billing stats error:', err);
        res.status(500).json({ error: 'Server error fetching billing stats.' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });

        const userResult = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'No account found with this email address.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 600000); // 10 minutes

        await pool.query(
            'UPDATE users SET reset_otp = $1, reset_otp_expiry = $2 WHERE email = $3',
            [otp, otpExpiry, email]
        );
        
        await resend.emails.send({
            from: 'LuminaBI <onboarding@resend.dev>',
            to: email,
            subject: 'Your LuminaBI Password Reset OTP',
            html: `
                <h2>Password Reset OTP</h2>
                <p>Hi ${userResult.rows[0].name},</p>
                <p>Your OTP to reset your password is:</p>
                <h1 style="font-size: 32px; letter-spacing: 8px; color: #6366f1; margin: 24px 0;">${otp}</h1>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });
        
        res.json({ message: 'OTP sent to your email.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

        const userResult = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND reset_otp = $2 AND reset_otp_expiry > NOW()',
            [email, otp]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }

        res.json({ message: 'OTP verified successfully.' });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ error: 'Server error verifying OTP.' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) return res.status(400).json({ error: 'Email, OTP and password are required.' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

        const userResult = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND reset_otp = $2 AND reset_otp_expiry > NOW()',
            [email, otp]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }

        const hashed = await bcrypt.hash(password, 8);
        await pool.query(
            'UPDATE users SET password = $1, reset_otp = NULL, reset_otp_expiry = NULL WHERE id = $2',
            [hashed, userResult.rows[0].id]
        );

        res.json({ message: 'Password reset successfully.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error resetting password.' });
    }
};

module.exports = { register, login, getMe, deleteAccount, updatePassword, updateProfile, updateKeys, updateNotifications, getBillingStats, forgotPassword, verifyOtp, resetPassword };