import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rolldownOptions: {
            checks: {
                pluginTimings: false,
            },
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'react-vendor',
                            test: /node_modules[\\/](react|react-dom)[\\/]/,
                            priority: 40,
                        },
                        {
                            name: 'inertia-vendor',
                            test: /node_modules[\\/]@inertiajs[\\/]/,
                            priority: 35,
                        },
                        {
                            name: 'radix-vendor',
                            test: /node_modules[\\/]@radix-ui[\\/]/,
                            priority: 30,
                        },
                        {
                            name: 'hls-vendor',
                            test: /node_modules[\\/]hls\.js[\\/]/,
                            priority: 30,
                        },
                        {
                            name: 'ui-vendor',
                            test: /node_modules[\\/](lucide-react|sonner|class-variance-authority|clsx|tailwind-merge)[\\/]/,
                            priority: 20,
                        },
                    ],
                },
            },
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
});
