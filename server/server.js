const express = require("express");
const cors = require("cors");
const apiRoutes = require('./routes/api');
const setupDb = require('./db/setup');
const { handleQuery } = require('./controllers/queryController');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://lumina-bi.vercel.app"
  ]
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Setup Metadata DB table
setupDb();

// Routes
app.use('/api', apiRoutes);

// Legacy route fallback for previous UI structure
app.post("/query", handleQuery);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});