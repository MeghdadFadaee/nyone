# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS assets

WORKDIR /build

COPY runtime/source/package.json runtime/source/package-lock.json ./
RUN npm ci

COPY runtime/source/ ./
RUN npm run build

FROM php:8.4-apache-bookworm AS app

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
        pgsql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && a2enmod headers proxy proxy_http rewrite setenvif \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY runtime/source/composer.json runtime/source/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY runtime/source/ ./
COPY --from=assets /build/public/build ./public/build

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
