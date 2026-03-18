# LuminaBI

A conversational Business Intelligence (BI) dashboard that allows non-technical users to generate fully functional, interactive data dashboards using natural languages.

## Features
- **Upload Datasets**: Automatically parses CSV datasets and indexes them via PostgreSQL schema generation.
- **Conversational Queries**: Simply ask questions about your data in plain English.
- **Dynamic AI Visuals**: Automatically selects the most optimal charts (Pie, Bar, Area, Line, Scatter).
- **Persistent Memory**: Chat histories and analytics are permanently bound to their datasets so you never lose context.
- **Agentic Chat Orchesration**: System understands when to execute complex ILIKE/Aggregation SQL versus answering normal conversational knowledge loops.

## Tech Stack
- Frontend: React / Vite / Recharts
- Backend: Node.js / Express
- Database: PostgreSQL
- LLM Integration: Google Gemini 2.5 Flash

## How to Run

1. Clone repo
2. Navigate to `/server` and run `npm install`, then `node server.js`
3. Navigate to `/client` and run `npm install`, then `npm run dev`
