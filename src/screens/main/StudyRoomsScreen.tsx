import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { mockStudyRooms } from '../../data/mockData';
import { StudyRoom } from '../../types';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'StudyRooms'>;
};

type NoiseFilter = 'all' | 'quiet' | 'moderate' | 'collaborative';

const AMENITY_ICONS: Record<string, string> = {
  'Wi-Fi': 'wifi-outline',
  'Power Outlets': 'flash-outline',
  'Whiteboard': 'easel-outline',
  'Projector': 'desktop-outline',
  'TV Screen': 'tv-outline',
  'Natural Light': 'sunny-outline',
  'Vending Machines': 'cafe-outline',
  'Lab Equipment Access': 'flask-outline',
};

export function StudyRoomsScreen({ navigation }: Props) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const t = useTranslation();

  const NOISE_CONFIG = {
    quiet: { label: t.studyRooms.quiet, icon: 'volume-mute-outline', color: COLORS.success },
    moderate: { label: t.studyRooms.moderate, icon: 'volume-low-outline', color: COLORS.accent },
    collaborative: { label: t.studyRooms.collaborative, icon: 'volume-high-outline', color: COLORS.primaryLight },
  };

  const [noiseFilter, setNoiseFilter] = useState<NoiseFilter>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const filtered = mockStudyRooms.filter((r) => {
    if (showAvailableOnly && !r.isAvailable) return false;
    if (noiseFilter !== 'all' && r.noiseLevel !== noiseFilter) return false;
    return true;
  });

  const handleBook = (room: StudyRoom) => {
    Alert.alert(
      t.studyRooms.bookTitle,
      `${t.studyRooms.bookNow} ${room.name}?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.studyRooms.confirm,
          onPress: () =>
            Alert.alert(t.studyRooms.booked, `${room.name} has been reserved for you.`),
        },
      ]
    );
  };

  const renderRoom = ({ item }: { item: StudyRoom }) => {
    const noise = NOISE_CONFIG[item.noiseLevel];
    const occupancyPct = Math.round((item.currentOccupancy / item.capacity) * 100);
    const occupancyColor =
      occupancyPct >= 80 ? COLORS.error : occupancyPct >= 50 ? COLORS.accent : COLORS.success;

    return (
      <View style={[styles.card, !item.isAvailable && styles.cardUnavailable]}>
        <View style={styles.cardHeader}>
          <View style={styles.roomInfo}>
            <Text style={styles.roomName}>{item.name}</Text>
            <Text style={styles.buildingName}>{item.buildingName} • Floor {item.floor}</Text>
          </View>
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: item.isAvailable ? COLORS.success + '20' : COLORS.error + '20' }
          ]}>
            <View style={[
              styles.availabilityDot,
              { backgroundColor: item.isAvailable ? COLORS.success : COLORS.error }
            ]} />
            <Text style={[
              styles.availabilityText,
              { color: item.isAvailable ? COLORS.success : COLORS.error }
            ]}>
              {item.isAvailable ? t.studyRooms.available : t.studyRooms.full}
            </Text>
          </View>
        </View>

        {/* Occupancy bar */}
        <View style={styles.occupancySection}>
          <View style={styles.occupancyRow}>
            <Text style={styles.occupancyLabel}>{t.studyRooms.occupancy}</Text>
            <Text style={[styles.occupancyCount, { color: occupancyColor }]}>
              {item.currentOccupancy}/{item.capacity}
            </Text>
          </View>
          <View style={styles.occupancyBar}>
            <View
              style={[
                styles.occupancyFill,
                { width: `${occupancyPct}%` as any, backgroundColor: occupancyColor },
              ]}
            />
          </View>
        </View>

        {/* Noise + capacity row */}
        <View style={styles.metaRow}>
          <View style={[styles.noiseBadge, { backgroundColor: noise.color + '15' }]}>
            <Ionicons name={noise.icon as any} size={13} color={noise.color} />
            <Text style={[styles.noiseText, { color: noise.color }]}>{noise.label}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="people-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{t.studyRooms.capacity} {item.capacity}</Text>
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.amenities}>
          {item.amenities.map((amenity) => (
            <View key={amenity} style={styles.amenityChip}>
              <Ionicons
                name={(AMENITY_ICONS[amenity] ?? 'checkmark-outline') as any}
                size={12}
                color={COLORS.textSecondary}
              />
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </View>

        {/* Book button */}
        <TouchableOpacity
          style={[styles.bookBtn, !item.isAvailable && styles.bookBtnDisabled]}
          onPress={() => item.isAvailable && handleBook(item)}
          disabled={!item.isAvailable}
          activeOpacity={0.8}
        >
          <Ionicons
            name={item.isAvailable ? 'calendar-outline' : 'close-circle-outline'}
            size={16}
            color={item.isAvailable ? COLORS.surface : COLORS.textMuted}
          />
          <Text style={[styles.bookText, !item.isAvailable && styles.bookTextDisabled]}>
            {item.isAvailable ? t.studyRooms.bookNow : t.studyRooms.notAvailable}
          </Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{t.studyRooms.title}</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Noise level chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {(['all', 'quiet', 'moderate', 'collaborative'] as NoiseFilter[]).map((key) => {
            const active = noiseFilter === key;
            const cfg = key !== 'all' ? NOISE_CONFIG[key] : null;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setNoiseFilter(key)}
                activeOpacity={0.8}
              >
                {cfg && (
                  <Ionicons
                    name={cfg.icon as any}
                    size={13}
                    color={active ? COLORS.surface : COLORS.textSecondary}
                  />
                )}
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {key === 'all' ? t.studyRooms.allRooms : cfg!.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Available only toggle */}
        <TouchableOpacity
          style={[styles.availableToggle, showAvailableOnly && styles.availableToggleActive]}
          onPress={() => setShowAvailableOnly(!showAvailableOnly)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={showAvailableOnly ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={16}
            color={showAvailableOnly ? COLORS.surface : COLORS.textSecondary}
          />
          <Text style={[styles.availableToggleText, showAvailableOnly && styles.availableToggleTextActive]}>
            {t.studyRooms.availableOnly}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>{t.studyRooms.noRooms}</Text>
          </View>
        }
      />
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
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
  filtersContainer: { paddingBottom: SPACING.sm },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
  chipLabelActive: { color: COLORS.surface },
  availableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
  },
  availableToggleActive: { backgroundColor: COLORS.secondary },
  availableToggleText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
  availableToggleTextActive: { color: COLORS.surface },
  list: { padding: SPACING.lg, gap: SPACING.md },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardUnavailable: { opacity: 0.75 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  roomInfo: { flex: 1 },
  roomName: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  buildingName: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  availabilityDot: { width: 6, height: 6, borderRadius: 3 },
  availabilityText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  occupancySection: { marginBottom: SPACING.md },
  occupancyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  occupancyLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  occupancyCount: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  occupancyBar: {
    height: 6,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  noiseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  noiseText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  metaText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: SPACING.md,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  amenityText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
  },
  bookBtnDisabled: { backgroundColor: COLORS.surfaceVariant },
  bookText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.surface },
  bookTextDisabled: { color: COLORS.textMuted },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
}); }
