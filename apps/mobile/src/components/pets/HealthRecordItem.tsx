import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { Badge } from '@components/ui/Badge';
import type { HealthRecord } from '@types/index';

const TYPE_CONFIG = {
  VACCINATION: { emoji: '💉', label: 'Vaccination', variant: 'success' as const },
  CHECKUP:     { emoji: '🩺', label: 'Checkup',     variant: 'info' as const },
  SURGERY:     { emoji: '🏥', label: 'Surgery',      variant: 'warning' as const },
  MEDICATION:  { emoji: '💊', label: 'Medication',   variant: 'info' as const },
  NOTE:        { emoji: '📝', label: 'Note',          variant: 'neutral' as const },
};

interface HealthRecordItemProps {
  record: HealthRecord;
}

export function HealthRecordItem({ record }: HealthRecordItemProps) {
  const { colors } = useTheme();
  const config = TYPE_CONFIG[record.type];
  const isOverdue = record.nextDueDate && new Date(record.nextDueDate) < new Date();

  return (
    <View style={[styles.item, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={{ fontSize: 22 }}>{config.emoji}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{record.title}</Text>
          <Badge label={config.label} variant={config.variant} size="sm" />
        </View>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        {record.nextDueDate && (
          <Text style={[styles.due, { color: isOverdue ? colors.danger : colors.warning }]}>
            {isOverdue ? '⚠️ Overdue · ' : 'Due · '}
            {new Date(record.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        )}
        {record.vetName && (
          <Text style={[styles.vet, { color: colors.textTertiary }]}>👨‍⚕️ {record.vetName}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '600', flex: 1 },
  date: { fontSize: 13 },
  due: { fontSize: 12, fontWeight: '600' },
  vet: { fontSize: 12 },
});
