import type { Localization, LocaleDirection } from '@/types';

type DocumentLocalization = {
    direction: LocaleDirection;
    locale: string;
};

export function applyDocumentLocalization(
    localization?: DocumentLocalization | Localization | null,
): void {
    if (!localization || typeof document === 'undefined') {
        return;
    }

    document.documentElement.lang = localization.locale.replaceAll('_', '-');
    document.documentElement.dir = localization.direction;
}
