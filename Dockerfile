FROM php:8.3-fpm-alpine

RUN apk update && apk add --no-cache \
    pcre-dev \
    ${PHPIZE_DEPS} \
    nginx \
    supervisor \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    postgresql-dev \
    libpng \
    libjpeg-turbo \
    freetype \
    postgresql-client \
    libpq \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_pgsql \
    && pecl install redis-6.0.2 \
    && docker-php-ext-enable redis \
    && apk del --no-cache \
        pcre-dev \
        ${PHPIZE_DEPS} \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        postgresql-dev

COPY php.ini /usr/local/etc/php/conf.d/php.ini
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html/storage

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]