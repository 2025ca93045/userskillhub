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

  // Skills table (global skill names)
  db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )
  `);

  // User skills linking users to skills with level & description
  db.run(`
    CREATE TABLE IF NOT EXISTS user_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      skill_id INTEGER,
      level TEXT CHECK(level IN ('Beginner','Intermediate','Advanced')),
      description TEXT
    )
  `);

  // Course skills linking courses to skills they teach
  db.run(`
    CREATE TABLE IF NOT EXISTS course_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      skill_id INTEGER,
      UNIQUE(course_id, skill_id)
    )
  `);

  // Skill mentoring requests (peer-to-peer)
  db.run(`
    CREATE TABLE IF NOT EXISTS skill_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      learner_id INTEGER,
      mentor_id INTEGER,
      skill_id INTEGER,
      status TEXT DEFAULT 'pending',
      UNIQUE(learner_id, mentor_id, skill_id)
    )
  `);
});
