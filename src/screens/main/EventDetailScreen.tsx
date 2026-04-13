import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Linking,
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

function normalizeExternalUrl(url: string): string {
  const u = url.trim();
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

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

  const { eventId, openRegister } = route.params;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredAt, setRegisteredAt] = useState<string | null>(null);

  const refreshRegistration = useCallback(() => {
    setRegLoading(true);
    eventsApi
      .getMyEventRegistration(eventId)
      .then((res) => {
        const d = res.data;
        if (d?.isRegistered && d.registration) {
          setIsRegistered(true);
          setRegisteredAt(d.registration.registeredAt || null);
        } else {
          setIsRegistered(false);
          setRegisteredAt(null);
        }
      })
      .catch(() => {
        setIsRegistered(false);
        setRegisteredAt(null);
      })
      .finally(() => setRegLoading(false));
  }, [eventId]);

  useEffect(() => {
    eventsApi
      .getEvent(eventId)
      .then((res) => setEvent(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!event) return;
    refreshRegistration();
  }, [event, refreshRegistration]);

  useEffect(() => {
    if (openRegister && event && event.isRegistrationRequired) {
      setRegisterModalVisible(true);
    }
  }, [openRegister, event]);

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

  const openRegistrationWebsite = () => {
    const raw = event.registrationUrl as string | undefined;
    if (!raw?.trim()) return;
    const url = normalizeExternalUrl(raw);
    Linking.openURL(url).catch(() =>
      Alert.alert(t.common.error, t.eventDetail.couldNotOpenLink),
    );
  };

  const closeRegisterModal = () => {
    if (!regSubmitting) setRegisterModalVisible(false);
  };

  const handleRegisterInApp = () => {
    setRegSubmitting(true);
    eventsApi
      .registerForEvent(eventId)
      .then((res) => {
        const reg = res.data;
        if (reg) {
          setIsRegistered(true);
          setRegisteredAt(reg.registeredAt || null);
        }
        setRegisterModalVisible(false);
        Alert.alert(t.eventDetail.registered, t.eventDetail.registeredMsg);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (/already registered/i.test(msg)) {
          Alert.alert(t.common.error, t.eventDetail.alreadyRegistered);
          refreshRegistration();
        } else {
          Alert.alert(t.common.error, msg || t.common.error);
        }
      })
      .finally(() => setRegSubmitting(false));
  };

  const confirmCancelRegistration = () => {
    Alert.alert(t.eventDetail.cancelRegistration, t.eventDetail.cancelRegistrationConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.eventDetail.unregister,
        style: 'destructive',
        onPress: () => {
          setRegSubmitting(true);
          eventsApi
            .unregisterFromEvent(eventId)
            .then(() => {
              setIsRegistered(false);
              setRegisteredAt(null);
              setRegisterModalVisible(false);
            })
            .catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : String(err);
              Alert.alert(t.common.error, msg || t.common.error);
            })
            .finally(() => setRegSubmitting(false));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.eventDetail.about}</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {event.isRegistrationRequired && (
          <View style={[styles.registrationBanner, { borderColor: categoryColor }]}>
            <Ionicons name="information-circle-outline" size={18} color={categoryColor} />
            <Text style={[styles.registrationText, { color: categoryColor }]}>
              {t.eventDetail.registrationRequired}
            </Text>
          </View>
        )}

        {event.isRegistrationRequired && isRegistered && (
          <View style={[styles.registeredPill, { borderColor: categoryColor, backgroundColor: categoryColor + '12' }]}>
            <Ionicons name="checkmark-circle" size={20} color={categoryColor} />
            <Text style={[styles.registeredPillText, { color: categoryColor }]}>
              {t.eventDetail.youAreRegistered}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() =>
              Alert.alert(t.eventDetail.addedToCalendar, `"${event.title}" has been added to your calendar.`)
            }
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.calendarBtnText}>{t.eventDetail.addToCalendar}</Text>
          </TouchableOpacity>

          {event.isRegistrationRequired && (
            <TouchableOpacity
              style={[styles.rsvpBtn, { backgroundColor: categoryColor }]}
              onPress={() => setRegisterModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="clipboard-outline" size={18} color={COLORS.surface} />
              <Text style={styles.rsvpBtnText}>
                {isRegistered ? t.eventDetail.registerTitle : t.eventDetail.registerNow}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={registerModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeRegisterModal}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeRegisterModal} />
          <View style={[styles.modalSheet, { backgroundColor: COLORS.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: COLORS.text }]} numberOfLines={2}>
                {t.eventDetail.registerTitle}
              </Text>
              <TouchableOpacity
                onPress={closeRegisterModal}
                hitSlop={12}
                disabled={regSubmitting}
                accessibilityRole="button"
                accessibilityLabel={t.common.close}
              >
                <Ionicons name="close" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalEventName, { color: COLORS.text }]} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={[styles.modalBody, { color: COLORS.textSecondary }]}>
              {t.eventDetail.registerModalSubtitle}
            </Text>

            {regLoading ? (
              <ActivityIndicator style={{ marginVertical: SPACING.lg }} color={COLORS.primary} />
            ) : isRegistered ? (
              <View style={styles.modalRegisteredBlock}>
                <View style={styles.modalSuccessRow}>
                  <Ionicons name="checkmark-circle" size={28} color={categoryColor} />
                  <Text style={[styles.modalSuccessTitle, { color: COLORS.text }]}>
                    {t.eventDetail.youAreRegistered}
                  </Text>
                </View>
                {registeredAt ? (
                  <Text style={[styles.modalMeta, { color: COLORS.textSecondary }]}>
                    {t.eventDetail.registeredOn}:{' '}
                    {new Date(registeredAt).toLocaleString()}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={[styles.modalSecondaryBtn, { borderColor: COLORS.borderLight }]}
                  onPress={confirmCancelRegistration}
                  disabled={regSubmitting}
                >
                  {regSubmitting ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Text style={[styles.modalSecondaryBtnText, { color: COLORS.error }]}>
                      {t.eventDetail.cancelRegistration}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalActions}>
                {event.registrationUrl ? (
                  <TouchableOpacity
                    style={[styles.modalPrimaryBtn, { backgroundColor: categoryColor }]}
                    onPress={openRegistrationWebsite}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="open-outline" size={18} color={COLORS.surface} />
                    <Text style={styles.modalPrimaryBtnText}>{t.eventDetail.openExternalRegistration}</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[
                    styles.modalPrimaryBtn,
                    {
                      backgroundColor: event.registrationUrl ? COLORS.surfaceVariant : categoryColor,
                      borderWidth: event.registrationUrl ? 1.5 : 0,
                      borderColor: event.registrationUrl ? categoryColor : 'transparent',
                    },
                  ]}
                  onPress={handleRegisterInApp}
                  disabled={regSubmitting}
                  activeOpacity={0.85}
                >
                  {regSubmitting ? (
                    <ActivityIndicator color={event.registrationUrl ? categoryColor : COLORS.surface} />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color={event.registrationUrl ? categoryColor : COLORS.surface}
                      />
                      <Text
                        style={[
                          styles.modalPrimaryBtnText,
                          { color: event.registrationUrl ? categoryColor : COLORS.surface },
                        ]}
                      >
                        {t.eventDetail.registerInApp}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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

function makeStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
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
    registeredPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      borderWidth: 1.5,
      borderRadius: BORDER_RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },
    registeredPillText: { fontSize: FONT_SIZE.md, fontWeight: '700', flex: 1 },
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
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalSheet: {
      borderTopLeftRadius: BORDER_RADIUS.xl,
      borderTopRightRadius: BORDER_RADIUS.xl,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xxl,
      paddingTop: SPACING.sm,
      maxHeight: '88%',
    },
    modalHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: COLORS.borderLight,
      marginBottom: SPACING.md,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.md,
    },
    modalTitle: {
      flex: 1,
      fontSize: FONT_SIZE.lg,
      fontWeight: '800',
    },
    modalEventName: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      marginTop: SPACING.xs,
      marginBottom: SPACING.md,
    },
    modalBody: {
      fontSize: FONT_SIZE.sm,
      lineHeight: 20,
      marginBottom: SPACING.lg,
    },
    modalActions: { gap: SPACING.sm },
    modalPrimaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
    },
    modalPrimaryBtnText: {
      fontSize: FONT_SIZE.md,
      fontWeight: '700',
    },
    modalRegisteredBlock: {
      gap: SPACING.md,
    },
    modalSuccessRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    modalSuccessTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: '700',
      flex: 1,
    },
    modalMeta: {
      fontSize: FONT_SIZE.sm,
    },
    modalSecondaryBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1.5,
    },
    modalSecondaryBtnText: {
      fontSize: FONT_SIZE.md,
      fontWeight: '700',
    },
  });
}
