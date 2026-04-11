import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useMemo, useEffect } from "react";
import {
  ActivityIndicator,
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
import { EventsStackParamList } from "../../navigation/EventsNavigator";
import { CampusEvent } from "../../types";
import { useTranslation } from "../../i18n";
import { eventsApi } from "../../services/api";

type Category =
  | "all"
  | "academic"
  | "social"
  | "sports"
  | "cultural"
  | "career"
  | "other";

export function EventsScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const navigation =
    useNavigation<NativeStackNavigationProp<EventsStackParamList>>();
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [allEvents, setAllEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslation();

  useEffect(() => {
    eventsApi.getEvents()
      .then((res) => setAllEvents(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const CATEGORY_COLORS: Record<string, string> = {
    academic: COLORS.primary,
    social: COLORS.secondary,
    sports: COLORS.accent,
    cultural: "#8B5CF6",
    career: COLORS.primaryLight,
    other: COLORS.textMuted,
  };

  const CATEGORIES: { key: Category; label: string; icon: string }[] = [
    { key: "all", label: t.events.all, icon: "apps-outline" },
    { key: "academic", label: t.events.academic, icon: "school-outline" },
    { key: "career", label: t.events.career, icon: "briefcase-outline" },
    { key: "social", label: t.events.social, icon: "people-outline" },
    { key: "sports", label: t.events.sports, icon: "football-outline" },
    { key: "cultural", label: t.events.cultural, icon: "color-palette-outline" },
  ];

  const filtered =
    activeCategory === "all"
      ? allEvents
      : allEvents.filter((e) => e.category === activeCategory);

  const renderEvent = ({ item }: { item: CampusEvent }) => {
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);
    const categoryColor = CATEGORY_COLORS[item.category] ?? COLORS.textMuted;

    const formatTime = (d: Date) =>
      d.toLocaleTimeString("en", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    return (
      <TouchableOpacity
        style={styles.eventCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
      >
        {/* Date sidebar */}
        <View style={[styles.dateSidebar, { backgroundColor: categoryColor }]}>
          <Text style={styles.dateMonth}>
            {start.toLocaleString("en", { month: "short" }).toUpperCase()}
          </Text>
          <Text style={styles.dateDay}>{start.getDate()}</Text>
        </View>

        {/* Content */}
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: categoryColor + "20" },
              ]}
            >
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {item.category}
              </Text>
            </View>
          </View>

          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.eventMeta}>
            <View style={styles.metaRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons
                name="time-outline"
                size={13}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>
                {formatTime(start)} – {formatTime(end)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons
                name="person-outline"
                size={13}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>{item.organizer}</Text>
            </View>
          </View>

          {item.isRegistrationRequired && (
            <TouchableOpacity style={styles.rsvpBtn} activeOpacity={0.85}>
              <Text style={styles.rsvpText}>{t.events.register}</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.surface} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.events.title}</Text>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterList}
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={active ? COLORS.surface : COLORS.textSecondary}
              />
              <Text
                style={[styles.filterLabel, active && styles.filterLabelActive]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Events list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>No events in this category</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "bold",
    color: COLORS.text,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  filterScroll: {
    flexGrow: 0,
    height: 46,
  },
  filterList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterLabelActive: {
    color: COLORS.surface,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  dateSidebar: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
  },
  dateMonth: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  dateDay: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "bold",
    color: COLORS.surface,
  },
  eventContent: {
    flex: 1,
    padding: SPACING.md,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginBottom: 4,
  },
  eventTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.text,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  eventDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  eventMeta: {
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  rsvpBtn: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  rsvpText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.surface,
  },
  empty: {
    alignItems: "center",
    paddingTop: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
}); }
