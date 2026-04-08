import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import React, { useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BORDER_RADIUS,
  useColors,
  FONT_SIZE,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { mockDiscounts } from "../../data/mockData";
import { HomeStackParamList } from "../../navigation/HomeNavigator";
import { Discount } from "../../types";
import { useTranslation } from "../../i18n";

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, "Discounts">;
};

type Category =
  | "all"
  | "food"
  | "entertainment"
  | "shopping"
  | "services"
  | "travel"
  | "other";

export function DiscountsScreen({ navigation }: Props) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const t = useTranslation();

  const CATEGORIES: { key: Category; label: string; icon: string }[] = [
    { key: "all", label: t.discounts.all, icon: "apps-outline" },
    { key: "food", label: t.discounts.food, icon: "restaurant-outline" },
    { key: "entertainment", label: t.discounts.entertainment, icon: "film-outline" },
    { key: "shopping", label: t.discounts.shopping, icon: "bag-outline" },
    { key: "services", label: t.discounts.services, icon: "briefcase-outline" },
    { key: "travel", label: t.discounts.travel, icon: "airplane-outline" },
  ];

  const CATEGORY_COLORS: Record<string, string> = {
    food: COLORS.accent,
    entertainment: "#8B5CF6",
    shopping: COLORS.primaryLight,
    services: COLORS.secondary,
    travel: COLORS.primary,
    other: COLORS.textSecondary,
  };

  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered =
    activeCategory === "all"
      ? mockDiscounts
      : mockDiscounts.filter((d) => d.category === activeCategory);

  const copyCode = (code: string, vendorName: string) => {
    Clipboard.setStringAsync(code);
    Alert.alert(t.discounts.codeCopied, `"${code}" copied for ${vendorName}.`);
  };

  const renderDiscount = ({ item }: { item: Discount }) => {
    const color = CATEGORY_COLORS[item.category] ?? COLORS.textSecondary;
    const daysLeft = Math.ceil(
      (new Date(item.validUntil).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );

    return (
      <View style={styles.card}>
        {/* Left accent + discount % */}
        <View style={[styles.discountBadge, { backgroundColor: color }]}>
          {item.discountPercentage > 0 ? (
            <>
              <Text style={styles.discountPct}>{item.discountPercentage}%</Text>
              <Text style={styles.discountOff}>OFF</Text>
            </>
          ) : (
            <Ionicons name="gift" size={24} color={COLORS.surface} />
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.vendorName}>{item.vendorName}</Text>
              <Text style={styles.discountTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={COLORS.success}
                />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.validity}>
              <Ionicons
                name="time-outline"
                size={13}
                color={COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.validityText,
                  daysLeft <= 7 && styles.validityUrgent,
                ]}
              >
                {daysLeft > 0
                  ? daysLeft <= 7
                    ? `${daysLeft} days left!`
                    : `Until ${item.validUntil}`
                  : t.discounts.expired}
              </Text>
            </View>

            {item.code ? (
              <TouchableOpacity
                style={[styles.codeBtn, { borderColor: color }]}
                onPress={() => copyCode(item.code!, item.vendorName)}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={13} color={color} />
                <Text style={[styles.codeText, { color }]}>{item.code}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.showIdBadge}>
                <Ionicons
                  name="card-outline"
                  size={13}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.showIdText}>{t.discounts.showStudentId}</Text>
              </View>
            )}
          </View>

          <Text style={styles.terms} numberOfLines={1}>
            * {item.terms}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.discounts.title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{mockDiscounts.length}</Text>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={active ? COLORS.surface : COLORS.textSecondary}
              />
              <Text
                style={[styles.chipLabel, active && styles.chipLabelActive]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderDiscount}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="pricetag-outline"
              size={48}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyText}>{t.discounts.noDiscounts}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: "bold",
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  countText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.surface,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  chipLabelActive: { color: COLORS.surface },
  list: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  discountBadge: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.sm,
  },
  discountPct: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "bold",
    color: COLORS.surface,
    lineHeight: 28,
  },
  discountOff: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
  },
  cardContent: { flex: 1, padding: SPACING.md },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: SPACING.sm,
  },
  vendorName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  discountTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: COLORS.success + "15",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    flexShrink: 0,
  },
  verifiedText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
    color: COLORS.success,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  validity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  validityText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  validityUrgent: { color: COLORS.error, fontWeight: "700" },
  codeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  codeText: { fontSize: FONT_SIZE.sm, fontWeight: "700" },
  showIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  showIdText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  terms: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  empty: { alignItems: "center", paddingTop: SPACING.xxl, gap: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
}); }
