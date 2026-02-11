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

// -------- Skills & UserSkills Endpoints --------
app.get('/skills', (_, res) => {
  db.all('SELECT id,name FROM skills', (_, rows) => res.json(rows));
});

app.post('/skills', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send('Missing name');
  db.run('INSERT OR IGNORE INTO skills (name) VALUES (?)', [name], function(err) {
    if (err) return res.status(500).send('DB error');
    // return the skill (new or existing)
    db.get('SELECT id,name FROM skills WHERE name=?', [name], (_, row) => res.json(row));
  });
});

app.get('/user-skills', (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  db.all(`
    SELECT us.id, s.name, us.level, us.description
    FROM user_skills us
    JOIN skills s ON s.id = us.skill_id
    WHERE us.user_id = ?
  `, [req.session.user.id], (_, rows) => res.json(rows));
});

app.post('/user-skills', async (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  const { name, level, description } = req.body;
  if (!name || !level) return res.status(400).send('Missing fields');

  // Ensure skill exists (create if needed)
  db.get('SELECT id FROM skills WHERE name=?', [name], (err, skill) => {
    if (err) return res.status(500).send('DB error');
    function createUserSkill(skillId) {
      db.run(
        'INSERT INTO user_skills (user_id,skill_id,level,description) VALUES (?,?,?,?)',
        [req.session.user.id, skillId, level, description || ''],
        function(err) {
          if (err) return res.status(500).send('DB error');
          db.get('SELECT us.id, s.name, us.level, us.description FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.id=?', [this.lastID], (_, row) => res.json(row));
        }
      );
    }

    if (skill) {
      createUserSkill(skill.id);
    } else {
      db.run('INSERT INTO skills (name) VALUES (?)', [name], function(err) {
        if (err) return res.status(500).send('DB error');
        createUserSkill(this.lastID);
      });
    }
  });
});

app.put('/user-skills/:id', (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  const { id } = req.params;
  const { level, description } = req.body;
  db.get('SELECT * FROM user_skills WHERE id=? AND user_id=?', [id, req.session.user.id], (err, row) => {
    if (err) return res.status(500).send('DB error');
    if (!row) return res.sendStatus(404);
    db.run('UPDATE user_skills SET level=?, description=? WHERE id=?', [level || row.level, description || row.description, id], function(err) {
      if (err) return res.status(500).send('DB error');
      res.send({ updated: this.changes });
    });
  });
});

app.delete('/user-skills/:id', (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  const { id } = req.params;
  db.run('DELETE FROM user_skills WHERE id=? AND user_id=?', [id, req.session.user.id], function(err) {
    if (err) return res.status(500).send('DB error');
    res.send({ deleted: this.changes });
  });
});

// -------- Browse Skills Endpoints --------
app.get('/browse-skills', (req, res) => {
  db.all(`
    SELECT us.id, u.id AS user_id, u.email, s.name, us.level, us.description
    FROM user_skills us
    JOIN users u ON u.id = us.user_id
    JOIN skills s ON s.id = us.skill_id
    ORDER BY s.name, u.email
  `, (_, rows) => res.json(rows || []));
});

// -------- Course Skills Endpoints --------
app.get('/courses/:id/skills', (req, res) => {
  const { id } = req.params;
  db.all(`
    SELECT cs.id, s.id AS skill_id, s.name
    FROM course_skills cs
    JOIN skills s ON s.id = cs.skill_id
    WHERE cs.course_id = ?
  `, [id], (_, rows) => res.json(rows || []));
});

app.post('/courses/:id/skills', (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  const { id } = req.params;
  const { skill_id } = req.body;
  
  if (!skill_id) return res.status(400).send('Missing skill_id');
  
  // Check if user is the instructor of this course
  db.get('SELECT instructor_id FROM courses WHERE id=?', [id], (err, course) => {
    if (err) return res.status(500).send('DB error');
    if (!course || course.instructor_id !== req.session.user.id) return res.sendStatus(403);
    
    db.run('INSERT INTO course_skills (course_id,skill_id) VALUES (?,?)', [id, skill_id], function(err) {
      if (err) return res.status(500).send('DB error or duplicate');
      db.get('SELECT cs.id, s.name FROM course_skills cs JOIN skills s ON s.id=cs.skill_id WHERE cs.id=?', [this.lastID], (_, row) => res.json(row));
    });
  });
});

app.delete('/courses/:id/skills/:skillId', (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  const { id, skillId } = req.params;
  
  // Check if user is the instructor
  db.get('SELECT instructor_id FROM courses WHERE id=?', [id], (err, course) => {
    if (err) return res.status(500).send('DB error');
    if (!course || course.instructor_id !== req.session.user.id) return res.sendStatus(403);
    
    db.run('DELETE FROM course_skills WHERE course_id=? AND skill_id=?', [id, skillId], function(err) {
      if (err) return res.status(500).send('DB error');
      res.send({ deleted: this.changes });
    });
  });
});

// -------- Skill Mentoring Request Endpoints --------
app.post('/skill-request', (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  const { mentor_id, skill_id } = req.body;
  
  if (!mentor_id || !skill_id) return res.status(400).send('Missing fields');
  if (mentor_id === req.session.user.id) return res.status(400).send('Cannot request from yourself');
  
  db.run(
    'INSERT INTO skill_requests (learner_id,mentor_id,skill_id,status) VALUES (?,?,?,?)',
    [req.session.user.id, mentor_id, skill_id, 'pending'],
    function(err) {
      if (err) return res.status(500).send('DB error or duplicate request');
      db.get(`
        SELECT sr.id, u.email AS learner, s.name AS skill, sr.status
        FROM skill_requests sr
        JOIN users u ON u.id = sr.learner_id
        JOIN skills s ON s.id = sr.skill_id
        WHERE sr.id = ?
      `, [this.lastID], (_, row) => res.json(row));
    }
  );
});

app.get('/skill-requests-received', (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  db.all(`
    SELECT sr.id, u.email AS learner, s.name AS skill, sr.status
    FROM skill_requests sr
    JOIN users u ON u.id = sr.learner_id
    JOIN skills s ON s.id = sr.skill_id
    WHERE sr.mentor_id = ?
    ORDER BY sr.status, sr.id DESC
  `, [req.session.user.id], (_, rows) => res.json(rows || []));
});

app.get('/skill-requests-sent', (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  db.all(`
    SELECT sr.id, u.email AS mentor, s.name AS skill, sr.status
    FROM skill_requests sr
    JOIN users u ON u.id = sr.mentor_id
    JOIN skills s ON s.id = sr.skill_id
    WHERE sr.learner_id = ?
    ORDER BY sr.status, sr.id DESC
  `, [req.session.user.id], (_, rows) => res.json(rows || []));
});

app.post('/skill-requests/:id/:status', (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  const { id, status } = req.params;
  
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).send('Invalid status');
  
  // Check if user is the mentor
  db.get('SELECT * FROM skill_requests WHERE id=?', [id], (err, req_row) => {
    if (err) return res.status(500).send('DB error');
    if (!req_row) return res.sendStatus(404);
    if (req_row.mentor_id !== req.session.user.id) return res.sendStatus(403);
    
    db.run('UPDATE skill_requests SET status=? WHERE id=?', [status, id], function(err) {
      if (err) return res.status(500).send('DB error');
      res.send({ updated: this.changes });
    });
  });
});

app.listen(3000, () =>
  console.log("✅ UserSkillHub running at http://localhost:3000")
);

