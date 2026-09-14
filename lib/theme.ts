export type Theme = 'light' | 'dark';

export const THEME_COOKIE = 'theme';

export function parseTheme(value: string | undefined): Theme | undefined {
    return value === 'light' || value === 'dark' ? value : undefined;
}
