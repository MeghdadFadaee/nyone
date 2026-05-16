<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('profile.edit'));

        $response->assertOk();
    }

    public function test_profile_page_exposes_user_avatar_url(): void
    {
        $user = User::factory()->create([
            'avatar_path' => 'users/demo/avatar.jpg',
        ]);

        $this
            ->actingAs($user)
            ->get(route('profile.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/profile')
                ->where('auth.user.avatar', '/storage/users/demo/avatar.jpg'),
            );
    }

    public function test_profile_information_can_be_updated()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_update_their_avatar(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'avatar_path' => 'users/demo/old-avatar.jpg',
        ]);

        Storage::disk('public')->put($user->avatar_path, 'old avatar');

        $this
            ->actingAs($user)
            ->post(route('profile.update'), [
                '_method' => 'PATCH',
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => UploadedFile::fake()->image('avatar.png', 400, 400),
            ])
            ->assertRedirect(route('profile.edit'))
            ->assertSessionHasNoErrors();

        $user->refresh();

        $this->assertNotSame('users/demo/old-avatar.jpg', $user->avatar_path);
        $this->assertStringStartsWith("users/{$user->id}/avatars/", $user->avatar_path);
        Storage::disk('public')->assertMissing('users/demo/old-avatar.jpg');
        Storage::disk('public')->assertExists($user->avatar_path);
    }

    public function test_user_avatar_must_be_an_image(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'avatar_path' => 'users/demo/current-avatar.jpg',
        ]);

        $this
            ->actingAs($user)
            ->from(route('profile.edit'))
            ->post(route('profile.update'), [
                '_method' => 'PATCH',
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => UploadedFile::fake()->create('avatar.txt', 8, 'text/plain'),
            ])
            ->assertRedirect(route('profile.edit'))
            ->assertSessionHasErrors('avatar');

        $this->assertSame('users/demo/current-avatar.jpg', $user->refresh()->avatar_path);
    }

    public function test_user_can_delete_their_account()
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'avatar_path' => 'users/demo/avatar.jpg',
        ]);

        Storage::disk('public')->put($user->avatar_path, 'avatar');

        $response = $this
            ->actingAs($user)
            ->delete(route('profile.destroy'), [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('home'));

        $this->assertGuest();
        $this->assertNull($user->fresh());
        Storage::disk('public')->assertMissing('users/demo/avatar.jpg');
    }

    public function test_correct_password_must_be_provided_to_delete_account()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from(route('profile.edit'))
            ->delete(route('profile.destroy'), [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect(route('profile.edit'));

        $this->assertNotNull($user->fresh());
    }
}
