# 🪐 Uni Verse – Student Productivity App

A beginner-friendly web application based on the Uni Verse mini project synopsis.

## 📁 Project Structure

```
universe/
├── index.html        ← Main app file (open this!)
├── css/
│   └── style.css     ← All styling
├── js/
│   └── app.js        ← All logic (JavaScript)
└── README.md         ← This file
```

## 🚀 How to Run

**No installation needed!**

1. Unzip the downloaded folder
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge)
3. That's it! The app runs entirely in your browser.

## ✨ Features

| Module | What it does |
|---|---|
| 🏠 Dashboard | Overview of all modules + smart alerts |
| 📅 Attendance | Add subjects, track attendance %, see warnings below 75% |
| 💰 Expenses | Set a monthly budget, add expenses, see balance |
| ✅ Tasks | Add tasks with due dates, mark done, delete |
| 🧠 Mood | Log daily mood, burnout risk detection |

## 💾 Data Storage

- All data is saved in your browser's **localStorage**
- No internet or server required
- Data persists between sessions (closing & reopening the browser)
- To reset all data: open browser DevTools → Application → Local Storage → Clear

## 🛠 Technologies Used

- **HTML** – Structure
- **CSS** – Styling (dark theme, responsive)
- **JavaScript** – Logic & localStorage

## 📌 Notes for Students

- This is a **frontend-only** demo version. For the full project described in the synopsis, you would add a Flutter mobile app + Firebase backend.
- All alert logic (attendance < 75%, budget exceeded, burnout detection) mirrors the use cases described in the synopsis.
