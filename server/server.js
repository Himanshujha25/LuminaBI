const express = require("express");
const cors = require("cors");
const compression = require("compression");
const multer = require('multer');
const { Resend } = require('resend');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const setupDb = require('./db/setup');

// ── Crash prevention ──────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('🔴 [uncaughtException] Server kept alive:', err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🔴 [unhandledRejection] Server kept alive:', reason?.message || reason);
});
// ─────────────────────────────────────────────────────────

// Validate required environment variables at startup
const required = ['GEMINI_API_KEY', 'DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.warn(`⚠️  Missing env vars: ${missing.join(', ')} — using unsafe defaults for some.`);
}

const app = express();

// Multer for support attachments (memory storage, 5MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 }
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(compression());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://lumina-bi.vercel.app",
    "https://luminabi.onrender.com",
    "http://192.168.29.122:5173"
  ],
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Run DB migrations / table setup
setupDb();

// ── All API routes (auth, datasets, query, dashboards, exports) ──
app.use('/api', apiRoutes);

// ── Health check ──
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Support email via Resend ──
app.post('/api/support', upload.any(), async (req, res) => {
  try {
    const { email, name, issueType, description } = req.body;
    const files = req.files || [];

    if (!email || !issueType || !description) {
      return res.status(400).json({ error: "email, issueType and description are required." });
    }

    const displayName = name || email.split('@')[0];

    const attachments = files.map(f => ({
      filename: f.originalname,
      content: f.buffer
    }));

    const { data, error } = await resend.emails.send({
      from: `${displayName} (Lumina Support) <onboarding@resend.dev>`,
      to: 'jhahimanshu930@gmail.com',
      reply_to: email,
      subject: `[Lumina BI Support] ${issueType.toUpperCase()} Issue`,
      html: `
        <h3>New Support Request</h3>
        <p><strong>User:</strong> ${email}</p>
        <p><strong>Type:</strong> ${issueType}</p>
        <p><strong>Description:</strong><br/>${description.replace(/\n/g, '<br/>')}</p>
      `,
      attachments
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Support ticket submitted successfully." });

  } catch (error) {
    console.error("Support email error:", error);
    res.status(500).json({ error: "Failed to send the report." });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});