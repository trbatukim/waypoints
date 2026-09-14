import { useSyncExternalStore } from 'react';
import { THEME_COOKIE, parseTheme, type Theme } from './theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function resolveTheme(): Theme {
    return (
        parseTheme(document.documentElement.dataset.theme) ??
        (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')
    );
}

function subscribe(onChange: () => void) {
    const media = window.matchMedia(DARK_QUERY);
    const observer = new MutationObserver(onChange);

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    media.addEventListener('change', onChange);

    return () => {
        observer.disconnect();
        media.removeEventListener('change', onChange);
    };
}

export function useTheme(): Theme {
    return useSyncExternalStore(subscribe, resolveTheme, () => 'light');
}

export function setTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme;
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}
