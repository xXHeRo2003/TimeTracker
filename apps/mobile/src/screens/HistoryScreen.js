import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useHistoryContext } from '../context/HistoryContext';
import { useTranslation } from '../context/TranslationContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { formatDuration } from '../utils/time';
import { getEndOfWeek, getStartOfWeek } from '../utils/dateRange';

const FILTERS = ['today', 'week', 'all'];

export const HistoryScreen = () => {
  const { entries } = useHistoryContext();
  const { translate, locale } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('today');

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now, locale);
    const endOfWeek = getEndOfWeek(now, locale);

    return entries
      .filter((entry) => {
        if (activeFilter === 'all') {
          return true;
        }
        const completed = new Date(entry.completedAt);
        if (activeFilter === 'today') {
          return completed.toDateString() === now.toDateString();
        }
        if (activeFilter === 'week') {
          return completed >= startOfWeek && completed < endOfWeek;
        }
        return true;
      })
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  }, [entries, activeFilter, locale]);

  const totalMs = useMemo(
    () => filteredEntries.reduce((acc, entry) => acc + (entry.trackedMs || 0), 0),
    [filteredEntries]
  );

  const renderItem = ({ item }) => {
    const completed = new Date(item.completedAt);
    const tracked = formatDuration(item.trackedMs);
    const timeLabel = completed.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateLabel = completed.toLocaleDateString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });

    return (
      <View style={styles.entry}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTask}>{item.taskName}</Text>
          <Text style={styles.entryTracked}>{tracked}</Text>
        </View>
        <View style={styles.entryMeta}>
          <Text style={styles.entryMetaText}>{timeLabel}</Text>
          <Text style={styles.entryDot}>•</Text>
          <Text style={styles.entryMetaText}>{dateLabel}</Text>
          {item.mode === 'countdown' && item.plannedMs ? (
            <>
              <Text style={styles.entryDot}>•</Text>
              <Text style={styles.entryMetaText}>
                {formatDuration(item.plannedMs)}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{translate('history.title')}</Text>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.filterChipActive
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterLabel,
                activeFilter === filter && styles.filterLabelActive
              ]}
            >
              {translate(`history.filter.${filter}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{translate('app.totalFocus')}</Text>
        <Text style={styles.totalValue}>{formatDuration(totalMs)}</Text>
      </View>

      {filteredEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyLabel}>{translate('history.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  filterChip: {
    flex: 1,
    marginRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center'
  },
  filterChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent
  },
  filterLabel: {
    color: colors.textSecondary,
    fontWeight: '500'
  },
  filterLabelActive: {
    color: colors.textPrimary
  },
  totalCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary
  },
  totalValue: {
    marginTop: spacing.sm,
    fontSize: 32,
    fontWeight: '600',
    color: colors.textPrimary
  },
  list: {
    paddingBottom: spacing.xl
  },
  entry: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  entryTask: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm
  },
  entryTracked: {
    color: colors.accent,
    fontWeight: '600'
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  entryMetaText: {
    color: colors.textSecondary,
    fontSize: 12
  },
  entryDot: {
    color: colors.textSecondary,
    marginHorizontal: spacing.xs
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyLabel: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 16
  }
});

