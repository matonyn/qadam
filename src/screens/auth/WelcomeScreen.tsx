import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui/Button";
import { useColors, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { useTranslation } from "../../i18n";

const { width, height } = Dimensions.get("window");

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Welcome">;
};

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const t = useTranslation();

  const FEATURES = [
    {
      icon: "navigate-outline" as const,
      text: t.welcome.feature1,
      color: COLORS.primaryLight,
    },
    {
      icon: "calendar-outline" as const,
      text: t.welcome.feature2,
      color: COLORS.secondary,
    },
    {
      icon: "school-outline" as const,
      text: t.welcome.feature3,
      color: COLORS.accent,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Hero image */}
      <Image
        source={require("../../../documents/logo.png")}
        style={styles.heroImage}
        resizeMode="cover"
      />

      {/* Dark overlay gradient effect */}
      <View style={styles.heroOverlay} />

      {/* App name on top of image */}
      <View style={styles.heroTextContainer}>
        <Text style={styles.heroAppName}>Qadam</Text>
        <Text style={styles.heroTagline}>{t.welcome.tagline}</Text>
      </View>

      {/* Bottom content */}
      <View style={styles.content}>
        {/* Features */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + "20" }]}>
                <Ionicons name={f.icon} size={20} color={f.color} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            title={t.welcome.getStarted}
            onPress={() => navigation.navigate("Register")}
            variant="primary"
            size="lg"
            fullWidth
          />
          <Button
            title={t.welcome.haveAccount}
            onPress={() => navigation.navigate("Login")}
            variant="ghost"
            size="lg"
            fullWidth
            style={styles.loginButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroImage: {
    width: width,
    height: height * 0.42,
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.42,
    backgroundColor: "rgba(30, 58, 138, 0.35)",
  },
  heroTextContainer: {
    position: "absolute",
    top: height * 0.42 - 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  heroAppName: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.surface,
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroTagline: {
    fontSize: FONT_SIZE.lg,
    color: "rgba(255,255,255,0.9)",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    justifyContent: "space-between",
  },
  featuresContainer: {
    gap: SPACING.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: "500",
  },
  buttonsContainer: {
    marginBottom: SPACING.md,
  },
  loginButton: {
    marginTop: SPACING.sm,
  },
}); }
