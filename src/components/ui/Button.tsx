import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  SPACING,
} from "../../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.textMuted;
    switch (variant) {
      case "primary":
        return COLORS.primary;
      case "secondary":
        return COLORS.secondary;
      case "outline":
      case "ghost":
        return "transparent";
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.surface;
    switch (variant) {
      case "primary":
      case "secondary":
        return COLORS.textOnPrimary;
      case "outline":
        return COLORS.primary;
      case "ghost":
        return COLORS.text;
      default:
        return COLORS.textOnPrimary;
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") return COLORS.primary;
    return "transparent";
  };

  const getPadding = () => {
    switch (size) {
      case "sm":
        return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
      case "lg":
        return {
          paddingVertical: SPACING.md + 4,
          paddingHorizontal: SPACING.xl,
        };
      default:
        return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "sm":
        return FONT_SIZE.sm;
      case "lg":
        return FONT_SIZE.lg;
      default:
        return FONT_SIZE.md;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          ...getPadding(),
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && icon}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getFontSize() },
              icon ? styles.textWithIcon : {},
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  textWithIcon: {
    marginLeft: SPACING.sm,
  },
});
