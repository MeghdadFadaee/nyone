<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $fallbackLocale = (string) config('app.fallback_locale');
        $locale = app()->getLocale();
        $locales = $this->locales();
        $direction = $locales[$locale]['direction'] ?? 'ltr';

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'fallbackLocale' => $fallbackLocale,
            'locale' => $locale,
            'localization' => [
                'locale' => $locale,
                'fallbackLocale' => $fallbackLocale,
                'direction' => $direction,
                'isRtl' => $direction === 'rtl',
                'locales' => $this->localeOptions($locales),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'translations' => fn () => $this->translations(),
        ];
    }

    /**
     * @return array<string, array{name: string, native_name: string, direction: string}>
     */
    private function locales(): array
    {
        $locales = config('localization.locales', []);

        return is_array($locales) ? $locales : [];
    }

    /**
     * @param  array<string, array{name: string, native_name: string, direction: string}>  $locales
     * @return array<int, array{code: string, name: string, nativeName: string, direction: string}>
     */
    private function localeOptions(array $locales): array
    {
        return collect($locales)
            ->map(fn (array $locale, string $code): array => [
                'code' => $code,
                'name' => $locale['name'],
                'nativeName' => $locale['native_name'],
                'direction' => $locale['direction'],
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, string>
     */
    private function translations(): array
    {
        $fallbackLocale = (string) config('app.fallback_locale');
        $locale = app()->getLocale();

        return [
            ...$this->jsonTranslations($fallbackLocale),
            ...$this->jsonTranslations($locale),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function jsonTranslations(string $locale): array
    {
        $path = lang_path("{$locale}.json");

        if (! is_file($path)) {
            return [];
        }

        $translations = json_decode((string) file_get_contents($path), true);

        return is_array($translations) ? $translations : [];
    }
}
