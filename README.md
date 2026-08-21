Absolutely — here’s a **smaller, cleaner README** that includes the demo account information and setup without all the extra detail:

````markdown
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
- MySQL

---

## 🚀 Setup

### Clone

```bash
git clone <repository-url>
cd EduAUST
````

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### Backend

```bash
cd backend
composer install
php artisan migrate
php artisan db:seed
php artisan serve
```

Backend: `http://127.0.0.1:8000`

Create a `.env` file in `backend/` and configure your database:

```env
DB_DATABASE=eduaust
DB_USERNAME=root
DB_PASSWORD=
```

---

## 🧪 Demo Account

For testing without an AUST student account:

```text
Email: demo.student@aust.edu
Password: password
Student ID: DEMO001
```

> The demo account uses an `@aust.edu` email because EduAUST only accepts valid AUST email addresses.

To create the demo account:

```bash
php artisan db:seed
```

If you get a duplicate `DEMO001` error, the demo account already exists in the database.

---

## 📌 Main Routes

| Page              | Route              |
| ----------------- | ------------------ |
| Landing           | `/`                |
| Login             | `/login`           |
| Sign Up           | `/signup`          |
| Student Dashboard | `/dashboard`       |
| Find Tutors       | `/find-tutors`     |
| Become a Tutor    | `/become-a-tutor`  |
| Tutor Dashboard   | `/tutor-dashboard` |
| Tutor Requests    | `/tutor-requests`  |
| Messages          | `/messages`        |
| Notifications     | `/notifications`   |
| Settings          | `/settings`        |
| Support           | `/support`         |

---

## 👥 Team

* Israt Hossain Snigdha
* Shaikh Tashrik Halim Samudra
* Ishrat Jahan Ifa

---

## 🤝 Contributing

```bash
git pull origin main
git checkout -b feature/your-feature-name
git add .
git commit -m "feat: your-feature-name"
git push origin feature/your-feature-name
```

Then open a Pull Request.

---

## 📜 License

Developed as part of the **Software Engineering course** at **Ahsanullah University of Science and Technology (AUST)**.

```
```
