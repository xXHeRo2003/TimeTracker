const createMediaQuery = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  return window.matchMedia('(max-width: 768px)');
};

export const createSettingsPanel = ({ elements, onLanguageChange, getLanguage }) => {
  const originalParent = elements.settingsToggle?.parentElement ?? null;
  const originalNextSibling = elements.settingsToggle?.nextElementSibling ?? null;
  const mediaQuery = createMediaQuery();

  const relocateToggle = (embedInPanel) => {
    if (!elements.settingsToggle) {
      return;
    }

    if (embedInPanel) {
      if (elements.timerPanel && elements.settingsToggle.parentElement !== elements.timerPanel) {
        elements.timerPanel.prepend(elements.settingsToggle);
      }
      return;
    }

    if (!originalParent) {
      return;
    }

    if (elements.settingsToggle.parentElement === originalParent) {
      return;
    }

    if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
      originalParent.insertBefore(elements.settingsToggle, originalNextSibling);
    } else {
      originalParent.appendChild(elements.settingsToggle);
    }
  };

  const setVisibility = (visible) => {
    if (!elements.settingsSidebar || !elements.settingsToggle || !elements.settingsBackdrop) {
      return;
    }

    elements.settingsSidebar.classList.toggle('settings--visible', visible);
    elements.settingsBackdrop.classList.toggle('settings-backdrop--visible', visible);
    elements.settingsSidebar.setAttribute('aria-hidden', String(!visible));
    elements.settingsBackdrop.setAttribute('aria-hidden', String(!visible));
    elements.settingsToggle.setAttribute('aria-expanded', String(visible));
    elements.settingsToggle.classList.toggle('settings-toggle--hidden', visible);

    if (visible) {
      elements.settingsClose?.focus();
    } else {
      elements.settingsToggle.focus();
    }
  };

  const closeSettings = () => setVisibility(false);

  if (elements.settingsToggle) {
    elements.settingsToggle.addEventListener('click', () => {
      const isVisible = elements.settingsSidebar?.classList.contains('settings--visible');
      setVisibility(!isVisible);
    });
  }

  if (elements.settingsClose) {
    elements.settingsClose.addEventListener('click', closeSettings);
  }

  if (elements.settingsBackdrop) {
    elements.settingsBackdrop.addEventListener('click', closeSettings);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elements.settingsSidebar?.classList.contains('settings--visible')) {
      closeSettings();
    }
  });

  if (elements.languageSelect) {
    elements.languageSelect.addEventListener('change', (event) => {
      const nextLanguage = event.target.value;
      if (nextLanguage) {
        onLanguageChange(nextLanguage);
      }
    });
  }

  if (mediaQuery) {
    relocateToggle(mediaQuery.matches);
    const listener = (event) => relocateToggle(event.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(listener);
    }
  } else {
    relocateToggle(false);
  }

  const syncLanguageSelect = () => {
    if (elements.languageSelect) {
      elements.languageSelect.value = getLanguage();
    }
  };

  syncLanguageSelect();

  return {
    refreshLanguageSelection: syncLanguageSelect,
    close: closeSettings
  };
};
