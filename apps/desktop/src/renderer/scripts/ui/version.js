export const initializeAppVersion = async (element) => {
  if (!element || !window?.timeTracker?.getVersion) {
    return;
  }

  try {
    const version = await window.timeTracker.getVersion();
    if (typeof version !== 'string' || !version.trim()) {
      return;
    }

    const normalized = version.trim();
    element.textContent = normalized;
    element.setAttribute('data-version-value', normalized);
    document.body?.setAttribute('data-app-version', normalized);
  } catch (error) {
    console.warn('[app] Unable to retrieve application version', error);
  }
};
