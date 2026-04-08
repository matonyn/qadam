import { StyleSheet, Text, View, ViewStyle } from "react-native";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  SPACING,
} from "../../constants/theme";

interface BadgeProps {
  text: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function Badge({
  text,
  variant = "primary",
  size = "md",
  style,
}: BadgeProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case "secondary":
        return COLORS.secondary + "20";
      case "success":
        return COLORS.success + "20";
      case "warning":
        return COLORS.warning + "20";
      case "error":
        return COLORS.error + "20";
      case "info":
        return COLORS.info + "20";
      default:
        return COLORS.primary + "20";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "secondary":
        return COLORS.secondary;
      case "success":
        return COLORS.success;
      case "warning":
        return COLORS.warning;
      case "error":
        return COLORS.error;
      case "info":
        return COLORS.info;
      default:
        return COLORS.primary;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: size === "sm" ? SPACING.xs / 2 : SPACING.xs,
          paddingHorizontal: size === "sm" ? SPACING.sm : SPACING.md,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: size === "sm" ? FONT_SIZE.xs : FONT_SIZE.sm,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BORDER_RADIUS.full,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
  },
});
