import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../context/TranslationContext';
import { colors } from '../theme/colors';

export const LoadingOverlay = ({ message }) => {
  const { translate } = useTranslation();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.label}>{message || translate('app.title')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  label: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textPrimary
  }
});

