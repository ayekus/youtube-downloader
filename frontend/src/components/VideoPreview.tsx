import { Box, Image, Text, VStack, Badge, useColorModeValue } from "@chakra-ui/react";
import type { VideoInfo } from "../api/client";

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
      p={{ base: 4, md: 5, lg: 6 }}
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
      height="100%"
    >
      <VStack spacing={{ base: 4, md: 5 }} align="stretch" width="full">
        <Box position="relative" width="100%">
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
            px={2}
            py={1}
          >
            {formatDuration(video.duration)}
          </Badge>
        </Box>

        <VStack align="start" flex={1} spacing={2} width="full">
          <Text
            fontWeight="bold"
            noOfLines={2}
            fontSize={{ base: "md", md: "lg", lg: "xl" }}
            lineHeight="1.3"
          >
            {video.title}
          </Text>
          {video.uploader && (
            <Text fontSize={{ base: "xs", md: "sm", lg: "md" }} color="gray.500">
              {video.uploader}
            </Text>
          )}
          {video.view_count && (
            <Text fontSize={{ base: "xs", md: "sm", lg: "md" }} color="gray.500">
              {new Intl.NumberFormat().format(video.view_count)} views
            </Text>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};
