# EduAUST Backend

Backend API for **EduAUST**, a platform that connects AUST students with qualified tutors. This project is built with **Laravel 12** and provides RESTful APIs for authentication, tutor management, tuition requests, and other backend services.

---

## Tech Stack

* Laravel 12
* PHP 8.3+
* SQLite (Development)
* Laravel Sanctum
* Composer

---

## Prerequisites

Before running the project, ensure you have:

* PHP 8.3 or later
* Composer
* Git

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd backend
```

### 2. Install dependencies

```bash
composer install
```

### 3. Copy the environment file

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 4. Generate the application key

```bash
php artisan key:generate
```

### 5. Configure the database

This project uses **SQLite** for local development.

Create the SQLite database if it does not already exist:

```bash
type nul > database/database.sqlite
```

Update the `.env` file if necessary.

### 6. Run the migrations

```bash
php artisan migrate
```

### 7. Start the development server

```bash
php artisan serve
```

The backend will be available at:

```
http://127.0.0.1:8000
```

---

## Available Commands

Run migrations:

```bash
php artisan migrate
```

List all routes:

```bash
php artisan route:list
```

Clear configuration cache:

```bash
php artisan optimize:clear
```

Run the test suite:

```bash
php artisan test
```

---

## Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   ├── Middleware/
│   └── Requests/
├── Models/
├── Providers/
└── Services/

config/
database/
public/
resources/
routes/
storage/
tests/
```

---

## Authentication

The backend uses **Laravel Sanctum** for API authentication.

---

## Development Notes

* Follow the project's coding conventions.
* Keep API routes inside `routes/api.php`.
* Place business logic inside the `Services` directory when appropriate.
* Keep controllers lightweight by delegating business logic to services.

---

## License

This project is developed for the **EduAUST** academic project.
