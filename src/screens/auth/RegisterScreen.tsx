import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useColors, SPACING, FONT_SIZE } from '../../constants/theme';
import { useTranslation } from '../../i18n';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

interface FormData {
  firstName: string;
  lastName: string;
  studentId: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  studentId?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { register, isLoading } = useAuthStore();
  const t = useTranslation();

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t.auth.firstNameRequired;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t.auth.lastNameRequired;
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = t.auth.studentIdRequired;
    } else if (formData.studentId.length < 6) {
      newErrors.studentId = t.auth.studentIdMin;
    }

    if (!formData.email) {
      newErrors.email = t.auth.emailRequired;
    } else if (!formData.email.includes('@')) {
      newErrors.email = t.auth.emailInvalid;
    }

    if (!formData.password) {
      newErrors.password = t.auth.passwordRequired;
    } else if (formData.password.length < 8) {
      newErrors.password = t.auth.passwordMin;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t.auth.passwordRequired;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.auth.passwordsNoMatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const success = await register(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      formData.studentId
    );

    if (!success) {
      const msg = useAuthStore.getState().authError;
      Alert.alert(t.common.error, msg ?? t.common.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t.auth.createAccount}</Text>
            <Text style={styles.subtitle}>{t.auth.registerSubtitle}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label={t.auth.firstName}
                  placeholder={t.auth.firstNamePlaceholder}
                  value={formData.firstName}
                  onChangeText={(v) => updateField('firstName', v)}
                  autoCapitalize="words"
                  error={errors.firstName}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label={t.auth.lastName}
                  placeholder={t.auth.lastNamePlaceholder}
                  value={formData.lastName}
                  onChangeText={(v) => updateField('lastName', v)}
                  autoCapitalize="words"
                  error={errors.lastName}
                />
              </View>
            </View>

            <Input
              label={t.auth.studentId}
              placeholder={t.auth.studentIdPlaceholder}
              value={formData.studentId}
              onChangeText={(v) => updateField('studentId', v)}
              leftIcon="card-outline"
              error={errors.studentId}
            />

            <Input
              label={t.auth.email}
              placeholder={t.auth.emailPlaceholder}
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail-outline"
              error={errors.email}
            />

            <Input
              label={t.auth.password}
              placeholder={t.auth.passwordPlaceholder}
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <Input
              label={t.auth.confirmPassword}
              placeholder={t.auth.confirmPasswordPlaceholder}
              value={formData.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
            />

            <Button
              title={t.auth.createAccount}
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t.auth.alreadyAccount}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>{t.auth.signIn}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  form: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  terms: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  footerText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
}); }
