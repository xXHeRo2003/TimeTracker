import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTranslation } from '../context/TranslationContext';
import { useBreakReminderSettings } from '../context/BreakReminderContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LANGUAGES = ['de', 'en'];

export const SettingsScreen = () => {
  const { translate, language, setLanguage } = useTranslation();
  const { settings, setEnabled, setIntervalMinutes } = useBreakReminderSettings();
  const [intervalText, setIntervalText] = useState(String(settings.intervalMinutes));

  useEffect(() => {
    setIntervalText(String(settings.intervalMinutes));
  }, [settings.intervalMinutes]);

  const commitInterval = (value) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      setIntervalMinutes(numeric);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{translate('settings.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{translate('settings.language.heading')}</Text>
        <Text style={styles.sectionDescription}>
          {translate('settings.language.description')}
        </Text>

        <View style={styles.languageRow}>
          {LANGUAGES.map((code) => (
            <TouchableOpacity
              key={code}
              style={[
                styles.languageButton,
                language === code && styles.languageButtonActive
              ]}
              onPress={() => setLanguage(code)}
            >
              <Text
                style={[
                  styles.languageLabel,
                  language === code && styles.languageLabelActive
                ]}
              >
                {translate(`settings.language.${code}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{translate('settings.breakReminder.heading')}</Text>
        <Text style={styles.sectionDescription}>
          {translate('settings.breakReminder.description')}
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>
            {translate('settings.breakReminder.enableLabel')}
          </Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.accentSoft }}
            thumbColor={settings.enabled ? colors.accent : colors.textSecondary}
            value={settings.enabled}
            onValueChange={setEnabled}
          />
        </View>

        <View style={styles.intervalRow}>
          <View style={styles.intervalColumn}>
            <Text style={styles.intervalLabel}>
              {translate('settings.breakReminder.intervalLabel')}
            </Text>
            <Text style={styles.intervalHint}>
              {translate('settings.breakReminder.intervalHint')}
            </Text>
          </View>
          <View style={styles.intervalControls}>
            <TouchableOpacity
              style={styles.intervalButton}
              onPress={() => setIntervalMinutes(settings.intervalMinutes - 5)}
              disabled={!settings.enabled}
            >
              <Text style={styles.intervalButtonLabel}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.intervalInput}
              value={intervalText}
              keyboardType="number-pad"
              onChangeText={setIntervalText}
              onBlur={() => commitInterval(intervalText)}
              editable={settings.enabled}
            />
            <TouchableOpacity
              style={styles.intervalButton}
              onPress={() => setIntervalMinutes(settings.intervalMinutes + 5)}
              disabled={!settings.enabled}
            >
              <Text style={styles.intervalButtonLabel}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.intervalSuffix}>
          {translate('settings.breakReminder.intervalSuffix')}
        </Text>
      </View>
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
    marginBottom: spacing.sm
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.md
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  languageButton: {
    flex: 1,
    marginRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center'
  },
  languageButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent
  },
  languageLabel: {
    color: colors.textSecondary,
    fontWeight: '500'
  },
  languageLabelActive: {
    color: colors.textPrimary
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  intervalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  intervalColumn: {
    flex: 1,
    marginRight: spacing.md
  },
  intervalLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs
  },
  intervalHint: {
    color: colors.textSecondary,
    fontSize: 12
  },
  intervalControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  intervalButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs
  },
  intervalButtonLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600'
  },
  intervalInput: {
    width: 60,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingVertical: spacing.xs
  },
  intervalSuffix: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 12
  }
});

