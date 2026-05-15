<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
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

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'is_admin' => true,
        ]);
    }
}
