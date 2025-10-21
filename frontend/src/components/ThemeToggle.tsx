import { IconButton, useColorMode, Tooltip } from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Tooltip label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}>
      <IconButton
        position="fixed"
        bottom={4}
        right={4}
        aria-label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
        icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
        onClick={toggleColorMode}
        size="lg"
        variant="solid"
        colorScheme="blue"
        transition="all 0.2s"
        _hover={{
          transform: "scale(1.1)",
        }}
      />
    </Tooltip>
  );
}
