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

* Search tutors by course or subject
* View tutor profiles and qualifications
* Filter tutors by department and availability
* Contact tutors directly

It also enables tutors to:

* Create tutor profiles
* List courses and subjects they teach
* Set availability
* Receive tutoring requests
* Build credibility through ratings and reviews

---

## ✨ Features

### 👨‍🎓 Student

* User Registration & Login
* Search Tutors
* Course-wise Tutor Discovery
* View Tutor Profiles
* Send Tuition Requests
* Manage Profile

### 👨‍🏫 Tutor

* Become a Tutor
* Create Tutor Profile
* Manage Availability
* Accept Tuition Requests
* View Student Requests
* Manage Personal Profile

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* React Router DOM
* CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB

---

## 📁 Project Structure

```text
EduAUST/
│
├── frontend/
│   ├── src/
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── Navbar/
│   │   └── Footer/
│   │
│   ├── pages/
│   │   ├── LandingPage/
│   │   ├── LoginPage/
│   │   ├── SignUpPage/
│   │   ├── StudentDashboard/
│   │   ├── TutorDashboard/
│   │   ├── FindTutors/
│   │   ├── TutorProfile/
│   │   ├── BecomeTutor/
│   │   ├── MyRequests/
│   │   └── Profile/
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── backend/
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

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on:

```text
http://localhost:5173
```

---

### Backend

```bash
cd backend
npm install
npm run dev
```

Create a `.env` file inside the backend directory before starting the server.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## 📄 Current Pages

| Page              | Route                |
| ----------------- | -------------------- |
| Landing Page      | `/`                  |
| Login             | `/login`             |
| Sign Up           | `/signup`            |
| Student Dashboard | `/student-dashboard` |
| Tutor Dashboard   | `/tutor-dashboard`   |
| Find Tutors       | `/find-tutors`       |
| Tutor Profile     | `/tutor/:id`         |
| Become Tutor      | `/become-tutor`      |
| My Requests       | `/my-requests`       |
| Profile           | `/profile`           |

---

## 👥 Team

* **Israt Hossain Snigdha**
* **Shaikh Tashrik Halim Samudra**
* **Ishrat Jahan Ifa**

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

Ensure the following files are ignored:

```gitignore
node_modules/
.env
dist/
.vite/
coverage/
```

---

## 📜 License

This project is developed as part of a Software Engineering course project at **Ahsanullah University of Science and Technology (AUST)**.

---

# 🎯 Vision

Our vision is to create a trusted academic community where every AUST student can easily find the right tutor, improve their academic performance, and strengthen collaboration through peer learning.
