export const translations = {
  de: {
    app: {
      title: 'Flowtime',
      subtitle: 'Dein smarter Fokus-Timer',
      totalFocus: 'Gesamte Fokuszeit'
    },
    alerts: {
      invalidTime: 'Bitte gib eine gültige Zeit ein. Beispiele: 25 (Minuten), 15:00, 01:30:00',
      noTrackedTime:
        'Starte den Timer und arbeite mindestens ein paar Sekunden, bevor du die Aufgabe speicherst.'
    },
    console: {
      loadWarning: 'Konnte gespeicherte Daten nicht laden'
    },
    document: {
      title: 'Flowtime - Desktop'
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
      toggle: 'Einstellungen',
      title: 'Einstellungen',
      close: 'Sidebar schließen',
      infoTitle: 'App-Informationen',
      version: {
        label: 'Version',
        placeholder: 'Lade...'
      },
      breakReminder: {
        heading: 'Pausenerinnerung',
        description: 'Lass dich in regelmäßigen Abständen an eine kurze Pause erinnern.',
        enableLabel: 'Pausenerinnerung aktivieren',
        intervalLabel: 'Abstand zwischen Erinnerungen',
        intervalSuffix: 'Minuten',
        intervalHint: 'Mindestens 5 Minuten, maximal 240 Minuten.'
      },
      language: {
        heading: 'Sprache',
        description: 'Wähle die Sprache der App.',
        de: 'Deutsch',
        en: 'Englisch'
      }
    },
    task: {
      prompt: 'Was möchtest du fokussiert erledigen?',
      placeholder: 'z. B. Marktanalyse präsentieren',
      save: 'Task speichern'
    },
    mobile: {
      showTasks: 'Aufgaben anzeigen',
      showTimer: 'Timer anzeigen'
    },
    timer: {
      mode: {
        groupAria: 'Timer-Modus auswählen',
        countdown: 'Timer',
        stopwatch: 'Stopuhr'
      },
      presets: {
        15: '15 Min',
        25: '25 Min',
        45: '45 Min',
        60: '60 Min'
      },
      adjust: {
        increase: 'Zeit erhöhen',
        decrease: 'Zeit verringern',
        groupAria: 'Timer anpassen'
      },
      input: {
        ariaLabel: 'Timer bearbeiten'
      },
      start: 'Start',
      pause: 'Pause',
      resume: 'Weiter',
      reset: 'Reset'
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
      invalidTime: 'Please enter a valid time. Examples: 25 (minutes), 15:00, 01:30:00',
      noTrackedTime: 'Start the timer and work for at least a few seconds before saving the task.'
    },
    console: {
      loadWarning: 'Unable to load stored data'
    },
    document: {
      title: 'Flowtime - Desktop'
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
      toggle: 'Settings',
      title: 'Settings',
      close: 'Close sidebar',
      infoTitle: 'App information',
      version: {
        label: 'Version',
        placeholder: 'Loading...'
      },
      breakReminder: {
        heading: 'Break reminder',
        description: 'Get a gentle nudge to take a short break in regular intervals.',
        enableLabel: 'Enable break reminder',
        intervalLabel: 'Interval between reminders',
        intervalSuffix: 'minutes',
        intervalHint: 'Minimum 5 minutes, maximum 240 minutes.'
      },
      language: {
        heading: 'Language',
        description: 'Choose the language of the app.',
        de: 'German',
        en: 'English'
      }
    },
    task: {
      prompt: 'What do you want to focus on?',
      placeholder: 'e.g. Present market analysis',
      save: 'Save task'
    },
    mobile: {
      showTasks: 'Show tasks',
      showTimer: 'Show timer'
    },
    timer: {
      mode: {
        groupAria: 'Select timer mode',
        countdown: 'Timer',
        stopwatch: 'Stopwatch'
      },
      presets: {
        15: '15 min',
        25: '25 min',
        45: '45 min',
        60: '60 min'
      },
      adjust: {
        increase: 'Increase time',
        decrease: 'Decrease time',
        groupAria: 'Adjust timer'
      },
      input: {
        ariaLabel: 'Edit timer'
      },
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      reset: 'Reset'
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
