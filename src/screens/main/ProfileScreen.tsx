import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ProfileStackParamList } from '../../navigation/ProfileNavigator';
import { useAuthStore } from '../../stores/authStore';
import { academicApi } from '../../services/api';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user, settings, updateSettings, logout } = useAuthStore();
  const t = useTranslation();
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    academicApi.getAcademicPlan()
      .then((res) => setPlan(res.data))
      .catch(console.error);
  }, []);

  const handleLogout = () => {
    Alert.alert(t.profile.logoutTitle, t.profile.logoutConfirm, [
      { text: t.profile.cancel, style: 'cancel' },
      { text: t.profile.logout, style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.profile.title}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] ?? 'A') + (user?.lastName?.[0] ?? 'A')}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userStudentId}>ID: {user?.studentId}</Text>
          </View>
          <View style={styles.userBadge}>
            <Ionicons name="ribbon" size={14} color="#34D399" />
            <Text style={styles.userBadgeText}>{t.profile.deansList}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label={t.profile.gpa} value={plan ? plan.gpa.toFixed(2) : '—'} icon="trophy-outline" color={COLORS.primary} />
          <StatCard label={t.profile.credits} value={plan ? `${plan.creditsCompleted}` : '—'} icon="bookmark-outline" color={COLORS.secondary} />
          <StatCard label={t.profile.major} value={plan ? plan.major.split(' ')[0] : '—'} icon="school-outline" color={COLORS.accent} />
        </View>

        {/* Notifications */}
        <SettingsSection title={t.profile.notifications}>
          <ToggleRow
            label={t.profile.campusEvents}
            icon="calendar-outline"
            value={settings.notifications.events}
            onToggle={(v) =>
              updateSettings({ notifications: { ...settings.notifications, events: v } })
            }
          />
          <ToggleRow
            label={t.profile.discountsNotif}
            icon="pricetag-outline"
            value={settings.notifications.discounts}
            onToggle={(v) =>
              updateSettings({ notifications: { ...settings.notifications, discounts: v } })
            }
          />
          <ToggleRow
            label={t.profile.classReminders}
            icon="alarm-outline"
            value={settings.notifications.classReminders}
            onToggle={(v) =>
              updateSettings({
                notifications: { ...settings.notifications, classReminders: v },
              })
            }
          />
          <ToggleRow
            label={t.profile.campusAlerts}
            icon="warning-outline"
            value={settings.notifications.campusAlerts}
            onToggle={(v) =>
              updateSettings({
                notifications: { ...settings.notifications, campusAlerts: v },
              })
            }
            last
          />
        </SettingsSection>

        {/* Accessibility */}
        <SettingsSection title={t.profile.accessibility}>
          <ToggleRow
            label={t.profile.accessibleRoutes}
            icon="accessibility-outline"
            value={settings.accessibility.preferAccessibleRoutes}
            onToggle={(v) =>
              updateSettings({
                accessibility: { ...settings.accessibility, preferAccessibleRoutes: v },
              })
            }
          />
          <ToggleRow
            label={t.profile.highContrast}
            icon="contrast-outline"
            value={settings.accessibility.highContrast}
            onToggle={(v) =>
              updateSettings({
                accessibility: { ...settings.accessibility, highContrast: v },
              })
            }
          />
          <ToggleRow
            label={t.profile.largeText}
            icon="text-outline"
            value={settings.accessibility.largeText}
            onToggle={(v) =>
              updateSettings({
                accessibility: { ...settings.accessibility, largeText: v },
              })
            }
            last
          />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title={t.profile.privacy}>
          <ToggleRow
            label={t.profile.shareLocation}
            icon="location-outline"
            value={settings.privacy.shareLocation}
            onToggle={(v) =>
              updateSettings({ privacy: { ...settings.privacy, shareLocation: v } })
            }
          />
          <ToggleRow
            label={t.profile.anonymousMode}
            icon="eye-off-outline"
            value={settings.privacy.anonymousMode}
            onToggle={(v) =>
              updateSettings({ privacy: { ...settings.privacy, anonymousMode: v } })
            }
            last
          />
        </SettingsSection>

        {/* App settings */}
        <SettingsSection title={t.profile.appSettings}>
          <NavRow
            label={t.profile.language}
            icon="language-outline"
            value={settings.language.toUpperCase()}
            onPress={() => {
              Alert.alert(t.profile.chooseLanguage, undefined, [
                { text: t.profile.english, onPress: () => updateSettings({ language: 'en' }) },
                { text: t.profile.kazakh, onPress: () => updateSettings({ language: 'kz' }) },
                { text: t.profile.russian, onPress: () => updateSettings({ language: 'ru' }) },
                { text: t.profile.cancel, style: 'cancel' },
              ]);
            }}
          />
          <NavRow
            label={t.profile.theme}
            icon="color-palette-outline"
            value={settings.theme}
            onPress={() => {
              Alert.alert(t.profile.chooseTheme, undefined, [
                { text: t.profile.light, onPress: () => updateSettings({ theme: 'light' }) },
                { text: t.profile.dark, onPress: () => updateSettings({ theme: 'dark' }) },
                { text: t.profile.system, onPress: () => updateSettings({ theme: 'system' }) },
                { text: t.profile.cancel, style: 'cancel' },
              ]);
            }}
            last
          />
        </SettingsSection>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>{t.profile.logout}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t.profile.version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function ToggleRow({
  label,
  icon,
  value,
  onToggle,
  last,
}: {
  label: string;
  icon: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  last?: boolean;
}) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  return (
    <View style={[styles.settingRow, !last && styles.settingRowBorder]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={18} color={COLORS.textSecondary} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
        thumbColor={value ? COLORS.primary : COLORS.textMuted}
      />
    </View>
  );
}

function NavRow({
  label,
  icon,
  value,
  last,
  onPress,
}: {
  label: string;
  icon: string;
  value: string;
  last?: boolean;
  onPress?: () => void;
}) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  return (
    <TouchableOpacity style={[styles.settingRow, !last && styles.settingRowBorder]} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={18} color={COLORS.textSecondary} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.navRowRight}>
        <Text style={styles.navRowValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  avatarLg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userStudentId: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#34D39920',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  userBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#34D399',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  settingLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  navRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navRowValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  logoutBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + '08',
  },
  logoutText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.error,
  },
  version: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.lg,
  },
}); }
