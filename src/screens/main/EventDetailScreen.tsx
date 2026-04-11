import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { EventsStackParamList } from '../../navigation/EventsNavigator';
import { eventsApi } from '../../services/api';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';

type Props = {
  navigation: NativeStackNavigationProp<EventsStackParamList, 'EventDetail'>;
  route: RouteProp<EventsStackParamList, 'EventDetail'>;
};

const CATEGORY_ICONS: Record<string, string> = {
  academic: 'school-outline',
  social: 'people-outline',
  sports: 'football-outline',
  cultural: 'color-palette-outline',
  career: 'briefcase-outline',
  other: 'ellipse-outline',
};

export function EventDetailScreen({ navigation, route }: Props) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const t = useTranslation();

  const CATEGORY_COLORS: Record<string, string> = {
    academic: COLORS.primary,
    social: COLORS.secondary,
    sports: COLORS.accent,
    cultural: '#8B5CF6',
    career: COLORS.primaryLight,
    other: COLORS.textSecondary,
  };

  const { eventId } = route.params;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.getEvent(eventId)
      .then((res) => setEvent(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t.eventDetail.notFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const categoryColor = CATEGORY_COLORS[event.category] ?? COLORS.primary;
  const categoryIcon = CATEGORY_ICONS[event.category] ?? 'ellipse-outline';

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true });

  const handleRsvp = () => {
    Alert.alert(
      t.eventDetail.registerTitle,
      `${t.eventDetail.registerNow} "${event.title}"?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.eventDetail.registerNow,
          onPress: () =>
            eventsApi.registerForEvent(eventId)
              .then(() => Alert.alert(t.eventDetail.registered, t.eventDetail.registeredMsg))
              .catch(() => Alert.alert(t.common.error, 'Could not register. You may already be registered.')),
        },
      ]
    );
  };

  const handleAddToCalendar = () => {
    Alert.alert(t.eventDetail.addedToCalendar, `"${event.title}" has been added to your calendar.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero header */}
      <View style={[styles.hero, { backgroundColor: categoryColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <View style={styles.categoryRow}>
            <Ionicons name={categoryIcon as any} size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.categoryLabel}>{event.category}</Text>
          </View>
          <Text style={styles.heroTitle}>{event.title}</Text>
          <Text style={styles.heroOrganizer}>by {event.organizer}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Date & Time card */}
        <View style={styles.infoCard}>
          <InfoRow
            icon="calendar-outline"
            label={t.eventDetail.date}
            value={formatDate(start)}
            color={categoryColor}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="time-outline"
            label={t.eventDetail.time}
            value={`${formatTime(start)} – ${formatTime(end)}`}
            color={categoryColor}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="location-outline"
            label={t.eventDetail.location}
            value={event.location}
            color={categoryColor}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.eventDetail.about}</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* Registration */}
        {event.isRegistrationRequired && (
          <View style={[styles.registrationBanner, { borderColor: categoryColor }]}>
            <Ionicons name="information-circle-outline" size={18} color={categoryColor} />
            <Text style={[styles.registrationText, { color: categoryColor }]}>
              {t.eventDetail.registrationRequired}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={handleAddToCalendar}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.calendarBtnText}>{t.eventDetail.addToCalendar}</Text>
          </TouchableOpacity>

          {event.isRegistrationRequired && (
            <TouchableOpacity
              style={[styles.rsvpBtn, { backgroundColor: categoryColor }]}
              onPress={handleRsvp}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.surface} />
              <Text style={styles.rsvpBtnText}>{t.eventDetail.registerNow}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    paddingBottom: SPACING.xl,
  },
  backBtn: {
    margin: SPACING.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    paddingHorizontal: SPACING.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  categoryLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'capitalize',
  },
  heroTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: SPACING.xs,
    lineHeight: 30,
  },
  heroOrganizer: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.8)',
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '600' },
  infoValue: { fontSize: FONT_SIZE.md, color: COLORS.text, fontWeight: '500', marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginLeft: SPACING.lg + 40 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  registrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  registrationText: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: '500' },
  actions: { gap: SPACING.sm },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  calendarBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.primary },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  rsvpBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.surface },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary },
}); }
