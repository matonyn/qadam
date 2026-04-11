import React, { useState, useEffect, useRef, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NavigateStackParamList } from '../../navigation/NavigateNavigator';
import { Building, RoutePreference } from '../../types';
import { mapsApi } from '../../services/api';
import { useColors, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTranslation } from '../../i18n';

// NU campus center (Astana, Kazakhstan)
const CAMPUS_REGION = {
  latitude: 51.0904,
  longitude: 71.3989,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const CATEGORY_ICONS: Record<string, string> = {
  academic: 'school-outline',
  library: 'library-outline',
  dining: 'restaurant-outline',
  residential: 'home-outline',
  sports: 'fitness-outline',
  admin: 'business-outline',
  other: 'ellipse-outline',
};

export function MapScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const navigation = useNavigation<NativeStackNavigationProp<NavigateStackParamList>>();
  const [routePreference, setRoutePreference] = useState<RoutePreference>('shortest');
  const t = useTranslation();

  const ROUTE_PREFERENCES: { key: RoutePreference; label: string; icon: string }[] = [
    { key: 'shortest', label: t.navigate.shortest, icon: 'flash-outline' },
    { key: 'accessible', label: t.navigate.accessible, icon: 'accessibility-outline' },
    { key: 'least_crowded', label: t.navigate.lessCrowded, icon: 'people-outline' },
  ];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const mapRef = useRef<MapView>(null);

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

  const goToMyLocation = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 800);
    }
  };

  const navigateToBuilding = async (lat: number, lng: number, name: string) => {
    const twoGisApp = `dgis://2gis.ru/routeSearch/rsType/pedestrian/to/${lng},${lat}`;
    const twoGisWeb = `https://2gis.kz/directions/pedestrian/to/${lng},${lat}`;
    const appleMapsUrl = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
    try {
      const canOpen2Gis = await Linking.canOpenURL(twoGisApp);
      if (canOpen2Gis) { await Linking.openURL(twoGisApp); return; }
      if (Platform.OS === 'ios') { await Linking.openURL(appleMapsUrl); return; }
      await Linking.openURL(twoGisWeb);
    } catch {
      Alert.alert('Error', `Could not open navigation to ${name}.`);
    }
  };

  const filteredBuildings = buildings.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            onPress={() => setSelectedBuilding(building.id)}
          />
        ))}
      </MapView>

      {/* Top search overlay */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t.navigate.searchPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textMuted}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={goToMyLocation}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
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
                  onPress={() => navigateToBuilding(building.latitude, building.longitude, building.name)}
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
    ...SHADOWS.lg,
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
