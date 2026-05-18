<?php

use App\Http\Controllers\AdminChannelCreationController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminModerationController;
use App\Http\Controllers\AdminSupportConversationController;
use App\Http\Controllers\ChannelController;
use App\Http\Controllers\ChatMessageController;
use App\Http\Controllers\CreatorDashboardController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\MediaMtxController;
use App\Http\Controllers\SupportAttachmentController;
use App\Http\Controllers\SupportConversationController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::post('language', LanguageController::class)->name('language.update');
Route::get('channels/{channel:slug}', [ChannelController::class, 'show'])->name('channels.show');

Route::prefix('internal/mediamtx')->name('internal.mediamtx.')->group(function () {
    Route::post('auth', [MediaMtxController::class, 'auth'])->name('auth');
    Route::post('ready', [MediaMtxController::class, 'ready'])->name('ready');
    Route::post('not-ready', [MediaMtxController::class, 'notReady'])->name('not-ready');
    Route::post('recording-complete', [MediaMtxController::class, 'recordingComplete'])->name('recording-complete');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [CreatorDashboardController::class, 'show'])->name('dashboard');
    Route::post('creator/channel', [CreatorDashboardController::class, 'storeChannel'])->name('creator.channel.store');
    Route::patch('creator/channel', [CreatorDashboardController::class, 'updateChannel'])->name('creator.channel.update');
    Route::post('creator/stream-key/rotate', [CreatorDashboardController::class, 'rotateStreamKey'])->name('creator.stream-key.rotate');
    Route::post('creator/broadcasts', [CreatorDashboardController::class, 'storeBroadcast'])->name('creator.broadcasts.store');
    Route::post('creator/broadcasts/{broadcast}/stop', [CreatorDashboardController::class, 'stopBroadcast'])->name('creator.broadcasts.stop');

    Route::post('channels/{channel:slug}/follow', [FollowController::class, 'store'])->name('channels.follow');
    Route::delete('channels/{channel:slug}/follow', [FollowController::class, 'destroy'])->name('channels.unfollow');
    Route::post('channels/{channel:slug}/chat', [ChatMessageController::class, 'store'])
        ->middleware('throttle:30,1')
        ->name('channels.chat.store');

    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', AdminDashboardController::class)->name('dashboard');
        Route::get('support', [AdminSupportConversationController::class, 'index'])->name('support.index');
        Route::get('support/{conversation}', [AdminSupportConversationController::class, 'show'])->name('support.show');
        Route::post('support/{conversation}/messages', [AdminSupportConversationController::class, 'reply'])
            ->middleware('throttle:20,1')
            ->name('support.messages.store');
        Route::patch('support/{conversation}', [AdminSupportConversationController::class, 'update'])->name('support.update');
        Route::patch('channel-creation', [AdminChannelCreationController::class, 'updateDefault'])->name('channel-creation.update');
        Route::post('channels/{channel:slug}/suspend', [AdminModerationController::class, 'suspendChannel'])->name('channels.suspend');
        Route::post('channels/{channel:slug}/restore', [AdminModerationController::class, 'restoreChannel'])->name('channels.restore');
        Route::patch('users/{user}/creator-access', [AdminChannelCreationController::class, 'updateUser'])->name('users.creator-access.update');
        Route::post('users/{user}/suspend', [AdminModerationController::class, 'suspendUser'])->name('users.suspend');
        Route::post('broadcasts/{broadcast}/stop', [AdminModerationController::class, 'stopBroadcast'])->name('broadcasts.stop');
        Route::delete('vods/{vod}', [AdminModerationController::class, 'deleteVod'])->name('vods.destroy');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('contact', [SupportConversationController::class, 'index'])->name('support.index');
    Route::post('contact', [SupportConversationController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('support.store');
    Route::get('contact/attachments/{attachment}', SupportAttachmentController::class)->name('support.attachments.show');
    Route::get('contact/{conversation}', [SupportConversationController::class, 'show'])->name('support.show');
    Route::post('contact/{conversation}/messages', [SupportConversationController::class, 'reply'])
        ->middleware('throttle:20,1')
        ->name('support.messages.store');
});

require __DIR__.'/settings.php';
