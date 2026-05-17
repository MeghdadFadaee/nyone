import { usePage } from '@inertiajs/react';
import {
    Children,
    cloneElement,
    isValidElement,
    useCallback,
    useMemo,
} from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { TranslationReplacements, Translations } from '@/types';

export type Translate = (
    key: string,
    replacements?: TranslationReplacements,
) => string;

export function translateString(
    translations: Translations,
    key: string,
    replacements: TranslationReplacements = {},
): string {
    return Object.entries(replacements).reduce(
        (message, [name, value]) =>
            message
                .replaceAll(`:${name}`, String(value ?? ''))
                .replaceAll(`{${name}}`, String(value ?? '')),
        translations[key] ?? key,
    );
}

export function translateChildren(
    children: ReactNode,
    translate: Translate,
): ReactNode {
    return Children.map(children, (child) => {
        if (typeof child === 'string') {
            return translateTextNode(child, translate);
        }

        if (!isValidElement(child)) {
            return child;
        }

        const element = child as ReactElement<{ children?: ReactNode }>;

        if (!element.props.children) {
            return element;
        }

        return cloneElement(
            element,
            undefined,
            translateChildren(element.props.children, translate),
        );
    });
}

export function useTranslation(): {
    locale: string;
    t: Translate;
    translateNode: (children: ReactNode) => ReactNode;
} {
    const { locale, translations } = usePage().props;

    const t = useCallback<Translate>(
        (key, replacements = {}) =>
            translateString(translations, key, replacements),
        [translations],
    );

    const translateNode = useCallback(
        (children: ReactNode) => translateChildren(children, t),
        [t],
    );

    return useMemo(
        () => ({
            locale,
            t,
            translateNode,
        }),
        [locale, t, translateNode],
    );
}

export function useTranslatedChildren(children: ReactNode): ReactNode {
    const { translateNode } = useTranslation();

    return translateNode(children);
}

function translateTextNode(value: string, translate: Translate): string {
    const text = value.trim();

    if (text === '' || !/[A-Za-z]/.test(text)) {
        return value;
    }

    const leadingWhitespace = value.match(/^\s*/)?.[0] ?? '';
    const trailingWhitespace = value.match(/\s*$/)?.[0] ?? '';

    return `${leadingWhitespace}${translate(text)}${trailingWhitespace}`;
}
