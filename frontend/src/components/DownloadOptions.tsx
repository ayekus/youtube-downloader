import React from "react";
import { Box, VStack, Select, Switch, FormControl, FormLabel, Button, Text } from "@chakra-ui/react";
import { VideoInfo } from "../api/client";

interface DownloadOptionsProps {
  video: VideoInfo;
  onDownload: (formatId: string, extractAudio: boolean) => void;
  isLoading?: boolean;
  isInitializingDownload?: boolean;
}

export const DownloadOptions: React.FC<DownloadOptionsProps> = ({
  video,
  onDownload,
  isLoading = false,
  isInitializingDownload = false,
}) => {
  const [selectedFormat, setSelectedFormat] = React.useState("");
  const [extractAudio, setExtractAudio] = React.useState(false);

  // Filter and sort video formats
  const videoFormats = React.useMemo(() => {
    return (
      video.formats
        .filter((format) => {
          // Show MP4 formats with height info, regardless of filesize
          return format.format_note?.includes("p") && format.ext === "mp4";
        })
        .sort((a, b) => {
          // Sort by height
          const getHeight = (format: any) => {
            const match = format.format_note?.match(/(\d+)p/);
            return match ? parseInt(match[1], 10) : 0;
          };
          return getHeight(b) - getHeight(a);
        })
        // Remove duplicates by keeping only the highest quality version for each resolution
        .filter((format, _, self) => {
          const height = format.format_note?.match(/(\d+)p/)?.[1];
          const sameHeight = self.filter((f) => f.format_note?.includes(`${height}p`));
          // Keep only the one with highest bitrate for each resolution
          return format === sameHeight.sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];
        })
    );
  }, [video.formats]);

  const handleDownload = () => {
    onDownload(selectedFormat, extractAudio);
  };

  return (
    <Box p={{ base: 3, md: 4 }} borderWidth="1px" borderRadius="lg" transition="all 0.2s" _hover={{ shadow: "md" }}>
      <VStack spacing={{ base: 3, md: 4 }} align="stretch">
        <FormControl>
          <FormLabel fontSize={{ base: "sm", md: "md" }}>Video Quality</FormLabel>
          <Select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            placeholder="Select video quality"
            isDisabled={extractAudio}
            size={{ base: "sm", md: "md" }}
          >
            {videoFormats.map((format) => (
              <option key={format.format_id} value={format.format_id}>
                {format.format_note} {format.filesize ? `(~${(format.filesize / 1024 / 1024).toFixed(1)} MB)` : ""}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl
          display="flex"
          alignItems="center"
          flexDirection={{ base: "column", sm: "row" }}
          gap={{ base: 2, sm: 0 }}
        >
          <FormLabel
            mb={{ base: 0, sm: "0" }}
            fontSize={{ base: "sm", md: "md" }}
            textAlign={{ base: "center", sm: "left" }}
            width={{ base: "full", sm: "auto" }}
          >
            Extract Audio (MP3)
          </FormLabel>
          <Switch
            size={{ base: "md", md: "lg" }}
            isChecked={extractAudio}
            sx={{
              "& > span": {
                transition: "transform 0.2s",
              },
              "&:hover > span": {
                transform: "scale(1.1)",
              },
            }}
            onChange={(e) => {
              setExtractAudio(e.target.checked);
              setSelectedFormat(""); // Reset format selection when toggling audio
            }}
          />
        </FormControl>

        <Button
          colorScheme="blue"
          onClick={handleDownload}
          isLoading={isLoading || isInitializingDownload}
          loadingText={isInitializingDownload ? "Preparing Download..." : "Downloading..."}
          isDisabled={!selectedFormat && !extractAudio}
          size={{ base: "sm", md: "md" }}
          mt={{ base: 2, md: 3 }}
        >
          Download {extractAudio ? "Audio" : "Video"}
        </Button>

        {extractAudio && (
          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" textAlign="center">
            Audio will be converted to MP3 format
          </Text>
        )}
      </VStack>
    </Box>
  );
};
