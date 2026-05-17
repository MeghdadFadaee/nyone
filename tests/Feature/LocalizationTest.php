<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LocalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_inertia_responses_share_locale_and_translations(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('locale', app()->getLocale())
                ->where('fallbackLocale', config('app.fallback_locale'))
                ->where('translations.Live', __('Live'))
                ->where('translations.Password', __('Password'))
            );
    }

    public function test_inertia_responses_share_spanish_translations(): void
    {
        app()->setLocale('es');

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('locale', 'es')
                ->where('fallbackLocale', config('app.fallback_locale'))
                ->where('translations.Live', 'En vivo')
                ->where('translations.Password', 'Contraseña')
            );
    }

    public function test_inertia_responses_share_persian_translations(): void
    {
        app()->setLocale('fa');

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('locale', 'fa')
                ->where('fallbackLocale', config('app.fallback_locale'))
                ->where('translations.Live', 'زنده')
                ->where('translations.Password', 'رمز عبور')
            );
    }

    public function test_inertia_responses_share_arabic_translations(): void
    {
        app()->setLocale('ar');

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('locale', 'ar')
                ->where('fallbackLocale', config('app.fallback_locale'))
                ->where('translations.Live', 'مباشر')
                ->where('translations.Password', 'كلمة المرور')
            );
    }

    public function test_spanish_backend_translations_are_available(): void
    {
        app()->setLocale('es');

        $this->assertSame('Estas credenciales no coinciden con nuestros registros.', __('auth.failed'));
        $this->assertSame('Tu contraseña ha sido restablecida.', __('passwords.reset'));
        $this->assertSame('&laquo; Anterior', __('pagination.previous'));
        $this->assertSame('El campo email es obligatorio.', __('validation.required', ['attribute' => 'email']));
    }

    public function test_persian_backend_translations_are_available(): void
    {
        app()->setLocale('fa');

        $this->assertSame('این اطلاعات با سوابق ما مطابقت ندارد.', __('auth.failed'));
        $this->assertSame('رمز عبور شما بازنشانی شد.', __('passwords.reset'));
        $this->assertSame('&laquo; قبلی', __('pagination.previous'));
        $this->assertSame('فیلد email الزامی است.', __('validation.required', ['attribute' => 'email']));
    }

    public function test_arabic_backend_translations_are_available(): void
    {
        app()->setLocale('ar');

        $this->assertSame('بيانات الاعتماد هذه لا تطابق سجلاتنا.', __('auth.failed'));
        $this->assertSame('تمت إعادة تعيين كلمة المرور.', __('passwords.reset'));
        $this->assertSame('&laquo; السابق', __('pagination.previous'));
        $this->assertSame('حقل email مطلوب.', __('validation.required', ['attribute' => 'email']));
    }
}
