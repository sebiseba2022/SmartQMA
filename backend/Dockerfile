FROM php:8.4-cli-alpine

# Instalare dependinte de sistem si biblioteci PostgreSQL
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    linux-headers

# Instalare extensii PHP necesare pentru Laravel si PostgreSQL
RUN docker-php-ext-install pdo pdo_pgsql pgsql pcntl bcmath zip

# Copiere composer din imaginea oficiala
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

EXPOSE 8000

CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=8000"]
