import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NavigateStackParamList } from '../../navigation/NavigateNavigator';
import { mapsApi, reviewsApi } from '../../services/api';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';

type Props = {
  navigation: NativeStackNavigationProp<NavigateStackParamList, 'BuildingDetail'>;
  route: RouteProp<NavigateStackParamList, 'BuildingDetail'>;
};

const ROOM_TYPE_ICONS: Record<string, string> = {
  classroom: 'easel-outline',
  lab: 'flask-outline',
  office: 'briefcase-outline',
  study_room: 'book-outline',
  restroom: 'water-outline',
  elevator: 'arrow-up-circle-outline',
  stairs: 'chevron-up-circle-outline',
  other: 'ellipse-outline',
};

export function BuildingDetailScreen({ navigation, route }: Props) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const t = useTranslation();

  const CATEGORY_COLORS: Record<string, string> = {
    academic: COLORS.primary,
    library: COLORS.primaryLight,
    dining: COLORS.accent,
    residential: COLORS.secondary,
    sports: '#F97316',
    admin: '#6B7280',
    other: COLORS.textSecondary,
  };

  const { buildingId } = route.params;
  const [building, setBuilding] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [buildingReviews, setBuildingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      mapsApi.getBuilding(buildingId),
      mapsApi.getRoomsByBuilding(buildingId),
      reviewsApi.getReviews({ targetId: buildingId, targetType: 'building' }),
    ])
      .then(([bRes, rRes, revRes]) => {
        setBuilding(bRes.data);
        setRooms(rRes.data ?? []);
        setBuildingReviews(revRes.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [buildingId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtnOverlay} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!building) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtnOverlay} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t.buildingDetail.notFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const color = CATEGORY_COLORS[building.category] ?? COLORS.primary;
  const avgRating =
    buildingReviews.length > 0
      ? (buildingReviews.reduce((s, r) => s + r.rating, 0) / buildingReviews.length).toFixed(1)
      : null;

  const handleNavigate = async () => {
    const { latitude, longitude } = building;

    // 2GIS deep link (lng,lat order), web fallback
    const twoGisApp = `dgis://2gis.ru/routeSearch/rsType/pedestrian/to/${longitude},${latitude}`;
    const twoGisWeb = `https://2gis.kz/directions/pedestrian/to/${longitude},${latitude}`;
    const appleMapsUrl = `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w`;

    try {
      const canOpen2Gis = await Linking.canOpenURL(twoGisApp);
      if (canOpen2Gis) {
        await Linking.openURL(twoGisApp);
        return;
      }
      if (Platform.OS === 'ios') {
        await Linking.openURL(appleMapsUrl);
        return;
      }
      await Linking.openURL(twoGisWeb);
    } catch {
      Alert.alert(t.common.error, t.buildingDetail.errorMaps);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: color }]}>
        <TouchableOpacity
          style={styles.backBtnOverlay}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{building.category}</Text>
          </View>
          <Text style={styles.heroTitle}>{building.name}</Text>
          <Text style={styles.heroDesc}>{building.description}</Text>

          {/* Quick stats */}
          <View style={styles.heroStats}>
            <StatChip icon="layers-outline" label={`${building.floors} floors`} />
            {building.hasElevator && <StatChip icon="arrow-up-circle-outline" label={t.buildingDetail.elevator} />}
            {building.hasRamp && (
              <StatChip icon="accessibility-outline" label={t.navigate.accessible} highlight />
            )}
            {avgRating && <StatChip icon="star" label={`${avgRating} ★`} />}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Navigate button */}
        <TouchableOpacity
          style={[styles.navigateBtn, { backgroundColor: color }]}
          onPress={handleNavigate}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={20} color={COLORS.surface} />
          <Text style={styles.navigateBtnText}>{t.buildingDetail.navigateHere}</Text>
        </TouchableOpacity>

        {/* Accessibility info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.buildingDetail.accessibility}</Text>
          <View style={styles.accessRow}>
            <AccessItem
              icon="accessibility-outline"
              label={t.buildingDetail.rampAccess}
              available={building.hasRamp}
            />
            <AccessItem
              icon="arrow-up-circle-outline"
              label={t.buildingDetail.elevator}
              available={building.hasElevator}
            />
          </View>
        </View>

        {/* Rooms */}
        {rooms.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.buildingDetail.rooms} ({rooms.length})</Text>
            {rooms.map((room) => (
              <View key={room.id} style={styles.roomRow}>
                <View style={[styles.roomIcon, { backgroundColor: color + '15' }]}>
                  <Ionicons
                    name={(ROOM_TYPE_ICONS[room.type] ?? 'ellipse-outline') as any}
                    size={16}
                    color={color}
                  />
                </View>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>Room {room.name}</Text>
                  <Text style={styles.roomMeta}>
                    Floor {room.floor} •{' '}
                    {room.type.replace('_', ' ')}
                    {room.capacity ? ` • ${room.capacity} seats` : ''}
                  </Text>
                </View>
                {room.accessible && (
                  <Ionicons name="accessibility" size={14} color={COLORS.accessibleRoute} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Reviews */}
        {buildingReviews.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.buildingDetail.reviews}</Text>
            {buildingReviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{review.userName[0]}</Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewAuthor}>{review.userName}</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Ionicons
                          key={i}
                          name={i <= review.rating ? 'star' : 'star-outline'}
                          size={12}
                          color={i <= review.rating ? COLORS.accent : COLORS.border}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                {buildingReviews.indexOf(review) < buildingReviews.length - 1 && (
                  <View style={styles.reviewDivider} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatChip({
  icon,
  label,
  highlight,
}: {
  icon: string;
  label: string;
  highlight?: boolean;
}) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  return (
    <View
      style={[
        styles.statChip,
        { backgroundColor: highlight ? COLORS.accessibleRoute + '30' : 'rgba(255,255,255,0.2)' },
      ]}
    >
      <Ionicons name={icon as any} size={12} color={COLORS.surface} />
      <Text style={styles.statChipText}>{label}</Text>
    </View>
  );
}

function AccessItem({
  icon,
  label,
  available,
}: {
  icon: string;
  label: string;
  available: boolean;
}) {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  return (
    <View style={styles.accessItem}>
      <Ionicons
        name={icon as any}
        size={20}
        color={available ? COLORS.success : COLORS.textMuted}
      />
      <Text style={[styles.accessLabel, { color: available ? COLORS.text : COLORS.textMuted }]}>
        {label}
      </Text>
      <Ionicons
        name={available ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={available ? COLORS.success : COLORS.textMuted}
      />
    </View>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { paddingBottom: SPACING.xl },
  backBtnOverlay: {
    margin: SPACING.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: { paddingHorizontal: SPACING.lg },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.surface,
    textTransform: 'capitalize',
  },
  heroTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: SPACING.xs,
  },
  heroDesc: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  statChipText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.surface },
  scroll: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  navigateBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.surface },
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
  accessRow: { flexDirection: 'row', gap: SPACING.md },
  accessItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceVariant,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  accessLabel: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: '500' },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  roomIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomInfo: { flex: 1 },
  roomName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  roomMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 1, textTransform: 'capitalize' },
  reviewItem: { paddingVertical: SPACING.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: FONT_SIZE.sm, fontWeight: 'bold', color: COLORS.surface },
  reviewMeta: { flex: 1 },
  reviewAuthor: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  reviewComment: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 18 },
  reviewDivider: { height: 1, backgroundColor: COLORS.borderLight, marginTop: SPACING.sm },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary },
}); }
