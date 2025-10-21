import { Box, Image, Text, VStack, Stack, Badge, useColorModeValue, keyframes } from "@chakra-ui/react";
import { VideoInfo } from "../api/client";

interface VideoPreviewProps {
  video: VideoInfo;
  isSelected?: boolean;
  onClick?: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ video, isSelected, onClick }) => {
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const bg = useColorModeValue("white", "gray.800");

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={isSelected ? selectedBg : bg}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      transition="all 0.2s"
      _hover={{
        transform: onClick ? "translateY(-2px)" : "none",
        shadow: onClick ? "md" : "none",
      }}
      width="100%"
    >
      <Stack
        direction={{ base: "column", sm: "row" }}
        spacing={{ base: 4, sm: 6 }}
        align={{ base: "center", sm: "start" }}
        width="full"
      >
        <Box position="relative" width={{ base: "full", sm: "200px" }} maxWidth={{ base: "350px", sm: "200px" }}>
          <Image
            src={video.thumbnail}
            alt={video.title}
            borderRadius="md"
            objectFit="cover"
            width="100%"
            aspectRatio="16/9"
          />
          <Badge
            position="absolute"
            bottom={2}
            right={2}
            colorScheme="blackAlpha"
            backgroundColor="rgba(0, 0, 0, 0.75)"
            color="white"
            fontSize={{ base: "xs", md: "sm" }}
          >
            {formatDuration(video.duration)}
          </Badge>
        </Box>

        <VStack align={{ base: "center", sm: "start" }} flex={1} spacing={2} width={{ base: "full", sm: "auto" }}>
          <Text
            fontWeight="bold"
            noOfLines={2}
            textAlign={{ base: "center", sm: "left" }}
            fontSize={{ base: "md", md: "lg" }}
          >
            {video.title}
          </Text>
          {video.uploader && (
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" textAlign={{ base: "center", sm: "left" }}>
              {video.uploader}
            </Text>
          )}
          {video.view_count && (
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" textAlign={{ base: "center", sm: "left" }}>
              {new Intl.NumberFormat().format(video.view_count)} views
            </Text>
          )}
        </VStack>
      </Stack>
    </Box>
  );
};
