import { Head, Link, router } from '@inertiajs/react';
import {
    Ban,
    KeyRound,
    Lock,
    Radio,
    Shield,
    StopCircle,
    Undo2,
    Unlock,
    UserCheck,
    Users,
    UserX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import {
    updateDefault as updateChannelCreationDefault,
    updateUser as updateUserCreatorAccess,
} from '@/actions/App/Http/Controllers/AdminChannelCreationController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/translations';
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

type AdminUser = {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    can_create_channel: boolean;
    suspended_at: string | null;
    created_at: string | null;
    channel: {
        id: number;
        slug: string;
        display_name: string;
    } | null;
};

type Props = {
    stats: {
        users: number;
        channels: number;
        live_channels: number;
        vods: number;
        creator_access_grants: number;
    };
    channelCreationPolicy: {
        channel_creation_open: boolean;
    };
    liveBroadcasts: LiveBroadcast[];
    channels: AdminChannel[];
    users: AdminUser[];
};

type ModerationAction =
    | { kind: 'stop'; broadcast: LiveBroadcast }
    | { kind: 'suspend'; channel: AdminChannel }
    | { kind: 'restore'; channel: AdminChannel }
    | null;

export default function AdminDashboard({
    stats,
    channelCreationPolicy,
    liveBroadcasts,
    channels,
    users,
}: Props) {
    const [action, setAction] = useState<ModerationAction>(null);
    const { t } = useTranslation();

    function setChannelCreationDefault(channelCreationOpen: boolean) {
        router.patch(
            updateChannelCreationDefault(),
            {
                channel_creation_open: channelCreationOpen,
            },
            {
                preserveScroll: true,
            },
        );
    }

    function setUserCreatorAccess(user: AdminUser, canCreateChannel: boolean) {
        router.patch(
            updateUserCreatorAccess(user.id),
            {
                can_create_channel: canCreateChannel,
            },
            {
                preserveScroll: true,
            },
        );
    }

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
            <Head title={t('Admin')} />
            <div className="grid gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-md border bg-card p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Shield className="size-5" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {t('Moderation console')}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    'Review live streams, suspended states, users, and recordings.',
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2 text-sm">
                        {t(':count active broadcasts', {
                            count: liveBroadcasts.length,
                        })}
                    </div>
                </div>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
                    <Stat
                        icon={UserCheck}
                        label="Creator grants"
                        value={stats.creator_access_grants}
                    />
                    <Stat icon={Shield} label="VODs" value={stats.vods} />
                </section>

                <section className="rounded-md border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-2">
                            <KeyRound className="mt-0.5 size-5 text-primary" />
                            <div>
                                <h2 className="font-semibold">
                                    {t('Channel creation access')}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'Control who can create a creator channel.',
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={
                                    channelCreationPolicy.channel_creation_open
                                        ? 'outline'
                                        : 'default'
                                }
                                size="sm"
                                onClick={() => setChannelCreationDefault(false)}
                            >
                                <Lock className="size-4" />
                                Approval only
                            </Button>
                            <Button
                                variant={
                                    channelCreationPolicy.channel_creation_open
                                        ? 'default'
                                        : 'outline'
                                }
                                size="sm"
                                onClick={() => setChannelCreationDefault(true)}
                            >
                                <Unlock className="size-4" />
                                Open to all
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        {users.map((user) => (
                            <CreatorAccessRow
                                key={user.id}
                                user={user}
                                defaultOpen={
                                    channelCreationPolicy.channel_creation_open
                                }
                                onChange={(canCreateChannel) =>
                                    setUserCreatorAccess(user, canCreateChannel)
                                }
                            />
                        ))}
                        {users.length === 0 && (
                            <EmptyState text="No users found." />
                        )}
                    </div>
                </section>

                <section className="rounded-md border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Radio className="text-live size-5" />
                            <h2 className="font-semibold">
                                {t('Live broadcasts')}
                            </h2>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {t(':count rows', {
                                count: liveBroadcasts.length,
                            })}
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
                                        {t(':channel by :owner', {
                                            channel:
                                                broadcast.channel.display_name,
                                            owner: broadcast.channel.owner,
                                        })}
                                    </div>
                                    <div className="bg-live mt-2 inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold text-white">
                                        <span className="live-pulse size-1.5 rounded-full bg-white" />
                                        {t('LIVE')}
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
                        <h2 className="font-semibold">
                            {t('Recent channels')}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {t(':count rows', {
                                count: channels.length,
                            })}
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
                                        {t('@:slug owned by :owner', {
                                            slug: channel.slug,
                                            owner: channel.owner.name,
                                        })}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {channel.is_live && (
                                            <span className="bg-live rounded-md px-2 py-1 text-xs font-semibold text-white">
                                                {t('LIVE')}
                                            </span>
                                        )}
                                        {channel.suspended_at && (
                                            <span className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                                                {t('SUSPENDED')}
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
                        <DialogTitle>{t(dialogTitle(action))}</DialogTitle>
                        <DialogDescription>
                            {t(dialogDescription(action))}
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
    icon: LucideIcon;
    label: string;
    value: number;
    live?: boolean;
}) {
    const { t } = useTranslation();

    return (
        <div className="rounded-md border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>{t(label)}</span>
                <Icon className={live ? 'text-live size-4' : 'size-4'} />
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
        </div>
    );
}

function CreatorAccessRow({
    user,
    defaultOpen,
    onChange,
}: {
    user: AdminUser;
    defaultOpen: boolean;
    onChange: (canCreateChannel: boolean) => void;
}) {
    const effectiveAccess = defaultOpen || user.can_create_channel;
    const { t } = useTranslation();

    return (
        <div className="grid gap-3 rounded-md border bg-background p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{user.name}</span>
                    {user.is_admin && (
                        <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                            {t('ADMIN')}
                        </span>
                    )}
                    {user.suspended_at && (
                        <span className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            {t('SUSPENDED')}
                        </span>
                    )}
                    <span
                        className={
                            effectiveAccess
                                ? 'border-success/40 bg-success/10 text-success rounded-md border px-2 py-0.5 text-xs font-medium'
                                : 'border-warning/40 bg-warning/10 text-warning rounded-md border px-2 py-0.5 text-xs font-medium'
                        }
                    >
                        {effectiveAccess
                            ? t('CAN CREATE')
                            : t('NEEDS APPROVAL')}
                    </span>
                    {defaultOpen && !user.can_create_channel && (
                        <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                            {t('DEFAULT')}
                        </span>
                    )}
                </div>
                <div className="mt-1 truncate text-sm text-muted-foreground">
                    {user.email}
                    {user.channel && (
                        <>
                            {' - '}
                            <Link
                                href={showChannel(user.channel.slug)}
                                className="text-primary hover:underline"
                            >
                                {user.channel.display_name}
                            </Link>
                        </>
                    )}
                </div>
            </div>
            <Button
                variant={user.can_create_channel ? 'outline' : 'default'}
                size="sm"
                onClick={() => onChange(!user.can_create_channel)}
            >
                {user.can_create_channel ? (
                    <UserX className="size-4" />
                ) : (
                    <UserCheck className="size-4" />
                )}
                {user.can_create_channel ? 'Remove grant' : 'Grant'}
            </Button>
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
    const { t } = useTranslation();

    return (
        <div className="rounded-md border border-dashed bg-background p-6 text-sm text-muted-foreground">
            {t(text)}
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
