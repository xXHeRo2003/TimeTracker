import React from 'react';
import { TranslationProvider } from './TranslationContext';
import { HistoryProvider } from './HistoryContext';
import { BreakReminderProvider } from './BreakReminderContext';

export const AppProviders = ({ children }) => (
  <TranslationProvider>
    <HistoryProvider>
      <BreakReminderProvider>{children}</BreakReminderProvider>
    </HistoryProvider>
  </TranslationProvider>
);

