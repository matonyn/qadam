import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export function ForgotPasswordScreen({ navigation }: Props) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const t = useTranslation();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError(t.auth.emailRequired);
      return;
    }
    if (!email.includes('@')) {
      setError(t.auth.emailInvalid);
      return;
    }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          {!sent ? (
            <>
              <View style={styles.iconWrap}>
                <View style={styles.iconCircle}>
                  <Ionicons name="lock-closed-outline" size={36} color={COLORS.primary} />
                </View>
              </View>

              <Text style={styles.title}>{t.auth.forgotTitle}</Text>
              <Text style={styles.subtitle}>{t.auth.forgotSubtitle}</Text>

              <Input
                label={t.auth.universityEmail}
                placeholder="your.email@nu.edu.kz"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="mail-outline"
                error={error}
              />

              <Button
                title={t.auth.sendReset}
                onPress={handleSend}
                loading={loading}
                fullWidth
                size="lg"
              />

              <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={14} color={COLORS.primary} />
                <Text style={styles.backToLoginText}>{t.auth.backToSignIn}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>{t.auth.emailSent}</Text>
              <Text style={styles.successSubtitle}>{t.auth.emailSentTo}</Text>
              <Text style={styles.successEmail}>{email}</Text>

              <View style={styles.noteCard}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.noteText}>{t.auth.emailSentHint}</Text>
              </View>

              <Button
                title={t.auth.backToSignIn}
                onPress={() => navigation.navigate('Login')}
                fullWidth
                size="lg"
                style={{ marginTop: SPACING.xl }}
              />

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => setSent(false)}
              >
                <Text style={styles.resendText}>{t.auth.tryDifferentEmail}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  backBtn: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: { alignItems: 'center', marginBottom: SPACING.lg },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: SPACING.lg,
  },
  backToLoginText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  successContainer: { alignItems: 'center', paddingTop: SPACING.xl },
  successIconWrap: { marginBottom: SPACING.lg },
  successTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  successEmail: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceVariant,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    width: '100%',
  },
  noteText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  resendBtn: { marginTop: SPACING.md },
  resendText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
}); }
