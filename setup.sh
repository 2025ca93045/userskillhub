#!/bin/bash

PROJECT=userskillhub

mkdir -p $PROJECT/public
cd $PROJECT || exit 1

# ---------- package.json ----------
cat << 'EOF' > package.json
{
  "name": "userskillhub",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.0",
    "express": "^4.19.2",
    "express-session": "^1.17.3",
    "sqlite3": "^5.1.7"
  }
}
EOF

# ---------- db.js ----------
cat << 'EOF' > db.js
import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("./userskillhub.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT CHECK(role IN ('user','instructor'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      instructor_id INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS session_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      course_id INTEGER,
      status TEXT DEFAULT 'pending'
    )
  `);
});
EOF

# ---------- server.js ----------
cat << 'EOF' > server.js
import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { db } from "./db.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "userskillhub-secret",
  resave: false,
  saveUninitialized: false
}));

app.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (email,password,role) VALUES (?,?,?)",
    [email, hash, role || "user"],
    err => {
      if (err) return res.status(400).send("User exists");
      res.redirect("/auth.html");
    }
  );
});

app.post("/login", (req, res) => {
  db.get(
    "SELECT * FROM users WHERE email=?",
    [req.body.email],
    async (err, user) => {
      if (!user) return res.status(401).send("Invalid login");
      if (!(await bcrypt.compare(req.body.password, user.password)))
        return res.status(401).send("Invalid login");

      req.session.user = user;
      res.redirect("/dashboard.html");
    }
  );
});

app.get("/me", (req, res) => {
  res.json(req.session.user || null);
});

app.get("/users", (req, res) => {
  db.all("SELECT id,email,role FROM users", (_, rows) => res.json(rows));
});

app.get("/courses", (req, res) => {
  db.all(`
    SELECT c.id,c.title,u.email AS instructor
    FROM courses c
    JOIN users u ON u.id = c.instructor_id
  `, (_, rows) => res.json(rows));
});

app.post("/request", (req, res) => {
  if (!req.session.user) return res.sendStatus(401);

  db.run(
    "INSERT INTO session_requests (user_id,course_id) VALUES (?,?)",
    [req.session.user.id, req.body.course_id],
    () => res.send("Requested")
  );
});

app.get("/requests", (req, res) => {
  if (req.session.user?.role !== "instructor")
    return res.sendStatus(403);

  db.all(`
    SELECT sr.id,u.email AS student,c.title,sr.status
    FROM session_requests sr
    JOIN users u ON u.id = sr.user_id
    JOIN courses c ON c.id = sr.course_id
    WHERE c.instructor_id = ?
  `, [req.session.user.id], (_, rows) => res.json(rows));
});

app.post("/requests/:id/:status", (req, res) => {
  db.run(
    "UPDATE session_requests SET status=? WHERE id=?",
    [req.params.status, req.params.id],
    () => res.send("Updated")
  );
});

db.run(`
  INSERT OR IGNORE INTO courses (id,title,instructor_id)
  VALUES (1,'Intro to Web Development',1)
`);

app.listen(3000, () =>
  console.log("UserSkillHub running on http://0.0.0.0:3000")
);
EOF

# ---------- public/auth.html ----------
cat << 'EOF' > public/auth.html
<h2>Register</h2>
<form action="/register" method="post">
  <input name="email" placeholder="email" required />
  <input name="password" type="password" required />
  <select name="role">
    <option value="user">User</option>
    <option value="instructor">Instructor</option>
  </select>
  <button>Register</button>
</form>

<h2>Login</h2>
<form action="/login" method="post">
  <input name="email" required />
  <input name="password" type="password" required />
  <button>Login</button>
</form>
EOF

# ---------- public/dashboard.html ----------
cat << 'EOF' > public/dashboard.html
<h2>User Dashboard</h2>
<pre id="me"></pre>

<h3>Users</h3>
<ul id="users"></ul>

<h3>Courses</h3>
<ul id="courses"></ul>

<script>
async function load() {
  document.getElementById("me").textContent =
    JSON.stringify(await fetch("/me").then(r=>r.json()),null,2);

  (await fetch("/users").then(r=>r.json()))
    .forEach(u => users.innerHTML += `<li>${u.email} (${u.role})</li>`);

  (await fetch("/courses").then(r=>r.json()))
    .forEach(c => courses.innerHTML +=
      `<li>${c.title} - ${c.instructor}
       <button onclick="req(${c.id})">Request</button></li>`);
}

function req(id) {
  fetch("/request", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ course_id:id })
  });
}

load();
</script>
EOF

# ---------- public/instructor.html ----------
cat << 'EOF' > public/instructor.html
<h2>Instructor Requests</h2>
<ul id="list"></ul>

<script>
fetch("/requests").then(r=>r.json()).then(data => {
  data.forEach(r => {
    list.innerHTML += `
      <li>${r.student} → ${r.title} [${r.status}]
        <button onclick="act(${r.id},'accepted')">Accept</button>
        <button onclick="act(${r.id},'rejected')">Reject</button>
      </li>`;
  });
});

function act(id,s) {
  fetch(`/requests/${id}/${s}`, { method:"POST" });
}
</script>
EOF

echo "✅ UserSkillHub project created."
echo "➡️ Next steps:"
echo "   npm install"
echo "   node server.js"

