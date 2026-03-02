const { Pool } = require("pg");
require("dotenv").config();

const sslEnabled = String(process.env.PGSSL || "true").toLowerCase() !== "false";
const databaseUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : "";

function sanitizeConnectionString(value) {
  if (!value) return value;
  try {
    const parsed = new URL(value);
    const decodedPassword = decodeURIComponent(parsed.password || "");
    if (decodedPassword.startsWith("[") && decodedPassword.endsWith("]")) {
      parsed.password = encodeURIComponent(decodedPassword.slice(1, -1));
    }
    return parsed.toString();
  } catch {
    return value;
  }
}

const baseConfig = databaseUrl
  ? {
      connectionString: sanitizeConnectionString(databaseUrl)
    }
  : {
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE
    };

const pool = new Pool({
  ...baseConfig,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false
});

const seedStatements = [
  `INSERT INTO users (id, username, password, name, role, linked_id) VALUES
    (1, 'admin', 'admin123', 'School Admin', 'admin', NULL),
    (2, 'teacher.sarah', 'teacher123', 'Sarah Lee', 'teacher', 1),
    (3, 'teacher.david', 'teacher123', 'David Khan', 'teacher', 2),
    (4, 'student.aiden', 'student123', 'Aiden Cole', 'student', 1),
    (5, 'student.mia', 'student123', 'Mia Turner', 'student', 2),
    (6, 'student.noah', 'student123', 'Noah Reed', 'student', 3)`,
  `INSERT INTO teachers (id, user_id, name, email, subject, phone) VALUES
    (1, 2, 'Sarah Lee', 'sarah.lee@school.com', 'Math', '555-3001'),
    (2, 3, 'David Khan', 'david.khan@school.com', 'Science', '555-3002')`,
  `INSERT INTO students (id, user_id, teacher_id, first_name, last_name, email, class_name, guardian_phone) VALUES
    (1, 4, 1, 'Aiden', 'Cole', 'aiden.cole@school.com', 'Grade 8', '555-1010'),
    (2, 5, 1, 'Mia', 'Turner', 'mia.turner@school.com', 'Grade 8', '555-2020'),
    (3, 6, 2, 'Noah', 'Reed', 'noah.reed@school.com', 'Grade 9', '555-3030')`,
  `INSERT INTO attendance (id, student_id, date, status, marked_by) VALUES
    (1, 1, '2026-02-24', 'Present', 1),
    (2, 2, '2026-02-24', 'Absent', 1),
    (3, 3, '2026-02-24', 'Present', 2),
    (4, 1, '2026-02-25', 'Present', 1)`,
  `INSERT INTO results (id, student_id, subject, score, grade, teacher_id) VALUES
    (1, 1, 'Mathematics', 88, 'B', 1),
    (2, 2, 'Mathematics', 93, 'A', 1),
    (3, 3, 'Science', 84, 'B', 2)`
];

async function query(text, params = []) {
  return pool.query(text, params);
}

async function resetSequences() {
  const tables = ["users", "teachers", "students", "attendance", "results"];
  for (const table of tables) {
    await query(
      `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`,
      [table]
    );
  }
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
      linked_id INTEGER
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS teachers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      subject TEXT NOT NULL,
      phone TEXT NOT NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      class_name TEXT NOT NULL,
      guardian_phone TEXT NOT NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late')),
      marked_by INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
      UNIQUE (student_id, date)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
      grade TEXT NOT NULL,
      teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const usersCount = await query("SELECT COUNT(*)::int AS count FROM users");
  if (usersCount.rows[0].count === 0) {
    for (const statement of seedStatements) {
      await query(statement);
    }
    await resetSequences();
  }
}

module.exports = {
  pool,
  query,
  initDb
};
