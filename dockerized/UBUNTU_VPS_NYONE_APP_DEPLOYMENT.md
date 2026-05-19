# Fresh Ubuntu VPS Deployment for nyone.app

This guide explains how to deploy Nyone from only the `dockerized/` folder on a fresh Ubuntu VPS.

It assumes:

- App domain: `nyone.app`
- HLS playback domain: `hls.nyone.app`
- RTMP ingest URL: `rtmp://nyone.app:1935`
- Docker Apache is private on `127.0.0.1:8080`
- Host Nginx handles public HTTP, HTTPS, and SSL certificates

The application repository itself does not need to exist on the server before deployment. The deploy script clones it into `dockerized/runtime/source`.

## 1. Point DNS to the VPS

Create DNS records before requesting SSL certificates:

```text
nyone.app      A      <VPS_PUBLIC_IPV4>
hls.nyone.app  A      <VPS_PUBLIC_IPV4>
```

If your DNS provider has an HTTP proxy mode, make sure TCP `1935` still reaches the VPS directly for RTMP. With Cloudflare, that usually means the RTMP hostname must be DNS-only, not proxied.

Wait until DNS resolves from the VPS or your local machine:

```bash
dig +short nyone.app
dig +short hls.nyone.app
```

## 2. SSH into the VPS

```bash
ssh root@<VPS_PUBLIC_IPV4>
```

Update the server:

```bash
apt-get update
apt-get upgrade -y
apt-get install -y ca-certificates curl git gnupg lsb-release nginx openssl snapd ufw unzip zip
```

## 3. Configure the firewall

Allow SSH, HTTP/HTTPS, and RTMP:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 1935/tcp
ufw --force enable
ufw status
```

Docker can publish container ports outside some UFW rules. In this deployment, Apache is bound to `127.0.0.1:8080`, while RTMP is intentionally public on `1935`.

## 4. Install Docker Engine and Compose plugin

Remove conflicting packages if they exist:

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
    apt-get remove -y "$pkg" || true
done
```

Install Docker from Docker's official Ubuntu apt repository:

```bash
apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker run hello-world
```

## 5. Copy only the dockerized folder to the server

Create the deployment directory on the VPS:

```bash
mkdir -p /opt/nyone
```

From your local machine, copy the folder:

```bash
rsync -av --exclude '.env' --exclude 'runtime' dockerized/ root@<VPS_PUBLIC_IPV4>:/opt/nyone/dockerized/
```

Back on the VPS:

```bash
cd /opt/nyone/dockerized
cp .env.example .env
chmod +x scripts/deploy.sh
chmod +x scripts/backup.sh
```

## 6. Configure dockerized/.env

Edit the Docker deployment environment:

```bash
nano /opt/nyone/dockerized/.env
```

Use these values for `nyone.app`:

```env
COMPOSE_PROJECT_NAME=nyone

GIT_REPOSITORY_URL=git@github.com:your-org/nyone.git
GIT_REF=main

PUBLIC_SCHEME=https
APP_DOMAIN=nyone.app
HLS_DOMAIN=hls.nyone.app
APP_HTTP_PORT=127.0.0.1:8080
RTMP_PUBLIC_PORT=1935

APP_NAME=Nyone
APP_ENV=production
APP_DEBUG=false

POSTGRES_DB=nyone
POSTGRES_USER=nyone

SEED_DATABASE=false
APP_OPTIMIZE_ON_BOOT=true
QUEUE_NAMES=default
```

Leave these empty on first deploy if you want the deploy script to generate them:

```env
APP_KEY=
POSTGRES_PASSWORD=
MEDIAMTX_SHARED_SECRET=
```

If the repository is public, you can use an HTTPS clone URL instead:

```env
GIT_REPOSITORY_URL=https://github.com/your-org/nyone.git
```

If `GIT_REPOSITORY_URL` is private, install a deploy key on the VPS:

```bash
ssh-keygen -t ed25519 -C "nyone-vps-deploy" -f ~/.ssh/nyone_deploy
cat ~/.ssh/nyone_deploy.pub
```

Add the printed public key as a read-only deploy key in the Git provider, then configure SSH:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/nyone_deploy
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config ~/.ssh/nyone_deploy
```

Confirm Git access:

```bash
ssh -T git@github.com
```

## 7. Run the Docker deployment

```bash
cd /opt/nyone/dockerized
./scripts/deploy.sh
```

The script will clone the app into `runtime/source`, build the images, run migrations, and start:

- `app`
- `db`
- `redis`
- `mediamtx`
- `queue`
- `scheduler`
- `viewer-sync`

Check status:

```bash
docker compose --env-file .env -f docker-compose.yml ps
docker compose --env-file .env -f docker-compose.yml logs --tail=100 app
docker compose --env-file .env -f docker-compose.yml logs --tail=100 mediamtx
```

## 8. Install Certbot

Install Certbot through snap:

```bash
snap install core
snap refresh core
apt-get remove -y certbot || true
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/local/bin/certbot
```

Create the webroot used for certificate challenges:

```bash
mkdir -p /var/www/certbot
```

## 9. Create temporary Nginx config for SSL issuance

```bash
tee /etc/nginx/sites-available/nyone-temp.conf >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name nyone.app hls.nyone.app;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "nyone certificate setup\n";
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf /etc/nginx/sites-available/nyone-temp.conf /etc/nginx/sites-enabled/nyone-temp.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Request the certificate:

```bash
certbot certonly --webroot \
    -w /var/www/certbot \
    -d nyone.app \
    -d hls.nyone.app
```

The certificate files should be under:

```text
/etc/letsencrypt/live/nyone.app/fullchain.pem
/etc/letsencrypt/live/nyone.app/privkey.pem
```

## 10. Install final Nginx proxy config

```bash
tee /etc/nginx/sites-available/nyone.conf >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name nyone.app hls.nyone.app;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name nyone.app;

    ssl_certificate /etc/letsencrypt/live/nyone.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nyone.app/privkey.pem;

    client_max_body_size 100M;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 120s;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name hls.nyone.app;

    ssl_certificate /etc/letsencrypt/live/nyone.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nyone.app/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
        proxy_set_header X-Forwarded-Proto https;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate" always;
    }
}
EOF

ln -sf /etc/nginx/sites-available/nyone.conf /etc/nginx/sites-enabled/nyone.conf
rm -f /etc/nginx/sites-enabled/nyone-temp.conf
nginx -t
systemctl reload nginx
```

## 11. Test certificate renewal

```bash
certbot renew --dry-run
```

## 12. Verify the deployment

Check the app health endpoint:

```bash
curl -I https://nyone.app/up
```

Check container status:

```bash
cd /opt/nyone/dockerized
docker compose --env-file .env -f docker-compose.yml ps
```

Check database migrations:

```bash
docker compose --env-file .env -f docker-compose.yml exec app php artisan migrate:status
```

Run one viewer-count sync pass:

```bash
docker compose --env-file .env -f docker-compose.yml exec app php artisan streaming:sync-viewer-counts --once -v
```

Check that MediaMTX API is not exposed on the host. This should fail because the API is only available inside the Docker network:

```bash
curl -I http://127.0.0.1:9997/v3/config/get
```

Do not expose port `9997` on the public firewall.

## 13. OBS and playback values

Creators should use:

```text
OBS server: rtmp://nyone.app:1935
OBS stream key: <channel-slug>?token=<generated-stream-key>
```

Viewer playback URLs generated by Laravel should look like:

```text
https://hls.nyone.app/<channel-slug>/index.m3u8
```

## 14. Redeploy after app changes

When the Git branch changes:

```bash
cd /opt/nyone/dockerized
./scripts/deploy.sh
```

Useful logs:

```bash
docker compose --env-file .env -f docker-compose.yml logs -f app
docker compose --env-file .env -f docker-compose.yml logs -f queue
docker compose --env-file .env -f docker-compose.yml logs -f scheduler
docker compose --env-file .env -f docker-compose.yml logs -f viewer-sync
docker compose --env-file .env -f docker-compose.yml logs -f mediamtx
```

## 15. Create a restore-ready backup

Run backups from the Dockerized deployment directory:

```bash
cd /opt/nyone/dockerized
./scripts/backup.sh
```

For the safest storage and recording snapshot, use a maintenance window and stop writer services while the backup runs:

```bash
./scripts/backup.sh --stop-writers
```

The final archive is written to:

```text
/opt/nyone/dockerized/backups/nyone-backup-YYYYMMDD-HHMMSS.zip
```

Copy that one zip file off the VPS. It contains the Dockerized deployment files, `.env`, source checkout, PostgreSQL dump, app storage, Redis data, checksums, restore notes, and a restore helper.

Restore on a fresh Ubuntu VPS after installing Docker and copying the zip:

```bash
unzip nyone-backup-YYYYMMDD-HHMMSS.zip
cd nyone-backup-YYYYMMDD-HHMMSS
chmod +x restore.sh
./restore.sh /opt/nyone/dockerized
```

If `/opt/nyone/dockerized` already exists and you intentionally want to replace it:

```bash
./restore.sh --replace /opt/nyone/dockerized
```

Host-level Nginx files and Let's Encrypt certificates live outside `dockerized/`, so recreate or back them up separately.

## References

- Docker Engine on Ubuntu: https://docs.docker.com/engine/install/ubuntu/
- Certbot Nginx instructions: https://certbot.eff.org/instructions
- Laravel trusted proxy behavior: https://laravel.com/docs/13.x/requests#configuring-trusted-proxies
