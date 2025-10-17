export const createMobileViewController = ({ elements, translate, initialView = 'timer' }) => {
  let activeView = initialView === 'tasks' ? 'tasks' : 'timer';

  const updateToggleLabel = () => {
    if (!elements.viewToggleBtn) {
      return;
    }

    const key = activeView === 'timer' ? 'mobile.showTasks' : 'mobile.showTimer';
    const label = translate(key);
    elements.viewToggleBtn.textContent = label;
    elements.viewToggleBtn.setAttribute('aria-label', label);
  };

  const applyViewToLayout = () => {
    if (elements.layout) {
      elements.layout.setAttribute('data-active-view', activeView);
    }
    updateToggleLabel();
  };

  if (elements.viewToggleBtn && elements.layout) {
    elements.viewToggleBtn.addEventListener('click', () => {
      activeView = activeView === 'timer' ? 'tasks' : 'timer';
      applyViewToLayout();
    });
  }

  applyViewToLayout();

  return {
    getActiveView: () => activeView,
    setActiveView: (view) => {
      activeView = view === 'tasks' ? 'tasks' : 'timer';
      applyViewToLayout();
    },
    refreshLabels: updateToggleLabel
  };
};
