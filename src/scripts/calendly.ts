/**
 * Calendly popup, loaded only when a booking button is clicked.
 * Nothing from calendly.com is requested before that. If the widget script fails
 * to load (blocked, offline), the click falls back to opening the event in a new tab.
 */
const SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js';
const STYLE_HREF = 'https://assets.calendly.com/assets/external/widget.css';

type CalendlyGlobal = { initPopupWidget: (options: { url: string }) => void };
declare global {
  interface Window {
    Calendly?: CalendlyGlobal;
  }
}

let loading: Promise<CalendlyGlobal> | null = null;

function loadWidget(): Promise<CalendlyGlobal> {
  if (window.Calendly) return Promise.resolve(window.Calendly);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLE_HREF;
    document.head.append(link);

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.Calendly ? resolve(window.Calendly) : reject(new Error('Calendly global missing'));
    script.onerror = () => reject(new Error('Calendly widget failed to load'));
    document.head.append(script);
    window.setTimeout(() => reject(new Error('Calendly widget timed out')), 6000);
  });
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

function openFallback(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function bindCalendlyButtons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLAnchorElement>('a[data-calendly]').forEach((anchor) => {
    if (anchor.dataset.bound) return;
    anchor.dataset.bound = 'true';
    anchor.addEventListener('click', (event) => {
      // Let modifier clicks and middle clicks behave like normal links.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
        return;
      event.preventDefault();
      const url = anchor.href;
      anchor.setAttribute('aria-busy', 'true');
      loadWidget()
        .then((calendly) => calendly.initPopupWidget({ url }))
        .catch(() => openFallback(url))
        .finally(() => anchor.removeAttribute('aria-busy'));
    });
  });
}
