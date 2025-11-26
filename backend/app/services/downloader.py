from typing import Dict, List, Optional, Union, Callable
import os
import asyncio
from yt_dlp import YoutubeDL
from pydantic import BaseModel
from datetime import datetime

class VideoInfo(BaseModel):
    id: str
    title: str
    duration: int
    thumbnail: str
    formats: List[Dict]
    webpage_url: str
    description: Optional[str] = None
    view_count: Optional[int] = None
    uploader: Optional[str] = None
    playlist_index: Optional[int] = None

class PlaylistInfo(BaseModel):
    id: str
    title: str
    uploader: Optional[str] = None
    video_count: int
    videos: List[VideoInfo]
    webpage_url: str

class DownloadProgress(BaseModel):
    status: str
    video_id: str
    title: str
    downloaded_bytes: Optional[int] = None
    total_bytes: Optional[int] = None
    speed: Optional[float] = None
    eta: Optional[int] = None
    filename: Optional[str] = None
    playlist_index: Optional[int] = None
    error: Optional[str] = None
    fragment_index: Optional[int] = None
    fragment_count: Optional[int] = None

class BatchDownloadProgress(BaseModel):
    status: str
    total_videos: int
    completed_videos: int
    current_video: Optional[DownloadProgress] = None
    failed_videos: List[Dict[str, str]] = []
    playlist_title: Optional[str] = None
    
class YoutubeDownloadService:
    def __init__(self):
        self.downloads_dir = os.path.expanduser("~/Downloads/youtube")
        os.makedirs(self.downloads_dir, exist_ok=True)
        self.progress_callbacks = {}

    async def get_video_info(self, url: str, playlist_index: Optional[int] = None) -> VideoInfo:
        """Fetch video information without downloading."""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'nocheckcertificate': True
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info:
                    raise Exception("No video information found")
                
                # Filter and sort formats
                formats = []
                for f in info.get('formats', []):
                    # Only include formats that either:
                    # 1. Have both video and audio
                    # 2. Are MP4 video only (will be merged with best audio)
                    # 3. Are audio only formats
                    if ((f.get('acodec') != 'none' and f.get('vcodec') != 'none') or  # Combined formats
                        (f.get('vcodec') != 'none' and f.get('ext') == 'mp4') or      # MP4 video formats
                        (f.get('acodec') != 'none' and f.get('vcodec') == 'none')):   # Audio only formats
                        
                        format_note = []
                        if f.get('height'):
                            format_note.append(f"{f['height']}p")
                        if f.get('fps'):
                            format_note.append(f"{f['fps']}fps")
                        
                        # Indicate if this is a combined format or will need merging
                        if f.get('acodec') != 'none' and f.get('vcodec') != 'none':
                            format_note.append('video+audio')
                        elif f.get('acodec') == 'none':
                            format_note.append('video-only')
                        elif f.get('vcodec') == 'none':
                            format_note.append('audio-only')
                            
                        formats.append({
                            'format_id': f['format_id'],
                            'ext': f['ext'],
                            'filesize': f.get('filesize'),
                            'format_note': ' '.join(format_note),
                            'tbr': f.get('tbr'),  # Total bitrate
                            'has_audio': f.get('acodec') != 'none',
                            'has_video': f.get('vcodec') != 'none',
                        })
                
                # Sort formats by quality (bitrate)
                formats.sort(key=lambda x: float('-inf') if x.get('tbr') is None else x['tbr'], reverse=True)
                
                video_info = VideoInfo(
                    id=info['id'],
                    title=info.get('title'),
                    duration=info.get('duration'),
                    thumbnail=info.get('thumbnail'),
                    formats=formats,
                    webpage_url=info.get('webpage_url'),
                    description=info.get('description'),
                    view_count=info.get('view_count'),
                    uploader=info.get('uploader'),
                    playlist_index=playlist_index
                )
                return video_info
        except Exception as e:
            raise
                
    async def get_playlist_info(self, url: str) -> PlaylistInfo:
        """Fetch playlist information without downloading."""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,  # Only extract video metadata
            'nocheckcertificate': True
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info:
                    raise Exception("No playlist information found")
                
                # Check if it's actually a playlist
                if 'entries' not in info:
                    raise Exception("URL is not a playlist")
                
                # Get basic video info for each entry
                entries = []
                for idx, entry in enumerate(info['entries'], 1):
                    if entry:  # Some entries might be None if video is private/deleted
                        video_info = VideoInfo(
                            id=entry['id'],
                            title=entry.get('title'),
                            duration=entry.get('duration'),
                            thumbnail=entry.get('thumbnail'),
                            formats=[],  # Will be populated when downloading
                            webpage_url=entry.get('webpage_url'),
                            uploader=entry.get('uploader'),
                            playlist_index=idx
                        )
                        entries.append(video_info)

                playlist_info = PlaylistInfo(
                    id=info['id'],
                    title=info.get('title'),
                    uploader=info.get('uploader'),
                    description=info.get('description'),
                    webpage_url=info.get('webpage_url'),
                    videos=entries
                )
                
                return playlist_info
        except Exception as e:
            print(f"Error fetching playlist info: {str(e)}")
            raise
            
    async def batch_download_playlist(self, url: str, format_id: str = None, callback: Callable = None) -> List[str]:
        """Download all videos in a playlist."""
        try:
            # First get playlist info
            playlist_info = await self.get_playlist_info(url)
            total_videos = len(playlist_info.videos)
            
            # Initialize batch progress
            batch_progress = BatchDownloadProgress(
                total_videos=total_videos,
                completed_videos=0,
                current_video_title="",
                current_video_progress=0,
                start_time=datetime.now(),
                estimated_time_remaining=None
            )
            
            downloaded_files = []
            
            # Download each video
            for idx, video in enumerate(playlist_info.videos, 1):
                try:
                    # Update progress
                    batch_progress.current_video_title = video.title
                    batch_progress.current_video_progress = 0
                    
                    if callback:
                        callback(batch_progress)
                    
                    # Custom progress hook for current video
                    def progress_hook(d):
                        if d['status'] == 'downloading':
                            # Update individual video progress
                            try:
                                downloaded = d.get('downloaded_bytes', 0)
                                total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                                if total > 0:
                                    progress = (downloaded / total) * 100
                                    batch_progress.current_video_progress = progress
                                    
                                    # Update estimated time remaining
                                    elapsed_time = (datetime.now() - batch_progress.start_time).total_seconds()
                                    videos_per_second = batch_progress.completed_videos / elapsed_time if elapsed_time > 0 else 0
                                    if videos_per_second > 0:
                                        remaining_videos = total_videos - batch_progress.completed_videos
                                        estimated_seconds = remaining_videos / videos_per_second
                                        batch_progress.estimated_time_remaining = int(estimated_seconds)
                                    
                                    if callback:
                                        callback(batch_progress)
                            except Exception as e:
                                print(f"Error in progress hook: {str(e)}")
                    
                    # Download the video
                    file_path = await self.download_video(
                        video.webpage_url,
                        format_id=format_id,
                        progress_hooks=[progress_hook]
                    )
                    
                    # Update batch progress
                    batch_progress.completed_videos += 1
                    downloaded_files.append(file_path)
                    
                    if callback:
                        callback(batch_progress)
                        
                except Exception as e:
                    print(f"Error downloading video {video.title}: {str(e)}")
                    # Continue with next video instead of failing entire playlist
                    continue
            
            return downloaded_files
            
        except Exception as e:
            print(f"Error in batch download: {str(e)}")
            raise

    def _progress_hook(self, d: Dict):
        """Handle download progress updates."""
        video_id = d.get('info_dict', {}).get('id')
        if not video_id or video_id not in self.progress_callbacks:
            return

        callback = self.progress_callbacks[video_id]
        try:
            if d['status'] == 'downloading':
                # Get all progress info
                info_dict = d.get('info_dict', {})
                progress = DownloadProgress(
                    status='downloading',
                    video_id=video_id,
                    title=info_dict.get('title', 'Unknown'),
                    downloaded_bytes=d.get('downloaded_bytes'),
                    total_bytes=d.get('total_bytes') or d.get('total_bytes_estimate'),
                    speed=d.get('speed'),
                    eta=d.get('eta'),
                    filename=d.get('filename'),
                    fragment_index=d.get('fragment_index'),
                    fragment_count=d.get('fragment_count')
                )
                
                # Always send progress updates to ensure UI stays current
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    loop.run_until_complete(callback(progress))
                finally:
                    loop.close()
            elif d['status'] == 'finished':
                # Only report finished status for the final output file
                # During audio extraction, ignore intermediate files (like .webm)
                filename = d.get('filename', '')
                info_dict = d.get('info_dict', {})
                
                # Skip intermediate files during postprocessing
                # The final file will be .mp3 for audio or .mp4 for video
                if filename.endswith(('.webm', '.m4a', '.mkv', '.f')):
                    return
                
                progress = DownloadProgress(
                    status='finished',
                    video_id=video_id,
                    title=info_dict.get('title', 'Unknown'),
                    filename=filename
                )
                asyncio.run(callback(progress))
        except Exception as e:
            pass  # Silently ignore progress hook errors

    async def download_video(self, url: str, format_id: str = None, extract_audio: bool = False, start_time: Optional[int] = None, end_time: Optional[int] = None, callback=None):
        """Download video with specified format and options."""
        if extract_audio:
            # Audio extraction configuration
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(self.downloads_dir, '%(title)s.%(ext)s'),
                'progress_hooks': [self._progress_hook],
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'quiet': True,
                'nocheckcertificate': True,
                'prefer_ffmpeg': True,
                'keepvideo': False,  # Don't keep the video file for audio extraction
            }
        else:
            # Video download configuration
            ydl_opts = {
                'format': format_id if format_id else 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'merge_output_format': 'mp4',
                'outtmpl': os.path.join(self.downloads_dir, '%(title)s.%(ext)s'),
                'progress_hooks': [self._progress_hook],
                'postprocessors': [{
                    'key': 'FFmpegVideoConvertor',
                    'preferedformat': 'mp4',  # Ensure final format is MP4
                }],
                'quiet': True,
                'nocheckcertificate': True,
                'prefer_ffmpeg': True,
                'keepvideo': True,  # Keep the video file after merging
                'postprocessor_args': [
                    # FFmpeg arguments to ensure audio is properly copied
                    '-c:v', 'copy',  # Copy video codec
                    '-c:a', 'aac',   # Convert audio to AAC
                    '-strict', 'experimental'  # Allow experimental codecs if needed
                ]
            }

        if start_time is not None and end_time is not None:
            ydl_opts['download_ranges'] = lambda info, ydl: [{'start_time': start_time, 'end_time': end_time}]
            # Force keyframe cutting for more accurate trimming, though it might be less precise without re-encoding
            # For audio, re-encoding is usually fine.
            ydl_opts['force_keyframes_at_cuts'] = True

        video_id = None  # Initialize video_id outside try block
        try:
            with YoutubeDL(ydl_opts) as ydl:
                # First get video info to get the ID
                info = ydl.extract_info(url, download=False)
                video_id = info.get('id')
                if not video_id:
                    raise Exception("Could not get video ID")

                # Set up callback if provided
                if callback:
                    self.progress_callbacks[video_id] = callback

                # Download the video
                await asyncio.get_event_loop().run_in_executor(None, ydl.download, [url])
                return info.get('title')
        except Exception as e:
            raise Exception(f"Error downloading video: {str(e)}")
        finally:
            # Clean up callback in finally block to ensure it always runs
            if video_id and video_id in self.progress_callbacks:
                del self.progress_callbacks[video_id]

