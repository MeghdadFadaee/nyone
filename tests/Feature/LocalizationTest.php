<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LocalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_inertia_responses_use_configured_default_locale_when_cookie_is_missing(): void
    {
        config(['app.locale' => 'fa']);

        $this->get(route('home'))
            ->assertOk()
            ->assertSee('dir="rtl"', false)
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('locale', 'fa')
                ->where('fallbackLocale', config('app.fallback_locale'))
                ->where('localization.locale', 'fa')
                ->where('localization.direction', 'rtl')
                ->where('localization.isRtl', true)
                ->has('localization.locales', 4)
                ->where('translations.Live', __('Live', [], 'fa'))
                ->where('translations.Password', __('Password', [], 'fa'))
                ->where('translations.Language', __('Language', [], 'fa'))
                ->where('translations', fn ($translations) => $translations->get('Browse active channels by category or title.') === __('Browse active channels by category or title.', [], 'fa'))
            );
    }

    public function test_inertia_responses_use_valid_language_cookie(): void
    {
        config(['app.locale' => 'fa']);

        $this->withCookie('locale', 'es')
            ->get(route('home'))
            ->assertOk()
            ->assertSee('dir="ltr"', false)
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('locale', 'es')
                ->where('localization.locale', 'es')
                ->where('localization.direction', 'ltr')
                ->where('localization.isRtl', false)
                ->where('translations.Live', __('Live', [], 'es'))
                ->where('translations.Password', __('Password', [], 'es'))
                ->where('translations.Language', __('Language', [], 'es'))
                ->where('translations', fn ($translations) => $translations->get('Browse active channels by category or title.') === __('Browse active channels by category or title.', [], 'es'))
            );
    }

    public function test_rtl_language_cookie_shares_rtl_metadata(): void
    {
        config(['app.locale' => 'en']);

        $this->withCookie('locale', 'ar')
            ->get(route('home'))
            ->assertOk()
            ->assertSee('lang="ar"', false)
            ->assertSee('dir="rtl"', false)
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('locale', 'ar')
                ->where('localization.locale', 'ar')
                ->where('localization.direction', 'rtl')
                ->where('localization.isRtl', true)
                ->where('translations.Live', __('Live', [], 'ar'))
                ->where('translations.Password', __('Password', [], 'ar'))
                ->where('translations.Language', __('Language', [], 'ar'))
            );
    }

    public function test_invalid_language_cookie_falls_back_to_configured_locale_and_expires_cookie(): void
    {
        config(['app.locale' => 'fa']);

        $this->withCookie('locale', 'invalid')
            ->get(route('home'))
            ->assertOk()
            ->assertCookieExpired('locale')
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('locale', 'fa')
                ->where('localization.locale', 'fa')
                ->where('localization.direction', 'rtl')
                ->where('localization.isRtl', true)
            );
    }

    public function test_user_can_change_language_preference(): void
    {
        $this->from(route('home'))
            ->post(route('language.update'), ['locale' => 'es'])
            ->assertRedirect(route('home'))
            ->assertCookie('locale', 'es');
    }

    public function test_language_preference_must_be_supported(): void
    {
        $this->from(route('home'))
            ->post(route('language.update'), ['locale' => 'invalid'])
            ->assertRedirect(route('home'))
            ->assertSessionHasErrors('locale')
            ->assertCookieMissing('locale');
    }

    public function test_backend_translation_files_are_available(): void
    {
        foreach (['en', 'es', 'fa', 'ar'] as $locale) {
            app()->setLocale($locale);

            $this->assertNotSame('auth.failed', __('auth.failed'));
            $this->assertNotSame('passwords.reset', __('passwords.reset'));
            $this->assertNotSame('pagination.previous', __('pagination.previous'));
            $this->assertNotSame('validation.required', __('validation.required', ['attribute' => 'email']));
        }
    }
}
