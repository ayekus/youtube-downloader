import { useState, useEffect, useCallback } from "react";
import {
  ChakraProvider,
  Container,
  VStack,
  Input,
  Button,
  useToast,
  Text,
  Heading,
  Box,
  HStack,
  Skeleton,
  ColorModeScript,
} from "@chakra-ui/react";
import theme from "./theme";
import { apiClient } from "./api/client";
import type { VideoInfo, DownloadProgress } from "./api/client";
import { VideoPreview } from "./components/VideoPreview";
import { DownloadOptions } from "./components/DownloadOptions";
import { DownloadProgressBar } from "./components/DownloadProgressBar";
import { ThemeToggle } from "./components/ThemeToggle";

function App() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isInitializingDownload, setIsInitializingDownload] = useState(false);
  const toast = useToast();

  const handleUrlSubmit = async () => {
    if (!url) return;

    setIsLoading(true);
    setVideo(null);
    setDownloadProgress(null);

    try {
      const videoInfo = await apiClient.getVideoInfo(url);

      if (!videoInfo || !videoInfo.title) {
        throw new Error("Invalid video information received");
      }

      setVideo(videoInfo);
      toast({
        title: "Success",
        description: "Video information loaded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      let errorMessage = "Failed to fetch video information. Please check the URL.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setVideo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(
    (formatId: string, extractAudio: boolean) => {
      if (!video) {
        toast({
          title: "Error",
          description: "No video selected",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setIsInitializingDownload(true);

      let reconnectAttempts = 0;
      const maxReconnectAttempts = 3;
      let ws: WebSocket;

      const connectWebSocket = () => {
        ws = apiClient.createDownloadSocket();

        ws.onopen = () => {
          setIsInitializingDownload(false);
          try {
            ws.send(
              JSON.stringify({
                url: video.webpage_url,
                format_id: formatId,
                extract_audio: extractAudio,
              })
            );
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to start download",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            ws.close();
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setDownloadProgress(data);

            if (data.status === "completed") {
              ws.close();
              // Update the download progress with finished state instead of showing toast
              setDownloadProgress({
                ...data,
                status: "finished",
              });
            } else if (data.status === "error") {
              ws.close();
              toast({
                title: "Download Error",
                description: data.message || "Failed to download video",
                status: "error",
                duration: 5000,
                isClosable: true,
              });
              setDownloadProgress(null);
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Invalid response from server",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            ws.close();
          }
        };

        ws.onerror = () => {
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            toast({
              title: "Connection Error",
              description: `Reconnecting (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`,
              status: "warning",
              duration: 3000,
              isClosable: true,
            });
            setTimeout(connectWebSocket, 1000 * reconnectAttempts);
          } else {
            toast({
              title: "Error",
              description: "Failed to connect to download server",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            setDownloadProgress(null);
          }
        };

        ws.onclose = (event) => {
          if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            toast({
              title: "Connection Lost",
              description: `Reconnecting (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`,
              status: "warning",
              duration: 3000,
              isClosable: true,
            });
            setTimeout(connectWebSocket, 1000 * reconnectAttempts);
          }
        };
      };

      connectWebSocket();

      // Cleanup function
      return () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    },
    [video, toast]
  );

  // Clear download progress only when starting a new download
  useEffect(() => {
    if (isInitializingDownload) {
      setDownloadProgress(null);
    }
  }, [isInitializingDownload]);

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Container maxW={{ base: "95%", md: "container.md" }} py={{ base: 4, md: 8 }}>
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          <Heading as="h1" size={{ base: "lg", md: "xl" }} textAlign="center" px={2}>
            YouTube Downloader
          </Heading>

          <Text textAlign="center" color="gray.600" fontSize={{ base: "sm", md: "md" }} px={2}>
            Download videos and playlists from YouTube in various formats
          </Text>

          <VStack spacing={4} px={2}>
            <Input
              placeholder="Enter YouTube URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              size={{ base: "md", md: "lg" }}
              width="full"
            />
            <Button
              colorScheme="blue"
              onClick={handleUrlSubmit}
              isLoading={isLoading}
              size={{ base: "md", md: "lg" }}
              width="full"
            >
              Get Video Info
            </Button>
          </VStack>

          {isLoading ? (
            <VStack spacing={4}>
              <Box p={4} borderWidth="1px" borderRadius="lg" width="100%">
                <HStack spacing={4}>
                  <Skeleton height="112px" width="200px" borderRadius="md" />
                  <VStack align="start" flex={1} spacing={2}>
                    <Skeleton height="24px" width="80%" />
                    <Skeleton height="20px" width="60%" />
                    <Skeleton height="20px" width="40%" />
                  </VStack>
                </HStack>
              </Box>
              <Box p={4} borderWidth="1px" borderRadius="lg" width="100%">
                <VStack spacing={4} align="stretch">
                  <Skeleton height="40px" />
                  <Skeleton height="24px" />
                  <Skeleton height="40px" />
                </VStack>
              </Box>
            </VStack>
          ) : (
            video && (
              <>
                <VideoPreview video={video} />
                <DownloadOptions
                  video={video}
                  onDownload={handleDownload}
                  isLoading={downloadProgress?.status === "downloading"}
                  isInitializingDownload={isInitializingDownload}
                />
              </>
            )
          )}

          {downloadProgress && <DownloadProgressBar progress={downloadProgress} />}
        </VStack>
      </Container>
      <ThemeToggle />
    </ChakraProvider>
  );
}

export default App;
