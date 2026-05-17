import { Head, Link } from '@inertiajs/react';
import { Inbox, MessageSquare, Shield, User } from 'lucide-react';
import { useTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';
import {
    index as adminSupportIndex,
    show as showAdminSupport,
} from '@/routes/admin/support';
import type { SupportConversationSummary } from '@/types';

type Props = {
    stats: {
        open: number;
        closed: number;
    };
    conversations: SupportConversationSummary[];
};

export default function AdminSupportIndex({ stats, conversations }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('Support inbox')} />
            <div className="grid gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 rounded-md border bg-card p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Inbox className="size-5" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {t('Support inbox')}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    'Contact threads from users and channel request notes.',
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                        <Stat label="Open" value={stats.open} />
                        <Stat label="Closed" value={stats.closed} />
                    </div>
                </div>

                <section className="rounded-md border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Shield className="size-5 text-primary" />
                            <h2 className="font-semibold">
                                {t('Conversations')}
                            </h2>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {t(':count rows', {
                                count: conversations.length,
                            })}
                        </span>
                    </div>
                    <div className="grid gap-2">
                        {conversations.map((conversation) => (
                            <Link
                                key={conversation.id}
                                href={showAdminSupport(conversation.id)}
                                className="grid gap-3 rounded-md border bg-background p-3 transition hover:border-primary/50 md:grid-cols-[minmax(0,1fr)_auto]"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge
                                            status={conversation.status}
                                        />
                                        <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                                            {conversation.category_label}
                                        </span>
                                    </div>
                                    <div className="mt-2 truncate font-medium">
                                        {conversation.subject}
                                    </div>
                                    <div className="mt-1 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                                        <User className="size-4 shrink-0" />
                                        <span className="truncate">
                                            {conversation.user?.name} -{' '}
                                            {conversation.user?.email}
                                        </span>
                                    </div>
                                    {conversation.latest_message && (
                                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                            {
                                                conversation.latest_message
                                                    .author.name
                                            }
                                            : {conversation.latest_message.body}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground md:justify-end">
                                    <MessageSquare className="size-4" />
                                    {conversation.messages_count}
                                </div>
                            </Link>
                        ))}

                        {conversations.length === 0 && (
                            <div className="rounded-md border border-dashed bg-background p-6 text-sm text-muted-foreground">
                                {t('No support conversations found.')}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

AdminSupportIndex.layout = {
    breadcrumbs: [
        {
            title: 'Support inbox',
            href: adminSupportIndex(),
        },
    ],
};

function Stat({ label, value }: { label: string; value: number }) {
    const { t } = useTranslation();

    return (
        <div className="rounded-md border bg-background px-3 py-2">
            <span className="text-muted-foreground">{t(label)}</span>{' '}
            <span className="font-semibold">{value}</span>
        </div>
    );
}

function StatusBadge({ status }: { status: 'open' | 'closed' }) {
    const { t } = useTranslation();

    return (
        <span
            className={cn(
                'rounded-md border px-2 py-0.5 text-xs font-medium',
                status === 'open'
                    ? 'border-success/40 bg-success/10 text-success'
                    : 'text-muted-foreground',
            )}
        >
            {status === 'open' ? t('OPEN') : t('CLOSED')}
        </span>
    );
}
