export const applyDocumentTranslations = ({ translate, language, elements }) => {
  document.documentElement.lang = language;
  document.title = translate('document.title');

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    if (!key) {
      return;
    }

    if (node.dataset?.versionValue != null) {
      return;
    }

    node.textContent = translate(key);
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
    const config = node.getAttribute('data-i18n-attr');
    if (!config) {
      return;
    }

    config.split(';').forEach((entry) => {
      const [attr, key] = entry.split(':').map((part) => part && part.trim());
      if (attr && key) {
        node.setAttribute(attr, translate(key));
      }
    });
  });

  if (elements.languageSelect) {
    elements.languageSelect.value = language;
  }

  if (elements.appVersion && !elements.appVersion.getAttribute('data-version-value')) {
    elements.appVersion.textContent = translate('settings.version.placeholder');
  }
};
