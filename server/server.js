const express = require("express");
const cors = require("cors");
const compression = require("compression");
const multer = require('multer');
const { Resend } = require('resend'); // Import Resend
require('dotenv').config();

const apiRoutes = require('./routes/api');
const setupDb = require('./db/setup');
const { handleQuery } = require('./controllers/queryController');

// ── Crash prevention ──────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('🔴 [uncaughtException] Server kept alive:', err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🔴 [unhandledRejection] Server kept alive:', reason?.message || reason);
});
// ─────────────────────────────────────────────────────────

const app = express();

// Secure multer by limiting file size and count
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

setupDb();

app.use('/api', apiRoutes);
app.post("/query", handleQuery);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.post('/api/support', upload.any(), async (req, res) => {
  try {
    // 1. Grab the name if you have it, otherwise just use the email
    const { email, name, issueType, description } = req.body;
    const files = req.files || [];

    // 2. Create a dynamic display name
    // E.g., If name is missing, turns "john.doe@gmail.com" into "john.doe"
    const displayName = name || email.split('@')[0]; 

    const attachments = files.map(f => ({
        filename: f.originalname,
        content: f.buffer
    }));

    const { data, error } = await resend.emails.send({
      // 3. Inject the dynamic name here, but keep your verified email in the brackets!
      from: `${displayName} (Lumina Support) <onboarding@resend.dev>`, 
      to: 'jhahimanshu930@gmail.com', // Keep this as your own email while testing
      reply_to: email, // This makes the "Reply" button work correctly!
      subject: `[Lumina BI Support] ${issueType.toUpperCase()} Issue`,
      html: `
        <h3>New Support Request</h3>
        <p><strong>User:</strong> ${email}</p>
        <p><strong>Type:</strong> ${issueType}</p>
        <p><strong>Description:</strong><br/>${description.replace(/\n/g, '<br/>')}</p>
      `,
      attachments: attachments
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Support ticket submitted successfully." });
    
  } catch (error) {
    res.status(500).json({ error: "Failed to send the report." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});