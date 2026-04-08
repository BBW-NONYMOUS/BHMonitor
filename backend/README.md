# Backend (Laravel API)

Laravel API backend for the SUDO BH application.

## Requirements

- PHP 8.3+
- Composer
- MySQL/PostgreSQL/SQLite

## Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

## Development

```bash
# Start the API server
php artisan serve

# Or use composer script
composer dev
```

The API will be available at `http://localhost:8000`

## Testing

```bash
composer test
```
