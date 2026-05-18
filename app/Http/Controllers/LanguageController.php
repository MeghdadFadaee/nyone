<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateLanguageRequest;
use Illuminate\Http\RedirectResponse;

class LanguageController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(UpdateLanguageRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        return back()->withCookie(cookie(
            (string) config('localization.cookie', 'locale'),
            (string) $validated['locale'],
            60 * 24 * 365,
            (string) config('session.path', '/'),
            config('session.domain'),
            config('session.secure'),
            true,
            false,
            config('session.same_site', 'lax'),
        ));
    }
}
