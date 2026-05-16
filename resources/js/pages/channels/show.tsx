import {
    Head,
    Link,
    router,
    useForm,
    usePage,
    usePoll,
} from '@inertiajs/react';
import {
    Crown,
    Heart,
    LogIn,
    MessageSquare,
    Radio,
    Send,
    SmilePlus,
    Users,
    Video,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    Avatar as ChatAvatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { VideoPlayer } from '@/components/video-player';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { home, login } from '@/routes';
import { follow, unfollow } from '@/routes/channels';
import { store as storeChat } from '@/routes/channels/chat';
import type {
    BroadcastSummary,
    ChannelDetail,
    ChatMessage,
    ViewerStats,
    VodSummary,
} from '@/types';

type Props = {
    channel: ChannelDetail;
    currentBroadcast: BroadcastSummary | null;
    viewerStats: ViewerStats;
    vods: VodSummary[];
    chatMessages: ChatMessage[];
    isFollowing: boolean;
};

const chatEmojis = [
    '😀',
    '😂',
    '😍',
    '😎',
    '🔥',
    '👏',
    '🙌',
    '❤️',
    '💯',
    '🎉',
    '👍',
    '👀',
    '🤯',
    '😭',
    '🙏',
    '✨',
];

export default function ChannelShow({
    channel,
    currentBroadcast,
    viewerStats,
    vods,
    chatMessages,
    isFollowing,
}: Props) {
    const { auth } = usePage().props;
    const [chatOpen, setChatOpen] = useState(false);
    const chatForm = useForm({ body: '' });
    const currentViewers = viewerStats.current;
    const viewerStatsRefreshInterval = viewerStats.refresh_interval_ms ?? 30000;

    usePoll(
        viewerStatsRefreshInterval,
        {
            only: ['viewerStats'],
        },
        {
            autoStart: channel.is_live && Boolean(currentBroadcast),
        },
    );

    function submitChat(event: FormEvent) {
        event.preventDefault();
        chatForm.submit(storeChat(channel.slug), {
            preserveScroll: true,
            onSuccess: () => chatForm.reset('body'),
        });
    }

    function toggleFollow() {
        if (isFollowing) {
            router.delete(unfollow(channel.slug), {
                preserveScroll: true,
            });

            return;
        }

        router.post(follow(channel.slug), undefined, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title={channel.display_name} />
            <div className="theatre-surface grid min-h-[calc(100vh-4rem)] gap-0 xl:grid-cols-[minmax(0,1fr)_380px]">
                <main className="min-w-0">
                    <section className="border-b bg-zinc-950 text-white">
                        <div className="mx-auto w-full max-w-[1600px]">
                            {currentBroadcast?.hls_url ? (
                                <VideoPlayer
                                    src={currentBroadcast.hls_url}
                                    title={currentBroadcast.title}
                                />
                            ) : (
                                <OfflinePlayer channel={channel} />
                            )}
                        </div>
                    </section>

                    <section className="grid gap-6 p-4 md:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 gap-4">
                                <Avatar channel={channel} />
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <LiveState channel={channel} />
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
                                            {currentViewers} viewers
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
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Sheet
                                    open={chatOpen}
                                    onOpenChange={setChatOpen}
                                >
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="xl:hidden"
                                        >
                                            <MessageSquare className="size-4" />
                                            Chat
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent
                                        side="bottom"
                                        className="h-[82svh] rounded-t-md"
                                    >
                                        <SheetHeader>
                                            <SheetTitle>Live chat</SheetTitle>
                                        </SheetHeader>
                                        <ChatPanel
                                            channel={channel}
                                            authUser={Boolean(auth.user)}
                                            currentUserId={
                                                auth.user?.id ?? null
                                            }
                                            messages={chatMessages}
                                            form={chatForm}
                                            onSubmit={submitChat}
                                            compact
                                        />
                                    </SheetContent>
                                </Sheet>

                                {auth.user ? (
                                    <Button
                                        variant={
                                            isFollowing ? 'outline' : 'default'
                                        }
                                        onClick={toggleFollow}
                                    >
                                        <Heart
                                            className={cn(
                                                'size-4',
                                                isFollowing &&
                                                    'fill-current text-primary',
                                            )}
                                        />
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </Button>
                                ) : (
                                    <Button asChild variant="outline">
                                        <Link href={login()}>
                                            <LogIn className="size-4" />
                                            Log in to follow
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <section className="grid gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Video className="size-5 text-primary" />
                                    <h2 className="font-semibold">
                                        Recent VODs
                                    </h2>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {vods.length} available
                                </span>
                            </div>
                            {vods.length > 0 ? (
                                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                                    {vods.map((vod) => (
                                        <VodCard key={vod.id} vod={vod} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-md border border-dashed bg-card p-6 text-sm text-muted-foreground">
                                    No public recordings yet.
                                </div>
                            )}
                        </section>
                    </section>
                </main>

                <aside className="hidden min-h-[480px] border-l bg-card xl:flex">
                    <ChatPanel
                        channel={channel}
                        authUser={Boolean(auth.user)}
                        currentUserId={auth.user?.id ?? null}
                        messages={chatMessages}
                        form={chatForm}
                        onSubmit={submitChat}
                    />
                </aside>
            </div>
        </>
    );
}

ChannelShow.layout = {
    breadcrumbs: [
        {
            title: 'Channel',
            href: home(),
        },
    ],
};

function OfflinePlayer({ channel }: { channel: ChannelDetail }) {
    return (
        <div className="relative grid aspect-video min-h-[280px] place-items-center overflow-hidden">
            {channel.banner_url ? (
                <img
                    src={channel.banner_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-40"
                />
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,oklch(0.28_0.1_326),oklch(0.1_0.04_315)_60%)]" />
            <div className="relative grid justify-items-center gap-3 px-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-md border border-white/20 bg-white/10">
                    <Radio className="size-6" />
                </span>
                <div>
                    <div className="text-xl font-semibold">
                        {channel.display_name} is offline
                    </div>
                    <p className="mt-1 text-sm text-white/70">
                        Recent recordings remain available below when the
                        creator publishes VODs.
                    </p>
                </div>
            </div>
        </div>
    );
}

function ChatPanel({
    channel,
    authUser,
    currentUserId,
    messages,
    form,
    onSubmit,
    compact = false,
}: {
    channel: ChannelDetail;
    authUser: boolean;
    currentUserId: number | null;
    messages: ChatMessage[];
    form: ReturnType<typeof useForm<{ body: string }>>;
    onSubmit: (event: FormEvent) => void;
    compact?: boolean;
}) {
    const getInitials = useInitials();
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const messageLength = form.data.body.length;
    const canSend =
        channel.is_live && form.data.body.trim().length > 0 && !form.processing;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }, [messages.length]);

    function submitChatForm(event: FormEvent) {
        setEmojiPickerOpen(false);
        onSubmit(event);
    }

    function insertEmoji(emoji: string) {
        const input = inputRef.current;
        const cursorStart = input?.selectionStart ?? form.data.body.length;
        const cursorEnd = input?.selectionEnd ?? form.data.body.length;
        const nextBody = (
            form.data.body.slice(0, cursorStart) +
            emoji +
            form.data.body.slice(cursorEnd)
        ).slice(0, 500);
        const nextCursor = Math.min(
            cursorStart + emoji.length,
            nextBody.length,
        );

        form.setData('body', nextBody);

        window.requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(nextCursor, nextCursor);
        });
    }

    return (
        <div className="flex min-h-0 w-full flex-col">
            <div
                className={cn(
                    'flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4',
                    compact && 'hidden',
                )}
            >
                <div className="flex items-center gap-2">
                    <MessageSquare className="size-5 text-primary" />
                    <div>
                        <h2 className="font-semibold">Live chat</h2>
                        <p className="text-xs text-muted-foreground">
                            {formatMessageCount(messages.length)}
                        </p>
                    </div>
                </div>
                <LiveState channel={channel} compact />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="grid gap-3">
                    {messages.map((message) => {
                        const isOwnMessage = currentUserId === message.user.id;
                        const isChannelOwner =
                            channel.owner.id === message.user.id;

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    'flex min-w-0 gap-2 rounded-md border border-transparent p-2 text-sm',
                                    isOwnMessage &&
                                        !isChannelOwner &&
                                        'bg-primary/5',
                                    isChannelOwner &&
                                        'border-primary/30 bg-primary/10',
                                )}
                            >
                                <ChatAvatar
                                    className={cn(
                                        'mt-0.5 size-8 rounded-md',
                                        isChannelOwner &&
                                            'ring-2 ring-primary/40',
                                    )}
                                >
                                    <AvatarImage
                                        src={
                                            message.user.avatar_url ?? undefined
                                        }
                                        alt={message.user.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-md bg-secondary text-[11px] font-semibold text-secondary-foreground">
                                        {getInitials(message.user.name)}
                                    </AvatarFallback>
                                </ChatAvatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex min-w-0 items-baseline gap-2">
                                        <span
                                            className={cn(
                                                'truncate font-medium',
                                                isChannelOwner &&
                                                    'text-primary',
                                            )}
                                        >
                                            {isOwnMessage
                                                ? 'You'
                                                : message.user.name}
                                        </span>
                                        {isChannelOwner && (
                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                                <Crown className="size-3" />
                                                Owner
                                            </span>
                                        )}
                                        {message.created_at && (
                                            <time
                                                dateTime={message.created_at}
                                                title={formatChatDateTime(
                                                    message.created_at,
                                                )}
                                                className={cn(
                                                    'ml-auto shrink-0 text-[11px] text-muted-foreground',
                                                    isChannelOwner &&
                                                        'text-primary/80',
                                                )}
                                            >
                                                {formatChatTime(
                                                    message.created_at,
                                                )}
                                            </time>
                                        )}
                                    </div>
                                    <div
                                        className={cn(
                                            'leading-5 break-words whitespace-pre-wrap',
                                            isChannelOwner
                                                ? 'text-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {message.body}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {messages.length === 0 && (
                        <div className="grid justify-items-center gap-2 rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
                            <MessageSquare className="size-5 text-primary" />
                            <span>
                                {channel.is_live
                                    ? 'No messages yet.'
                                    : 'Chat appears when the channel is live.'}
                            </span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="shrink-0 border-t p-4">
                {authUser ? (
                    <form onSubmit={submitChatForm} className="grid gap-2">
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={form.data.body}
                                onChange={(event) =>
                                    form.setData('body', event.target.value)
                                }
                                placeholder={
                                    channel.is_live
                                        ? 'Send a message'
                                        : 'Channel is offline'
                                }
                                disabled={!channel.is_live || form.processing}
                                maxLength={500}
                            />
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    disabled={
                                        !channel.is_live || form.processing
                                    }
                                    aria-label="Open emoji picker"
                                    aria-expanded={emojiPickerOpen}
                                    onClick={() =>
                                        setEmojiPickerOpen((open) => !open)
                                    }
                                >
                                    <SmilePlus className="size-4" />
                                </Button>
                                {emojiPickerOpen && channel.is_live && (
                                    <div className="absolute right-0 bottom-full z-10 mb-2 grid w-52 grid-cols-4 gap-1 rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
                                        {chatEmojis.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                aria-label={`Insert ${emoji}`}
                                                className="flex size-10 items-center justify-center rounded-md text-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                                onClick={() =>
                                                    insertEmoji(emoji)
                                                }
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!canSend}
                                aria-label="Send message"
                            >
                                <Send className="size-4" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span
                                className={cn(
                                    'min-h-4',
                                    form.errors.body && 'text-destructive',
                                )}
                            >
                                {form.errors.body ??
                                    (!channel.is_live
                                        ? 'Channel is offline'
                                        : '')}
                            </span>
                            <span
                                className={cn(
                                    'shrink-0 tabular-nums',
                                    messageLength > 450 && 'text-primary',
                                )}
                            >
                                {messageLength}/500
                            </span>
                        </div>
                    </form>
                ) : (
                    <Button asChild variant="outline" className="w-full">
                        <Link href={login()}>Log in to chat</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

function formatMessageCount(count: number): string {
    return count === 1 ? '1 message' : `${count} messages`;
}

function formatChatTime(value: string): string {
    return new Date(value).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatChatDateTime(value: string): string {
    return new Date(value).toLocaleString();
}

function VodCard({ vod }: { vod: VodSummary }) {
    return (
        <div className="overflow-hidden rounded-md border bg-card">
            <div className="grid aspect-video place-items-center bg-zinc-950 text-white">
                <Video className="size-6 opacity-70" />
            </div>
            <div className="grid gap-3 p-4">
                <div>
                    <div className="line-clamp-2 font-medium">{vod.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                        Expires{' '}
                        {vod.expires_at
                            ? new Date(vod.expires_at).toLocaleDateString()
                            : 'later'}
                    </div>
                </div>
                {vod.playback_url ? (
                    <Button asChild variant="outline" size="sm">
                        <a href={vod.playback_url}>Watch VOD</a>
                    </Button>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        Processing recording
                    </div>
                )}
            </div>
        </div>
    );
}

function LiveState({
    channel,
    compact = false,
}: {
    channel: ChannelDetail;
    compact?: boolean;
}) {
    if (channel.is_live) {
        return (
            <span
                className={cn(
                    'bg-live inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold text-white',
                    compact && 'gap-1.5 px-1.5',
                )}
            >
                <span className="live-pulse size-1.5 rounded-full bg-white" />
                LIVE
            </span>
        );
    }

    return (
        <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
            Offline
        </span>
    );
}

function Avatar({ channel }: { channel: ChannelDetail }) {
    return (
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary text-secondary-foreground">
            {channel.avatar_url ? (
                <img
                    src={channel.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                />
            ) : (
                <Radio className="size-5" />
            )}
        </div>
    );
}
