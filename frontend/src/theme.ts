import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
};

export default extendTheme({
  config,
  styles: {
    global: (props: { colorMode: "light" | "dark" }) => ({
      body: {
        bg: props.colorMode === "dark" ? "gray.800" : "white",
        color: props.colorMode === "dark" ? "white" : "gray.800",
      },
      "@keyframes shine": {
        "0%": {
          transform: "translateX(-100%)",
        },
        "100%": {
          transform: "translateX(100%)",
        },
      },
    }),
  },
  components: {
    Container: {
      baseStyle: (props: { colorMode: "light" | "dark" }) => ({
        bg: props.colorMode === "dark" ? "gray.700" : "white",
        borderRadius: "xl",
        shadow: "lg",
      }),
    },
    Input: {
      variants: {
        outline: (props: { colorMode: "light" | "dark" }) => ({
          field: {
            bg: props.colorMode === "dark" ? "gray.600" : "white",
            _hover: {
              borderColor: props.colorMode === "dark" ? "blue.300" : "blue.500",
            },
          },
        }),
      },
    },
    Button: {
      defaultProps: {
        colorScheme: "blue",
      },
    },
  },
  transition: {
    duration: {
      fast: "150ms",
      normal: "200ms",
      slow: "300ms",
    },
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
});
