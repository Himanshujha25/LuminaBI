const pool = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_lumina_key';

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
             return res.status(400).json({ error: "All fields are required" });
        }
        
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "Email is already registered" });
        }
        
        const salt = await bcrypt.genSalt(8);
        const hashed = await bcrypt.hash(password, salt);
        
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashed]
        );
        
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ token, user, message: "Registration successful" });
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
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ token, user: { id: user.id, name: user.name, email: user.email }, message: "Login successful" });
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
    if (!password) return res.status(400).json({ error: 'Password is required to delete account.' });
    const client = await pool.connect();
    try {
        const userResult = await client.query('SELECT password FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect password. Account deletion cancelled.' });

        await client.query('BEGIN');
        const datasetsRes = await client.query('SELECT table_name FROM datasets WHERE user_id = $1', [userId]);
        for (let row of datasetsRes.rows) {
            await client.query(`DROP TABLE IF EXISTS "${row.table_name}"`);
        }
        await client.query('DELETE FROM chat_histories WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM dashboards WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM datasets WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        await client.query('COMMIT');
        res.json({ message: "Account and all associated data wiped successfully." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Account Wipe Error:", err);
        res.status(500).json({ error: "Could not fully delete account." });
    } finally {
        client.release();
    }
};

const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both current and new password are required.' });
        if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
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
        const datasetsResult = await pool.query('SELECT COUNT(*) as count FROM datasets WHERE user_id = $1', [userId]);
        const storageResult = await pool.query('SELECT COALESCE(SUM(file_size), 0) as total_size FROM datasets WHERE user_id = $1', [userId]);
        const queriesResult = await pool.query('SELECT COUNT(*) as count FROM chat_histories WHERE user_id = $1', [userId]);
        
        res.json({
            datasets: parseInt(datasetsResult.rows[0].count),
            storage: Math.round(parseInt(storageResult.rows[0].total_size) / (1024 * 1024)),
            queries: parseInt(queriesResult.rows[0].count)
        });
    } catch (err) {
        console.error('Get billing stats error:', err);
        res.status(500).json({ error: 'Server error fetching billing stats.' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });
        const userRes = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.json({ message: "If an account exists, an OTP has been sent." });

        const user = userRes.rows[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query('UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3', [otp, expiresAt, user.id]);

        await sendEmail({
            to: email,
            subject: 'LuminaBI - Password Reset OTP',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
                    <h2 style="color: #6366f1;">Reset Your Password</h2>
                    <p>Hi ${user.name},</p>
                    <p>Your OTP code for password reset is:</p>
                    <div style="background: #f4f4f9; padding: 10px 20px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #6366f1; display: inline-block;">${otp}</div>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            `
        });
        res.json({ message: "OTP sent to your email." });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ error: "Error processing forgot password request." });
    }
};

const resetPasswordWithOtp = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ error: "All fields are required" });
        const userRes = await pool.query('SELECT id, otp_code, otp_expires_at FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.status(400).json({ error: "Invalid request." });

        const user = userRes.rows[0];
        if (!user.otp_code || user.otp_code !== otp || new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        const hashed = await bcrypt.hash(newPassword, 8);
        await pool.query('UPDATE users SET password = $1, otp_code = NULL, otp_expires_at = NULL WHERE id = $2', [hashed, user.id]);
        res.json({ message: "Password reset successful." });
    } catch (err) {
        res.status(500).json({ error: "Error resetting password." });
    }
};

module.exports = { register, login, getMe, deleteAccount, updatePassword, updateProfile, updateKeys, updateNotifications, getBillingStats, forgotPassword, resetPasswordWithOtp };