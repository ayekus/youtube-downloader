import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;

export interface VideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  formats: Array<{
    format_id: string;
    ext: string;
    resolution?: string;
    filesize?: number;
    format_note?: string;
    tbr?: number;
  }>;
  webpage_url: string;
  description?: string;
  view_count?: number;
  uploader?: string;
}

export interface DownloadRequest {
  url: string;
  format_id?: string;
  extract_audio: boolean;
}

export interface DownloadProgress {
  status: string;
  downloaded_bytes?: number;
  total_bytes?: number;
  speed?: number;
  eta?: number;
  filename?: string;
  fragment_index?: number;
  fragment_count?: number;
  title?: string;
}

class ApiClient {
  async getVideoInfo(url: string): Promise<VideoInfo> {
    try {
      // First validate the URL format
      try {
        new URL(url);
      } catch {
        throw new Error("Please enter a valid URL");
      }

      // Try to fetch video info
      try {
        const response = await axios.get(`${API_BASE_URL}/video/info`, {
          params: { url },
        });

        if (!response.data || !response.data.title) {
          throw new Error("Invalid response from server");
        }
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // Handle specific HTTP error cases
          switch (error.response?.status) {
            case 400:
              throw new Error("Invalid video URL. Please check the URL and try again.");
            case 404:
              throw new Error("Video not found. It might be private or deleted.");
            case 429:
              throw new Error("Too many requests. Please try again later.");
            case 500:
              throw new Error("Server error. Please try again later.");
            default:
              throw new Error(error.response?.data?.detail || "Failed to fetch video information");
          }
        }
        throw new Error("Network error. Please check your internet connection.");
      }
    } catch (error) {
      // Ensure we always return an Error object with a message
      if (error instanceof Error) throw error;
      throw new Error("An unexpected error occurred");
    }
  }

  async getPlaylistInfo(url: string): Promise<VideoInfo[]> {
    const response = await axios.get(`${API_BASE_URL}/playlist/info`, {
      params: { url },
    });
    return response.data;
  }

  createDownloadSocket(): WebSocket {
    return new WebSocket(`${WS_URL}/download`);
  }

  async startDownload(request: DownloadRequest): Promise<{ message: string }> {
    const response = await axios.post(`${API_BASE_URL}/download`, request);
    return response.data;
  }
}

export const apiClient = new ApiClient();
