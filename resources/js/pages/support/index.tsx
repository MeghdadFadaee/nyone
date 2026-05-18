import { Head, Link, useForm } from '@inertiajs/react';
import { FileUp, LifeBuoy, MessageSquare, Send } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useRef } from 'react';
import { SupportAttachmentErrors } from '@/components/support-attachment-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';
import {
    index as supportIndex,
    show as showConversation,
    store as storeConversation,
} from '@/routes/support';
import type {
    SupportCategoryOption,
    SupportConversationSummary,
} from '@/types';

type Props = {
    categories: SupportCategoryOption[];
    conversations: SupportConversationSummary[];
};

export default function SupportIndex({ categories, conversations }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();
    const form = useForm({
        category: categories[0]?.value ?? 'bug',
        subject: '',
        body: '',
        attachments: [] as File[],
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        form.post(storeConversation.url(), {
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

    function setAttachments(files: FileList | null) {
        form.setData('attachments', Array.from(files ?? []).slice(0, 3));
    }

    return (
        <>
            <Head title={t('Contact admin')} />
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <section className="grid content-start gap-4">
                    <div className="flex flex-col gap-4 rounded-md border bg-card p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <LifeBuoy className="size-5" />
                            </span>
                            <div>
                                <h1 className="text-2xl font-semibold">
                                    {t('Contact admin')}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'Bug reports, suggestions, channel requests, and account questions.',
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-md border bg-background px-3 py-2 text-sm">
                            {t(':count threads', {
                                count: conversations.length,
                            })}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        {conversations.map((conversation) => (
                            <Link
                                key={conversation.id}
                                href={showConversation(conversation.id)}
                                className="grid gap-3 rounded-md border bg-card p-4 shadow-sm transition hover:border-primary/50 md:grid-cols-[minmax(0,1fr)_auto]"
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
                                    {conversation.latest_message && (
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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
                            <div className="grid min-h-64 place-items-center rounded-md border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
                                {t('No conversations yet.')}
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-md border bg-card p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="font-semibold">
                            {t('New conversation')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t('Attach up to 3 files, 200 MB each.')}
                        </p>
                    </div>
                    <form onSubmit={submit} className="grid gap-4">
                        <Field label="Category" error={form.errors.category}>
                            <select
                                value={form.data.category}
                                onChange={(event) =>
                                    form.setData('category', event.target.value)
                                }
                                className="h-9 rounded-md border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                {categories.map((category) => (
                                    <option
                                        key={category.value}
                                        value={category.value}
                                    >
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Subject" error={form.errors.subject}>
                            <Input
                                value={form.data.subject}
                                onChange={(event) =>
                                    form.setData('subject', event.target.value)
                                }
                                maxLength={120}
                            />
                        </Field>
                        <Field label="Message" error={form.errors.body}>
                            <textarea
                                value={form.data.body}
                                onChange={(event) =>
                                    form.setData('body', event.target.value)
                                }
                                className="min-h-36 rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                                    {form.data.attachments.map((file) => (
                                        <span
                                            key={`${file.name}-${file.size}`}
                                            className="flex min-w-0 items-center gap-2"
                                        >
                                            <FileUp className="size-3.5 shrink-0" />
                                            <span className="truncate">
                                                {file.name}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {form.progress && (
                                <progress
                                    value={form.progress.percentage}
                                    max="100"
                                    className="h-1.5 w-full"
                                />
                            )}
                            <SupportAttachmentErrors errors={form.errors} />
                        </Field>
                        <Button type="submit" disabled={form.processing}>
                            <Send className="size-4" />
                            Send
                        </Button>
                    </form>
                </section>
            </div>
        </>
    );
}

SupportIndex.layout = {
    breadcrumbs: [
        {
            title: 'Contact admin',
            href: supportIndex(),
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
