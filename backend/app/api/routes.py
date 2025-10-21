from fastapi import APIRouter, WebSocket, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel, HttpUrl

from app.services.downloader import YoutubeDownloadService, VideoInfo, DownloadProgress

router = APIRouter()
download_service = YoutubeDownloadService()

class DownloadRequest(BaseModel):
    url: HttpUrl
    format_id: Optional[str] = None
    extract_audio: bool = False

@router.get("/video/info", response_model=VideoInfo)
async def get_video_info(url: HttpUrl):
    """Get information about a video without downloading it."""
    try:
        return await download_service.get_video_info(str(url))
    except Exception as e:
        print(f"Error in get_video_info: {str(e)}")  # Log the error server-side
        if "No video information found" in str(e):
            raise HTTPException(status_code=404, detail="Video not found")
        elif "URL is not accessible" in str(e):
            raise HTTPException(status_code=400, detail="Invalid or inaccessible URL")
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch video information")

@router.get("/playlist/info", response_model=List[VideoInfo])
async def get_playlist_info(url: HttpUrl):
    """Get information about all videos in a playlist."""
    try:
        return await download_service.get_playlist_info(str(url))
    except Exception as e:
        print(f"Error in get_playlist_info: {str(e)}")  # Log the error server-side
        if "URL is not a playlist" in str(e):
            raise HTTPException(status_code=400, detail="The provided URL is not a playlist")
        elif "No playlist information found" in str(e):
            raise HTTPException(status_code=404, detail="Playlist not found")
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch playlist information")

@router.websocket("/ws/download")
async def websocket_download(websocket: WebSocket):
    """WebSocket endpoint for downloading videos with real-time progress updates."""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            
            async def progress_callback(progress: DownloadProgress):
                await websocket.send_json(progress.dict())
            
            try:
                title = await download_service.download_video(
                    url=data['url'],
                    format_id=data.get('format_id'),
                    extract_audio=data.get('extract_audio', False),
                    callback=progress_callback
                )
                await websocket.send_json({"status": "completed", "title": title})
            except Exception as e:
                await websocket.send_json({"status": "error", "message": str(e)})
                
    except Exception as e:
        await websocket.close(code=1000)

@router.post("/download")
async def download_video(request: DownloadRequest, background_tasks: BackgroundTasks):
    """Start a video download in the background."""
    try:
        background_tasks.add_task(
            download_service.download_video,
            url=str(request.url),
            format_id=request.format_id,
            extract_audio=request.extract_audio
        )
        return {"message": "Download started"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))