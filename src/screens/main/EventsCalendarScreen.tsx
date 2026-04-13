import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDER_RADIUS, FONT_SIZE, SHADOWS, SPACING, useColors } from '../../constants/theme';
import { useTranslation } from '../../i18n';
import { EventsStackParamList } from '../../navigation/EventsNavigator';
import { eventsApi } from '../../services/api';
import type { RegisteredCampusEvent } from '../../types';

type Nav = NativeStackNavigationProp<EventsStackParamList>;

function dayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function EventsCalendarScreen() {
  const t = useTranslation();
  const COLORS = useColors();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const navigation = useNavigation<Nav>();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<RegisteredCampusEvent[]>([]);

  useEffect(() => {
    setLoading(true);
    eventsApi
      .getRegisteredEvents()
      .then((res) => setEvents(res.data ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, RegisteredCampusEvent[]>();
    for (const e of events) {
      const d = new Date(e.startDate);
      const k = isNaN(d.getTime()) ? '' : dayKey(d);
      if (!k) continue;
      const list = m.get(k) ?? [];
      list.push(e);
      m.set(k, list);
    }
    return m;
  }, [events]);

  const selectedEvents = useMemo(() => {
    const k = dayKey(selectedDay);
    return eventsByDay.get(k) ?? [];
  }, [eventsByDay, selectedDay]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    return days;
  }, [month]);

  const weekdayLabels = useMemo(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], []);

  const renderDay = ({ item }: { item: Date }) => {
    const inMonth = isSameMonth(item, month);
    const isSelected = isSameDay(item, selectedDay);
    const k = dayKey(item);
    const count = eventsByDay.get(k)?.length ?? 0;

    return (
      <TouchableOpacity
        style={[
          styles.dayCell,
          !inMonth && styles.dayCellMuted,
          isSelected && styles.dayCellSelected,
        ]}
        onPress={() => setSelectedDay(item)}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.dayNumber,
            !inMonth && styles.dayNumberMuted,
            isSelected && styles.dayNumberSelected,
          ]}
        >
          {format(item, 'd')}
        </Text>
        {count > 0 ? <View style={[styles.dot, isSelected && styles.dotSelected]} /> : <View style={styles.dotSpacer} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.events.calendarTitle}</Text>
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => navigation.navigate('EventsList')}
          activeOpacity={0.85}
        >
          <Ionicons name="list-outline" size={18} color={COLORS.primary} />
          <Text style={styles.switchText}>{t.events.listView}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity
          style={styles.monthNavBtn}
          onPress={() => setMonth((m) => startOfMonth(subMonths(m, 1)))}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(month, 'MMMM yyyy')}</Text>
        <TouchableOpacity
          style={styles.monthNavBtn}
          onPress={() => setMonth((m) => startOfMonth(addMonths(m, 1)))}
        >
          <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdays}>
        {weekdayLabels.map((w) => (
          <Text key={w} style={styles.weekdayLabel}>
            {w}
          </Text>
        ))}
      </View>

      <FlatList
        data={gridDays}
        keyExtractor={(d) => dayKey(d)}
        renderItem={renderDay}
        numColumns={7}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
      />

      <View style={styles.agendaHeader}>
        <Text style={styles.agendaTitle}>
          {format(selectedDay, 'EEE, MMM d')}
        </Text>
        <Text style={styles.agendaCount}>
          {selectedEvents.length ? `${selectedEvents.length}` : ''}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: SPACING.lg }} color={COLORS.primary} />
      ) : selectedEvents.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={42} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>{t.events.noRegisteredEvents}</Text>
        </View>
      ) : (
        <FlatList
          data={selectedEvents}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.agendaList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.eventRow}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
            >
              <View style={styles.eventLeft}>
                <Text style={styles.eventTime}>{format(new Date(item.startDate), 'HH:mm')}</Text>
              </View>
              <View style={styles.eventBody}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.eventMeta} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    headerTitle: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: 'bold',
      color: COLORS.text,
    },
    switchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.full,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary + '10',
    },
    switchText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
    },
    monthNavBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.surface,
      ...SHADOWS.xs,
    },
    monthTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.text },
    weekdays: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.sm,
      paddingBottom: 6,
    },
    weekdayLabel: {
      width: `${100 / 7}%` as any,
      textAlign: 'center',
      fontSize: FONT_SIZE.xs,
      fontWeight: '700',
      color: COLORS.textMuted,
    },
    grid: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.md,
    },
    dayCell: {
      width: `${100 / 7}%` as any,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: COLORS.surface,
      marginVertical: 4,
      ...SHADOWS.xs,
    },
    dayCellMuted: {
      backgroundColor: COLORS.surfaceVariant,
      opacity: 0.6,
    },
    dayCellSelected: {
      backgroundColor: COLORS.primary,
    },
    dayNumber: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.text },
    dayNumberMuted: { color: COLORS.textMuted },
    dayNumberSelected: { color: COLORS.surface },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.primary,
      marginTop: 6,
    },
    dotSelected: { backgroundColor: COLORS.surface },
    dotSpacer: { width: 6, height: 6, marginTop: 6 },
    agendaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.sm,
    },
    agendaTitle: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.text },
    agendaCount: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textMuted },
    agendaList: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, gap: SPACING.sm },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: COLORS.surface,
      ...SHADOWS.sm,
    },
    eventLeft: { width: 56 },
    eventTime: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: COLORS.text },
    eventBody: { flex: 1, gap: 2 },
    eventTitle: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.text },
    eventMeta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
    empty: { alignItems: 'center', paddingTop: SPACING.xl, gap: SPACING.sm },
    emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted, fontWeight: '600' },
  });
}

