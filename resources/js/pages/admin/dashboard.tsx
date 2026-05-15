import { Head, Link, router } from '@inertiajs/react';
import { Ban, Radio, Shield, StopCircle, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type LiveBroadcast = {
    id: number;
    title: string;
    started_at: string | null;
    channel: {
        id: number;
        slug: string;
        display_name: string;
        owner: string;
    };
};

type AdminChannel = {
    id: number;
    slug: string;
    display_name: string;
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

export default function AdminDashboard({
    stats,
    liveBroadcasts,
    channels,
}: Props) {
    return (
        <>
            <Head title="Admin" />
            <div className="grid gap-6 p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-md border">
                        <Shield className="size-5" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-semibold">Admin</h1>
                        <p className="text-sm text-muted-foreground">
                            Moderate live streams, channels, users, and
                            recordings.
                        </p>
                    </div>
                </div>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat label="Users" value={stats.users} />
                    <Stat label="Channels" value={stats.channels} />
                    <Stat label="Live channels" value={stats.live_channels} />
                    <Stat label="VODs" value={stats.vods} />
                </section>

                <section className="rounded-md border bg-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Radio className="size-5 text-red-600" />
                        <h2 className="font-semibold">Live broadcasts</h2>
                    </div>
                    <div className="grid gap-3">
                        {liveBroadcasts.map((broadcast) => (
                            <div
                                key={broadcast.id}
                                className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                            >
                                <div>
                                    <div className="font-medium">
                                        {broadcast.title}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {broadcast.channel.display_name} by{' '}
                                        {broadcast.channel.owner}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link
                                            href={`/channels/${broadcast.channel.slug}`}
                                        >
                                            Open
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            router.post(
                                                `/admin/broadcasts/${broadcast.id}/stop`,
                                            )
                                        }
                                    >
                                        <StopCircle className="size-4" />
                                        Stop
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {liveBroadcasts.length === 0 && (
                            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                                No channels are live.
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-md border bg-card p-5">
                    <h2 className="mb-4 font-semibold">Recent channels</h2>
                    <div className="grid gap-3">
                        {channels.map((channel) => (
                            <div
                                key={channel.id}
                                className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                            >
                                <div>
                                    <div className="font-medium">
                                        {channel.display_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        @{channel.slug} owned by{' '}
                                        {channel.owner.name}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link
                                            href={`/channels/${channel.slug}`}
                                        >
                                            Open
                                        </Link>
                                    </Button>
                                    {channel.suspended_at ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.post(
                                                    `/admin/channels/${channel.slug}/restore`,
                                                )
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
                                                router.post(
                                                    `/admin/channels/${channel.slug}/suspend`,
                                                )
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
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin',
        },
    ],
};

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md border bg-card p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
    );
}
