<?php

namespace Tests\Feature;

use App\Models\SupportAttachment;
use App\Models\SupportConversation;
use App\Models\SupportMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SupportConversationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_contact_pages(): void
    {
        $conversation = SupportConversation::factory()->create();

        $this->get(route('support.index'))->assertRedirect(route('login'));
        $this->post(route('support.store'))->assertRedirect(route('login'));
        $this->get(route('support.show', $conversation))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_create_support_conversation_with_attachment(): void
    {
        Storage::fake('local');

        $user = User::factory()->create(['can_create_channel' => false]);
        $attachment = UploadedFile::fake()->create('channel-request.pdf', 204800, 'application/pdf');
        $jsonAttachment = UploadedFile::fake()->create('payload.json', 1, 'application/json');

        $this->actingAs($user)
            ->post(route('support.store'), [
                'category' => SupportConversation::CATEGORY_CHANNEL_REQUEST,
                'subject' => 'Please approve my creator channel',
                'body' => 'I want to start streaming tutorials.',
                'attachments' => [$attachment, $jsonAttachment],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $conversation = SupportConversation::query()->firstOrFail();
        $message = SupportMessage::query()->firstOrFail();
        $storedAttachment = SupportAttachment::query()->firstOrFail();

        $this->assertSame($user->id, $conversation->user_id);
        $this->assertSame(SupportConversation::CATEGORY_CHANNEL_REQUEST, $conversation->category);
        $this->assertSame('I want to start streaming tutorials.', $message->body);
        $this->assertFalse($user->refresh()->can_create_channel);
        $this->assertSame('channel-request.pdf', $storedAttachment->original_name);
        $this->assertDatabaseHas('support_attachments', [
            'support_message_id' => $message->id,
            'original_name' => 'payload.json',
            'mime_type' => 'application/json',
        ]);
        Storage::disk('local')->assertExists($storedAttachment->path);
    }

    public function test_support_conversation_validation_errors_are_returned(): void
    {
        $user = User::factory()->create();
        $attachment = UploadedFile::fake()->create('script.exe', 1, 'application/x-msdownload');

        $this->actingAs($user)
            ->post(route('support.store'), [
                'category' => 'billing',
                'subject' => '',
                'body' => '',
                'attachments' => [$attachment],
            ])
            ->assertSessionHasErrors([
                'category',
                'subject',
                'body',
                'attachments.0' => 'Unsupported attachment type. Upload media, PDF, text/data, Office, OpenDocument, or archive files.',
            ]);
    }

    public function test_media_attachment_must_not_exceed_two_hundred_megabytes(): void
    {
        $user = User::factory()->create();
        $attachment = UploadedFile::fake()->image('too-large.jpg')->size(204801);

        $this->actingAs($user)
            ->post(route('support.store'), [
                'category' => SupportConversation::CATEGORY_BUG,
                'subject' => 'Large upload',
                'body' => 'This screenshot is too large.',
                'attachments' => [$attachment],
            ])
            ->assertSessionHasErrors([
                'attachments.0' => 'Attachments must be 200 MB or smaller.',
            ]);
    }

    public function test_user_can_view_and_reply_to_own_conversation(): void
    {
        $user = User::factory()->create();
        $conversation = SupportConversation::factory()->for($user)->create([
            'subject' => 'Playback problem',
        ]);
        SupportMessage::factory()->for($conversation, 'conversation')->for($user)->create([
            'body' => 'Video stalls after one minute.',
        ]);

        $this->actingAs($user)
            ->get(route('support.show', $conversation))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('support/show')
                ->where('conversation.subject', 'Playback problem')
                ->where('conversation.messages.0.body', 'Video stalls after one minute.'),
            );

        $this->actingAs($user)
            ->post(route('support.messages.store', $conversation), [
                'body' => 'It also happens in another browser.',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('support_messages', [
            'support_conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'body' => 'It also happens in another browser.',
        ]);
    }

    public function test_user_cannot_access_another_users_conversation(): void
    {
        $user = User::factory()->create();
        $conversation = SupportConversation::factory()->create();

        $this->actingAs($user)
            ->get(route('support.show', $conversation))
            ->assertForbidden();

        $this->actingAs($user)
            ->post(route('support.messages.store', $conversation), [
                'body' => 'Trying to reply.',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_view_reply_and_close_conversation(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create(['email' => 'viewer@example.com']);
        $conversation = SupportConversation::factory()->for($user)->create([
            'subject' => 'Bug report',
        ]);
        SupportMessage::factory()->for($conversation, 'conversation')->for($user)->create([
            'body' => 'The chat panel overlaps the video.',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.support.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/support/index')
                ->where('conversations.0.user.email', 'viewer@example.com'),
            );

        $this->actingAs($admin)
            ->get(route('admin.support.show', $conversation))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/support/show')
                ->where('conversation.messages.0.body', 'The chat panel overlaps the video.'),
            );

        $this->actingAs($admin)
            ->post(route('admin.support.messages.store', $conversation), [
                'body' => 'Thanks, we are reviewing it.',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)
            ->patch(route('admin.support.update', $conversation), [
                'status' => SupportConversation::STATUS_CLOSED,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('support_messages', [
            'support_conversation_id' => $conversation->id,
            'user_id' => $admin->id,
            'body' => 'Thanks, we are reviewing it.',
        ]);
        $this->assertSame(SupportConversation::STATUS_CLOSED, $conversation->refresh()->status);
    }

    public function test_non_admin_cannot_access_admin_support_inbox(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('admin.support.index'))
            ->assertForbidden();
    }

    public function test_private_attachment_download_requires_conversation_access(): void
    {
        Storage::fake('local');

        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $admin = User::factory()->create(['is_admin' => true]);
        $conversation = SupportConversation::factory()->for($owner)->create();
        $message = SupportMessage::factory()->for($conversation, 'conversation')->for($owner)->create();
        $attachment = SupportAttachment::factory()->for($message, 'message')->create([
            'path' => 'support/testing/debug.log',
            'original_name' => 'debug.log',
        ]);

        Storage::disk('local')->put($attachment->path, 'log contents');

        $this->actingAs($owner)
            ->get(route('support.attachments.show', $attachment))
            ->assertOk()
            ->assertDownload('debug.log');

        $this->actingAs($otherUser)
            ->get(route('support.attachments.show', $attachment))
            ->assertForbidden();

        $this->actingAs($admin)
            ->get(route('support.attachments.show', $attachment))
            ->assertOk()
            ->assertDownload('debug.log');
    }
}
