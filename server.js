import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";

const app = express();
const db = new sqlite3.Database("./userskillhub.db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "userskillhub-secret",
  resave: false,
  saveUninitialized: false
}));

// -------- Authentication --------
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
  db.get("SELECT * FROM users WHERE email=?", [req.body.email], async (err, user) => {
    if (!user) return res.status(401).send("Invalid login");
    if (!(await bcrypt.compare(req.body.password, user.password)))
      return res.status(401).send("Invalid login");

    req.session.user = user;
    res.redirect(user.role === "instructor" ? "/instructor.html" : "/dashboard.html");
  });
});

app.get("/me", (req, res) => res.json(req.session.user || null));

// -------- Student Endpoints --------
app.get("/users", (_, res) => {
  db.all("SELECT id,email,role FROM users", (_, rows) => res.json(rows));
});

app.get("/courses", (_, res) => {
  db.all(`
    SELECT c.id, c.title, u.email AS instructor
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

app.get("/student-sessions", (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  db.all(`
    SELECT sr.id, c.title, sr.status
    FROM session_requests sr
    JOIN courses c ON sr.course_id = c.id
    WHERE sr.user_id = ?
  `, [req.session.user.id], (_, rows) => res.json(rows));
});

// -------- Instructor Endpoints --------
app.get("/requests", (req, res) => {
  if (!req.session.user || req.session.user.role !== "instructor")
    return res.sendStatus(403);
  db.all(`
    SELECT sr.id, u.email AS student, c.title, sr.status
    FROM session_requests sr
    JOIN users u ON u.id = sr.user_id
    JOIN courses c ON c.id = sr.course_id
    WHERE c.instructor_id = ?
  `, [req.session.user.id], (_, rows) => res.json(rows));
});

app.post("/requests/:id/:status", (req, res) => {
  const { id, status } = req.params;
  if (!["accepted","rejected"].includes(status)) return res.status(400).send("Invalid status");
  db.run(
    "UPDATE session_requests SET status=? WHERE id=?",
    [status, id],
    function(err) {
      if (err) return res.status(500).send("DB error");
      res.send({ updated: this.changes });
    }
  );
});

app.listen(3000, () =>
  console.log("✅ UserSkillHub running at http://localhost:3000")
);

