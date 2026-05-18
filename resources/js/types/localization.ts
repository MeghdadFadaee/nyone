export type Translations = Record<string, string>;

export type TranslationReplacements = Record<
    string,
    boolean | null | number | string | undefined
>;

export type LocaleDirection = 'ltr' | 'rtl';

export type LocaleOption = {
    code: string;
    name: string;
    nativeName: string;
    direction: LocaleDirection;
};

export type Localization = {
    locale: string;
    fallbackLocale: string;
    direction: LocaleDirection;
    isRtl: boolean;
    locales: LocaleOption[];
};
