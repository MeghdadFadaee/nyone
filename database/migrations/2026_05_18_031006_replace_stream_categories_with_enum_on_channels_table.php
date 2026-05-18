<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->string('category')->nullable()->after('user_id')->index();
        });

        $allowedCategories = ['gaming', 'music', 'talk-shows', 'education', 'creative'];

        DB::table('categories')
            ->select(['id', 'slug'])
            ->orderBy('id')
            ->get()
            ->each(function (object $category) use ($allowedCategories): void {
                if (! in_array($category->slug, $allowedCategories, true)) {
                    return;
                }

                DB::table('channels')
                    ->where('category_id', $category->id)
                    ->update(['category' => $category->slug]);
            });

        Schema::table('channels', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
        });

        Schema::dropIfExists('categories');
    }

    public function down(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        DB::table('categories')->insert([
            ['name' => 'Gaming', 'slug' => 'gaming', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Music', 'slug' => 'music', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Talk Shows', 'slug' => 'talk-shows', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Education', 'slug' => 'education', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Creative', 'slug' => 'creative', 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::table('channels', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
        });

        DB::table('categories')
            ->select(['id', 'slug'])
            ->orderBy('id')
            ->get()
            ->each(function (object $category): void {
                DB::table('channels')
                    ->where('category', $category->slug)
                    ->update(['category_id' => $category->id]);
            });

        Schema::table('channels', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropColumn('category');
        });
    }
};
