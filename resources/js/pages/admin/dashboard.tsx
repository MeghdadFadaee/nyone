import { Head, Link, router } from '@inertiajs/react';
import { Ban, Radio, Shield, StopCircle, Undo2, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { dashboard as adminDashboard } from '@/routes/admin';
import { stop as stopBroadcast } from '@/routes/admin/broadcasts';
import { restore, suspend } from '@/routes/admin/channels';
import { show as showChannel } from '@/routes/channels';

type LiveBroadcast = {
    id: number;
    title: string;
    started_at: string | null;
    channel: {
        id: number;
        slug: string;
        display_name: string;
        thumbnail_url: string | null;
        owner: string;
    };
};

type AdminChannel = {
    id: number;
    slug: string;
    display_name: string;
    avatar_url: string | null;
    thumbnail_url: string | null;
    is_live: boolean;
    suspended_at: string | null;
    owner: {
        id: number;
        name: string;
    };
};

type Props = {
    stats: {
        users: number;
        channels: number;
        live_channels: number;
        vods: number;
    };
    liveBroadcasts: LiveBroadcast[];
    channels: AdminChannel[];
};

type ModerationAction =
    | { kind: 'stop'; broadcast: LiveBroadcast }
    | { kind: 'suspend'; channel: AdminChannel }
    | { kind: 'restore'; channel: AdminChannel }
    | null;

export default function AdminDashboard({
    stats,
    liveBroadcasts,
    channels,
}: Props) {
    const [action, setAction] = useState<ModerationAction>(null);

    function confirmAction() {
        if (!action) {
            return;
        }

        if (action.kind === 'stop') {
            router.post(stopBroadcast(action.broadcast.id), undefined, {
                onFinish: () => setAction(null),
            });

            return;
        }

        router.post(
            action.kind === 'suspend'
                ? suspend(action.channel.slug)
                : restore(action.channel.slug),
            undefined,
            { onFinish: () => setAction(null) },
        );
    }

    return (
        <>
            <Head title="Admin" />
            <div className="grid gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-md border bg-card p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Shield className="size-5" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Moderation console
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Review live streams, suspended states, users,
                                and recordings.
                            </p>
                        </div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2 text-sm">
                        {liveBroadcasts.length} active broadcasts
                    </div>
                </div>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat icon={Users} label="Users" value={stats.users} />
                    <Stat
                        icon={Radio}
                        label="Channels"
                        value={stats.channels}
                    />
                    <Stat
                        icon={Radio}
                        label="Live channels"
                        value={stats.live_channels}
                        live
                    />
                    <Stat icon={Shield} label="VODs" value={stats.vods} />
                </section>

                <section className="rounded-md border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Radio className="text-live size-5" />
                            <h2 className="font-semibold">Live broadcasts</h2>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {liveBroadcasts.length} rows
                        </span>
                    </div>
                    <div className="grid gap-2">
                        {liveBroadcasts.map((broadcast) => (
                            <div
                                key={broadcast.id}
                                className="grid gap-3 rounded-md border bg-background p-3 md:grid-cols-[72px_minmax(0,1fr)_auto]"
                            >
                                <Thumb url={broadcast.channel.thumbnail_url} />
                                <div className="min-w-0">
                                    <div className="truncate font-medium">
                                        {broadcast.title}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {broadcast.channel.display_name} by{' '}
                                        {broadcast.channel.owner}
                                    </div>
                                    <div className="bg-live mt-2 inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold text-white">
                                        <span className="live-pulse size-1.5 rounded-full bg-white" />
                                        LIVE
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link
                                            href={showChannel(
                                                broadcast.channel.slug,
                                            )}
                                        >
                                            Open
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            setAction({
                                                kind: 'stop',
                                                broadcast,
                                            })
                                        }
                                    >
                                        <StopCircle className="size-4" />
                                        Stop
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {liveBroadcasts.length === 0 && (
                            <EmptyState text="No channels are live." />
                        )}
                    </div>
                </section>

                <section className="rounded-md border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="font-semibold">Recent channels</h2>
                        <span className="text-sm text-muted-foreground">
                            {channels.length} rows
                        </span>
                    </div>
                    <div className="grid gap-2">
                        {channels.map((channel) => (
                            <div
                                key={channel.id}
                                className="grid gap-3 rounded-md border bg-background p-3 md:grid-cols-[48px_minmax(0,1fr)_auto]"
                            >
                                <Avatar channel={channel} />
                                <div className="min-w-0">
                                    <div className="truncate font-medium">
                                        {channel.display_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        @{channel.slug} owned by{' '}
                                        {channel.owner.name}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {channel.is_live && (
                                            <span className="bg-live rounded-md px-2 py-1 text-xs font-semibold text-white">
                                                LIVE
                                            </span>
                                        )}
                                        {channel.suspended_at && (
                                            <span className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                                                SUSPENDED
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={showChannel(channel.slug)}>
                                            Open
                                        </Link>
                                    </Button>
                                    {channel.suspended_at ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setAction({
                                                    kind: 'restore',
                                                    channel,
                                                })
                                            }
                                        >
                                            <Undo2 className="size-4" />
                                            Restore
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                setAction({
                                                    kind: 'suspend',
                                                    channel,
                                                })
                                            }
                                        >
                                            <Ban className="size-4" />
                                            Suspend
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <Dialog
                open={action !== null}
                onOpenChange={(open) => !open && setAction(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogTitle(action)}</DialogTitle>
                        <DialogDescription>
                            {dialogDescription(action)}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAction(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={
                                action?.kind === 'restore'
                                    ? 'default'
                                    : 'destructive'
                            }
                            onClick={confirmAction}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: adminDashboard(),
        },
    ],
};

function Stat({
    icon: Icon,
    label,
    value,
    live = false,
}: {
    icon: typeof Radio;
    label: string;
    value: number;
    live?: boolean;
}) {
    return (
        <div className="rounded-md border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>{label}</span>
                <Icon className={live ? 'text-live size-4' : 'size-4'} />
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
        </div>
    );
}

function Thumb({ url }: { url: string | null }) {
    return (
        <div className="grid aspect-video overflow-hidden rounded-md bg-zinc-950 text-white md:aspect-square">
            {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
                <div className="grid place-items-center">
                    <Radio className="size-5 opacity-70" />
                </div>
            )}
        </div>
    );
}

function Avatar({ channel }: { channel: AdminChannel }) {
    return (
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-md bg-secondary text-secondary-foreground">
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

function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-md border border-dashed bg-background p-6 text-sm text-muted-foreground">
            {text}
        </div>
    );
}

function dialogTitle(action: ModerationAction): string {
    if (action?.kind === 'stop') {
        return 'Stop live broadcast?';
    }

    if (action?.kind === 'restore') {
        return 'Restore channel?';
    }

    return 'Suspend channel?';
}

function dialogDescription(action: ModerationAction): string {
    if (action?.kind === 'stop') {
        return 'The live session will end immediately and the channel will move offline.';
    }

    if (action?.kind === 'restore') {
        return 'The channel will be visible again if the owning account is active.';
    }

    return 'The channel will be hidden from public browsing and watch pages.';
}
