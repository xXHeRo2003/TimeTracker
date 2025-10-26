export const translations = {
  de: {
    app: {
      title: 'Flowtime',
      subtitle: 'Dein smarter Fokus-Timer',
      totalFocus: 'Gesamte Fokuszeit'
    },
    alerts: {
      invalidTime:
        'Bitte gib eine gültige Zeit ein. Beispiele: 25 (Minuten), 15:00, 01:30:00',
      noTrackedTime:
        'Starte den Timer und arbeite mindestens ein paar Sekunden, bevor du die Aufgabe speicherst.'
    },
    history: {
      title: 'Produktivitätsjournal',
      empty: 'Sobald du eine Session speicherst, taucht sie hier auf.',
      filter: {
        today: 'Heute',
        week: 'Woche',
        all: 'Alles'
      }
    },
    settings: {
      title: 'Einstellungen',
      language: {
        heading: 'Sprache',
        description: 'Wähle die Sprache der App.',
        de: 'Deutsch',
        en: 'Englisch'
      },
      breakReminder: {
        heading: 'Pausenerinnerung',
        description:
          'Lass dich in regelmäßigen Abständen an eine kurze Pause erinnern.',
        enableLabel: 'Pausenerinnerung aktivieren',
        intervalLabel: 'Abstand zwischen Erinnerungen',
        intervalSuffix: 'Minuten',
        intervalHint: 'Mindestens 5 Minuten, maximal 240 Minuten.'
      }
    },
    task: {
      prompt: 'Was möchtest du fokussiert erledigen?',
      placeholder: 'z. B. Marktanalyse präsentieren',
      save: 'Task speichern',
      savedToast: 'Task gespeichert!'
    },
    timer: {
      heading: 'Timer',
      mode: {
        countdown: 'Timer',
        stopwatch: 'Stopuhr'
      },
      inputLabel: 'Timer bearbeiten',
      start: 'Start',
      pause: 'Pause',
      resume: 'Weiter',
      reset: 'Reset',
      presets: {
        fifteen: '15 Min',
        twentyFive: '25 Min',
        fortyFive: '45 Min',
        sixty: '60 Min'
      },
      adjustUp: 'Zeit erhöhen',
      adjustDown: 'Zeit verringern',
      completedTitle: 'Session abgeschlossen',
      completedMessage: 'Speichere die Aufgabe, um deinen Fokus festzuhalten.'
    },
    mobile: {
      timerTab: 'Timer',
      historyTab: 'Historie',
      settingsTab: 'Einstellungen'
    },
    breakReminder: {
      notification: {
        title: 'Zeit für eine Pause',
        message:
          'Du bist seit %MINUTES% Minuten fokussiert – steh kurz auf, streck dich oder hol dir etwas zu trinken.',
        snooze: 'Später erinnern',
        dismiss: 'Schließen'
      }
    }
  },
  en: {
    app: {
      title: 'Flowtime',
      subtitle: 'Your smart focus timer',
      totalFocus: 'Total focus time'
    },
    alerts: {
      invalidTime:
        'Please enter a valid time. Examples: 25 (minutes), 15:00, 01:30:00',
      noTrackedTime:
        'Start the timer and work for at least a few seconds before saving the task.'
    },
    history: {
      title: 'Productivity journal',
      empty: 'Once you save a session it will appear here.',
      filter: {
        today: 'Today',
        week: 'Week',
        all: 'Everything'
      }
    },
    settings: {
      title: 'Settings',
      language: {
        heading: 'Language',
        description: 'Choose the language of the app.',
        de: 'German',
        en: 'English'
      },
      breakReminder: {
        heading: 'Break reminder',
        description: 'Get a gentle nudge to take a short break in regular intervals.',
        enableLabel: 'Enable break reminder',
        intervalLabel: 'Interval between reminders',
        intervalSuffix: 'minutes',
        intervalHint: 'Minimum 5 minutes, maximum 240 minutes.'
      }
    },
    task: {
      prompt: 'What do you want to focus on?',
      placeholder: 'e.g. Present market analysis',
      save: 'Save task',
      savedToast: 'Task saved!'
    },
    timer: {
      heading: 'Timer',
      mode: {
        countdown: 'Timer',
        stopwatch: 'Stopwatch'
      },
      inputLabel: 'Edit timer',
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      reset: 'Reset',
      presets: {
        fifteen: '15 min',
        twentyFive: '25 min',
        fortyFive: '45 min',
        sixty: '60 min'
      },
      adjustUp: 'Increase time',
      adjustDown: 'Decrease time',
      completedTitle: 'Session complete',
      completedMessage: 'Save the task to capture your focus session.'
    },
    mobile: {
      timerTab: 'Timer',
      historyTab: 'History',
      settingsTab: 'Settings'
    },
    breakReminder: {
      notification: {
        title: 'Time for a break',
        message:
          'You have been focused for %MINUTES% minutes – take a short break to stretch or grab some water.',
        snooze: 'Remind me later',
        dismiss: 'Dismiss'
      }
    }
  }
};
