# YouTube Downloader Web App

A modern web application for downloading YouTube videos and playlists with enhanced features. Built with React, TypeScript, and FastAPI.

## Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn

## Setup

1. Clone the repository:

```bash
git clone git@github.com:ayekus/youtube-downloader.git
cd youtube-downloader
```

2. Install backend dependencies:

```bash
cd backend
python -m pip install -r requirements.txt
cd ..
```

3. Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

4. Install root project dependencies:

```bash
npm install
```

## Development

To run the development servers:

```bash
npm run dev
```

This will start both the frontend and backend servers:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

You can also run them separately:

- Frontend only: `npm run frontend`
- Backend only: `npm run backend`

## Project Structure

```
youtube-downloader/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic
│   ├── requirements.txt
│   └── main.py
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── api/          # API integration
│   │   └── App.tsx       # Main application
│   └── package.json
│
└── package.json          # Root package.json for development scripts
```

## API Endpoints

- `GET /api/video/info?url=<video_url>` - Get video information
- `GET /api/playlist/info?url=<playlist_url>` - Get playlist information
- `POST /api/download` - Start a video download
- `WS /api/ws/download` - WebSocket endpoint for download progress
