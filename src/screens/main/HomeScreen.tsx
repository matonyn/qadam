import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BORDER_RADIUS,
  FONT_SIZE,
  SHADOWS,
  SPACING,
  useColors,
} from "../../constants/theme";
import { useTranslation } from "../../i18n";
import { HomeStackParamList } from "../../navigation/HomeNavigator";
import { academicApi, discountsApi, eventsApi, studyRoomsApi } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";

const COURSE_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#6366F1'];

export function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const t = useTranslation();
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const [plan, setPlan] = useState<any>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState(0);
  const [activeDiscounts, setActiveDiscounts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.allSettled([
      academicApi.getAcademicPlan(),
      academicApi.getSchedule(today),
      eventsApi.getEvents(),
      studyRoomsApi.getStudyRooms({ available: true }),
      discountsApi.getDiscounts(),
    ])
      .then(([planRes, scheduleRes, eventsRes, roomsRes, discountsRes]) => {
        if (planRes.status === 'fulfilled') setPlan(planRes.value.data);
        if (scheduleRes.status === 'fulfilled') {
          setUpcomingClasses(
            (scheduleRes.value.data ?? []).flatMap((course: any, idx: number) =>
              (course.schedule ?? []).map((sched: any) => ({
                id: `${course.id}-${sched.day}`,
                title: `${course.code} – ${course.name}`,
                startTime: sched.startTime,
                endTime: sched.endTime,
                location: `Room ${sched.room}`,
                color: COURSE_COLORS[idx % COURSE_COLORS.length],
              }))
            ).slice(0, 2),
          );
        }
        if (eventsRes.status === 'fulfilled') setUpcomingEvents((eventsRes.value.data ?? []).slice(0, 2));
        if (roomsRes.status === 'fulfilled') setAvailableRooms((roomsRes.value.data ?? []).length);
        if (discountsRes.status === 'fulfilled') setActiveDiscounts((discountsRes.value.data ?? []).length);
      })
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t.greeting.morning
      : hour < 17
        ? t.greeting.afternoon
        : t.greeting.evening;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>
              {user?.firstName ?? "Student"} 👋
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={COLORS.text}
              />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.getParent()?.navigate("Profile")}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarText}>
                {(user?.firstName?.[0] ?? "A") + (user?.lastName?.[0] ?? "A")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GPA Card */}
        <View style={styles.gpaCard}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <View style={styles.gpaItem}>
                <Text style={styles.gpaLabel}>{t.home.gpa}</Text>
                <Text style={styles.gpaValue}>
                  {plan ? plan.gpa.toFixed(2) : '—'}
                </Text>
              </View>
              <View style={styles.gpaDivider} />
              <View style={styles.gpaItem}>
                <Text style={styles.gpaLabel}>{t.home.standing}</Text>
                <Text style={styles.gpaStanding}>{t.home.deansList}</Text>
              </View>
              <View style={styles.gpaDivider} />
              <View style={styles.gpaItem}>
                <Text style={styles.gpaLabel}>{t.home.credits}</Text>
                <Text style={styles.gpaCredits}>
                  {plan ? `${plan.creditsCompleted}/${plan.totalCreditsRequired}` : '—'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Navigate CTA */}
        <TouchableOpacity
          style={styles.navigateCard}
          activeOpacity={0.85}
          onPress={() => navigation.getParent()?.navigate("Navigate")}
        >
          <View style={styles.navigateIcon}>
            <Ionicons name="navigate" size={20} color={COLORS.surface} />
          </View>
          <Text style={styles.navigateText}>{t.home.whereToGo}</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.surface} />
        </TouchableOpacity>

        {/* Upcoming Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.home.upcomingClasses}</Text>
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate("Academic")}
            >
              <Text style={styles.seeAll}>{t.home.seeAll}</Text>
            </TouchableOpacity>
          </View>
          {upcomingClasses.map((cls) => (
            <View key={cls.id} style={styles.classCard}>
              <View
                style={[styles.classAccent, { backgroundColor: cls.color }]}
              />
              <View style={styles.classInfo}>
                <Text style={styles.className}>{cls.title}</Text>
                <View style={styles.classRow}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.classDetail}>
                    {cls.startTime} – {cls.endTime}
                  </Text>
                </View>
                <View style={styles.classRow}>
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.classDetail}>{cls.location}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: cls.color + "20" },
                ]}
              >
                <Text style={[styles.typeText, { color: cls.color }]}>
                  {t.home.classType}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.home.quickAccess}</Text>
          <View style={styles.quickGrid}>
            <QuickCard
              icon="book-outline"
              label={t.home.studyRooms}
              sub={`${availableRooms} ${t.home.available}`}
              color={COLORS.primaryLight}
              onPress={() => navigation.navigate("StudyRooms")}
            />
            <QuickCard
              icon="pricetag-outline"
              label={t.home.discounts}
              sub={`${activeDiscounts} ${t.home.active}`}
              color={COLORS.secondary}
              onPress={() => navigation.navigate("Discounts")}
            />
            <QuickCard
              icon="star-outline"
              label={t.home.reviews}
              sub={t.home.rateSpaces}
              color={COLORS.accent}
              onPress={() => navigation.navigate("Reviews")}
            />
            <QuickCard
              icon="map-outline"
              label={t.home.campusMap}
              sub={t.home.navigate}
              color={COLORS.accessibleRoute}
              onPress={() => navigation.getParent()?.navigate("Navigate")}
            />
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.home.upcomingEvents}</Text>
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate("Events")}
            >
              <Text style={styles.seeAll}>{t.home.seeAll}</Text>
            </TouchableOpacity>
          </View>
          {upcomingEvents.map((event) => {
            const raw = (event as any).start_date ?? (event as any).date ?? event.startDate;
            const date = raw ? new Date(raw) : null;
            const validDate = date && !isNaN(date.getTime());
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                activeOpacity={0.8}
                onPress={() => navigation.getParent()?.navigate("Events")}
              >
                <View style={styles.eventDate}>
                  <Text style={styles.eventMonth}>
                    {validDate ? date!.toLocaleString("en", { month: "short" }).toUpperCase() : '—'}
                  </Text>
                  <Text style={styles.eventDay}>{validDate ? date!.getDate() : '?'}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <View style={styles.classRow}>
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.eventLocation} numberOfLines={1}>
                      {event.location}
                    </Text>
                  </View>
                  <View style={styles.eventCategoryBadge}>
                    <Text style={styles.eventCategory}>{event.category}</Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickCard({
  icon,
  label,
  sub,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  color: string;
  onPress?: () => void;
}) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  return (
    <TouchableOpacity
      style={styles.quickCard}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    scroll: {
      paddingBottom: SPACING.xl,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    greeting: {
      fontSize: FONT_SIZE.md,
      color: COLORS.textSecondary,
    },
    userName: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: "bold",
      color: COLORS.text,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    notifBtn: {
      position: "relative",
      padding: 4,
    },
    notifDot: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: COLORS.error,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: COLORS.surface,
      fontWeight: "bold",
      fontSize: FONT_SIZE.sm,
    },
    gpaCard: {
      marginHorizontal: SPACING.lg,
      marginTop: SPACING.md,
      backgroundColor: COLORS.primary,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      ...SHADOWS.md,
    },
    gpaItem: {
      alignItems: "center",
    },
    gpaLabel: {
      fontSize: FONT_SIZE.xs,
      color: "rgba(255,255,255,0.65)",
      marginBottom: 4,
    },
    gpaValue: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: "bold",
      color: COLORS.surface,
    },
    gpaStanding: {
      fontSize: FONT_SIZE.md,
      fontWeight: "700",
      color: "#34D399",
    },
    gpaCredits: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
      color: COLORS.surface,
    },
    gpaDivider: {
      width: 1,
      height: 40,
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    navigateCard: {
      marginHorizontal: SPACING.lg,
      marginTop: SPACING.md,
      backgroundColor: COLORS.primaryLight,
      borderRadius: BORDER_RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      ...SHADOWS.sm,
    },
    navigateIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    navigateText: {
      flex: 1,
      color: COLORS.surface,
      fontSize: FONT_SIZE.md,
      fontWeight: "500",
    },
    section: {
      marginTop: SPACING.lg,
      paddingHorizontal: SPACING.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    sectionTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: "700",
      color: COLORS.text,
    },
    seeAll: {
      fontSize: FONT_SIZE.sm,
      color: COLORS.primary,
      fontWeight: "600",
    },
    classCard: {
      flexDirection: "row",
      backgroundColor: COLORS.surface,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.sm,
      overflow: "hidden",
      alignItems: "center",
      ...SHADOWS.sm,
    },
    classAccent: {
      width: 4,
      alignSelf: "stretch",
    },
    classInfo: {
      flex: 1,
      padding: SPACING.md,
    },
    className: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
      color: COLORS.text,
      marginBottom: 4,
    },
    classRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    classDetail: {
      fontSize: FONT_SIZE.sm,
      color: COLORS.textSecondary,
    },
    typeBadge: {
      marginRight: SPACING.md,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: BORDER_RADIUS.sm,
    },
    typeText: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "600",
    },
    quickGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginTop: SPACING.sm,
    },
    quickCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: COLORS.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      ...SHADOWS.sm,
    },
    quickIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.sm,
    },
    quickLabel: {
      fontSize: FONT_SIZE.sm,
      fontWeight: "700",
      color: COLORS.text,
    },
    quickSub: {
      fontSize: FONT_SIZE.xs,
      color: COLORS.textSecondary,
      marginTop: 2,
    },
    eventCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      ...SHADOWS.sm,
    },
    eventDate: {
      width: 50,
      alignItems: "center",
      backgroundColor: COLORS.primaryLight + "15",
      borderRadius: BORDER_RADIUS.sm,
      paddingVertical: SPACING.sm,
      marginRight: SPACING.md,
    },
    eventMonth: {
      fontSize: FONT_SIZE.xs,
      fontWeight: "700",
      color: COLORS.primary,
    },
    eventDay: {
      fontSize: FONT_SIZE.xl,
      fontWeight: "bold",
      color: COLORS.primary,
    },
    eventInfo: {
      flex: 1,
    },
    eventTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: "600",
      color: COLORS.text,
      marginBottom: 2,
    },
    eventLocation: {
      fontSize: FONT_SIZE.sm,
      color: COLORS.textSecondary,
    },
    eventCategoryBadge: {
      marginTop: 4,
      backgroundColor: COLORS.primaryLight + "15",
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
      alignSelf: "flex-start",
    },
    eventCategory: {
      fontSize: FONT_SIZE.xs,
      color: COLORS.primary,
      fontWeight: "600",
      textTransform: "capitalize",
    },
  });
}
