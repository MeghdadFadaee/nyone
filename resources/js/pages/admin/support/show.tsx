import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    FileDown,
    FileUp,
    KeyRound,
    Lock,
    Send,
    Unlock,
    User,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useRef } from 'react';
import { SupportAttachmentErrors } from '@/components/support-attachment-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { dashboard as adminDashboard } from '@/routes/admin';
import {
    index as adminSupportIndex,
    update as updateConversation,
} from '@/routes/admin/support';
import { store as storeAdminMessage } from '@/routes/admin/support/messages';
import { show as showChannel } from '@/routes/channels';
import { show as showAttachment } from '@/routes/support/attachments';
import type {
    SupportAttachment,
    SupportConversation,
    SupportMessage,
} from '@/types';

type Props = {
    conversation: SupportConversation;
};

export default function AdminSupportShow({ conversation }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();
    const form = useForm({
        body: '',
        attachments: [] as File[],
    });
    const isClosed = conversation.status === 'closed';

    function submit(event: FormEvent) {
        event.preventDefault();

        form.post(storeAdminMessage.url(conversation.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    }

    function setStatus(status: 'open' | 'closed') {
        router.patch(
            updateConversation(conversation.id),
            { status },
            { preserveScroll: true },
        );
    }

    function setAttachments(files: FileList | null) {
        form.setData('attachments', Array.from(files ?? []).slice(0, 3));
    }

    return (
        <>
            <Head title={conversation.subject} />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="grid min-w-0 gap-6">
                    <div className="rounded-md border bg-card p-5 shadow-sm">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="mb-4"
                        >
                            <Link href={adminSupportIndex()}>
                                <ArrowLeft className="size-4" />
                                {t('Support inbox')}
                            </Link>
                        </Button>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <StatusBadge status={conversation.status} />
                                    <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                                        {conversation.category_label}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-semibold break-words">
                                    {conversation.subject}
                                </h1>
                            </div>
                            <Button
                                variant={isClosed ? 'default' : 'outline'}
                                size="sm"
                                onClick={() =>
                                    setStatus(isClosed ? 'open' : 'closed')
                                }
                            >
                                {isClosed ? (
                                    <Unlock className="size-4" />
                                ) : (
                                    <Lock className="size-4" />
                                )}
                                {isClosed ? t('Reopen') : t('Close')}
                            </Button>
                        </div>
                    </div>

                    <section className="grid gap-3">
                        {conversation.messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                    </section>

                    <section className="rounded-md border bg-card p-5 shadow-sm">
                        {isClosed ? (
                            <div className="flex items-start gap-3 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
                                <Lock className="mt-0.5 size-4 shrink-0" />
                                <span>
                                    {t('Reopen the conversation to reply.')}
                                </span>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="grid gap-4">
                                <Field label="Reply" error={form.errors.body}>
                                    <textarea
                                        value={form.data.body}
                                        onChange={(event) =>
                                            form.setData(
                                                'body',
                                                event.target.value,
                                            )
                                        }
                                        className="min-h-32 rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        maxLength={2000}
                                    />
                                </Field>
                                <Field label="Attachments">
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={(event) =>
                                            setAttachments(event.target.files)
                                        }
                                    />
                                    {form.data.attachments.length > 0 && (
                                        <div className="grid gap-1 text-xs text-muted-foreground">
                                            {form.data.attachments.map(
                                                (file) => (
                                                    <span
                                                        key={`${file.name}-${file.size}`}
                                                        className="flex min-w-0 items-center gap-2"
                                                    >
                                                        <FileUp className="size-3.5 shrink-0" />
                                                        <span className="truncate">
                                                            {file.name}
                                                        </span>
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    )}
                                    {form.progress && (
                                        <progress
                                            value={form.progress.percentage}
                                            max="100"
                                            className="h-1.5 w-full"
                                        />
                                    )}
                                    <SupportAttachmentErrors
                                        errors={form.errors}
                                    />
                                </Field>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="w-fit"
                                >
                                    <Send className="size-4" />
                                    Send reply
                                </Button>
                            </form>
                        )}
                    </section>
                </div>

                <aside className="grid content-start gap-6">
                    <section className="rounded-md border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <User className="size-5 text-primary" />
                            <h2 className="font-semibold">{t('User')}</h2>
                        </div>
                        <div className="grid gap-3 text-sm">
                            <div>
                                <div className="font-medium">
                                    {conversation.user?.name}
                                </div>
                                <div className="text-muted-foreground">
                                    {conversation.user?.email}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span
                                    className={cn(
                                        'rounded-md border px-2 py-0.5 text-xs font-medium',
                                        conversation.user?.can_create_channel
                                            ? 'border-success/40 bg-success/10 text-success'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {conversation.user?.can_create_channel
                                        ? t('CAN CREATE CHANNEL')
                                        : t('NEEDS CHANNEL GRANT')}
                                </span>
                                {conversation.user?.suspended_at && (
                                    <span className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                        {t('SUSPENDED')}
                                    </span>
                                )}
                            </div>
                            {conversation.user?.channel && (
                                <Button asChild variant="outline" size="sm">
                                    <Link
                                        href={showChannel(
                                            conversation.user.channel.slug,
                                        )}
                                    >
                                        Open channel
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </section>

                    {conversation.category === 'channel_request' && (
                        <section className="rounded-md border bg-card p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <KeyRound className="size-5 text-primary" />
                                <h2 className="font-semibold">
                                    {t('Channel request')}
                                </h2>
                            </div>
                            <p className="mb-4 text-sm text-muted-foreground">
                                {t(
                                    'Creator access grants stay in the moderation console.',
                                )}
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link href={adminDashboard()}>
                                    Open moderation
                                </Link>
                            </Button>
                        </section>
                    )}
                </aside>
            </div>
        </>
    );
}

AdminSupportShow.layout = {
    breadcrumbs: [
        {
            title: 'Support inbox',
            href: adminSupportIndex(),
        },
    ],
};

function MessageBubble({ message }: { message: SupportMessage }) {
    const isAdmin = message.author.is_admin;
    const { t } = useTranslation();

    return (
        <article
            className={cn(
                'grid max-w-3xl gap-3 rounded-md border bg-card p-4 shadow-sm',
                isAdmin && 'justify-self-end border-primary/30',
            )}
        >
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{message.author.name}</span>
                <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                    {isAdmin ? t('ADMIN') : t('USER')}
                </span>
                {message.created_at && (
                    <span className="text-xs text-muted-foreground">
                        {formatDateTime(message.created_at)}
                    </span>
                )}
            </div>
            <p className="text-sm leading-6 break-words whitespace-pre-wrap">
                {message.body}
            </p>
            {message.attachments && message.attachments.length > 0 && (
                <AttachmentList attachments={message.attachments} />
            )}
        </article>
    );
}

function AttachmentList({ attachments }: { attachments: SupportAttachment[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
                <a
                    key={attachment.id}
                    href={showAttachment.url(attachment.id)}
                    className="inline-flex max-w-full items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground"
                >
                    <FileDown className="size-3.5 shrink-0" />
                    <span className="truncate">{attachment.original_name}</span>
                    <span className="shrink-0 text-muted-foreground">
                        {formatBytes(attachment.size)}
                    </span>
                </a>
            ))}
        </div>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="grid gap-2">
            <Label>{label}</Label>
            {children}
            {error && <span className="text-sm text-destructive">{error}</span>}
        </label>
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

function formatDateTime(value: string): string {
    return new Date(value).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function formatBytes(value: number): string {
    if (value < 1024) {
        return `${value} B`;
    }

    if (value < 1024 * 1024) {
        return `${Math.round(value / 102.4) / 10} KB`;
    }

    return `${Math.round(value / 1024 / 102.4) / 10} MB`;
}
