import React from "react";
import { Box, Progress, Text, VStack } from "@chakra-ui/react";
import type { DownloadProgress } from "../api/client";

interface DownloadProgressBarProps {
  progress: DownloadProgress;
}

export const DownloadProgressBar: React.FC<DownloadProgressBarProps> = ({ progress }) => {
  const getProgressPercentage = () => {
    if (progress.status === "downloading" && progress.total_bytes && progress.downloaded_bytes) {
      return (progress.downloaded_bytes / progress.total_bytes) * 100;
    }
    return 0;
  };

  const formatSpeed = (bytesPerSecond?: number) => {
    if (!bytesPerSecond) return "";

    const mbps = bytesPerSecond / 1024 / 1024;
    return `${mbps.toFixed(2)} MB/s`;
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return "";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (progress.status === "finished") {
    return (
      <Box
        p={{ base: 3, md: 4, lg: 6 }}
        borderWidth="1px"
        borderRadius="lg"
        transition="all 0.3s ease-in-out"
        bg="green.50"
        _dark={{ bg: "green.900" }}
        transform="scale(1)"
        _hover={{ transform: "scale(1.01)" }}
        role="alert"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
          animation: "shine 1s",
        }}
      >
        <VStack spacing={{ base: 2, md: 3 }} align={{ base: "center", sm: "start" }}>
          <Text color="green.500" fontWeight="bold" fontSize={{ base: "sm", md: "md", lg: "lg" }}>
            Download Complete!
          </Text>
          <Text fontSize={{ base: "xs", md: "sm", lg: "md" }} color="green.600" _dark={{ color: "green.200" }}>
            {progress.title}
          </Text>
          {progress.filename && (
            <Text
              fontSize={{ base: "xs", md: "sm", lg: "md" }}
              mt={{ base: 1, md: 2 }}
              textAlign={{ base: "center", sm: "left" }}
              wordBreak="break-word"
              color="gray.600"
              _dark={{ color: "gray.300" }}
            >
              Saved as: {progress.filename}
            </Text>
          )}
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      p={{ base: 3, md: 4, lg: 6 }}
      borderWidth="1px"
      borderRadius="lg"
      transition="all 0.3s ease-in-out"
      transform="scale(1)"
      _hover={{ transform: "scale(1.01)", shadow: "md" }}
    >
      <VStack spacing={{ base: 2, md: 3, lg: 4 }} align="stretch">
        <Progress
          value={getProgressPercentage()}
          size={{ base: "xs", md: "sm", lg: "md" }}
          colorScheme="blue"
          hasStripe
          isAnimated
        />
        <Text fontSize={{ base: "xs", md: "sm", lg: "md" }} textAlign={{ base: "center", sm: "left" }}>
          {progress.downloaded_bytes && progress.total_bytes
            ? `${(progress.downloaded_bytes / 1024 / 1024).toFixed(1)} MB of ${(
                progress.total_bytes /
                1024 /
                1024
              ).toFixed(1)} MB${
                progress.fragment_index && progress.fragment_count
                  ? ` (fragment ${progress.fragment_index}/${progress.fragment_count})`
                  : ""
              }`
            : "Starting download..."}
        </Text>{" "}
        {progress.speed && (
          <Text fontSize={{ base: "xs", md: "sm", lg: "md" }} color="gray.500" textAlign={{ base: "center", sm: "left" }}>
            Speed: {formatSpeed(progress.speed)}
            {progress.eta && ` • Time remaining: ${formatTime(progress.eta)}`}
          </Text>
        )}
      </VStack>
    </Box>
  );
};
