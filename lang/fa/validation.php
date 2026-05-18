<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => 'فیلد :attribute باید پذیرفته شود.',
    'accepted_if' => 'فیلد :attribute وقتی :other برابر :value است باید پذیرفته شود.',
    'active_url' => 'فیلد :attribute باید یک نشانی اینترنتی معتبر باشد.',
    'after' => 'فیلد :attribute باید تاریخی بعد از :date باشد.',
    'after_or_equal' => 'فیلد :attribute باید تاریخی بعد از یا برابر با :date باشد.',
    'alpha' => 'فیلد :attribute فقط باید شامل حروف باشد.',
    'alpha_dash' => 'فیلد :attribute فقط باید شامل حروف، اعداد، خط تیره و زیرخط باشد.',
    'alpha_num' => 'فیلد :attribute فقط باید شامل حروف و اعداد باشد.',
    'any_of' => 'فیلد :attribute نامعتبر است.',
    'array' => 'فیلد :attribute باید آرایه باشد.',
    'ascii' => 'فیلد :attribute فقط باید شامل حروف، اعداد و نمادهای تک‌بایتی باشد.',
    'before' => 'فیلد :attribute باید تاریخی قبل از :date باشد.',
    'before_or_equal' => 'فیلد :attribute باید تاریخی قبل از یا برابر با :date باشد.',
    'between' => [
        'array' => 'فیلد :attribute باید بین :min و :max آیتم داشته باشد.',
        'file' => 'فیلد :attribute باید بین :min و :max کیلوبایت باشد.',
        'numeric' => 'فیلد :attribute باید بین :min و :max باشد.',
        'string' => 'فیلد :attribute باید بین :min و :max کاراکتر باشد.',
    ],
    'boolean' => 'فیلد :attribute باید درست یا نادرست باشد.',
    'can' => 'فیلد :attribute شامل مقدار غیرمجاز است.',
    'confirmed' => 'تأیید فیلد :attribute مطابقت ندارد.',
    'contains' => 'فیلد :attribute یک مقدار الزامی را ندارد.',
    'current_password' => 'رمز عبور نادرست است.',
    'date' => 'فیلد :attribute باید یک تاریخ معتبر باشد.',
    'date_equals' => 'فیلد :attribute باید تاریخی برابر با :date باشد.',
    'date_format' => 'فیلد :attribute باید با قالب :format مطابقت داشته باشد.',
    'decimal' => 'فیلد :attribute باید :decimal رقم اعشار داشته باشد.',
    'declined' => 'فیلد :attribute باید رد شود.',
    'declined_if' => 'فیلد :attribute وقتی :other برابر :value است باید رد شود.',
    'different' => 'فیلد :attribute و :other باید متفاوت باشند.',
    'digits' => 'فیلد :attribute باید :digits رقم باشد.',
    'digits_between' => 'فیلد :attribute باید بین :min و :max رقم باشد.',
    'dimensions' => 'فیلد :attribute ابعاد تصویر نامعتبر دارد.',
    'distinct' => 'فیلد :attribute مقدار تکراری دارد.',
    'doesnt_contain' => 'فیلد :attribute نباید شامل هیچ‌یک از این مقادیر باشد: :values.',
    'doesnt_end_with' => 'فیلد :attribute نباید با یکی از این مقادیر پایان یابد: :values.',
    'doesnt_start_with' => 'فیلد :attribute نباید با یکی از این مقادیر شروع شود: :values.',
    'email' => 'فیلد :attribute باید یک آدرس ایمیل معتبر باشد.',
    'encoding' => 'فیلد :attribute باید با :encoding کدگذاری شده باشد.',
    'ends_with' => 'فیلد :attribute باید با یکی از این مقادیر پایان یابد: :values.',
    'enum' => ':attribute انتخاب‌شده نامعتبر است.',
    'exists' => ':attribute انتخاب‌شده نامعتبر است.',
    'extensions' => 'فیلد :attribute باید یکی از این پسوندها را داشته باشد: :values.',
    'file' => 'فیلد :attribute باید یک فایل باشد.',
    'filled' => 'فیلد :attribute باید مقدار داشته باشد.',
    'gt' => [
        'array' => 'فیلد :attribute باید بیشتر از :value آیتم داشته باشد.',
        'file' => 'فیلد :attribute باید بزرگ‌تر از :value کیلوبایت باشد.',
        'numeric' => 'فیلد :attribute باید بزرگ‌تر از :value باشد.',
        'string' => 'فیلد :attribute باید بیشتر از :value کاراکتر باشد.',
    ],
    'gte' => [
        'array' => 'فیلد :attribute باید :value آیتم یا بیشتر داشته باشد.',
        'file' => 'فیلد :attribute باید بزرگ‌تر یا برابر با :value کیلوبایت باشد.',
        'numeric' => 'فیلد :attribute باید بزرگ‌تر یا برابر با :value باشد.',
        'string' => 'فیلد :attribute باید :value کاراکتر یا بیشتر باشد.',
    ],
    'hex_color' => 'فیلد :attribute باید یک رنگ هگزادسیمال معتبر باشد.',
    'image' => 'فیلد :attribute باید یک تصویر باشد.',
    'in' => ':attribute انتخاب‌شده نامعتبر است.',
    'in_array' => 'فیلد :attribute باید در :other وجود داشته باشد.',
    'in_array_keys' => 'فیلد :attribute باید حداقل یکی از این کلیدها را داشته باشد: :values.',
    'integer' => 'فیلد :attribute باید یک عدد صحیح باشد.',
    'ip' => 'فیلد :attribute باید یک آدرس IP معتبر باشد.',
    'ipv4' => 'فیلد :attribute باید یک آدرس IPv4 معتبر باشد.',
    'ipv6' => 'فیلد :attribute باید یک آدرس IPv6 معتبر باشد.',
    'json' => 'فیلد :attribute باید یک رشته JSON معتبر باشد.',
    'list' => 'فیلد :attribute باید یک فهرست باشد.',
    'lowercase' => 'فیلد :attribute باید با حروف کوچک باشد.',
    'lt' => [
        'array' => 'فیلد :attribute باید کمتر از :value آیتم داشته باشد.',
        'file' => 'فیلد :attribute باید کمتر از :value کیلوبایت باشد.',
        'numeric' => 'فیلد :attribute باید کمتر از :value باشد.',
        'string' => 'فیلد :attribute باید کمتر از :value کاراکتر باشد.',
    ],
    'lte' => [
        'array' => 'فیلد :attribute نباید بیشتر از :value آیتم داشته باشد.',
        'file' => 'فیلد :attribute باید کمتر یا برابر با :value کیلوبایت باشد.',
        'numeric' => 'فیلد :attribute باید کمتر یا برابر با :value باشد.',
        'string' => 'فیلد :attribute باید :value کاراکتر یا کمتر باشد.',
    ],
    'mac_address' => 'فیلد :attribute باید یک آدرس MAC معتبر باشد.',
    'max' => [
        'array' => 'فیلد :attribute نباید بیشتر از :max آیتم داشته باشد.',
        'file' => 'فیلد :attribute نباید بزرگ‌تر از :max کیلوبایت باشد.',
        'numeric' => 'فیلد :attribute نباید بزرگ‌تر از :max باشد.',
        'string' => 'فیلد :attribute نباید بیشتر از :max کاراکتر باشد.',
    ],
    'max_digits' => 'فیلد :attribute نباید بیشتر از :max رقم داشته باشد.',
    'mimes' => 'فیلد :attribute باید فایلی از نوع :values باشد.',
    'mimetypes' => 'فیلد :attribute باید فایلی از نوع :values باشد.',
    'min' => [
        'array' => 'فیلد :attribute باید حداقل :min آیتم داشته باشد.',
        'file' => 'فیلد :attribute باید حداقل :min کیلوبایت باشد.',
        'numeric' => 'فیلد :attribute باید حداقل :min باشد.',
        'string' => 'فیلد :attribute باید حداقل :min کاراکتر باشد.',
    ],
    'min_digits' => 'فیلد :attribute باید حداقل :min رقم داشته باشد.',
    'missing' => 'فیلد :attribute باید وجود نداشته باشد.',
    'missing_if' => 'فیلد :attribute وقتی :other برابر :value است باید وجود نداشته باشد.',
    'missing_unless' => 'فیلد :attribute باید وجود نداشته باشد مگر اینکه :other برابر :value باشد.',
    'missing_with' => 'فیلد :attribute وقتی :values حاضر است باید وجود نداشته باشد.',
    'missing_with_all' => 'فیلد :attribute وقتی :values حاضر هستند باید وجود نداشته باشد.',
    'multiple_of' => 'فیلد :attribute باید مضربی از :value باشد.',
    'not_in' => ':attribute انتخاب‌شده نامعتبر است.',
    'not_regex' => 'قالب فیلد :attribute نامعتبر است.',
    'numeric' => 'فیلد :attribute باید عدد باشد.',
    'password' => [
        'letters' => 'فیلد :attribute باید حداقل یک حرف داشته باشد.',
        'mixed' => 'فیلد :attribute باید حداقل یک حرف بزرگ و یک حرف کوچک داشته باشد.',
        'numbers' => 'فیلد :attribute باید حداقل یک عدد داشته باشد.',
        'symbols' => 'فیلد :attribute باید حداقل یک نماد داشته باشد.',
        'uncompromised' => ':attribute واردشده در یک نشت داده دیده شده است. لطفاً :attribute دیگری انتخاب کنید.',
    ],
    'present' => 'فیلد :attribute باید حاضر باشد.',
    'present_if' => 'فیلد :attribute وقتی :other برابر :value است باید حاضر باشد.',
    'present_unless' => 'فیلد :attribute باید حاضر باشد مگر اینکه :other برابر :value باشد.',
    'present_with' => 'فیلد :attribute وقتی :values حاضر است باید حاضر باشد.',
    'present_with_all' => 'فیلد :attribute وقتی :values حاضر هستند باید حاضر باشد.',
    'prohibited' => 'فیلد :attribute ممنوع است.',
    'prohibited_if' => 'فیلد :attribute وقتی :other برابر :value است ممنوع است.',
    'prohibited_if_accepted' => 'فیلد :attribute وقتی :other پذیرفته شده است ممنوع است.',
    'prohibited_if_declined' => 'فیلد :attribute وقتی :other رد شده است ممنوع است.',
    'prohibited_unless' => 'فیلد :attribute ممنوع است مگر اینکه :other در :values باشد.',
    'prohibits' => 'فیلد :attribute اجازه حضور :other را نمی‌دهد.',
    'regex' => 'قالب فیلد :attribute نامعتبر است.',
    'required' => 'فیلد :attribute الزامی است.',
    'required_array_keys' => 'فیلد :attribute باید ورودی‌هایی برای :values داشته باشد.',
    'required_if' => 'فیلد :attribute وقتی :other برابر :value است الزامی است.',
    'required_if_accepted' => 'فیلد :attribute وقتی :other پذیرفته شده است الزامی است.',
    'required_if_declined' => 'فیلد :attribute وقتی :other رد شده است الزامی است.',
    'required_unless' => 'فیلد :attribute الزامی است مگر اینکه :other در :values باشد.',
    'required_with' => 'فیلد :attribute وقتی :values حاضر است الزامی است.',
    'required_with_all' => 'فیلد :attribute وقتی :values حاضر هستند الزامی است.',
    'required_without' => 'فیلد :attribute وقتی :values حاضر نیست الزامی است.',
    'required_without_all' => 'فیلد :attribute وقتی هیچ‌یک از :values حاضر نیستند الزامی است.',
    'same' => 'فیلد :attribute باید با :other مطابقت داشته باشد.',
    'size' => [
        'array' => 'فیلد :attribute باید :size آیتم داشته باشد.',
        'file' => 'فیلد :attribute باید :size کیلوبایت باشد.',
        'numeric' => 'فیلد :attribute باید :size باشد.',
        'string' => 'فیلد :attribute باید :size کاراکتر باشد.',
    ],
    'starts_with' => 'فیلد :attribute باید با یکی از این مقادیر شروع شود: :values.',
    'string' => 'فیلد :attribute باید رشته باشد.',
    'timezone' => 'فیلد :attribute باید یک منطقه زمانی معتبر باشد.',
    'unique' => 'مقدار :attribute قبلاً استفاده شده است.',
    'uploaded' => 'بارگذاری :attribute ناموفق بود.',
    'uppercase' => 'فیلد :attribute باید با حروف بزرگ باشد.',
    'url' => 'فیلد :attribute باید یک نشانی اینترنتی معتبر باشد.',
    'ulid' => 'فیلد :attribute باید یک ULID معتبر باشد.',
    'uuid' => 'فیلد :attribute باید یک UUID معتبر باشد.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom validation messages for attributes using the
    | convention "attribute.rule" to name the lines. This makes it quick to
    | specify a specific custom language line for a given attribute rule.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'پیام-سفارشی',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap our attribute placeholder
    | with something more reader friendly such as "E-Mail Address" instead
    | of "email". This simply helps us make our message more expressive.
    |
    */

    'attributes' => [],

];
