import { Head, Link, usePage } from '@inertiajs/react';
import {
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
                <header className="border-b">
                    <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4">
                        <Link
                            href={home()}
                            className="flex items-center gap-2 font-semibold"
                        >
                            <span className="flex size-9 items-center justify-center rounded-md bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                                <Radio className="size-4" />
                            </span>
                            <span>Nyone</span>
                        </Link>

                        <div className="ml-auto flex items-center gap-2">
                            {auth.user ? (
                                <Button asChild size="sm">
                                    <Link href={dashboard()}>
                                        <LayoutDashboard className="size-4" />
                                        Dashboard
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

                <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
                    <section className="grid gap-6 border-b pb-8 lg:grid-cols-[1fr_320px]">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm text-muted-foreground">
                                <Video className="size-4 text-red-600" />
                                {liveChannels.length} live now
                            </div>
                            <div className="max-w-3xl space-y-3">
                                <h1 className="text-3xl font-semibold tracking-normal md:text-5xl">
                                    Live streams from independent channels
                                </h1>
                                <p className="text-base text-muted-foreground md:text-lg">
                                    Watch public live broadcasts, follow
                                    channels, and chat while creators stream
                                    from OBS.
                                </p>
                            </div>
                        </div>

                        <div className="grid content-start gap-3 rounded-md border p-4">
                            <div className="flex items-center gap-3">
                                <Users className="size-5 text-sky-700 dark:text-sky-400" />
                                <div>
                                    <div className="text-sm font-medium">
                                        Creator access
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        One channel per account with private
                                        stream keys.
                                    </div>
                                </div>
                            </div>
                            <Button asChild variant="outline">
                                <Link
                                    href={auth.user ? dashboard() : register()}
                                >
                                    {auth.user
                                        ? 'Open studio'
                                        : 'Start a channel'}
                                </Link>
                            </Button>
                        </div>
                    </section>

                    <section className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <h2 className="text-xl font-semibold">
                                Live directory
                            </h2>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="relative">
                                    <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                    <Input
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        placeholder="Search channels"
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
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredChannels.map((channel) => (
                                    <Link
                                        key={channel.id}
                                        href={showChannel(channel.slug)}
                                        className="group overflow-hidden rounded-md border bg-card text-card-foreground transition-colors hover:border-neutral-400 dark:hover:border-neutral-600"
                                    >
                                        <div className="flex aspect-video items-center justify-center bg-neutral-950 text-white">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="size-2 rounded-full bg-red-500" />
                                                Live preview
                                            </div>
                                        </div>
                                        <div className="grid gap-3 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium">
                                                        {channel.broadcast
                                                            ?.title ??
                                                            channel.display_name}
                                                    </div>
                                                    <div className="truncate text-sm text-muted-foreground">
                                                        {channel.display_name}{' '}
                                                        by {channel.owner.name}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white">
                                                    LIVE
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>
                                                    {channel.category?.name ??
                                                        'Uncategorized'}
                                                </span>
                                                <span>
                                                    {channel.viewer_count}{' '}
                                                    viewers
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                                No live channels match this view.
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </>
    );
}
