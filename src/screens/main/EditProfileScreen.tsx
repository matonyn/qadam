import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '../../navigation/ProfileNavigator';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;
};

export function EditProfileScreen({ navigation }: Props) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const t = useTranslation();

  const { user, updateProfile } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = t.editProfile.firstNameRequired;
    if (!lastName.trim()) errs.lastName = t.editProfile.lastNameRequired;
    if (!email.trim()) errs.email = t.auth.emailRequired;
    else if (!email.includes('@')) errs.email = t.auth.emailInvalid;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
    setLoading(false);
    Alert.alert(t.editProfile.saved, t.editProfile.savedMsg, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.editProfile.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || 'A'}</Text>
            </View>
            <TouchableOpacity style={styles.avatarEditBtn} onPress={() => Alert.alert(t.editProfile.comingSoon, t.editProfile.photoSoon)}>
              <Ionicons name="camera" size={14} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>{t.editProfile.tapToChange}</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.editProfile.personalInfo}</Text>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Input
                label={t.auth.firstName}
                placeholder={t.editProfile.firstNamePlaceholder}
                value={firstName}
                onChangeText={(v) => {
                  setFirstName(v);
                  setErrors((e) => ({ ...e, firstName: '' }));
                }}
                autoCapitalize="words"
                leftIcon="person-outline"
                error={errors.firstName}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={t.auth.lastName}
                placeholder={t.editProfile.lastNamePlaceholder}
                value={lastName}
                onChangeText={(v) => {
                  setLastName(v);
                  setErrors((e) => ({ ...e, lastName: '' }));
                }}
                autoCapitalize="words"
                leftIcon="person-outline"
                error={errors.lastName}
              />
            </View>
          </View>

          <Input
            label={t.auth.email}
            placeholder={t.editProfile.emailPlaceholder}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setErrors((e) => ({ ...e, email: '' }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />
        </View>

        {/* Read-only fields */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.editProfile.universityInfo}</Text>
          <View style={styles.readonlyRow}>
            <Ionicons name="card-outline" size={18} color={COLORS.textSecondary} />
            <View style={styles.readonlyContent}>
              <Text style={styles.readonlyLabel}>{t.auth.studentId}</Text>
              <Text style={styles.readonlyValue}>{user?.studentId ?? '—'}</Text>
            </View>
            <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
          </View>
          <View style={[styles.readonlyRow, { borderTopWidth: 1, borderTopColor: COLORS.borderLight }]}>
            <Ionicons name="school-outline" size={18} color={COLORS.textSecondary} />
            <View style={styles.readonlyContent}>
              <Text style={styles.readonlyLabel}>{t.editProfile.institution}</Text>
              <Text style={styles.readonlyValue}>{t.editProfile.institutionValue}</Text>
            </View>
            <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
          </View>
          <Text style={styles.readonlyHint}>{t.editProfile.readonlyHint}</Text>
        </View>

        {/* Save button */}
        <Button
          title={t.editProfile.saveChanges}
          onPress={handleSave}
          loading={loading}
          fullWidth
          size="lg"
        />

        <TouchableOpacity
          style={styles.changePasswordBtn}
          onPress={() => Alert.alert(t.editProfile.changePassword, t.editProfile.changePasswordMsg, [
            { text: t.common.cancel, style: 'cancel' },
            { text: t.editProfile.sendLink, onPress: () => Alert.alert(t.editProfile.sent, t.editProfile.checkEmail) },
          ])}
        >
          <Ionicons name="lock-closed-outline" size={16} color={COLORS.primary} />
          <Text style={styles.changePasswordText}>{t.editProfile.changePassword}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  scroll: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.md },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.surface },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarHint: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  nameRow: { flexDirection: 'row', gap: SPACING.sm },
  readonlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  readonlyContent: { flex: 1 },
  readonlyLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '600' },
  readonlyValue: { fontSize: FONT_SIZE.md, color: COLORS.textMuted, marginTop: 2 },
  readonlyHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  changePasswordText: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '600' },
}); }
