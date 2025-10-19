const noop = () => {};

const requestFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 0);

export const createNotificationManager = ({ host, defaultDismissLabel = 'Dismiss' } = {}) => {
  if (!host) {
    return {
      show: () => ({
        close: noop
      }),
      clear: noop
    };
  }

  let counter = 0;

  const removeNotification = (node) => {
    if (!node || node.dataset.dismissed === 'true') {
      return;
    }
    node.dataset.dismissed = 'true';
    node.classList.remove('notification--visible');
    setTimeout(() => {
      if (node.parentElement === host) {
        host.removeChild(node);
      }
    }, 220);
  };

  const buildElement = ({ title, message, dismissLabel }) => {
    const container = document.createElement('div');
    container.className = 'notification';
    container.setAttribute('role', 'status');

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'notification__close';
    closeButton.setAttribute('aria-label', dismissLabel || defaultDismissLabel);
    closeButton.innerHTML = '&times;';

    container.appendChild(closeButton);

    if (title) {
      const heading = document.createElement('h4');
      heading.className = 'notification__title';
      heading.textContent = title;
      container.appendChild(heading);
    }

    if (message) {
      const body = document.createElement('p');
      body.className = 'notification__message';
      body.textContent = message;
      container.appendChild(body);
    }

    closeButton.addEventListener('click', () => removeNotification(container));

    return container;
  };

  const addActions = (node, actions, { close }) => {
    if (!Array.isArray(actions) || actions.length === 0) {
      return;
    }

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'notification__actions';

    actions.forEach(({ label, onClick = noop, variant, closeOnClick = true }) => {
      if (!label) {
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'notification__action';
      if (variant === 'ghost') {
        button.classList.add('notification__action--ghost');
      }
      button.textContent = label;
      button.addEventListener('click', () => {
        try {
          onClick();
        } catch (error) {
          console.warn('[notifications] action handler failed', error);
        }
        if (closeOnClick) {
          close();
        }
      });

      actionsContainer.appendChild(button);
    });

    if (actionsContainer.childNodes.length > 0) {
      node.appendChild(actionsContainer);
    }
  };

  const show = ({
    title,
    message,
    durationMs = 10000,
    actions = [],
    dismissLabel,
    onClose = noop
  } = {}) => {
    const element = buildElement({ title, message, dismissLabel });
    const notificationId = `notification-${++counter}`;
    element.dataset.id = notificationId;

    let dismissed = false;
    const close = () => {
      if (dismissed) {
        return;
      }
      dismissed = true;
      removeNotification(element);
      try {
        onClose();
      } catch (error) {
        console.warn('[notifications] onClose handler failed', error);
      }
    };

    addActions(element, actions, { close });

    host.appendChild(element);

    requestFrame(() => {
      element.classList.add('notification--visible');
    });

    let timerId = null;
    if (durationMs > 0) {
      timerId = setTimeout(close, durationMs);
    }

    element.addEventListener('mouseenter', () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    });

    element.addEventListener('mouseleave', () => {
      if (durationMs > 0 && !dismissed) {
        timerId = setTimeout(close, durationMs);
      }
    });

    return { close };
  };

  const clear = () => {
    Array.from(host.querySelectorAll('.notification')).forEach(removeNotification);
  };

  return { show, clear };
};
