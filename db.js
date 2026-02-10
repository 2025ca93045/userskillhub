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
