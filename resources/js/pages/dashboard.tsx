import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Check,
    Copy,
    Eye,
    ImagePlus,
    Radio,
    RotateCw,
    Save,
    ShieldAlert,
    StopCircle,
    Video,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import { dashboard as dashboardRoute } from '@/routes';
import { show as showChannel } from '@/routes/channels';
import {
    stop as stopBroadcastRoute,
    store as storeBroadcastRoute,
} from '@/routes/creator/broadcasts';
import {
    store as storeChannelRoute,
    update as updateChannelRoute,
} from '@/routes/creator/channel';
import { rotate as rotateStreamKeyRoute } from '@/routes/creator/stream-key';
import type { BroadcastSummary, Category } from '@/types';

type CreatorChannel = {
    id: number;
    slug: string;
    display_name: string;
    description: string | null;
    avatar_url: string | null;
    banner_url: string | null;
    thumbnail_url: string | null;
    is_live: boolean;
    viewer_count: number;
    stream_key_last_used_at: string | null;
    category_id: number | null;
    live_broadcast: BroadcastSummary | null;
};

type Props = {
    channel: CreatorChannel | null;
    plainStreamKey: string | null;
    streaming: {
        ingestServer: string;
        tokenizedPath: string | null;
    };
    categories: Category[];
    recentBroadcasts: BroadcastSummary[];
};

export default function Dashboard({
    channel,
    plainStreamKey,
    streaming,
    categories,
    recentBroadcasts,
}: Props) {
    const [copiedText, copy] = useClipboard();
    const [stopTarget, setStopTarget] = useState<BroadcastSummary | null>(null);
    const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<
        string | null
    >(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const liveBroadcast = channel?.live_broadcast ?? null;
    const pendingBroadcast =
        recentBroadcasts.find((broadcast) => broadcast.status === 'pending') ??
        null;
    const createForm = useForm({
        display_name: '',
        slug: '',
        description: '',
        category_id: '',
    });
    const channelForm = useForm({
        _method: 'PATCH',
        display_name: channel?.display_name ?? '',
        slug: channel?.slug ?? '',
        description: channel?.description ?? '',
        category_id: channel?.category_id ? String(channel.category_id) : '',
        thumbnail: null as File | null,
    });
    const broadcastForm = useForm({
        title: '',
        recording_enabled: false,
    });

    useEffect(() => {
        return () => {
            if (thumbnailPreviewUrl) {
                URL.revokeObjectURL(thumbnailPreviewUrl);
            }
        };
    }, [thumbnailPreviewUrl]);

    function createChannel(event: FormEvent) {
        event.preventDefault();
        createForm.submit(storeChannelRoute());
    }

    function updateChannel(event: FormEvent) {
        event.preventDefault();
        channelForm.post(updateChannelRoute.url(), {
            forceFormData: true,
            onSuccess: () => {
                channelForm.reset('thumbnail');
                setThumbnailPreviewUrl(null);

                if (thumbnailInputRef.current) {
                    thumbnailInputRef.current.value = '';
                }
            },
        });
    }

    function updateThumbnail(file: File | null) {
        channelForm.setData('thumbnail', file);
        setThumbnailPreviewUrl(file ? URL.createObjectURL(file) : null);
    }

    function createBroadcast(event: FormEvent) {
        event.preventDefault();
        broadcastForm.submit(storeBroadcastRoute(), {
            onSuccess: () => broadcastForm.reset('title', 'recording_enabled'),
        });
    }

    function stopBroadcast() {
        if (!stopTarget) {
            return;
        }

        router.post(stopBroadcastRoute(stopTarget.id), undefined, {
            onFinish: () => setStopTarget(null),
        });
    }

    return (
        <>
            <Head title="Creator Studio" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-md border bg-card p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <ChannelAvatar channel={channel} />
                        <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <StatusPill
                                    live={channel?.is_live ?? false}
                                    viewers={channel?.viewer_count ?? 0}
                                />
                                {pendingBroadcast && !liveBroadcast && (
                                    <span className="border-warning/40 bg-warning/10 text-warning rounded-md border px-2 py-1 text-xs font-medium">
                                        READY
                                    </span>
                                )}
                            </div>
                            <h1 className="truncate text-2xl font-semibold">
                                {channel?.display_name ?? 'Creator Studio'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Prepare broadcasts, secure your stream key, and
                                monitor the current session.
                            </p>
                        </div>
                    </div>
                    {channel && (
                        <Button asChild variant="outline">
                            <Link href={showChannel(channel.slug)}>
                                <Eye className="size-4" />
                                View channel
                            </Link>
                        </Button>
                    )}
                </div>

                {!channel ? (
                    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <Panel
                            title="Create your channel"
                            description="Each account can own one public channel in this version."
                        >
                            <form
                                onSubmit={createChannel}
                                className="grid gap-4"
                            >
                                <Field
                                    label="Display name"
                                    error={createForm.errors.display_name}
                                >
                                    <Input
                                        value={createForm.data.display_name}
                                        onChange={(event) =>
                                            createForm.setData(
                                                'display_name',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Nyone Live"
                                    />
                                </Field>
                                <Field
                                    label="Slug"
                                    error={createForm.errors.slug}
                                >
                                    <Input
                                        value={createForm.data.slug}
                                        onChange={(event) =>
                                            createForm.setData(
                                                'slug',
                                                event.target.value.toLowerCase(),
                                            )
                                        }
                                        placeholder="nyone-live"
                                    />
                                </Field>
                                <Field label="Category">
                                    <CategorySelect
                                        categories={categories}
                                        value={createForm.data.category_id}
                                        onChange={(value) =>
                                            createForm.setData(
                                                'category_id',
                                                value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Description"
                                    error={createForm.errors.description}
                                >
                                    <textarea
                                        value={createForm.data.description}
                                        onChange={(event) =>
                                            createForm.setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                        className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                </Field>
                                <Button
                                    type="submit"
                                    disabled={createForm.processing}
                                >
                                    <Save className="size-4" />
                                    Create channel
                                </Button>
                            </form>
                        </Panel>
                        <Panel title="OBS readiness">
                            <ReadinessRow done label="Channel metadata" />
                            <ReadinessRow label="Private stream key" />
                            <ReadinessRow label="Prepared broadcast" />
                            <ReadinessRow label="Live ingest signal" />
                        </Panel>
                    </section>
                ) : (
                    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                        <div className="grid min-w-0 gap-6">
                            <section className="grid gap-4 md:grid-cols-3">
                                <MetricCard
                                    label="Broadcast state"
                                    value={
                                        channel.is_live
                                            ? 'Live'
                                            : pendingBroadcast
                                              ? 'Ready'
                                              : 'Offline'
                                    }
                                />
                                <MetricCard
                                    label="Current viewers"
                                    value={String(channel.viewer_count)}
                                />
                                <MetricCard
                                    label="Stream key used"
                                    value={
                                        channel.stream_key_last_used_at
                                            ? new Date(
                                                  channel.stream_key_last_used_at,
                                              ).toLocaleDateString()
                                            : 'Never'
                                    }
                                />
                            </section>

                            <Panel
                                title="Broadcast prep"
                                description="Create a pending session before starting OBS."
                            >
                                <form
                                    onSubmit={createBroadcast}
                                    className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_auto]"
                                >
                                    <Field
                                        label="Stream title"
                                        error={broadcastForm.errors.title}
                                    >
                                        <Input
                                            value={broadcastForm.data.title}
                                            onChange={(event) =>
                                                broadcastForm.setData(
                                                    'title',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Building Nyone live"
                                            disabled={
                                                Boolean(liveBroadcast) ||
                                                Boolean(pendingBroadcast)
                                            }
                                        />
                                    </Field>
                                    <label className="mt-6 flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={
                                                broadcastForm.data
                                                    .recording_enabled
                                            }
                                            onChange={(event) =>
                                                broadcastForm.setData(
                                                    'recording_enabled',
                                                    event.target.checked,
                                                )
                                            }
                                            disabled={
                                                Boolean(liveBroadcast) ||
                                                Boolean(pendingBroadcast)
                                            }
                                        />
                                        Record VOD
                                    </label>
                                    <Button
                                        type="submit"
                                        disabled={
                                            broadcastForm.processing ||
                                            Boolean(liveBroadcast) ||
                                            Boolean(pendingBroadcast)
                                        }
                                        className="mt-6"
                                    >
                                        <Video className="size-4" />
                                        Prepare
                                    </Button>
                                </form>
                                {(liveBroadcast ?? pendingBroadcast) && (
                                    <div className="border-warning/40 bg-warning/10 text-warning mt-4 rounded-md border p-3 text-sm">
                                        Finish the current broadcast before
                                        preparing another session.
                                    </div>
                                )}
                            </Panel>

                            <Panel
                                title="Channel setup"
                                description="Public metadata used in the directory and watch page."
                            >
                                <form
                                    onSubmit={updateChannel}
                                    className="grid gap-4 md:grid-cols-2"
                                >
                                    <Field
                                        label="Display name"
                                        error={channelForm.errors.display_name}
                                    >
                                        <Input
                                            value={
                                                channelForm.data.display_name
                                            }
                                            onChange={(event) =>
                                                channelForm.setData(
                                                    'display_name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Slug"
                                        error={channelForm.errors.slug}
                                    >
                                        <Input
                                            value={channelForm.data.slug}
                                            onChange={(event) =>
                                                channelForm.setData(
                                                    'slug',
                                                    event.target.value.toLowerCase(),
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Category">
                                        <CategorySelect
                                            categories={categories}
                                            value={channelForm.data.category_id}
                                            onChange={(value) =>
                                                channelForm.setData(
                                                    'category_id',
                                                    value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Live thumbnail"
                                        error={channelForm.errors.thumbnail}
                                        className="md:col-span-2"
                                    >
                                        <div className="flex flex-col gap-3 rounded-md border bg-background p-3 sm:flex-row sm:items-center">
                                            <div className="aspect-video w-full overflow-hidden rounded-md bg-muted sm:w-40 sm:shrink-0">
                                                {thumbnailPreviewUrl ||
                                                channel.thumbnail_url ? (
                                                    <img
                                                        src={
                                                            thumbnailPreviewUrl ??
                                                            channel.thumbnail_url ??
                                                            ''
                                                        }
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="grid h-full place-items-center text-xs text-muted-foreground">
                                                        No thumbnail
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid min-w-0 flex-1 gap-2">
                                                <Input
                                                    ref={thumbnailInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    onChange={(event) =>
                                                        updateThumbnail(
                                                            event.target
                                                                .files?.[0] ??
                                                                null,
                                                        )
                                                    }
                                                />
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                    <ImagePlus className="size-3.5" />
                                                    <span>
                                                        Use a 16:9 JPG, PNG, or
                                                        WebP up to 4 MB.
                                                    </span>
                                                    {channelForm.data
                                                        .thumbnail && (
                                                        <span className="truncate font-medium text-foreground">
                                                            {
                                                                channelForm.data
                                                                    .thumbnail
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                {channelForm.progress && (
                                                    <progress
                                                        value={
                                                            channelForm.progress
                                                                .percentage
                                                        }
                                                        max="100"
                                                        className="h-1.5 w-full"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </Field>
                                    <Field
                                        label="Description"
                                        error={channelForm.errors.description}
                                        className="md:col-span-2"
                                    >
                                        <textarea
                                            value={
                                                channelForm.data.description ??
                                                ''
                                            }
                                            onChange={(event) =>
                                                channelForm.setData(
                                                    'description',
                                                    event.target.value,
                                                )
                                            }
                                            className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                    </Field>
                                    <Button
                                        type="submit"
                                        disabled={channelForm.processing}
                                        className="md:col-span-2 md:w-fit"
                                    >
                                        <Save className="size-4" />
                                        Save channel
                                    </Button>
                                </form>
                            </Panel>

                            <Panel title="Recent broadcasts">
                                <div className="grid gap-2">
                                    {recentBroadcasts.map((broadcast) => (
                                        <BroadcastRow
                                            key={broadcast.id}
                                            broadcast={broadcast}
                                            onStop={() =>
                                                setStopTarget(broadcast)
                                            }
                                        />
                                    ))}
                                    {recentBroadcasts.length === 0 && (
                                        <EmptyState text="No broadcasts yet." />
                                    )}
                                </div>
                            </Panel>
                        </div>

                        <aside className="grid min-w-0 content-start gap-6">
                            <Panel title="OBS stream key">
                                <div className="border-warning/40 bg-warning/10 text-warning mb-4 flex items-start gap-3 rounded-md border p-3 text-sm">
                                    <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                                    <span>
                                        Stream keys can publish to this channel.
                                        Rotate immediately if it was exposed.
                                    </span>
                                </div>
                                <div className="grid gap-3 text-sm">
                                    <CopyRow
                                        label="Server"
                                        value={streaming.ingestServer}
                                        copied={
                                            copiedText ===
                                            streaming.ingestServer
                                        }
                                        onCopy={copy}
                                    />
                                    <CopyRow
                                        label="Stream key"
                                        value={
                                            streaming.tokenizedPath ??
                                            'Rotate the key to reveal it once.'
                                        }
                                        copied={
                                            copiedText ===
                                            streaming.tokenizedPath
                                        }
                                        onCopy={copy}
                                        muted={!streaming.tokenizedPath}
                                    />
                                    {plainStreamKey && (
                                        <div className="border-warning/40 bg-warning/10 text-warning rounded-md border p-3">
                                            This key is shown once. Store it in
                                            OBS before leaving this page.
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            router.post(rotateStreamKeyRoute())
                                        }
                                    >
                                        <RotateCw className="size-4" />
                                        Rotate key
                                    </Button>
                                </div>
                            </Panel>

                            <Panel title="Current session">
                                {liveBroadcast ? (
                                    <div className="grid gap-3">
                                        <StatusPill
                                            live
                                            viewers={channel.viewer_count}
                                        />
                                        <div>
                                            <div className="font-medium">
                                                {liveBroadcast.title}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {liveBroadcast.recording_enabled
                                                    ? 'Recording enabled'
                                                    : 'Live only'}
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                setStopTarget(liveBroadcast)
                                            }
                                        >
                                            <StopCircle className="size-4" />
                                            Stop broadcast
                                        </Button>
                                    </div>
                                ) : pendingBroadcast ? (
                                    <div className="grid gap-3">
                                        <StatusPill ready />
                                        <div>
                                            <div className="font-medium">
                                                {pendingBroadcast.title}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Start OBS to push the session
                                                live.
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyState text="No active session." />
                                )}
                            </Panel>
                        </aside>
                    </div>
                )}
            </div>

            <Dialog
                open={stopTarget !== null}
                onOpenChange={(open) => !open && setStopTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Stop broadcast?</DialogTitle>
                        <DialogDescription>
                            This ends the live session and clears the channel's
                            live state. Viewers will see the offline screen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setStopTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={stopBroadcast}>
                            <StopCircle className="size-4" />
                            Stop broadcast
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Creator Studio',
            href: dashboardRoute(),
        },
    ],
};

function Panel({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="min-w-0 rounded-md border bg-card p-5 shadow-sm">
            <div className="mb-5">
                <h2 className="font-semibold">{title}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}

function Field({
    label,
    error,
    className,
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <label className={cn('grid gap-2', className)}>
            <Label>{label}</Label>
            {children}
            {error && <span className="text-sm text-destructive">{error}</span>}
        </label>
    );
}

function CategorySelect({
    categories,
    value,
    onChange,
}: {
    categories: Category[];
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            <option value="">No category</option>
            {categories.map((category) => (
                <option key={category.id} value={category.id}>
                    {category.name}
                </option>
            ))}
        </select>
    );
}

function CopyRow({
    label,
    value,
    copied,
    muted = false,
    onCopy,
}: {
    label: string;
    value: string;
    copied: boolean;
    muted?: boolean;
    onCopy: (text: string) => Promise<boolean>;
}) {
    return (
        <div className="grid min-w-0 gap-2">
            <div className="text-xs font-medium text-muted-foreground uppercase">
                {label}
            </div>
            <div className="flex min-w-0 gap-2">
                <code
                    className={cn(
                        'min-w-0 flex-1 overflow-hidden rounded-md border bg-background px-3 py-2 text-xs text-ellipsis whitespace-nowrap',
                        muted && 'text-muted-foreground',
                    )}
                >
                    {value}
                </code>
                <Button
                    type="button"
                    variant={copied ? 'default' : 'outline'}
                    size="icon"
                    className="shrink-0"
                    onClick={() => void onCopy(value)}
                >
                    {copied ? (
                        <Check className="size-4" />
                    ) : (
                        <Copy className="size-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
    );
}

function BroadcastRow({
    broadcast,
    onStop,
}: {
    broadcast: BroadcastSummary;
    onStop: () => void;
}) {
    const active = broadcast.status !== 'ended';

    return (
        <div className="flex flex-col gap-3 rounded-md border bg-background p-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
                <div className="truncate font-medium">{broadcast.title}</div>
                <div className="text-sm text-muted-foreground">
                    {broadcast.status ?? 'unknown'} -{' '}
                    {broadcast.recording_enabled ? 'recording' : 'live only'}
                    {broadcast.has_vod ? ' - VOD ready' : ''}
                </div>
            </div>
            {active && (
                <Button variant="outline" size="sm" onClick={onStop}>
                    <StopCircle className="size-4" />
                    Stop
                </Button>
            )}
        </div>
    );
}

function StatusPill({
    live = false,
    ready = false,
    viewers = 0,
}: {
    live?: boolean;
    ready?: boolean;
    viewers?: number;
}) {
    if (live) {
        return (
            <span className="bg-live inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold text-white">
                <span className="live-pulse size-1.5 rounded-full bg-white" />
                LIVE - {viewers} viewers
            </span>
        );
    }

    if (ready) {
        return (
            <span className="border-warning/40 bg-warning/10 text-warning rounded-md border px-2 py-1 text-xs font-medium">
                READY
            </span>
        );
    }

    return (
        <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
            OFFLINE
        </span>
    );
}

function ChannelAvatar({ channel }: { channel: CreatorChannel | null }) {
    return (
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary text-secondary-foreground">
            {channel?.avatar_url ? (
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

function ReadinessRow({
    done = false,
    label,
}: {
    done?: boolean;
    label: string;
}) {
    return (
        <div className="flex items-center gap-3 border-b py-3 last:border-b-0">
            <span
                className={cn(
                    'flex size-6 items-center justify-center rounded-md border',
                    done && 'border-success/40 bg-success/10 text-success',
                )}
            >
                {done && <Check className="size-3" />}
            </span>
            <span className="text-sm">{label}</span>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-md border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
            {text}
        </div>
    );
}
