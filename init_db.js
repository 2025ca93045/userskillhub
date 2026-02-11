import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";

const db = new sqlite3.Database("./userskillhub.db");

// Hash passwords
const instructorPassword = await bcrypt.hash("password123", 10);
const studentPassword = await bcrypt.hash("password123", 10);

db.serialize(() => {
  // Drop tables if you want to reset
  db.run("DROP TABLE IF EXISTS session_requests");
  db.run("DROP TABLE IF EXISTS courses");
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

  console.log("✅ Database initialized with sample instructor, student, course, and request.");
});

db.close();

