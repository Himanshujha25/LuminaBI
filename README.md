# DashTalk

A **conversational Business Intelligence (BI) dashboard** that allows non-technical users to generate fully functional, interactive data dashboards using natural language.

## Features
- **Upload Datasets**: Automatically parses CSV datasets and indexes them via PostgreSQL schema generation.
- **Conversational Queries**: Simply ask questions about your data in plain English.
- **Dynamic AI Visuals**: Automatically selects the most optimal charts (Pie, Bar, Area, Line, Scatter).
- **Persistent Memory**: Chat histories and analytics are permanently bound to their datasets so you never lose context.
- **Agentic Chat Orchestration**: System understands when to execute complex ILIKE/Aggregation SQL versus answering normal conversational knowledge loops.
- **Real-time Collaboration**: Invite collaborators to your datasets via email and collaborate in real-time.

## Tech Stack
- Frontend: React / Vite / Recharts / TailwindCSS
- Backend: Node.js / Express
- Database: PostgreSQL (Neon)
- LLM Integration: Google Gemini 2.5 Flash
- Real-time: Socket.io

## How to Run

### Prerequisites
- Node.js >= 18
- A `server/.env` file with the following keys:
  ```
  DATABASE_URL=...
  GEMINI_API_KEY=...
  RESEND_API_KEY=...
  JWT_SECRET=...
  ```

### Start the Backend
```bash
cd server
npm install
node server.js
# → http://localhost:5050
```

### Start the Frontend
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

## Deployment
- Frontend → Vercel
- Backend → Render
