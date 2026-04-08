import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { mockCourses, mockAcademicPlan, gradePointsMap } from '../../data/mockData';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';

type Tab = 'overview' | 'courses' | 'calculator';

export function AcademicScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [calcGrades, setCalcGrades] = useState<{ grade: string; credits: number }[]>([
    { grade: 'A', credits: 6 },
    { grade: 'A-', credits: 6 },
  ]);
  const t = useTranslation();

  const GRADE_COLORS: Record<string, string> = {
    A: COLORS.success,
    'A-': COLORS.success,
    'B+': COLORS.secondary,
    B: COLORS.secondary,
    'B-': COLORS.accent,
    'C+': COLORS.warning,
    C: COLORS.warning,
    F: COLORS.error,
  };

  const plan = mockAcademicPlan;
  const progressPct = Math.round((plan.creditsCompleted / plan.totalCreditsRequired) * 100);

  const currentSemesterCourses = mockCourses.filter(
    (c) => c.semester === 'Spring 2026'
  );
  const completedCourses = mockCourses.filter((c) => c.grade);

  // Calculator GPA
  const calcGPA = (() => {
    const totalPoints = calcGrades.reduce(
      (sum, g) => sum + (gradePointsMap[g.grade] ?? 0) * g.credits,
      0
    );
    const totalCredits = calcGrades.reduce((sum, g) => sum + g.credits, 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  })();

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: t.academic.overview },
    { key: 'courses', label: t.academic.courses },
    { key: 'calculator', label: t.academic.gpaCalc },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.academic.title}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* GPA Card */}
            <View style={styles.gpaCard}>
              <View style={styles.gpaMain}>
                <Text style={styles.gpaLabel}>{t.academic.gpaProgress}</Text>
                <Text style={styles.gpaValue}>{plan.gpa.toFixed(2)}</Text>
                <View style={styles.standingBadge}>
                  <Ionicons name="ribbon" size={14} color="#34D399" />
                  <Text style={styles.standingText}>{t.profile.deansList}</Text>
                </View>
              </View>
              <View style={styles.gpaSplit}>
                <View style={styles.gpaStat}>
                  <Text style={styles.gpaStatValue}>{plan.major}</Text>
                  <Text style={styles.gpaStatLabel}>{t.academic.major}</Text>
                </View>
                {plan.minor && (
                  <View style={styles.gpaStat}>
                    <Text style={styles.gpaStatValue}>{plan.minor}</Text>
                    <Text style={styles.gpaStatLabel}>{t.academic.minor}</Text>
                  </View>
                )}
                <View style={styles.gpaStat}>
                  <Text style={styles.gpaStatValue}>{plan.expectedGraduation}</Text>
                  <Text style={styles.gpaStatLabel}>{t.academic.graduation}</Text>
                </View>
              </View>
            </View>

            {/* Credit Progress */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t.academic.creditProgress}</Text>
                <Text style={styles.creditCount}>
                  {plan.creditsCompleted + plan.creditsInProgress}/
                  {plan.totalCreditsRequired} {t.academic.credits}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                <View
                  style={[
                    styles.progressInProgress,
                    {
                      width: `${Math.round((plan.creditsInProgress / plan.totalCreditsRequired) * 100)}%`,
                      left: `${progressPct}%` as any,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.legendText}>{t.academic.completed} ({plan.creditsCompleted})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.primaryLight }]} />
                  <Text style={styles.legendText}>{t.academic.inProgress} ({plan.creditsInProgress})</Text>
                </View>
              </View>
            </View>

            {/* Current semester */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.academic.currentSemester} — Spring 2026</Text>
              {currentSemesterCourses.map((course) => (
                <View key={course.id} style={styles.courseRow}>
                  <View style={styles.courseCodeBadge}>
                    <Text style={styles.courseCode}>{course.code.split(' ')[1]}</Text>
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName} numberOfLines={1}>
                      {course.name}
                    </Text>
                    <Text style={styles.courseInstructor}>{course.instructor}</Text>
                  </View>
                  <Text style={styles.courseCredits}>{course.credits} cr</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* COURSES */}
        {activeTab === 'courses' && (
          <>
            <Text style={styles.semesterLabel}>{t.academic.springInProgress}</Text>
            {currentSemesterCourses.map((course) => (
              <CourseCard key={course.id} course={course} GRADE_COLORS={GRADE_COLORS} />
            ))}
            <Text style={styles.semesterLabel}>{t.academic.fallCompleted}</Text>
            {completedCourses.map((course) => (
              <CourseCard key={course.id} course={course} GRADE_COLORS={GRADE_COLORS} />
            ))}
          </>
        )}

        {/* GPA CALCULATOR */}
        {activeTab === 'calculator' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.academic.gpaCalculator}</Text>
            <View style={styles.calcResult}>
              <Text style={styles.calcLabel}>{t.academic.calculatedGPA}</Text>
              <Text style={styles.calcGPA}>{calcGPA}</Text>
            </View>
            {calcGrades.map((item, idx) => (
              <View key={idx} style={styles.calcRow}>
                <View style={styles.calcGradeRow}>
                  {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'F'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.gradeBtn,
                        item.grade === g && styles.gradeBtnActive,
                      ]}
                      onPress={() => {
                        const updated = [...calcGrades];
                        updated[idx] = { ...updated[idx], grade: g };
                        setCalcGrades(updated);
                      }}
                    >
                      <Text
                        style={[
                          styles.gradeBtnText,
                          item.grade === g && styles.gradeBtnTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.calcCreditRow}>
                  <Text style={styles.calcCreditLabel}>Credits: {item.credits}</Text>
                  <View style={styles.calcCreditBtns}>
                    <TouchableOpacity
                      style={styles.creditAdj}
                      onPress={() => {
                        const updated = [...calcGrades];
                        updated[idx] = {
                          ...updated[idx],
                          credits: Math.max(1, updated[idx].credits - 1),
                        };
                        setCalcGrades(updated);
                      }}
                    >
                      <Ionicons name="remove" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.creditAdj}
                      onPress={() => {
                        const updated = [...calcGrades];
                        updated[idx] = {
                          ...updated[idx],
                          credits: updated[idx].credits + 1,
                        };
                        setCalcGrades(updated);
                      }}
                    >
                      <Ionicons name="add" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    {calcGrades.length > 1 && (
                      <TouchableOpacity
                        style={styles.creditAdj}
                        onPress={() => {
                          setCalcGrades(calcGrades.filter((_, i) => i !== idx));
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addCourseBtn}
              onPress={() => setCalcGrades([...calcGrades, { grade: 'A', credits: 6 }])}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.addCourseText}>{t.academic.addCourse}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CourseCard({
  course,
  GRADE_COLORS,
}: {
  course: (typeof mockCourses)[0];
  GRADE_COLORS: Record<string, string>;
}) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const gradeColor = course.grade ? GRADE_COLORS[course.grade] ?? COLORS.textSecondary : COLORS.textMuted;
  const days = course.schedule.map((s) => s.day.slice(0, 3).toUpperCase()).join(', ');
  const time = course.schedule[0]
    ? `${course.schedule[0].startTime} – ${course.schedule[0].endTime}`
    : '';

  return (
    <View style={styles.courseCard}>
      <View style={styles.courseCardHeader}>
        <View>
          <Text style={styles.courseCardCode}>{course.code}</Text>
          <Text style={styles.courseCardName}>{course.name}</Text>
        </View>
        {course.grade ? (
          <View style={[styles.gradeBadge, { backgroundColor: gradeColor + '20' }]}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>{course.grade}</Text>
          </View>
        ) : (
          <View style={styles.inProgressBadge}>
            <Text style={styles.inProgressText}>In Progress</Text>
          </View>
        )}
      </View>
      <View style={styles.courseCardMeta}>
        <View style={styles.metaChip}>
          <Ionicons name="person-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.metaChipText}>{course.instructor}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.metaChipText}>{days}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.metaChipText}>{time}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="bookmark-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.metaChipText}>{course.credits} credits</Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  tabLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  gpaCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  gpaMain: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  gpaLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  gpaValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.surface,
    lineHeight: 64,
  },
  standingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    marginTop: 4,
  },
  standingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#34D399',
  },
  gpaSplit: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: SPACING.md,
  },
  gpaStat: { alignItems: 'center' },
  gpaStatValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.surface,
    textAlign: 'center',
  },
  gpaStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  creditCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  progressInProgress: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 5,
  },
  progressLegend: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  courseCodeBadge: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseCode: {
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  courseInfo: { flex: 1 },
  courseName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  courseInstructor: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  courseCredits: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  semesterLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  courseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  courseCardCode: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  courseCardName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  gradeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  gradeText: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  inProgressBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.accent + '20',
  },
  inProgressText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.accent,
  },
  courseCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  metaChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  calcResult: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  calcLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  calcGPA: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  calcRow: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  calcGradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  gradeBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  gradeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  gradeBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  gradeBtnTextActive: {
    color: COLORS.surface,
  },
  calcCreditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calcCreditLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  calcCreditBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  creditAdj: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCourseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  addCourseText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
}); }
