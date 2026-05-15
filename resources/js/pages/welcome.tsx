import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Compass,
    LayoutDashboard,
    Radio,
    Search,
    UserPlus,
    Users,
    Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { dashboard, home, login, register } from '@/routes';
import { show as showChannel } from '@/routes/channels';
import type { Category, ChannelCard } from '@/types';

type Props = {
    canRegister: boolean;
    liveChannels: ChannelCard[];
    categories: Category[];
};

export default function Welcome({
    canRegister,
    liveChannels,
    categories,
}: Props) {
    const { auth } = usePage().props;
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<string>('all');

    const featuredChannel = liveChannels[0] ?? null;
    const filteredChannels = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return liveChannels.filter((channel) => {
            const matchesCategory =
                category === 'all' || channel.category?.slug === category;
            const matchesQuery =
                normalizedQuery === '' ||
                channel.display_name.toLowerCase().includes(normalizedQuery) ||
                channel.broadcast?.title
                    .toLowerCase()
                    .includes(normalizedQuery) ||
                channel.owner.name.toLowerCase().includes(normalizedQuery);

            return matchesCategory && matchesQuery;
        });
    }, [category, liveChannels, query]);

    return (
        <>
            <Head title="Live" />
            <div className="min-h-screen bg-background text-foreground">
                <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
                    <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4">
                        <Link
                            href={home()}
                            className="flex items-center gap-2 font-semibold"
                        >
                            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <Radio className="size-4" />
                            </span>
                            <span>Nyone</span>
                        </Link>

                        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
                            <Link
                                href={home()}
                                className="rounded-md px-3 py-2 text-foreground"
                            >
                                Live
                            </Link>
                            {auth.user && (
                                <Link
                                    href={dashboard()}
                                    className="rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                                >
                                    Studio
                                </Link>
                            )}
                        </nav>

                        <div className="ml-auto flex items-center gap-2">
                            {auth.user ? (
                                <Button asChild size="sm">
                                    <Link href={dashboard()}>
                                        <LayoutDashboard className="size-4" />
                                        Studio
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={login()}>Log in</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button asChild size="sm">
                                            <Link href={register()}>
                                                <UserPlus className="size-4" />
                                                Register
                                            </Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:py-8">
                    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                        {featuredChannel ? (
                            <Link
                                href={showChannel(featuredChannel.slug)}
                                className="group overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm transition hover:border-primary/50"
                            >
                                <div className="grid md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
                                    <Thumbnail
                                        channel={featuredChannel}
                                        className="aspect-video md:min-h-[360px]"
                                        label="Featured live"
                                    />
                                    <div className="grid content-between gap-6 p-5">
                                        <div className="space-y-4">
                                            <LiveBadge />
                                            <div className="space-y-2">
                                                <h1 className="text-2xl font-semibold md:text-4xl">
                                                    {featuredChannel.broadcast
                                                        ?.title ??
                                                        featuredChannel.display_name}
                                                </h1>
                                                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                                                    {featuredChannel.description ??
                                                        `${featuredChannel.display_name} is live now with ${featuredChannel.viewer_count} viewers.`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            <span className="font-medium text-foreground">
                                                {featuredChannel.display_name}
                                            </span>
                                            <span>
                                                {featuredChannel.category
                                                    ?.name ?? 'Uncategorized'}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Users className="size-4" />
                                                {
                                                    featuredChannel.viewer_count
                                                }{' '}
                                                viewers
                                            </span>
                                            <span className="ml-auto inline-flex items-center gap-1 text-primary">
                                                Watch
                                                <ArrowRight className="size-4" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <div className="grid min-h-[360px] content-center gap-4 rounded-md border border-dashed bg-card p-6">
                                <div className="flex size-12 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                                    <Video className="size-5" />
                                </div>
                                <div className="max-w-xl space-y-2">
                                    <h1 className="text-2xl font-semibold md:text-4xl">
                                        The live floor is quiet
                                    </h1>
                                    <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                        Creators can prepare a broadcast in the
                                        studio and go live from OBS when ready.
                                    </p>
                                </div>
                            </div>
                        )}

                        <aside className="grid content-start gap-3 rounded-md border bg-card p-4">
                            <div className="flex items-center justify-between gap-3 border-b pb-3">
                                <div>
                                    <div className="text-sm font-medium">
                                        Live signal
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Public channels broadcasting now
                                    </div>
                                </div>
                                <div className="bg-live rounded-md px-2 py-1 text-xs font-medium text-white">
                                    {liveChannels.length}
                                </div>
                            </div>
                            <Metric
                                icon={Radio}
                                label="Live channels"
                                value={String(liveChannels.length)}
                            />
                            <Metric
                                icon={Users}
                                label="Viewers"
                                value={String(
                                    liveChannels.reduce(
                                        (total, item) =>
                                            total + item.viewer_count,
                                        0,
                                    ),
                                )}
                            />
                            <Metric
                                icon={Compass}
                                label="Categories"
                                value={String(categories.length)}
                            />
                            <Button asChild variant="outline">
                                <Link
                                    href={auth.user ? dashboard() : register()}
                                >
                                    {auth.user
                                        ? 'Open studio'
                                        : 'Start a channel'}
                                </Link>
                            </Button>
                        </aside>
                    </section>

                    <section className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Live directory
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Browse active channels by category or title.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                    <Input
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        placeholder="Search live channels"
                                        className="pl-9 sm:w-72"
                                    />
                                </div>
                                <select
                                    value={category}
                                    onChange={(event) =>
                                        setCategory(event.target.value)
                                    }
                                    className="h-9 rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    <option value="all">All categories</option>
                                    {categories.map((item) => (
                                        <option key={item.id} value={item.slug}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {filteredChannels.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredChannels.map((channel) => (
                                    <StreamCard
                                        key={channel.id}
                                        channel={channel}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="grid min-h-64 content-center justify-items-center gap-3 rounded-md border border-dashed bg-card p-6 text-center">
                                <Search className="size-8 text-muted-foreground" />
                                <div>
                                    <div className="font-medium">
                                        No streams match this view
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Clear search or switch categories.
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </>
    );
}

function StreamCard({ channel }: { channel: ChannelCard }) {
    return (
        <Link
            href={showChannel(channel.slug)}
            className="group overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm transition hover:border-primary/50"
        >
            <Thumbnail channel={channel} className="aspect-video" />
            <div className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="truncate font-medium">
                            {channel.broadcast?.title ?? channel.display_name}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                            {channel.display_name} by {channel.owner.name}
                        </div>
                    </div>
                    <LiveBadge compact />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span className="truncate">
                        {channel.category?.name ?? 'Uncategorized'}
                    </span>
                    <span className="shrink-0">
                        {channel.viewer_count} viewers
                    </span>
                </div>
            </div>
        </Link>
    );
}

function Thumbnail({
    channel,
    className,
    label = 'Live preview',
}: {
    channel: ChannelCard;
    className?: string;
    label?: string;
}) {
    return (
        <div
            className={cn(
                'relative flex items-center justify-center overflow-hidden bg-zinc-950 text-white',
                className,
            )}
        >
            {channel.thumbnail_url ? (
                <img
                    src={channel.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
            ) : (
                <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_40%_30%,oklch(0.34_0.12_326),oklch(0.14_0.04_315)_55%)]">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="bg-live live-pulse size-2 rounded-full" />
                        {label}
                    </div>
                </div>
            )}
            <div className="absolute top-3 left-3">
                <LiveBadge compact />
            </div>
        </div>
    );
}

function LiveBadge({ compact = false }: { compact?: boolean }) {
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

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Radio;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4 text-primary" />
                {label}
            </div>
            <div className="font-semibold">{value}</div>
        </div>
    );
}
