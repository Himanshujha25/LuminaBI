const express = require("express");
const cors = require("cors");
const compression = require("compression");
const multer = require('multer');
const { Resend } = require('resend'); // Import  //test
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
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://lumina-bi.vercel.app",
  "https://luminabi.onrender.com",
  "http://192.168.29.122:5173",
  "http://localhost:5050",
  "http://127.0.0.1:5050",
]);

app.use(compression());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use('/api', apiRoutes);
app.post("/query", handleQuery);
app.get('/health', (_, res) => {
  const db = require('./db/db');
  const dbStatus = db.dbState.ready ? 'ok' : 'error';
  const payload = {
    status: db.dbState.ready ? 'ok' : 'degraded',
    database: dbStatus,
  };

  if (db.dbState.lastError) {
    payload.databaseError = db.dbState.lastError.message || String(db.dbState.lastError);
  }

  res.status(db.dbState.ready ? 200 : 503).json(payload);
});

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

const http = require('http');
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5050; // Changed from 5001 to 5050

async function startServer() {
  const dbReady = await setupDb();

  if (!dbReady) {
    console.error('❌ Server startup aborted: database connection failed. Check DATABASE_URL in server/.env.');
    process.exit(1);
  }

  const server = http.createServer(app);
  
  // Real-time Socket.io initialization
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin not allowed by Socket.io: ${origin}`));
        }
      },
      credentials: true
    }
  });

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_lumina_key';

  // Socket Auth Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(); // Allow guest for now or return next(new Error('Auth error'))

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error('Socket auth failed:', err.message);
      next(); // Still let them connect, but without socket.user
    }
  });

  // Export io to be used in controllers if needed
  app.set('io', io);

  io.on('connection', (socket) => {
    console.log('⚡ [Socket] New client connected:', socket.id, socket.user ? `(User: ${socket.user.id})` : '(Guest)');

    if (socket.user) {
      // Join a personal room for this user
      socket.join(`user_${socket.user.id}`);
      
      // Also join by email for easier targeting by email (invites)
      if (socket.user.email) {
        socket.join(`email_${socket.user.email}`);
      }
    }

    socket.on('join-dataset', (datasetId) => {
      if (!datasetId) return;
      // Ensure we join a sanitized room name
      const room = `dataset_${String(datasetId)}`;
      socket.join(room);
      console.log(`⚡ [Socket] Client ${socket.id} joined ${room}`);
    });

    socket.on('pin-chart', (data) => {
      const { datasetId, userId } = data;
      // Broadcast to specific dataset room (collaborators) AND user room (cross-tab)
      if (datasetId) io.to(`dataset_${String(datasetId)}`).emit('pins-updated', { datasetId, userId });
      if (userId) io.to(`user_${userId}`).emit('pins-updated', { userId });
      console.log(`⚡ [Socket] Pins updated for dataset ${datasetId} / user ${userId}`);
    });

    socket.on('chat-updated', (datasetId) => {
        if (!datasetId) return;
        io.to(`dataset_${String(datasetId)}`).emit('chat-updated', { datasetId });
        console.log(`⚡ [Socket] Chat system re-sync for dataset ${datasetId}`);
    });

    socket.on('disconnect', () => {
      console.log('⚡ [Socket] Client disconnected:', socket.id);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`⚡ Real-time Socket.io enabled`);
  });
}

startServer();
