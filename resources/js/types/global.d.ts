import type { Auth } from '@/types/auth';
import type { Translations } from '@/types/localization';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            fallbackLocale: string;
            locale: string;
            sidebarOpen: boolean;
            translations: Translations;
            [key: string]: unknown;
        };
    }
}
