import Hls from 'hls.js/light';
import { useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/translations';

export function VideoPlayer({
    src,
    title,
}: {
    src: string | null;
    title: string;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const video = videoRef.current;

        if (!video || !src) {
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;

            return;
        }

        if (!Hls.isSupported()) {
            return;
        }

        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(video);

        return () => {
            hls.destroy();
        };
    }, [src]);

    if (!src) {
        return (
            <div className="flex aspect-video w-full items-center justify-center bg-neutral-950 text-sm text-neutral-300">
                {t('Offline')}
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            className="aspect-video w-full bg-black"
            controls
            playsInline
            title={title}
        />
    );
}
