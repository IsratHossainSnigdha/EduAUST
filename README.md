# 🎓 EduAUST

> **Find the Perfect Tutor, Right on Campus.**

EduAUST is a web application developed exclusively for **Ahsanullah University of Science and Technology (AUST)**. The platform connects students who need academic assistance with qualified tutors from within the university, promoting peer-to-peer learning and making tutoring opportunities more accessible.

---

## 📚 Problem Statement

Many AUST students struggle to find reliable tutors for difficult courses. They often rely on friends, social media, or AI tools, while experienced senior students have limited opportunities to offer tutoring services.

EduAUST bridges this gap by providing a centralized platform where students can easily discover tutors based on specific courses or subjects.

---

## 💡 Solution

EduAUST enables students to:

- Search tutors by course or subject
- View tutor profiles and qualifications
- Filter tutors by department and availability
- Send tuition requests
- Manage tutoring requests

It also enables tutors to:

- Create tutor profiles
- List courses and subjects they teach
- Set availability
- Receive tutoring requests
- Manage their profiles
- Build credibility through ratings and reviews

---

## ✨ Features

### 👨‍🎓 Student

- User Registration & Login
- Search Tutors
- Course-wise Tutor Discovery
- View Tutor Profiles
- Send Tuition Requests
- Track Request Status
- Manage Profile

### 👨‍🏫 Tutor

- Become a Tutor
- Create Tutor Profile
- Manage Subjects & Availability
- Accept or Reject Tuition Requests
- View Student Requests
- Manage Personal Profile

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- React Router DOM
- CSS

### Backend

- PHP
- RESTful API

### Database

- MySQL

---

## 📁 Project Structure

```text
EduAUST/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar/
│   │   │   └── Footer/
│   │   ├── pages/
│   │   │   ├── LandingPage/
│   │   │   ├── LoginPage/
│   │   │   ├── SignUpPage/
│   │   │   ├── StudentDashboard/
│   │   │   ├── TutorDashboard/
│   │   │   ├── FindTutors/
│   │   │   ├── TutorProfile/
│   │   │   ├── BecomeTutor/
│   │   │   ├── MyRequests/
│   │   │   └── Profile/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── api/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── vendor/
│   ├── index.php
│   ├── .env
│   └── composer.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone <repository-url>
cd EduAUST
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

---

## Backend Setup

### Requirements

- PHP 8.x
- Composer
- MySQL

Install dependencies:

```bash
cd backend
composer install
```

Create a `.env` file inside the `backend` directory.

Example:

```env
DB_HOST=localhost
DB_NAME=eduaust
DB_USER=root
DB_PASS=
JWT_SECRET=your_secret_key
```

Start the PHP server:

```bash
php -S localhost:8000
```

The backend API will be available at:

```text
http://localhost:8000
```

---

## 📄 Current Pages

| Page | Route |
|------|-------|
| Landing Page | `/` |
| Login | `/login` |
| Sign Up | `/signup` |
| Student Dashboard | `/student-dashboard` |
| Tutor Dashboard | `/tutor-dashboard` |
| Find Tutors | `/find-tutors` |
| Tutor Profile | `/tutor/:id` |
| Become Tutor | `/become-tutor` |
| My Requests | `/my-requests` |
| Profile | `/profile` |

---

## 👥 Team

- **Israt Hossain Snigdha**
- **Shaikh Tashrik Halim Samudra**
- **Ishrat Jahan Ifa**

---

## 🤝 Contributing

Before starting any task:

```bash
git pull origin main
git checkout -b feature/your-feature-name
```

After completing your work:

```bash
git add .
git commit -m "feat: your feature"
git push origin feature/your-feature-name
```

Then open a Pull Request for review.

---

## 📌 Git Ignore

```gitignore
# Frontend
frontend/node_modules/
frontend/dist/
.vite/

# Backend
backend/vendor/
backend/.env

# General
coverage/
.DS_Store
```

---

## 📜 License

This project is developed as part of the **Software Engineering** course at **Ahsanullah University of Science and Technology (AUST)**.

---

# 🎯 Vision

Our vision is to build a trusted academic platform where every AUST student can easily find the right tutor, enhance their academic performance, and strengthen peer-to-peer learning through meaningful collaboration.