import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from "../../constants/theme";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: "elevated" | "outlined" | "filled";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  onPress,
  style,
  variant = "elevated",
  padding = "md",
}: CardProps) {
  const getPadding = () => {
    switch (padding) {
      case "none":
        return 0;
      case "sm":
        return SPACING.sm;
      case "lg":
        return SPACING.lg;
      default:
        return SPACING.md;
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case "outlined":
        return {
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.surface,
        };
      case "filled":
        return {
          backgroundColor: COLORS.surfaceVariant,
        };
      default:
        return {
          backgroundColor: COLORS.surface,
          ...SHADOWS.md,
        };
    }
  };

  const cardStyles = [
    styles.card,
    getVariantStyles(),
    { padding: getPadding() },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
  },
});
