import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { mockReviews } from '../../data/mockData';
import { Review } from '../../types';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Reviews'>;
};

type TargetType = 'all' | 'building' | 'cafe' | 'room' | 'service';

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color={i <= rating ? COLORS.accent : COLORS.border}
        />
      ))}
    </View>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export function ReviewsScreen({ navigation }: Props) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const t = useTranslation();

  const SENTIMENT_CONFIG = {
    positive: { icon: 'happy-outline', color: COLORS.success, label: 'Positive' },
    neutral: { icon: 'remove-circle-outline', color: COLORS.accent, label: 'Neutral' },
    negative: { icon: 'sad-outline', color: COLORS.error, label: 'Negative' },
  };

  const [typeFilter, setTypeFilter] = useState<TargetType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviews, setReviews] = useState(mockReviews);

  // Add review form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newTarget, setNewTarget] = useState('Library');

  const filtered =
    typeFilter === 'all' ? reviews : reviews.filter((r) => r.targetType === typeFilter);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  const handleSubmitReview = () => {
    if (!newComment.trim()) {
      Alert.alert(t.common.error, t.reviews.errorComment);
      return;
    }
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      userId: 'user-001',
      userName: 'Aiym A.',
      targetId: 'bldg-004',
      targetType: 'building',
      targetName: newTarget,
      rating: newRating,
      comment: newComment.trim(),
      sentiment: newRating >= 4 ? 'positive' : newRating === 3 ? 'neutral' : 'negative',
      helpful: 0,
      createdAt: new Date().toISOString(),
    };
    setReviews([newReview, ...reviews]);
    setShowAddModal(false);
    setNewComment('');
    setNewRating(5);
    Alert.alert(t.reviews.thankYou, t.reviews.reviewSubmitted);
  };

  const FILTERS: { key: TargetType; label: string }[] = [
    { key: 'all', label: t.reviews.all },
    { key: 'building', label: t.reviews.buildings },
    { key: 'cafe', label: t.reviews.cafes },
    { key: 'room', label: t.reviews.rooms },
    { key: 'service', label: t.reviews.services },
  ];

  const renderReview = ({ item }: { item: Review }) => {
    const sentiment = SENTIMENT_CONFIG[item.sentiment];
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewAvatar}>
            <Text style={styles.reviewAvatarText}>{item.userName[0]}</Text>
          </View>
          <View style={styles.reviewMeta}>
            <Text style={styles.reviewAuthor}>{item.userName}</Text>
            <Text style={styles.reviewTarget}>{item.targetName}</Text>
          </View>
          <View style={styles.reviewRight}>
            <StarRating rating={item.rating} />
            <Text style={styles.reviewDate}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.reviewComment}>{item.comment}</Text>

        <View style={styles.reviewFooter}>
          <View style={[styles.sentimentBadge, { backgroundColor: sentiment.color + '15' }]}>
            <Ionicons name={sentiment.icon as any} size={12} color={sentiment.color} />
            <Text style={[styles.sentimentText, { color: sentiment.color }]}>
              {sentiment.label}
            </Text>
          </View>
          <TouchableOpacity style={styles.helpfulBtn}>
            <Ionicons name="thumbs-up-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.helpfulText}>Helpful ({item.helpful})</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.reviews.title}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{avgRating}</Text>
          <StarRating rating={Math.round(parseFloat(avgRating))} />
          <Text style={styles.statLabel}>{reviews.length} reviews</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.sentimentStats}>
          {Object.entries(SENTIMENT_CONFIG).map(([key, cfg]) => {
            const count = reviews.filter((r) => r.sentiment === key).length;
            return (
              <View key={key} style={styles.sentimentStat}>
                <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                <Text style={styles.sentimentStatText}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, typeFilter === f.key && styles.chipActive]}
            onPress={() => setTypeFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipLabel, typeFilter === f.key && styles.chipLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Review Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.reviews.submitReview}</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalLabel}>{t.reviews.location}</Text>
            <TextInput
              style={styles.modalInput}
              value={newTarget}
              onChangeText={setNewTarget}
              placeholder={t.reviews.locationPlaceholder}
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.modalLabel}>{t.reviews.rating}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setNewRating(i)}>
                  <Ionicons
                    name={i <= newRating ? 'star' : 'star-outline'}
                    size={36}
                    color={i <= newRating ? COLORS.accent : COLORS.border}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>{t.reviews.comment}</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              value={newComment}
              onChangeText={setNewComment}
              placeholder={t.reviews.sharePlaceholder}
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReview} activeOpacity={0.85}>
              <Text style={styles.submitBtnText}>{t.reviews.submitReview}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FONT_SIZE.xxl, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  statDivider: { width: 1, height: 48, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },
  sentimentStats: { flex: 1, gap: SPACING.sm },
  sentimentStat: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sentimentStatText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  filterScroll: { flexGrow: 0 },
  filterRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.sm, alignItems: 'center' },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
  chipLabelActive: { color: COLORS.surface },
  list: { padding: SPACING.lg, gap: SPACING.md },
  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: FONT_SIZE.md, fontWeight: 'bold', color: COLORS.surface },
  reviewMeta: { flex: 1 },
  reviewAuthor: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  reviewTarget: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 1 },
  reviewRight: { alignItems: 'flex-end', gap: 2 },
  reviewDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  reviewComment: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sentimentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  sentimentText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  helpfulBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  helpfulText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  modalContent: { padding: SPACING.lg, gap: SPACING.sm },
  modalLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalTextarea: { height: 100, textAlignVertical: 'top' },
  ratingRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  submitBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.surface },
}); }
