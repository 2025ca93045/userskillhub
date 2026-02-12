import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";

const db = new sqlite3.Database("./userskillhub.db");

// Hash passwords
const instructorPassword = await bcrypt.hash("password123", 10);
const studentPassword = await bcrypt.hash("password123", 10);

db.serialize(() => {
  // Drop tables if you want to reset
  db.run("DROP TABLE IF EXISTS skill_requests");
  db.run("DROP TABLE IF EXISTS course_skills");
  db.run("DROP TABLE IF EXISTS session_requests");
  db.run("DROP TABLE IF EXISTS courses");
  db.run("DROP TABLE IF EXISTS user_skills");
  db.run("DROP TABLE IF EXISTS skills");
  db.run("DROP TABLE IF EXISTS users");

  // Users table
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT CHECK(role IN ('user','instructor'))
    )
  `);

  // Courses table
  db.run(`
    CREATE TABLE courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      instructor_id INTEGER
    )
  `);

  // Session requests table
  db.run(`
    CREATE TABLE session_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      course_id INTEGER,
      status TEXT DEFAULT 'pending'
    )
  `);

  // Skills table
  db.run(`
    CREATE TABLE skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )
  `);

  // User skills table
  db.run(`
    CREATE TABLE user_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      skill_id INTEGER,
      level TEXT CHECK(level IN ('Beginner','Intermediate','Advanced')),
      description TEXT
    )
  `);

  // Course skills table
  db.run(`
    CREATE TABLE course_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      skill_id INTEGER,
      UNIQUE(course_id, skill_id)
    )
  `);

  // Skill requests table
  db.run(`
    CREATE TABLE skill_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      learner_id INTEGER,
      mentor_id INTEGER,
      skill_id INTEGER,
      status TEXT DEFAULT 'pending',
      UNIQUE(learner_id, mentor_id, skill_id)
    )
  `);

  // Insert initial instructor and student
  db.run(
    "INSERT INTO users (id,email,password,role) VALUES (1,?,?,?)",
    ["instructor@example.com", instructorPassword, "instructor"]
  );
  db.run(
    "INSERT INTO users (id,email,password,role) VALUES (2,?,?,?)",
    ["student@example.com", studentPassword, "user"]
  );

  // Insert a course for instructor
  db.run(
    "INSERT INTO courses (id,title,instructor_id) VALUES (1,'Intro to Web Development',1)"
  );

  // Insert a pending session request
  db.run(
    "INSERT INTO session_requests (id,user_id,course_id,status) VALUES (1,2,1,'pending')"
  );

  // Insert some sample skills and a user_skill for the student
  db.run("INSERT OR IGNORE INTO skills (id,name) VALUES (1,'JavaScript')");
  db.run("INSERT OR IGNORE INTO skills (id,name) VALUES (2,'HTML')");
  db.run("INSERT OR IGNORE INTO skills (id,name) VALUES (3,'CSS')");
  db.run(
    "INSERT INTO user_skills (id,user_id,skill_id,level,description) VALUES (1,2,1,'Beginner','Willing to help others get started with JS')"
  );
  db.run(
    "INSERT INTO user_skills (id,user_id,skill_id,level,description) VALUES (2,2,2,'Intermediate','Can help with HTML structure and semantics')"
  );
  db.run(
    "INSERT INTO user_skills (id,user_id,skill_id,level,description) VALUES (3,1,3,'Advanced','Expert in CSS layouts and animations')"
  );

  // Link skills to courses
  db.run("INSERT INTO course_skills (id,course_id,skill_id) VALUES (1,1,1)");
  db.run("INSERT INTO course_skills (id,course_id,skill_id) VALUES (2,1,2)");
  db.run("INSERT INTO course_skills (id,course_id,skill_id) VALUES (3,1,3)");

  // Insert a sample skill request (learner 1 requesting mentoring from mentor 2 on JavaScript)
  db.run(
    "INSERT INTO skill_requests (id,learner_id,mentor_id,skill_id,status) VALUES (1,1,2,1,'pending')"
  );

  console.log("✅ Database initialized with sample instructor, student, course, and request.");
});

db.close();

