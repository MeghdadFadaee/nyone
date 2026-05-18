<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Locale Preference Cookie
    |--------------------------------------------------------------------------
    |
    | This cookie stores the visitor's selected interface language. When it is
    | missing or invalid, the application falls back to the default locale
    | configured in config/app.php via APP_LOCALE.
    |
    */

    'cookie' => 'locale',

    /*
    |--------------------------------------------------------------------------
    | Supported Interface Locales
    |--------------------------------------------------------------------------
    |
    | These locales are available in the language switcher and are validated
    | before being stored in the locale cookie. The direction value controls
    | the document dir attribute, RTL layout variants, and RTL font selection.
    |
    */

    'locales' => [
        'en' => [
            'name' => 'English',
            'native_name' => 'English',
            'direction' => 'ltr',
        ],
        'es' => [
            'name' => 'Spanish',
            'native_name' => 'Español',
            'direction' => 'ltr',
        ],
        'fa' => [
            'name' => 'Persian',
            'native_name' => 'فارسی',
            'direction' => 'rtl',
        ],
        'ar' => [
            'name' => 'Arabic',
            'native_name' => 'العربية',
            'direction' => 'rtl',
        ],
    ],
];
