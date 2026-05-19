# syntax=docker/dockerfile:1

FROM php:8.4-apache-bookworm AS php-base

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    COMPOSER_ALLOW_SUPERUSER=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gettext-base \
        git \
        gosu \
        libicu-dev \
        libcurl4-openssl-dev \
        libonig-dev \
        libpq-dev \
        libsqlite3-dev \
        libzip-dev \
        netcat-openbsd \
        unzip \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        curl \
        intl \
        mbstring \
        opcache \
        pcntl \
        pdo_pgsql \
        pdo_sqlite \
        pgsql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && a2enmod headers proxy proxy_http rewrite setenvif \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

FROM php-base AS composer-deps

COPY runtime/source/composer.json runtime/source/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

FROM php-base AS assets

ENV APP_NAME=Nyone \
    APP_ENV=production \
    APP_DEBUG=false \
    APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA \
    APP_URL=http://localhost \
    LOG_CHANNEL=stderr \
    DB_CONNECTION=sqlite \
    DB_DATABASE=:memory: \
    CACHE_STORE=array \
    SESSION_DRIVER=array \
    QUEUE_CONNECTION=sync \
    MAIL_MAILER=log \
    BROADCAST_CONNECTION=log \
    FILESYSTEM_DISK=local \
    VITE_APP_NAME=Nyone \
    STREAMING_VIEWER_COUNT_CACHE_STORE=array \
    MEDIAMTX_SHARED_SECRET=build-time-secret

COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

COPY runtime/source/composer.json runtime/source/composer.lock ./
COPY --from=composer-deps /var/www/html/vendor ./vendor

COPY runtime/source/package.json runtime/source/package-lock.json ./
RUN npm ci

COPY runtime/source/ ./
RUN mkdir -p \
        storage/app/private/recordings \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi \
    && php artisan route:clear \
    && php artisan wayfinder:generate --with-form --no-interaction \
    && npm run build

FROM php-base AS app

COPY runtime/source/composer.json runtime/source/composer.lock ./
COPY --from=composer-deps /var/www/html/vendor ./vendor

COPY runtime/source/ ./
COPY --from=assets /var/www/html/public/build ./public/build

COPY docker/app/apache/nyone.conf.template /etc/apache2/sites-available/nyone.conf.template
COPY docker/app/php/production.ini /usr/local/etc/php/conf.d/production.ini
COPY docker/app/entrypoint.sh /usr/local/bin/nyone-entrypoint

RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi \
    && mkdir -p \
        storage/app/private/recordings \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod +x /usr/local/bin/nyone-entrypoint

ENTRYPOINT ["nyone-entrypoint"]
CMD ["app"]
