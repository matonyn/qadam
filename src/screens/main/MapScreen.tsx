import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NavigateStackParamList } from '../../navigation/NavigateNavigator';
import { Building, Route, RoutePreference } from '../../types';
import { mapsApi, routingApi } from '../../services/api';
import { tokenManager } from '../../services/tokenManager';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';

// NU campus center (Astana, Kazakhstan)
const CAMPUS_REGION = {
  latitude: 51.0904,
  longitude: 71.3989,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

function parseRouteFromApi(data: Record<string, unknown>): Route {
  const cl = data.crowdLevel as string | undefined;
  const crowdLevel =
    cl === 'low' || cl === 'medium' || cl === 'high' ? cl : 'medium';
  return {
    id: String(data.id),
    startLocation: data.startLocation as Route['startLocation'],
    endLocation: data.endLocation as Route['endLocation'],
    distance: Number(data.distance),
    duration: Number(data.duration),
    isAccessible: Boolean(data.isAccessible),
    crowdLevel,
    waypoints: (data.waypoints as Route['waypoints']) ?? [],
    instructions: (data.instructions as string[]) ?? [],
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  academic: 'school-outline',
  library: 'library-outline',
  dining: 'restaurant-outline',
  residential: 'home-outline',
  sports: 'fitness-outline',
  admin: 'business-outline',
  other: 'ellipse-outline',
};

type OriginMode = 'gps' | 'campus' | 'building';

export function MapScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const navigation = useNavigation<NativeStackNavigationProp<NavigateStackParamList>>();
  const navRoute = useRoute<RouteProp<NavigateStackParamList, 'Map'>>();
  const [routePreference, setRoutePreference] = useState<RoutePreference>('shortest');
  const t = useTranslation();

  const ROUTE_PREFERENCES: { key: RoutePreference; label: string; icon: string }[] = [
    { key: 'shortest', label: t.navigate.shortest, icon: 'flash-outline' },
    { key: 'accessible', label: t.navigate.accessible, icon: 'accessibility-outline' },
    { key: 'least_crowded', label: t.navigate.lessCrowded, icon: 'people-outline' },
  ];
  const [toQuery, setToQuery] = useState('');
  const [fromQuery, setFromQuery] = useState('');
  const [planFocus, setPlanFocus] = useState<'from' | 'to' | null>(null);
  const [originMode, setOriginMode] = useState<OriginMode>('gps');
  const [originBuilding, setOriginBuilding] = useState<Building | null>(null);
  const fromInputRef = useRef<TextInput>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const mapRef = useRef<MapView>(null);
  const processedRouteStartIdRef = useRef<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeTarget, setRouteTarget] = useState<{
    lat: number;
    lng: number;
    name: string;
    buildingId: string;
  } | null>(null);
  const [routeStartSnapshot, setRouteStartSnapshot] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [usedCampusFallbackStart, setUsedCampusFallbackStart] = useState(false);

  useEffect(() => {
    mapsApi.getBuildings()
      .then((res) => setBuildings(res.data ?? []))
      .catch(console.error);
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  const openExternalMaps = useCallback(async (lat: number, lng: number, name: string) => {
    const twoGisApp = `dgis://2gis.ru/routeSearch/rsType/pedestrian/to/${lng},${lat}`;
    const twoGisWeb = `https://2gis.kz/directions/pedestrian/to/${lng},${lat}`;
    const appleMapsUrl = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
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
      Alert.alert(t.common.error, `Could not open navigation to ${name}.`);
    }
  }, [t.common.error]);

  useEffect(() => {
    if (!routeTarget || !routeStartSnapshot) return;

    const token = tokenManager.getAccessToken();
    if (!token) {
      Alert.alert(t.common.error, t.navigate.signInForRoute);
      setRouteTarget(null);
      setRouteStartSnapshot(null);
      return;
    }

    let cancelled = false;
    setRouteLoading(true);
    (async () => {
      try {
        const res = await routingApi.calculateRoute({
          startLat: routeStartSnapshot.latitude,
          startLng: routeStartSnapshot.longitude,
          endLat: routeTarget.lat,
          endLng: routeTarget.lng,
          preference: routePreference,
          ...(originMode === 'building' && originBuilding
            ? { startBuildingId: originBuilding.id }
            : {}),
          endBuildingId: routeTarget.buildingId,
        });
        if (cancelled) return;
        const payload = res as { success?: boolean; data?: Record<string, unknown> };
        if (payload.success && payload.data) {
          setActiveRoute(parseRouteFromApi(payload.data));
        } else {
          setActiveRoute(null);
          Alert.alert(t.common.error, (res as { message?: string }).message ?? t.common.error);
        }
      } catch (e) {
        if (cancelled) return;
        setActiveRoute(null);
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('401') || /unauthorized/i.test(msg)) {
          Alert.alert(t.common.error, t.navigate.signInForRoute);
        } else {
          Alert.alert(t.common.error, msg);
        }
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    routeTarget,
    routeStartSnapshot,
    routePreference,
    originMode,
    originBuilding,
    t.common.error,
    t.navigate.signInForRoute,
  ]);

  useEffect(() => {
    if (!activeRoute?.waypoints?.length) return;
    const coords = activeRoute.waypoints.map((w) => ({
      latitude: w.latitude,
      longitude: w.longitude,
    }));
    const handle = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 100, right: 40, bottom: 360, left: 40 },
        animated: true,
      });
    }, 350);
    return () => clearTimeout(handle);
  }, [activeRoute]);

  const clearInAppRoute = () => {
    setRouteLoading(false);
    setActiveRoute(null);
    setRouteTarget(null);
    setRouteStartSnapshot(null);
    setUsedCampusFallbackStart(false);
  };

  const queueRoute = useCallback(
    (dest: Building) => {
      let usedFallback = false;
      let lat = CAMPUS_REGION.latitude;
      let lng = CAMPUS_REGION.longitude;
      if (originMode === 'building' && originBuilding) {
        lat = originBuilding.latitude;
        lng = originBuilding.longitude;
      } else if (originMode === 'campus') {
        lat = CAMPUS_REGION.latitude;
        lng = CAMPUS_REGION.longitude;
      } else if (originMode === 'gps' && userLocation) {
        lat = userLocation.latitude;
        lng = userLocation.longitude;
      } else {
        usedFallback = true;
      }
      setUsedCampusFallbackStart(usedFallback);
      setRouteStartSnapshot({ latitude: lat, longitude: lng });
      setRouteTarget({
        lat: dest.latitude,
        lng: dest.longitude,
        name: dest.name,
        buildingId: dest.id,
      });
    },
    [originMode, originBuilding, userLocation],
  );

  const showOriginPicker = () => {
    const cancel = t.common.cancel;
    const opts = [
      t.navigate.originMyLocation,
      t.navigate.originCampus,
      t.navigate.originPickBuilding,
      cancel,
    ];
    const onPick = (i: number) => {
      if (i > 2) return;
      if (i === 0) {
        setOriginMode('gps');
        setOriginBuilding(null);
      } else if (i === 1) {
        setOriginMode('campus');
        setOriginBuilding(null);
      } else if (i === 2) {
        setOriginMode('building');
        setPlanFocus('from');
        setTimeout(() => fromInputRef.current?.focus(), 100);
      }
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: opts, cancelButtonIndex: 3 },
        (buttonIndex) => onPick(buttonIndex),
      );
    } else {
      Alert.alert(t.navigate.routeFrom, '', [
        { text: t.navigate.originMyLocation, onPress: () => onPick(0) },
        { text: t.navigate.originCampus, onPress: () => onPick(1) },
        { text: t.navigate.originPickBuilding, onPress: () => onPick(2) },
        { text: cancel, style: 'cancel' },
      ]);
    }
  };

  const originSummary = () => {
    if (originMode === 'building' && originBuilding) {
      return originBuilding.shortName || originBuilding.name;
    }
    if (originMode === 'campus') return t.navigate.originCampus;
    if (userLocation) return t.navigate.originMyLocation;
    return t.navigate.originUsingCampus;
  };

  /** Building detail "Navigate" pops back here with this param — stay in-app, no Apple Maps. */
  useEffect(() => {
    const id = navRoute.params?.startRouteToBuildingId;
    if (!id) {
      processedRouteStartIdRef.current = null;
      return;
    }
    if (buildings.length === 0) return;
    if (processedRouteStartIdRef.current === id) return;
    const b = buildings.find((x) => x.id === id);
    if (!b) return;
    processedRouteStartIdRef.current = id;
    setSelectedBuilding(id);
    queueRoute(b);
    navigation.setParams({ startRouteToBuildingId: undefined });
  }, [navRoute.params?.startRouteToBuildingId, buildings, queueRoute, navigation]);

  const goToMyLocation = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 800);
    }
  };

  const qFrom = fromQuery.trim().toLowerCase();
  const qTo = toQuery.trim().toLowerCase();
  const filteredFrom = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(qFrom) ||
      b.shortName.toLowerCase().includes(qFrom),
  );
  const filteredTo = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(qTo) || b.shortName.toLowerCase().includes(qTo),
  );
  const filteredBuildings =
    qTo.length > 0
      ? filteredTo
      : buildings;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={CAMPUS_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {buildings.map((building) => (
          <Marker
            key={building.id}
            coordinate={{ latitude: building.latitude, longitude: building.longitude }}
            title={building.name}
            description={building.description}
            pinColor={
              selectedBuilding === building.id
                ? COLORS.primaryLight
                : building.hasRamp
                ? COLORS.accessibleRoute
                : COLORS.primary
            }
            onPress={() => {
              setSelectedBuilding(building.id);
              setToQuery(building.shortName || building.name);
            }}
          />
        ))}
        {activeRoute && activeRoute.waypoints.length >= 2 && (
          <Polyline
            coordinates={activeRoute.waypoints.map((w) => ({
              latitude: w.latitude,
              longitude: w.longitude,
            }))}
            strokeColor={routePreference === 'accessible' ? COLORS.accessibleRoute : COLORS.primary}
            strokeWidth={4}
            lineJoin="round"
            lineCap="round"
          />
        )}
      </MapView>

      {/* Route planner (From / To — 2GIS-style) */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.routePlannerCard}>
          <TouchableOpacity
            style={styles.routeEndpointRow}
            onPress={showOriginPicker}
            activeOpacity={0.75}
          >
            <View style={styles.routeLetterBadge}>
              <Text style={styles.routeLetterText}>A</Text>
            </View>
            <View style={styles.routeEndpointBody}>
              <Text style={styles.routeEndpointLabel}>{t.navigate.routeFrom}</Text>
              <Text style={styles.routeEndpointValue} numberOfLines={1}>
                {originSummary()}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {originMode === 'building' ? (
            <View style={styles.routeSearchBar}>
              <Ionicons name="search" size={16} color={COLORS.textSecondary} />
              <TextInput
                ref={fromInputRef}
                style={styles.routeSearchInput}
                placeholder={t.navigate.searchFromPlaceholder}
                value={fromQuery}
                onChangeText={setFromQuery}
                onFocus={() => setPlanFocus('from')}
                placeholderTextColor={COLORS.textMuted}
              />
              {fromQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setFromQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={styles.routeToRow}>
            <View style={[styles.routeLetterBadge, styles.routeLetterBadgeB]}>
              <Text style={styles.routeLetterText}>B</Text>
            </View>
            <View style={styles.routeSearchBar}>
              <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
              <TextInput
                style={styles.routeSearchInput}
                placeholder={t.navigate.searchToPlaceholder}
                value={toQuery}
                onChangeText={setToQuery}
                onFocus={() => setPlanFocus('to')}
                placeholderTextColor={COLORS.textMuted}
              />
              {toQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setToQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={goToMyLocation}
              activeOpacity={0.8}
            >
              <Ionicons name="locate" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {((planFocus === 'from' && qFrom.length > 0) || (planFocus === 'to' && qTo.length > 0)) ? (
            <ScrollView
              style={styles.routeSearchResults}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {(planFocus === 'from' ? filteredFrom : filteredTo).slice(0, 12).map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.routeSearchHit}
                  onPress={() => {
                    if (planFocus === 'from') {
                      setOriginBuilding(b);
                      setOriginMode('building');
                      setFromQuery('');
                      setPlanFocus(null);
                    } else {
                      setSelectedBuilding(b.id);
                      setToQuery(b.shortName || b.name);
                      setPlanFocus(null);
                      mapRef.current?.animateToRegion(
                        {
                          latitude: b.latitude,
                          longitude: b.longitude,
                          latitudeDelta: 0.004,
                          longitudeDelta: 0.004,
                        },
                        500,
                      );
                    }
                  }}
                >
                  <Text style={styles.routeSearchHitName}>{b.name}</Text>
                  <Text style={styles.routeSearchHitSub}>{b.shortName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </SafeAreaView>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        {(routeLoading || activeRoute) && (
          <View style={styles.routeCard}>
            {routeLoading ? (
              <View style={styles.routeLoadingRow}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.routeLoadingText}>{t.navigate.routeLoading}</Text>
              </View>
            ) : activeRoute ? (
              <>
                <View style={styles.routeHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeLineSummary} numberOfLines={1}>
                      {activeRoute.startLocation.name} → {activeRoute.endLocation.name}
                    </Text>
                    <Text style={styles.routeDestination} numberOfLines={2}>
                      {activeRoute.endLocation.name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={clearInAppRoute} hitSlop={12}>
                    <Ionicons name="close-circle" size={22} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.routeMetaRow}>
                  <Text style={styles.routeMeta}>
                    {t.navigate.routeDistance}: {activeRoute.distance} {t.navigate.metersAbbr}
                  </Text>
                  <Text style={styles.routeMeta}>
                    {t.navigate.routeDuration}: ~{activeRoute.duration} {t.navigate.minutesAbbr}
                  </Text>
                </View>
                {usedCampusFallbackStart ? (
                  <Text style={styles.routeFallbackHint}>{t.navigate.campusFallbackStart}</Text>
                ) : null}
                {routePreference === 'accessible' && (
                  <View style={styles.routeAccessRow}>
                    <Ionicons
                      name={activeRoute.isAccessible ? 'checkmark-circle' : 'warning-outline'}
                      size={16}
                      color={activeRoute.isAccessible ? COLORS.accessibleRoute : COLORS.accent}
                    />
                    <Text
                      style={[
                        styles.routeAccessText,
                        { color: activeRoute.isAccessible ? COLORS.accessibleRoute : COLORS.accent },
                      ]}
                    >
                      {activeRoute.isAccessible
                        ? t.navigate.accessibleRouteOk
                        : t.navigate.accessibleRouteCheck}
                    </Text>
                  </View>
                )}
                <Text style={styles.routeDirectionsTitle}>{t.navigate.directionsTitle}</Text>
                <ScrollView style={styles.routeInstructions} nestedScrollEnabled>
                  {activeRoute.instructions.map((line, i) => (
                    <Text key={i} style={styles.routeInstructionLine}>
                      {i + 1}. {line}
                    </Text>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.openMapsLink}
                  onPress={() =>
                    openExternalMaps(
                      activeRoute.endLocation.latitude,
                      activeRoute.endLocation.longitude,
                      activeRoute.endLocation.name,
                    )
                  }
                >
                  <Ionicons name="open-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.openMapsLinkText}>{t.navigate.openInMaps}</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        )}

        {/* Route preference selector */}
        <View style={styles.preferenceRow}>
          {ROUTE_PREFERENCES.map((pref) => {
            const active = routePreference === pref.key;
            return (
              <TouchableOpacity
                key={pref.key}
                style={[styles.prefBtn, active && styles.prefBtnActive]}
                onPress={() => setRoutePreference(pref.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={pref.icon as any}
                  size={14}
                  color={active ? COLORS.surface : COLORS.textSecondary}
                />
                <Text style={[styles.prefLabel, active && styles.prefLabelActive]}>
                  {pref.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Accessible legend */}
        {routePreference === 'accessible' && (
          <View style={styles.accessLegend}>
            <Ionicons name="accessibility" size={14} color={COLORS.accessibleRoute} />
            <Text style={styles.accessLegendText}>
              {t.navigate.accessibleLegend}
            </Text>
          </View>
        )}

        {/* Buildings horizontal list */}
        <Text style={styles.buildingsTitle}>{t.navigate.buildings}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.buildingList}
        >
          {filteredBuildings.map((building) => (
            <TouchableOpacity
              key={building.id}
              style={[
                styles.buildingCard,
                selectedBuilding === building.id && styles.buildingCardSelected,
              ]}
              onPress={() => {
                setSelectedBuilding(building.id);
                setToQuery(building.shortName || building.name);
                mapRef.current?.animateToRegion({
                  latitude: building.latitude,
                  longitude: building.longitude,
                  latitudeDelta: 0.004,
                  longitudeDelta: 0.004,
                }, 600);
              }}
              onLongPress={() => navigation.navigate('BuildingDetail', { buildingId: building.id })}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.buildingIconBg,
                  selectedBuilding === building.id && styles.buildingIconBgSelected,
                ]}
              >
                <Ionicons
                  name={(CATEGORY_ICONS[building.category] ?? 'business-outline') as any}
                  size={20}
                  color={
                    selectedBuilding === building.id ? COLORS.surface : COLORS.primary
                  }
                />
              </View>
              <Text
                style={[
                  styles.buildingName,
                  selectedBuilding === building.id && styles.buildingNameSelected,
                ]}
                numberOfLines={2}
              >
                {building.shortName}
              </Text>
              <Text style={styles.buildingFloors}>{building.floors}F</Text>
              {building.hasRamp && (
                <View style={styles.accessBadge}>
                  <Ionicons name="accessibility" size={10} color={COLORS.accessibleRoute} />
                </View>
              )}
              {selectedBuilding === building.id && (
                <TouchableOpacity
                  style={styles.navigateBtn}
                  onPress={() => queueRoute(building)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={12} color={COLORS.surface} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) { return StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 0 : SPACING.md,
  },
  routePlannerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  routeEndpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 6,
    paddingHorizontal: SPACING.xs,
  },
  routeLetterBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLetterBadgeB: {
    backgroundColor: COLORS.secondary + '22',
  },
  routeLetterText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.primary,
  },
  routeEndpointBody: {
    flex: 1,
    minWidth: 0,
  },
  routeEndpointLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  routeEndpointValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  routeToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  routeSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    gap: SPACING.xs,
  },
  routeSearchInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    paddingVertical: 2,
  },
  routeSearchResults: {
    maxHeight: 168,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    marginHorizontal: -SPACING.xs,
  },
  routeSearchHit: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  routeSearchHitName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  routeSearchHitSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  routeLineSummary: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  locationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl + 8,
    paddingHorizontal: SPACING.lg,
    maxHeight: '58%',
    ...SHADOWS.lg,
  },
  routeCard: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  routeLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  routeLoadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  routeDestination: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  routeMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  routeMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  routeFallbackHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  routeAccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
  },
  routeAccessText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    flex: 1,
  },
  routeDirectionsTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeInstructions: {
    maxHeight: 100,
    marginTop: 4,
  },
  routeInstructionLine: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  openMapsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
  },
  openMapsLinkText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  preferenceRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  prefBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceVariant,
  },
  prefBtnActive: {
    backgroundColor: COLORS.primary,
  },
  prefLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  prefLabelActive: {
    color: COLORS.surface,
  },
  accessLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accessibleRoute + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  accessLegendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.accessibleRoute,
    fontWeight: '500',
  },
  buildingsTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  buildingList: {
    gap: SPACING.sm,
    paddingRight: SPACING.lg,
  },
  buildingCard: {
    width: 88,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    position: 'relative',
  },
  buildingCardSelected: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  buildingIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  buildingIconBgSelected: {
    backgroundColor: COLORS.primary,
  },
  buildingName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  buildingNameSelected: {
    color: COLORS.primary,
  },
  buildingFloors: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accessBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accessibleRoute + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateBtn: {
    marginTop: 4,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); }
