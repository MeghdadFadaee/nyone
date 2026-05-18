<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $cookieName = (string) config('localization.cookie', 'locale');
        $supportedLocales = array_keys((array) config('localization.locales', []));
        $cookieLocale = $request->cookie($cookieName);
        $configuredLocale = (string) config('app.locale', 'en');

        $locale = $this->validLocale($cookieLocale, $supportedLocales)
            ?? $this->validLocale($configuredLocale, $supportedLocales)
            ?? $this->validLocale((string) config('app.fallback_locale', 'en'), $supportedLocales)
            ?? 'en';

        App::setLocale($locale);

        $response = $next($request);

        if ($request->hasCookie($cookieName) && $this->validLocale($cookieLocale, $supportedLocales) === null) {
            $response->headers->setCookie(Cookie::forget(
                $cookieName,
                (string) config('session.path', '/'),
                config('session.domain'),
            ));
        }

        return $response;
    }

    /**
     * @param  array<int, string>  $supportedLocales
     */
    private function validLocale(mixed $locale, array $supportedLocales): ?string
    {
        if (! is_string($locale)) {
            return null;
        }

        return in_array($locale, $supportedLocales, true) ? $locale : null;
    }
}
