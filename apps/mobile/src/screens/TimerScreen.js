import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTimer } from '../hooks/useTimer';
import { useHistoryContext } from '../context/HistoryContext';
import { useTranslation } from '../context/TranslationContext';
import { useBreakReminder } from '../hooks/useBreakReminder';
import {
  DEFAULT_SEGMENT_ID,
  TIME_SEGMENTS
} from '../config/constants';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { formatDuration } from '../utils/time';
import { createId } from '../utils/id';

const segmentById = new Map(TIME_SEGMENTS.map((segment) => [segment.id, segment]));

export const TimerScreen = () => {
  const { translate } = useTranslation();
  const { addEntry, getTotalTrackedMs } = useHistoryContext();

  const timer = useTimer({
    onComplete: () => {
      Alert.alert(translate('timer.completedTitle'), translate('timer.completedMessage'));
    }
  });

  const { settings } = useBreakReminder({
    trackedMs: timer.trackedMs,
    isTimerRunning: timer.isRunning
  });

  const [activeSegment, setActiveSegment] = useState(DEFAULT_SEGMENT_ID);
  const [taskName, setTaskName] = useState('');
  const [timerText, setTimerText] = useState(timer.displayValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setTimerText(timer.displayValue);
    }
  }, [timer.displayValue, isEditing]);

  const activeSegmentLabel = useMemo(() => {
    const segment = segmentById.get(activeSegment);
    if (!segment) {
      return 'minutes';
    }
    return segment.id;
  }, [activeSegment]);

  const handleAdjust = (direction) => {
    const segment = segmentById.get(activeSegment);
    if (!segment) {
      return;
    }
    timer.adjustDuration(segment.stepMs * direction);
  };

  const handleCommitTimerInput = () => {
    setIsEditing(false);
    const success = timer.setDurationFromInput(timerText);
    if (!success) {
      Alert.alert(translate('timer.heading'), translate('alerts.invalidTime'));
      setTimerText(timer.displayValue);
    }
  };

  const handlePrimaryAction = () => {
    if (timer.isRunning) {
      timer.pause();
      return;
    }
    if (timer.trackedMs > 0) {
      timer.resume();
    } else {
      timer.start();
    }
  };

  const handleReset = () => {
    timer.reset();
    setTimerText(timer.displayValue);
  };

  const totalFocusLabel = useMemo(() => formatDuration(getTotalTrackedMs()), [getTotalTrackedMs]);

  const primaryLabel = useMemo(() => {
    if (timer.isRunning) {
      return translate('timer.pause');
    }
    if (timer.trackedMs > 0) {
      return translate('timer.resume');
    }
    return translate('timer.start');
  }, [timer.isRunning, timer.trackedMs, translate]);

  const saveTask = () => {
    const trimmedName = taskName.trim();
    if (!trimmedName) {
      return;
    }
    if (timer.trackedMs <= 0) {
      Alert.alert(translate('timer.heading'), translate('alerts.noTrackedTime'));
      return;
    }

    const entry = {
      id: createId(),
      taskName: trimmedName,
      plannedMs: timer.mode === timer.TIMER_MODE.COUNTDOWN ? timer.durationMs : null,
      mode: timer.mode,
      trackedMs: timer.trackedMs,
      completedAt: new Date().toISOString(),
      breakReminderEnabled: settings.enabled,
      breakReminderIntervalMinutes: settings.intervalMinutes
    };
    addEntry(entry);
    timer.reset();
    setTaskName('');
    setTimerText(timer.displayValue);
    Alert.alert(translate('app.title'), translate('task.savedToast'));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{translate('app.title')}</Text>
            <Text style={styles.subtitle}>{translate('app.subtitle')}</Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>{translate('app.totalFocus')}</Text>
            <Text style={styles.totalValue}>{totalFocusLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{translate('timer.heading')}</Text>

          <View style={styles.modeSwitcher}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                timer.mode === timer.TIMER_MODE.COUNTDOWN && styles.modeButtonActive
              ]}
              onPress={() => timer.setMode(timer.TIMER_MODE.COUNTDOWN)}
            >
              <Text
                style={[
                  styles.modeButtonLabel,
                  timer.mode === timer.TIMER_MODE.COUNTDOWN && styles.modeButtonLabelActive
                ]}
              >
                {translate('timer.mode.countdown')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                timer.mode === timer.TIMER_MODE.STOPWATCH && styles.modeButtonActive
              ]}
              onPress={() => timer.setMode(timer.TIMER_MODE.STOPWATCH)}
            >
              <Text
                style={[
                  styles.modeButtonLabel,
                  timer.mode === timer.TIMER_MODE.STOPWATCH && styles.modeButtonLabelActive
                ]}
              >
                {translate('timer.mode.stopwatch')}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.timerInput}
            value={timerText}
            onChangeText={setTimerText}
            keyboardType="numbers-and-punctuation"
            onFocus={() => setIsEditing(true)}
            onBlur={handleCommitTimerInput}
            editable={timer.mode === timer.TIMER_MODE.COUNTDOWN}
            placeholder="00:25:00"
            placeholderTextColor={colors.muted}
            accessibilityLabel={translate('timer.inputLabel')}
          />

          {timer.mode === timer.TIMER_MODE.COUNTDOWN && (
            <View style={styles.segmentRow}>
              {TIME_SEGMENTS.map((segment) => (
                <TouchableOpacity
                  key={segment.id}
                  style={[
                    styles.segmentButton,
                    activeSegment === segment.id && styles.segmentButtonActive
                  ]}
                  onPress={() => setActiveSegment(segment.id)}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      activeSegment === segment.id && styles.segmentLabelActive
                    ]}
                  >
                    {segment.id.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.adjustRow}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleAdjust(-1)}
              disabled={timer.mode !== timer.TIMER_MODE.COUNTDOWN}
            >
              <Text style={styles.adjustLabel}>-</Text>
            </TouchableOpacity>
            <Text style={styles.adjustInfo}>{activeSegmentLabel}</Text>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleAdjust(1)}
              disabled={timer.mode !== timer.TIMER_MODE.COUNTDOWN}
            >
              <Text style={styles.adjustLabel}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.presetRow}>
            <PresetButton label={translate('timer.presets.fifteen')} onPress={() => timer.setDurationFromPreset(15)} />
            <PresetButton label={translate('timer.presets.twentyFive')} onPress={() => timer.setDurationFromPreset(25)} />
            <PresetButton label={translate('timer.presets.fortyFive')} onPress={() => timer.setDurationFromPreset(45)} />
            <PresetButton label={translate('timer.presets.sixty')} onPress={() => timer.setDurationFromPreset(60)} />
          </View>

          <View style={styles.timerActions}>
            <TouchableOpacity
              style={[styles.primaryButton, !timer.canStart && styles.buttonDisabled]}
              onPress={handlePrimaryAction}
              disabled={!timer.canStart && !timer.isRunning}
            >
              <Text style={styles.primaryButtonLabel}>{primaryLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
              <Text style={styles.secondaryButtonLabel}>{translate('timer.reset')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{translate('task.prompt')}</Text>
          <TextInput
            style={styles.taskInput}
            value={taskName}
            onChangeText={setTaskName}
            placeholder={translate('task.placeholder')}
            placeholderTextColor={colors.muted}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (timer.trackedMs <= 0 || !taskName.trim()) && styles.buttonDisabled
            ]}
            onPress={saveTask}
            disabled={timer.trackedMs <= 0 || !taskName.trim()}
          >
            <Text style={styles.primaryButtonLabel}>{translate('task.save')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const PresetButton = ({ label, onPress }) => (
  <TouchableOpacity style={styles.presetButton} onPress={onPress}>
    <Text style={styles.presetLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    padding: spacing.lg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary
  },
  totalContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  totalValue: {
    marginTop: spacing.xs,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary
  },
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface
  },
  modeButtonActive: {
    backgroundColor: colors.accentSoft
  },
  modeButtonLabel: {
    color: colors.textSecondary,
    fontWeight: '500'
  },
  modeButtonLabelActive: {
    color: colors.textPrimary
  },
  timerInput: {
    fontSize: 48,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  segmentButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  segmentButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent
  },
  segmentLabel: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontWeight: '600'
  },
  segmentLabelActive: {
    color: colors.textPrimary
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  adjustButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  adjustLabel: {
    fontSize: 28,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  adjustInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'uppercase'
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    flexWrap: 'wrap'
  },
  presetButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm
  },
  presetLabel: {
    color: colors.textSecondary,
    fontWeight: '500'
  },
  timerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: spacing.sm
  },
  primaryButtonLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  secondaryButtonLabel: {
    color: colors.textSecondary,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  taskInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md
  }
});
