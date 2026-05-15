export type Category = {
    id: number;
    name: string;
    slug: string;
};

export type ChannelCard = {
    id: number;
    slug: string;
    display_name: string;
    description: string | null;
    thumbnail_path: string | null;
    viewer_count: number;
    followers_count: number;
    category: Category | null;
    broadcast: {
        id: number;
        title: string;
        started_at: string | null;
    } | null;
    owner: {
        id: number;
        name: string;
    };
};

export type ChannelDetail = {
    id: number;
    slug: string;
    display_name: string;
    description: string | null;
    is_live: boolean;
    viewer_count: number;
    followers_count: number;
    category: Category | null;
    owner: {
        id: number;
        name: string;
    };
};

export type BroadcastSummary = {
    id: number;
    title: string;
    status?: string;
    hls_url?: string | null;
    recording_enabled: boolean;
    started_at: string | null;
    ended_at?: string | null;
    has_vod?: boolean;
};

export type VodSummary = {
    id: number;
    title: string;
    playback_url: string | null;
    duration_seconds: number | null;
    published_at: string | null;
    expires_at: string | null;
};

export type ChatMessage = {
    id: number;
    body: string;
    created_at: string | null;
    user: {
        id: number;
        name: string;
    };
};
