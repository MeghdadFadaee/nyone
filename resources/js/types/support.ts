export type SupportCategoryOption = {
    value: string;
    label: string;
};

export type SupportStatus = 'open' | 'closed';

export type SupportAuthor = {
    id: number | null;
    name: string;
    is_admin: boolean;
};

export type SupportAttachment = {
    id: number;
    original_name: string;
    mime_type: string;
    size: number;
};

export type SupportMessage = {
    id: number;
    body: string;
    created_at: string | null;
    author: SupportAuthor;
    attachments?: SupportAttachment[];
};

export type SupportUser = {
    id: number;
    name: string;
    email: string;
    can_create_channel?: boolean;
    suspended_at?: string | null;
    channel?: {
        id: number;
        slug: string;
        display_name: string;
    } | null;
};

export type SupportConversationSummary = {
    id: number;
    category: string;
    category_label: string;
    subject: string;
    status: SupportStatus;
    last_message_at: string | null;
    messages_count: number;
    latest_message: SupportMessage | null;
    user?: SupportUser;
};

export type SupportConversation = SupportConversationSummary & {
    messages: SupportMessage[];
    user?: SupportUser;
};
