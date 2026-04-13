import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { StudyRoom } from '../../types';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';
import { studyRoomsApi } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'StudyRooms'>;
};

type NoiseFilter = 'all' | 'quiet' | 'moderate' | 'collaborative';

type TimeSlot = { startTime: string; endTime: string; available: boolean };

function localDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hhmmToMin(t: string): number {
  const [h, mm] = t.split(':').map(Number);
  return h * 60 + mm;
}

function minToHhmm(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function rangeFree(slots: TimeSlot[], startT: string, endT: string): boolean {
  const s0 = hhmmToMin(startT);
  const s1 = hhmmToMin(endT);
  for (let t = s0; t < s1; t += 30) {
    const key = minToHhmm(t);
    const sl = slots.find((x) => x.startTime === key);
    if (!sl || !sl.available) return false;
  }
  return true;
}

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
  const [allRooms, setAllRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const [bookVisible, setBookVisible] = useState(false);
  const [bookRoom, setBookRoom] = useState<StudyRoom | null>(null);
  const [bookDate, setBookDate] = useState(() => localDateISO(new Date()));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookStart, setBookStart] = useState('');
  const [bookEnd, setBookEnd] = useState('');
  const [bookingSubmit, setBookingSubmit] = useState(false);

  const refreshRooms = () => {
    studyRoomsApi
      .getStudyRooms()
      .then((res) => setAllRooms(res.data ?? []))
      .catch(console.error);
  };

  useEffect(() => {
    setLoading(true);
    studyRoomsApi
      .getStudyRooms()
      .then((res) => setAllRooms(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadSlotsForRoom = (room: StudyRoom, date: string) => {
    setSlotsLoading(true);
    setSlots([]);
    setBookStart('');
    setBookEnd('');
    studyRoomsApi
      .getRoomAvailability(room.id, date)
      .then((res) => setSlots(res.data ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  };

  useEffect(() => {
    if (bookVisible && bookRoom) {
      loadSlotsForRoom(bookRoom, bookDate);
    }
  }, [bookVisible, bookRoom, bookDate]);

  const validEndTimes = useMemo(() => {
    if (!bookStart || !slots.length) return [];
    const starts: string[] = [];
    for (const dur of [30, 60, 90, 120]) {
      const end = minToHhmm(hhmmToMin(bookStart) + dur);
      if (rangeFree(slots, bookStart, end)) starts.push(end);
    }
    return starts;
  }, [bookStart, slots]);

  const openBook = (room: StudyRoom) => {
    setBookRoom(room);
    setBookDate(localDateISO(new Date()));
    setBookVisible(true);
  };

  const closeBook = () => {
    if (bookingSubmit) return;
    setBookVisible(false);
    setBookRoom(null);
    setSlots([]);
    setBookStart('');
    setBookEnd('');
  };

  const confirmBooking = () => {
    if (!bookRoom || !bookStart || !bookEnd) return;
    setBookingSubmit(true);
    studyRoomsApi
      .bookRoom(bookRoom.id, { date: bookDate, startTime: bookStart, endTime: bookEnd })
      .then(() => {
        setBookVisible(false);
        setBookRoom(null);
        Alert.alert(t.studyRooms.booked, `${bookRoom.name} · ${bookStart}–${bookEnd}`);
        refreshRooms();
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        Alert.alert(t.common.error, msg || t.studyRooms.bookingFailed);
      })
      .finally(() => setBookingSubmit(false));
  };

  const filtered = allRooms.filter((r) => {
    if (showAvailableOnly && !r.isAvailable) return false;
    if (noiseFilter !== 'all' && r.noiseLevel !== noiseFilter) return false;
    return true;
  });

  const todayStr = localDateISO(new Date());
  const tomorrowD = new Date();
  tomorrowD.setDate(tomorrowD.getDate() + 1);
  const tomorrowStr = localDateISO(tomorrowD);

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
          onPress={() => item.isAvailable && openBook(item)}
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

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
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
      )}

      <Modal visible={bookVisible} animationType="slide" transparent onRequestClose={closeBook}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeBook} />
          <View style={[styles.modalSheet, { backgroundColor: COLORS.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: COLORS.text }]}>{t.studyRooms.bookTitle}</Text>
            {bookRoom ? (
              <Text style={[styles.modalSubtitle, { color: COLORS.textSecondary }]} numberOfLines={2}>
                {bookRoom.name} · {bookRoom.buildingName}
              </Text>
            ) : null}

            <Text style={[styles.modalHint, { color: COLORS.textMuted }]}>{t.studyRooms.maxTwoHours}</Text>

            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateChip, bookDate === todayStr && styles.dateChipActive]}
                onPress={() => setBookDate(todayStr)}
              >
                <Text style={[styles.dateChipText, bookDate === todayStr && styles.dateChipTextActive]}>
                  {t.studyRooms.today}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateChip, bookDate === tomorrowStr && styles.dateChipActive]}
                onPress={() => setBookDate(tomorrowStr)}
              >
                <Text style={[styles.dateChipText, bookDate === tomorrowStr && styles.dateChipTextActive]}>
                  {t.studyRooms.tomorrow}
                </Text>
              </TouchableOpacity>
            </View>

            {slotsLoading ? (
              <ActivityIndicator style={{ marginVertical: SPACING.lg }} color={COLORS.primary} />
            ) : (
              <>
                <Text style={[styles.fieldLabel, { color: COLORS.text }]}>{t.studyRooms.startTime}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotRow}>
                  {slots
                    .filter((s) => s.available)
                    .map((s) => {
                      const active = bookStart === s.startTime;
                      return (
                        <TouchableOpacity
                          key={s.startTime}
                          style={[styles.slotChip, active && { backgroundColor: COLORS.primary }]}
                          onPress={() => {
                            setBookStart(s.startTime);
                            const ends: string[] = [];
                            for (const dur of [30, 60, 90, 120]) {
                              const end = minToHhmm(hhmmToMin(s.startTime) + dur);
                              if (rangeFree(slots, s.startTime, end)) ends.push(end);
                            }
                            setBookEnd(ends[0] ?? '');
                          }}
                        >
                          <Text style={[styles.slotChipText, active && { color: COLORS.surface }]}>{s.startTime}</Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>

                <Text style={[styles.fieldLabel, { color: COLORS.text }]}>{t.studyRooms.endTime}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotRow}>
                  {validEndTimes.map((end) => {
                    const active = bookEnd === end;
                    return (
                      <TouchableOpacity
                        key={end}
                        style={[styles.slotChip, active && { backgroundColor: COLORS.primary }]}
                        onPress={() => setBookEnd(end)}
                        disabled={!bookStart}
                      >
                        <Text style={[styles.slotChipText, active && { color: COLORS.surface }]}>{end}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtnSecondary, { borderColor: COLORS.borderLight }]} onPress={closeBook}>
                <Text style={{ color: COLORS.textSecondary, fontWeight: '700' }}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnPrimary,
                  { backgroundColor: COLORS.primary, opacity: !bookStart || !bookEnd || bookingSubmit ? 0.5 : 1 },
                ]}
                disabled={!bookStart || !bookEnd || bookingSubmit}
                onPress={confirmBooking}
              >
                {bookingSubmit ? (
                  <ActivityIndicator color={COLORS.surface} />
                ) : (
                  <Text style={{ color: COLORS.surface, fontWeight: '800' }}>{t.studyRooms.confirm}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
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
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  modalSubtitle: { fontSize: FONT_SIZE.sm, marginTop: 4, marginBottom: SPACING.sm },
  modalHint: { fontSize: FONT_SIZE.xs, marginBottom: SPACING.md },
  dateRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  dateChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  dateChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateChipText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textSecondary },
  dateChipTextActive: { color: COLORS.surface },
  fieldLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: SPACING.sm },
  slotRow: { gap: SPACING.sm, paddingBottom: SPACING.md },
  slotChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
  },
  slotChipText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  modalBtnSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
  },
  modalBtnPrimary: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg },
}); }
