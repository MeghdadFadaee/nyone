<?php

namespace App\Services\Streaming;

use App\Models\Broadcast;
use App\Models\Channel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Illuminate\Support\Uri;

class PlaybackViewerSigner
{
    private const VIEWER_KEY = 'viewer';

    private const EXPIRES_KEY = 'viewer_expires';

    private const SIGNATURE_KEY = 'viewer_signature';

    public function signedPlaybackUrl(string $hlsUrl, Channel $channel, Broadcast $broadcast, Request $request): string
    {
        return (string) Uri::of($hlsUrl)->withQuery(
            $this->queryParametersForViewerKey(
                $this->viewerKeyForRequest($request),
                $channel,
                $broadcast,
            ),
        );
    }

    /**
     * @return array{viewer: string, viewer_expires: int, viewer_signature: string}
     */
    public function queryParametersForViewerKey(
        string $viewerKey,
        Channel $channel,
        Broadcast $broadcast,
        ?int $expires = null,
    ): array {
        $expires ??= now()->addSeconds($this->signatureTtl())->getTimestamp();

        return [
            self::VIEWER_KEY => $viewerKey,
            self::EXPIRES_KEY => $expires,
            self::SIGNATURE_KEY => $this->signature($viewerKey, $channel->slug, $broadcast->id, $expires),
        ];
    }

    public function viewerKeyFromQuery(string $query, Channel $channel, ?Broadcast $broadcast): ?string
    {
        if (! $broadcast) {
            return null;
        }

        parse_str(ltrim($query, '?'), $parameters);

        $viewerKey = (string) ($parameters[self::VIEWER_KEY] ?? '');
        $expires = (int) ($parameters[self::EXPIRES_KEY] ?? 0);
        $signature = (string) ($parameters[self::SIGNATURE_KEY] ?? '');

        if (! $this->isValidViewerKey($viewerKey) || $expires < now()->getTimestamp() || $signature === '') {
            return null;
        }

        $expected = $this->signature($viewerKey, $channel->slug, $broadcast->id, $expires);

        return hash_equals($expected, $signature) ? $viewerKey : null;
    }

    private function viewerKeyForRequest(Request $request): string
    {
        if ($request->user()) {
            return 'u:'.$this->hashIdentity((string) $request->user()->id);
        }

        return 'g:'.$this->hashIdentity($this->guestVisitorId($request));
    }

    private function guestVisitorId(Request $request): string
    {
        $cookieName = $this->cookieName();
        $visitorId = (string) $request->cookie($cookieName, '');

        if (! Str::isUuid($visitorId)) {
            $visitorId = (string) Str::uuid();

            Cookie::queue(Cookie::make(
                $cookieName,
                $visitorId,
                $this->cookieLifetimeMinutes(),
                (string) config('session.path', '/'),
                config('session.domain'),
                config('session.secure'),
                true,
                false,
                config('session.same_site', 'lax'),
            ));
        }

        return $visitorId;
    }

    private function signature(string $viewerKey, string $channelSlug, int $broadcastId, int $expires): string
    {
        return hash_hmac(
            'sha256',
            "{$channelSlug}|{$broadcastId}|{$viewerKey}|{$expires}",
            $this->secret(),
        );
    }

    private function hashIdentity(string $identity): string
    {
        return hash_hmac('sha256', $identity, $this->secret());
    }

    private function isValidViewerKey(string $viewerKey): bool
    {
        return preg_match('/^[ug]:[a-f0-9]{64}$/', $viewerKey) === 1;
    }

    private function secret(): string
    {
        $key = (string) config('app.key');

        if (str_starts_with($key, 'base64:')) {
            return base64_decode(substr($key, 7), true) ?: $key;
        }

        return $key;
    }

    private function cookieName(): string
    {
        return (string) config('streaming.viewer_identity_cookie', 'nyone_visitor_id');
    }

    private function cookieLifetimeMinutes(): int
    {
        return max(1, (int) config('streaming.viewer_identity_cookie_lifetime_days', 365)) * 24 * 60;
    }

    private function signatureTtl(): int
    {
        return max(60, (int) config('streaming.viewer_identity_ttl', 86400));
    }
}
