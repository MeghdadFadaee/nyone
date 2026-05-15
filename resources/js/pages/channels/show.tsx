import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Heart,
    LogIn,
    MessageSquare,
    Radio,
    Send,
    Users,
    Video,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoPlayer } from '@/components/video-player';
import type {
    BroadcastSummary,
    ChannelDetail,
    ChatMessage,
    VodSummary,
} from '@/types';

type Props = {
    channel: ChannelDetail;
    currentBroadcast: BroadcastSummary | null;
    vods: VodSummary[];
    chatMessages: ChatMessage[];
    isFollowing: boolean;
};

export default function ChannelShow({
    channel,
    currentBroadcast,
    vods,
    chatMessages,
    isFollowing,
}: Props) {
    const { auth } = usePage().props;
    const chatForm = useForm({ body: '' });

    function submitChat(event: FormEvent) {
        event.preventDefault();
        chatForm.post(`/channels/${channel.slug}/chat`, {
            preserveScroll: true,
            onSuccess: () => chatForm.reset('body'),
        });
    }

    return (
        <>
            <Head title={channel.display_name} />
            <div className="grid min-h-[calc(100vh-4rem)] gap-0 xl:grid-cols-[1fr_360px]">
                <main className="min-w-0">
                    <div className="bg-black">
                        <VideoPlayer
                            src={currentBroadcast?.hls_url ?? null}
                            title={
                                currentBroadcast?.title ?? channel.display_name
                            }
                        />
                    </div>

                    <section className="grid gap-6 p-4 md:p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    {channel.is_live ? (
                                        <span className="inline-flex items-center gap-2 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white">
                                            <Radio className="size-3" />
                                            LIVE
                                        </span>
                                    ) : (
                                        <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                                            Offline
                                        </span>
                                    )}
                                    {channel.category && (
                                        <span className="rounded-md border px-2 py-1 text-xs">
                                            {channel.category.name}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl font-semibold">
                                    {currentBroadcast?.title ??
                                        channel.display_name}
                                </h1>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span>{channel.display_name}</span>
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="size-4" />
                                        {channel.viewer_count} viewers
                                    </span>
                                    <span>
                                        {channel.followers_count} followers
                                    </span>
                                </div>
                                {channel.description && (
                                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                                        {channel.description}
                                    </p>
                                )}
                            </div>

                            {auth.user ? (
                                <Button
                                    variant={
                                        isFollowing ? 'outline' : 'default'
                                    }
                                    onClick={() =>
                                        isFollowing
                                            ? router.delete(
                                                  `/channels/${channel.slug}/follow`,
                                                  {
                                                      preserveScroll: true,
                                                  },
                                              )
                                            : router.post(
                                                  `/channels/${channel.slug}/follow`,
                                                  undefined,
                                                  {
                                                      preserveScroll: true,
                                                  },
                                              )
                                    }
                                >
                                    <Heart className="size-4" />
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Button>
                            ) : (
                                <Button asChild variant="outline">
                                    <Link href="/login">
                                        <LogIn className="size-4" />
                                        Log in to follow
                                    </Link>
                                </Button>
                            )}
                        </div>

                        <section className="grid gap-3">
                            <div className="flex items-center gap-2">
                                <Video className="size-5" />
                                <h2 className="font-semibold">Recent VODs</h2>
                            </div>
                            {vods.length > 0 ? (
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {vods.map((vod) => (
                                        <div
                                            key={vod.id}
                                            className="rounded-md border p-4"
                                        >
                                            <div className="font-medium">
                                                {vod.title}
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">
                                                Expires{' '}
                                                {vod.expires_at
                                                    ? new Date(
                                                          vod.expires_at,
                                                      ).toLocaleDateString()
                                                    : 'later'}
                                            </div>
                                            {vod.playback_url ? (
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-3"
                                                >
                                                    <a href={vod.playback_url}>
                                                        Watch VOD
                                                    </a>
                                                </Button>
                                            ) : (
                                                <div className="mt-3 text-sm text-muted-foreground">
                                                    Processing recording
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                                    No public recordings yet.
                                </div>
                            )}
                        </section>
                    </section>
                </main>

                <aside className="flex min-h-[480px] flex-col border-l bg-card">
                    <div className="flex h-14 items-center gap-2 border-b px-4">
                        <MessageSquare className="size-5" />
                        <h2 className="font-semibold">Live chat</h2>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                        {chatMessages.map((message) => (
                            <div key={message.id} className="text-sm">
                                <span className="font-medium">
                                    {message.user.name}
                                </span>
                                <span className="ml-2 text-muted-foreground">
                                    {message.body}
                                </span>
                            </div>
                        ))}
                        {chatMessages.length === 0 && (
                            <div className="text-sm text-muted-foreground">
                                {channel.is_live
                                    ? 'No messages yet.'
                                    : 'Chat appears when the channel is live.'}
                            </div>
                        )}
                    </div>
                    <div className="border-t p-4">
                        {auth.user ? (
                            <form onSubmit={submitChat} className="flex gap-2">
                                <Input
                                    value={chatForm.data.body}
                                    onChange={(event) =>
                                        chatForm.setData(
                                            'body',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={
                                        channel.is_live
                                            ? 'Send a message'
                                            : 'Channel is offline'
                                    }
                                    disabled={!channel.is_live}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={
                                        !channel.is_live || chatForm.processing
                                    }
                                >
                                    <Send className="size-4" />
                                </Button>
                            </form>
                        ) : (
                            <Button
                                asChild
                                variant="outline"
                                className="w-full"
                            >
                                <Link href="/login">Log in to chat</Link>
                            </Button>
                        )}
                    </div>
                </aside>
            </div>
        </>
    );
}

ChannelShow.layout = {
    breadcrumbs: [
        {
            title: 'Channel',
            href: '/',
        },
    ],
};
