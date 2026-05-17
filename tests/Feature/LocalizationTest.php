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
                ->where('translations.Live', 'Live')
                ->where('translations.Password', 'Password')
            );
    }
}
