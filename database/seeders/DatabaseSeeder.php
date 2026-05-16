<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\Streaming\StreamKeyManager;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        collect([
            ['name' => 'Gaming', 'slug' => 'gaming'],
            ['name' => 'Music', 'slug' => 'music'],
            ['name' => 'Talk Shows', 'slug' => 'talk-shows'],
            ['name' => 'Education', 'slug' => 'education'],
            ['name' => 'Creative', 'slug' => 'creative'],
        ])->each(fn (array $category) => Category::query()->firstOrCreate(
            ['slug' => $category['slug']],
            ['name' => $category['name']],
        ));

        PlatformSetting::current();

        $admin = User::query()->firstOrNew(['email' => 'admin@nyone.net']);
        $admin->forceFill([
            'name' => 'Admin User',
            'password' => 'password',
            'email_verified_at' => now(),
            'is_admin' => true,
            'can_create_channel' => false,
        ])->save();

        $official = User::query()->firstOrNew(['email' => 'chief@nyone.net']);
        $official->forceFill([
            'name' => 'Chief Nyone',
            'password' => 'password',
            'email_verified_at' => now(),
            'is_admin' => false,
            'can_create_channel' => true,
        ])->save();

        $channel = $official->channel()->updateOrCreate([], [
            'category_id' => Category::query()->where('slug', 'creative')->value('id'),
            'slug' => 'nyone',
            'display_name' => 'Nyone Official',
            'description' => 'Official updates and live sessions from Nyone.',
        ]);

        if (! $channel->streamKey()->exists()) {
            app(StreamKeyManager::class)->rotate($channel);
        }
    }
}
