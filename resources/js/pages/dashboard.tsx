import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Copy,
    KeyRound,
    Radio,
    RotateCw,
    Save,
    StopCircle,
    Video,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClipboard } from '@/hooks/use-clipboard';
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
    const [, copy] = useClipboard();
    const liveBroadcast = channel?.live_broadcast ?? null;
    const createForm = useForm({
        display_name: '',
        slug: '',
        description: '',
        category_id: '',
    });
    const channelForm = useForm({
        display_name: channel?.display_name ?? '',
        slug: channel?.slug ?? '',
        description: channel?.description ?? '',
        category_id: channel?.category_id ? String(channel.category_id) : '',
    });
    const broadcastForm = useForm({
        title: '',
        recording_enabled: false,
    });

    function createChannel(event: FormEvent) {
        event.preventDefault();
        createForm.submit(storeChannelRoute());
    }

    function updateChannel(event: FormEvent) {
        event.preventDefault();
        channelForm.submit(updateChannelRoute());
    }

    function createBroadcast(event: FormEvent) {
        event.preventDefault();
        broadcastForm.submit(storeBroadcastRoute(), {
            onSuccess: () => broadcastForm.reset('title', 'recording_enabled'),
        });
    }

    return (
        <>
            <Head title="Creator Studio" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Creator Studio
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your channel, stream key, and OBS broadcast
                            sessions.
                        </p>
                    </div>
                    {channel && (
                        <Button asChild variant="outline">
                            <Link href={showChannel(channel.slug)}>
                                <Radio className="size-4" />
                                View channel
                            </Link>
                        </Button>
                    )}
                </div>

                {!channel ? (
                    <section className="max-w-2xl rounded-md border bg-card p-5">
                        <div className="mb-5">
                            <h2 className="font-semibold">
                                Create your channel
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Each account can own one channel in this
                                version.
                            </p>
                        </div>
                        <form onSubmit={createChannel} className="grid gap-4">
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
                            <Field label="Slug" error={createForm.errors.slug}>
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
                                        createForm.setData('category_id', value)
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
                    </section>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                        <div className="grid gap-6">
                            <section className="rounded-md border bg-card p-5">
                                <div className="mb-5 flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="font-semibold">
                                            Channel details
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            Public metadata used in the
                                            directory and channel page.
                                        </p>
                                    </div>
                                    <span className="rounded-md border px-2 py-1 text-xs">
                                        {channel.is_live
                                            ? `${channel.viewer_count} viewers`
                                            : 'Offline'}
                                    </span>
                                </div>
                                <form
                                    onSubmit={updateChannel}
                                    className="grid gap-4"
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
                                        label="Description"
                                        error={channelForm.errors.description}
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
                                    >
                                        <Save className="size-4" />
                                        Save channel
                                    </Button>
                                </form>
                            </section>

                            <section className="rounded-md border bg-card p-5">
                                <div className="mb-5">
                                    <h2 className="font-semibold">
                                        Broadcast setup
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Create a pending broadcast, then start
                                        OBS with your stream key.
                                    </p>
                                </div>
                                <form
                                    onSubmit={createBroadcast}
                                    className="grid gap-4 md:grid-cols-[1fr_auto]"
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
                                        />
                                    </Field>
                                    <label className="mt-6 flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
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
                                        />
                                        Record VOD
                                    </label>
                                    <Button
                                        type="submit"
                                        disabled={broadcastForm.processing}
                                        className="md:col-span-2"
                                    >
                                        <Video className="size-4" />
                                        Prepare broadcast
                                    </Button>
                                </form>
                            </section>

                            <section className="rounded-md border bg-card p-5">
                                <h2 className="mb-4 font-semibold">
                                    Recent broadcasts
                                </h2>
                                <div className="grid gap-2">
                                    {recentBroadcasts.map((broadcast) => (
                                        <div
                                            key={broadcast.id}
                                            className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {broadcast.title}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {broadcast.status}{' '}
                                                    {broadcast.recording_enabled
                                                        ? 'with recording'
                                                        : 'live only'}
                                                </div>
                                            </div>
                                            {broadcast.status !== 'ended' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.post(
                                                            stopBroadcastRoute(
                                                                broadcast.id,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <StopCircle className="size-4" />
                                                    Stop
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {recentBroadcasts.length === 0 && (
                                        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                                            No broadcasts yet.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <aside className="grid content-start gap-6">
                            <section className="rounded-md border bg-card p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <KeyRound className="size-5 text-amber-600" />
                                    <h2 className="font-semibold">
                                        OBS stream key
                                    </h2>
                                </div>
                                <div className="grid gap-3 text-sm">
                                    <CopyRow
                                        label="Server"
                                        value={streaming.ingestServer}
                                        onCopy={copy}
                                    />
                                    <CopyRow
                                        label="Stream key"
                                        value={
                                            streaming.tokenizedPath ??
                                            'Rotate the key to reveal it once.'
                                        }
                                        onCopy={copy}
                                        muted={!streaming.tokenizedPath}
                                    />
                                    {plainStreamKey && (
                                        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
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
                            </section>

                            {liveBroadcast && (
                                <section className="rounded-md border bg-card p-5">
                                    <h2 className="mb-3 font-semibold">
                                        Current live session
                                    </h2>
                                    <div className="space-y-2 text-sm">
                                        <div className="font-medium">
                                            {liveBroadcast.title}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {liveBroadcast.recording_enabled
                                                ? 'Recording enabled'
                                                : 'Live only'}
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                router.post(
                                                    stopBroadcastRoute(
                                                        liveBroadcast.id,
                                                    ),
                                                )
                                            }
                                        >
                                            <StopCircle className="size-4" />
                                            Stop broadcast
                                        </Button>
                                    </div>
                                </section>
                            )}
                        </aside>
                    </div>
                )}
            </div>
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

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="grid gap-2">
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
    muted = false,
    onCopy,
}: {
    label: string;
    value: string;
    muted?: boolean;
    onCopy: (text: string) => Promise<boolean>;
}) {
    return (
        <div className="grid gap-2">
            <div className="text-xs font-medium text-muted-foreground uppercase">
                {label}
            </div>
            <div className="flex gap-2">
                <code
                    className={`min-w-0 flex-1 rounded-md border px-3 py-2 text-xs ${muted ? 'text-muted-foreground' : ''}`}
                >
                    {value}
                </code>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void onCopy(value)}
                >
                    <Copy className="size-4" />
                </Button>
            </div>
        </div>
    );
}
