from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="YouTube Downloader API",
             description="API for downloading YouTube videos with enhanced features",
             version="2.0.0")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # React development server (default)
        "http://localhost:5173",    # Vite development server
        "http://127.0.0.1:5173",   # Vite development server (alternative)
        "http://localhost:5174",    # Vite development server (alternate port)
        "http://127.0.0.1:5174",   # Vite development server (alternate port alternative)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create downloads directory if it doesn't exist
downloads_dir = os.path.expanduser("~/Downloads/youtube")
os.makedirs(downloads_dir, exist_ok=True)

# Mount downloads directory for serving files
app.mount("/downloads", StaticFiles(directory=downloads_dir), name="downloads")

# Import and include routers
from app.api.routes import router as api_router
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)