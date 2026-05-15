# Nginx Deployment Notes

These configs match the current project domains:

- App: `https://nyone.net`
- HLS playback: `https://nyone-hls.net`
- OBS ingest: `rtmp://nyone.net:19935`

MediaMTX stays private on local ports:

- RTMP ingest: `0.0.0.0:19935` directly through MediaMTX
- HLS: `127.0.0.1:19988`

Install layout on Ubuntu/Debian:

```bash
sudo cp deploy/nginx/nyone-app.conf /etc/nginx/sites-available/nyone-app.conf
sudo cp deploy/nginx/nyone-hls.conf /etc/nginx/sites-available/nyone-hls.conf
sudo ln -s /etc/nginx/sites-available/nyone-app.conf /etc/nginx/sites-enabled/nyone-app.conf
sudo ln -s /etc/nginx/sites-available/nyone-hls.conf /etc/nginx/sites-enabled/nyone-hls.conf
```

Check and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Make sure DNS points both hostnames to the server:

- `nyone.net`
- `nyone-hls.net`

The Laravel `.env` should use:

```env
APP_URL=https://nyone.net
STREAMING_RTMP_INGEST_URL=rtmp://nyone.net:19935
STREAMING_HLS_PUBLIC_URL=https://nyone-hls.net
MEDIAMTX_SHARED_SECRET=change-this-secret
```

Open TCP `19935` on the server firewall for OBS ingest. Nginx is only proxying the Laravel app and HLS HTTPS playback in this setup.
