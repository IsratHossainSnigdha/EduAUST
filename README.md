# 🎓 EduAUST

> **Find the Perfect Tutor, Right on Campus.**

EduAUST is a web application developed for **Ahsanullah University of Science and Technology (AUST)** to connect students with qualified peer tutors.

---

## ✨ Features

### 👨‍🎓 Student
- Registration & Login
- Search and filter tutors
- View tutor profiles
- Send tuition requests
- Track requests
- Manage profile

### 👨‍🏫 Tutor
- Become a tutor
- Create tutor profile
- Select teaching subjects
- Manage availability
- Accept/reject tuition requests
- Manage profile

---

## 🛠️ Tech Stack

**Frontend**
- React
- Vite
- React Router DOM
- Tailwind CSS

**Backend**
- Laravel / PHP
- REST API

**Database**
- MySQL 8.4

**Development Environment**
- Docker
- Docker Compose

---

## 🐳 Docker Setup

EduAUST uses **Docker Compose** to run the frontend, Laravel backend, and MySQL database in separate containers.

### Docker Services

| Service | Container | Port |
|--------|-----------|------|
| Frontend | `eduaust-frontend` | `5173` |
| Backend | `eduaust-backend` | `8000` |
| MySQL | `eduaust-mysql` | `3307` |

> **Note:** MySQL uses port `3307` on the host, while Laravel connects to MySQL internally using port `3306`.

### Prerequisites

Make sure you have installed:

- Docker Desktop
- Git

Docker Desktop must be running before starting the project.

### Start the Project

From the project root:

```bash
docker compose up -d --build
```

Check the running containers:

```bash
docker ps
```

You should see:

```text
eduaust-frontend
eduaust-backend
eduaust-mysql
```

### Run Database Migrations

After the containers are running:

```bash
docker exec -it eduaust-backend php artisan migrate
```

### Seed the Database

Populate departments, subjects, demo users, tutors, and students:

```bash
docker exec -it eduaust-backend php artisan db:seed
```

### Access the Application

Frontend:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:8000
```

MySQL:

```text
Host: localhost
Port: 3307
Database: eduaust
Username: eduaust
Password: password
```

---

## 🔧 Useful Docker Commands

### Start containers

```bash
docker compose up -d
```

### Stop containers

```bash
docker compose down
```

### Rebuild containers

```bash
docker compose up -d --build
```

### View running containers

```bash
docker ps
```

### View container logs

Backend:

```bash
docker logs eduaust-backend
```

Frontend:

```bash
docker logs eduaust-frontend
```

MySQL:

```bash
docker logs eduaust-mysql
```

### Access Laravel container

```bash
docker exec -it eduaust-backend sh
```

### Run Laravel Artisan commands

```bash
docker exec -it eduaust-backend php artisan <command>
```

For example:

```bash
docker exec -it eduaust-backend php artisan migrate:status
```

### Access MySQL

```bash
docker exec -it eduaust-mysql mysql -u eduaust -ppassword
```

---

## 🗄️ Database

The project uses **MySQL 8.4** inside a Docker container.

Laravel connects to MySQL using the Docker service name:

```env
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=eduaust
DB_USERNAME=eduaust
DB_PASSWORD=password
```

> `DB_HOST=db` is used because Laravel communicates with the MySQL container through the Docker network. Do not use `localhost` for the Laravel-to-MySQL connection.

Database migrations are stored in:

```text
backend/database/migrations/
```

Database seeders are stored in:

```text
backend/database/seeders/
```

The main `DatabaseSeeder` runs:

- DepartmentSeeder
- SubjectSeeder
- DemoUserSeeder
- TutorSeeder
- StudentSeeder

---

## 🧪 Demo Account

For testing without an AUST student account:

```text
Email: demo.student@aust.edu
Password: password
Student ID: DEMO001
```

> The demo account uses an `@aust.edu` email because EduAUST only accepts valid AUST email addresses.

Create the demo and development data with:

```bash
docker exec -it eduaust-backend php artisan db:seed
```

If you get a duplicate `DEMO001` error, the demo account already exists in the database.

---

## 📌 Main Routes

| Page | Route |
|------|-------|
| Landing | `/` |
| Login | `/login` |
| Sign Up | `/signup` |
| Student Dashboard | `/dashboard` |
| Find Tutors | `/find-tutors` |
| Become a Tutor | `/become-a-tutor` |
| Tutor Dashboard | `/tutor-dashboard` |
| Tutor Requests | `/tutor-requests` |
| Messages | `/messages` |
| Notifications | `/notifications` |
| Settings | `/settings` |
| Support | `/support` |

---

## 👥 Team

- Israt Hossain Snigdha
- Shaikh Tashrik Halim Samudra
- Ishrat Jahan Ifa

---

## 🤝 Contributing

Pull the latest changes:

```bash
git pull origin main
```

Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

Make your changes and commit:

```bash
git add .
git commit -m "feat: your-feature-name"
```

Push your branch:

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request targeting `main`.

---

## 📜 License

Developed as part of the **Software Engineering course** at **Ahsanullah University of Science and Technology (AUST)**.