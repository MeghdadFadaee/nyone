import { router, usePage } from '@inertiajs/react';
import { Check, Globe2, Languages } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { applyDocumentLocalization } from '@/lib/localization';
import { useTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { update as updateLanguage } from '@/routes/language';
import type { Localization, LocaleOption } from '@/types';

type LanguageSwitcherProps = {
    align?: 'center' | 'end' | 'start';
    className?: string;
    variant?: 'compact' | 'settings' | 'sidebar';
};

export function LanguageSwitcher({
    align = 'end',
    className,
    variant = 'compact',
}: LanguageSwitcherProps) {
    const { localization } = usePage().props;
    const { t } = useTranslation();
    const [pendingLocale, setPendingLocale] = useState<string | null>(null);
    const currentLocale =
        localization.locales.find(
            (locale) => locale.code === localization.locale,
        ) ?? localization.locales[0];

    if (!currentLocale) {
        return null;
    }

    const updateLocale = (locale: string): void => {
        if (locale === localization.locale || pendingLocale) {
            return;
        }

        const nextLocale = localization.locales.find(
            (option) => option.code === locale,
        );

        if (!nextLocale) {
            return;
        }

        setPendingLocale(locale);
        applyDocumentLocalization({
            direction: nextLocale.direction,
            locale: nextLocale.code,
        });

        router
            .optimistic((props) => ({
                locale: nextLocale.code,
                localization: {
                    ...(props as { localization: Localization }).localization,
                    direction: nextLocale.direction,
                    isRtl: nextLocale.direction === 'rtl',
                    locale: nextLocale.code,
                },
            }))
            .post(
                updateLanguage.url(),
                { locale },
                {
                    preserveScroll: true,
                    preserveState: false,
                    onCancel: () => applyDocumentLocalization(localization),
                    onError: () => applyDocumentLocalization(localization),
                    onFinish: () => setPendingLocale(null),
                    onNetworkError: () =>
                        applyDocumentLocalization(localization),
                    onSuccess: (page) =>
                        applyDocumentLocalization(
                            page.props.localization as Localization | undefined,
                        ),
                },
            );
    };

    if (variant === 'settings') {
        return (
            <section className={cn('space-y-4', className)}>
                <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Languages className="size-5" />
                    </span>
                    <div className="space-y-1">
                        <h2 className="text-base font-semibold">
                            {t('Interface language')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t('Choose the language used across Nyone.')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    {localization.locales.map((locale) => (
                        <LanguageOptionButton
                            key={locale.code}
                            locale={locale}
                            isActive={locale.code === localization.locale}
                            isPending={pendingLocale === locale.code}
                            onSelect={updateLocale}
                        />
                    ))}
                </div>
            </section>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant === 'sidebar' ? 'ghost' : 'outline'}
                    size="sm"
                    className={cn(
                        'h-9 gap-2 px-2.5',
                        variant === 'sidebar' &&
                            'w-full justify-start border-transparent bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        className,
                    )}
                    aria-label={t('Change language')}
                >
                    <Globe2 className="size-4" />
                    <span className="text-xs font-semibold tracking-normal">
                        {currentLocale.code.toUpperCase()}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Globe2 className="size-4 text-muted-foreground" />
                    {t('Language')}
                </DropdownMenuLabel>

                {localization.locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale.code}
                        className="items-center gap-3 p-2"
                        disabled={pendingLocale !== null}
                        onSelect={() => updateLocale(locale.code)}
                    >
                        <LocaleBadge locale={locale} />
                        <span
                            className="min-w-0 flex-1 text-start"
                            dir={locale.direction}
                        >
                            <span className="block truncate text-sm font-medium">
                                {locale.nativeName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                                {t(locale.name)}
                            </span>
                        </span>
                        {locale.code === localization.locale && (
                            <Check className="size-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

type LanguageOptionButtonProps = {
    isActive: boolean;
    isPending: boolean;
    locale: LocaleOption;
    onSelect: (locale: string) => void;
};

function LanguageOptionButton({
    isActive,
    isPending,
    locale,
    onSelect,
}: LanguageOptionButtonProps) {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            className={cn(
                'flex min-h-20 items-center gap-3 rounded-md border p-3 text-start transition-colors',
                isActive
                    ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-accent',
            )}
            dir={locale.direction}
            disabled={isPending}
            onClick={() => onSelect(locale.code)}
        >
            <LocaleBadge locale={locale} />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                    {locale.nativeName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                    {t(locale.name)}
                </span>
            </span>
            {isActive && <Check className="size-4 shrink-0 text-primary" />}
        </button>
    );
}

function LocaleBadge({ locale }: { locale: LocaleOption }) {
    return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground uppercase">
            {locale.code}
        </span>
    );
}
