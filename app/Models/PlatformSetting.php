<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['channel_creation_open'])]
class PlatformSetting extends Model
{
    protected $attributes = [
        'channel_creation_open' => false,
    ];

    public static function current(): self
    {
        return static::query()->first() ?? static::query()->create();
    }

    protected function casts(): array
    {
        return [
            'channel_creation_open' => 'boolean',
        ];
    }
}
