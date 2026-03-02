const path = require("path");
const express = require("express");
const cors = require("cors");
const { initDb, pool, query } = require("./server/db");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

let dbInitPromise;

const ensureDbInitialized = async () => {
  if (!dbInitPromise) {
    dbInitPromise = initDb().catch((error) => {
      dbInitPromise = undefined;
      throw error;
    });
  }

  return dbInitPromise;
};

app.use("/api", async (_req, _res, next) => {
  try {
    await ensureDbInitialized();
    return next();
  } catch (error) {
    return next(error);
  }
});

const toUser = (row) => ({
  id: row.id,
  username: row.username,
  name: row.name,
  role: row.role,
  linkedId: row.linked_id
});

const toStudent = (row) => ({
  id: row.id,
  userId: row.user_id,
  teacherId: row.teacher_id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  className: row.class_name,
  guardianPhone: row.guardian_phone
});

const toTeacher = (row) => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  email: row.email,
  subject: row.subject,
  phone: row.phone
});

const toAttendance = (row) => ({
  id: row.id,
  studentId: row.student_id,
  date: row.date,
  status: row.status,
  markedBy: row.marked_by
});

const toResult = (row) => ({
  id: row.id,
  studentId: row.student_id,
  subject: row.subject,
  score: Number(row.score),
  grade: row.grade,
  teacherId: row.teacher_id
});

const gradeForScore = (score) => {
  const value = Number(score);
  if (value >= 90) return "A";
  if (value >= 80) return "B";
  if (value >= 70) return "C";
  if (value >= 60) return "D";
  return "F";
};

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { username, password, role, studentId } = req.body;
    const userResult = await query(
      `SELECT id, username, password, name, role, linked_id
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (!userResult.rows.length || userResult.rows[0].password !== password) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const user = userResult.rows[0];

    if (role && user.role !== role) {
      return res.status(400).json({ message: "Selected role does not match this account." });
    }

    if (user.role === "student") {
      if (!String(studentId || "").trim()) {
        return res.status(400).json({ message: "Student ID is required for student login." });
      }

      const student = await query("SELECT id FROM students WHERE user_id = $1", [user.id]);
      const studentRow = student.rows[0];
      if (!studentRow || String(studentRow.id) !== String(studentId).trim()) {
        return res.status(400).json({ message: "Invalid Student ID." });
      }
    }

    return res.json(toUser(user));
  } catch (error) {
    return next(error);
  }
});

app.get("/api/users", async (req, res, next) => {
  try {
    const { role } = req.query;
    if (role) {
      const result = await query(
        "SELECT id, username, name, role, linked_id FROM users WHERE role = $1 ORDER BY id ASC",
        [role]
      );
      return res.json(result.rows.map(toUser));
    }

    const result = await query("SELECT id, username, name, role, linked_id FROM users ORDER BY id ASC");
    return res.json(result.rows.map(toUser));
  } catch (error) {
    return next(error);
  }
});

app.get("/api/dashboard/stats", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM students) AS total_students,
         (SELECT COUNT(*)::int FROM teachers) AS total_teachers,
         (SELECT COUNT(DISTINCT class_name)::int FROM students) AS total_classes`
    );

    const stats = result.rows[0];
    return res.json({
      totalStudents: stats.total_students,
      totalTeachers: stats.total_teachers,
      totalClasses: stats.total_classes
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/admin/stats", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM students) AS total_students,
         (SELECT COUNT(*)::int FROM teachers) AS total_teachers,
         (
           SELECT COALESCE(ROUND(AVG(CASE WHEN status = 'Present' THEN 100 ELSE 0 END))::int, 0)
           FROM attendance
         ) AS attendance_rate,
         (
           SELECT COALESCE(ROUND(AVG(score)::numeric, 1), 0)
           FROM results
         ) AS average_grade`
    );

    const row = result.rows[0];
    return res.json({
      totalStudents: row.total_students,
      totalTeachers: row.total_teachers,
      attendanceRate: row.attendance_rate,
      averageGrade: Number(row.average_grade)
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/students", async (_req, res, next) => {
  try {
    const result = await query("SELECT * FROM students ORDER BY id ASC");
    return res.json(result.rows.map(toStudent));
  } catch (error) {
    return next(error);
  }
});

app.get("/api/students/:id", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM students WHERE id = $1", [Number(req.params.id)]);
    if (!result.rows.length) return res.status(404).json({ message: "Student not found" });
    return res.json(toStudent(result.rows[0]));
  } catch (error) {
    return next(error);
  }
});

app.post("/api/students", async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const payload = req.body;
    const studentUserInsert = await client.query(
      `INSERT INTO users (username, password, name, role, linked_id)
       VALUES (
         (SELECT 'student' || (COALESCE(MAX(id), 0) + 1) FROM students),
         'student123',
         $1,
         'student',
         NULL
       )
       RETURNING id, username, password`,
      [`${payload.firstName} ${payload.lastName}`]
    );

    const user = studentUserInsert.rows[0];

    const studentInsert = await client.query(
      `INSERT INTO students (user_id, teacher_id, first_name, last_name, email, class_name, guardian_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user.id,
        payload.teacherId ? Number(payload.teacherId) : null,
        payload.firstName,
        payload.lastName,
        payload.email,
        payload.className,
        payload.guardianPhone
      ]
    );

    const student = studentInsert.rows[0];
    await client.query("UPDATE users SET linked_id = $1 WHERE id = $2", [student.id, user.id]);

    await client.query("COMMIT");
    return res.status(201).json({
      ...toStudent(student),
      credentials: {
        username: user.username,
        password: user.password
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

app.put("/api/students/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    const update = await query(
      `UPDATE students
       SET teacher_id = $1,
           first_name = $2,
           last_name = $3,
           email = $4,
           class_name = $5,
           guardian_phone = $6
       WHERE id = $7
       RETURNING *`,
      [
        payload.teacherId ? Number(payload.teacherId) : null,
        payload.firstName,
        payload.lastName,
        payload.email,
        payload.className,
        payload.guardianPhone,
        id
      ]
    );

    if (!update.rows.length) return res.status(404).json({ message: "Student not found" });

    const student = update.rows[0];
    await query("UPDATE users SET name = $1 WHERE id = $2", [`${student.first_name} ${student.last_name}`, student.user_id]);

    return res.json(toStudent(student));
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/students/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const studentResult = await query("SELECT user_id FROM students WHERE id = $1", [id]);
    if (!studentResult.rows.length) return res.json({ success: true });

    await query("DELETE FROM users WHERE id = $1", [studentResult.rows[0].user_id]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/teachers", async (_req, res, next) => {
  try {
    const result = await query("SELECT * FROM teachers ORDER BY id ASC");
    return res.json(result.rows.map(toTeacher));
  } catch (error) {
    return next(error);
  }
});

app.post("/api/teachers", async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const payload = req.body;
    const teacherUserInsert = await client.query(
      `INSERT INTO users (username, password, name, role, linked_id)
       VALUES (
         (SELECT 'teacher' || (COALESCE(MAX(id), 0) + 1) FROM teachers),
         'teacher123',
         $1,
         'teacher',
         NULL
       )
       RETURNING id, username, password`,
      [payload.name]
    );

    const user = teacherUserInsert.rows[0];

    const teacherInsert = await client.query(
      `INSERT INTO teachers (user_id, name, email, subject, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user.id, payload.name, payload.email, payload.subject, payload.phone]
    );

    const teacher = teacherInsert.rows[0];
    await client.query("UPDATE users SET linked_id = $1 WHERE id = $2", [teacher.id, user.id]);
    await client.query("COMMIT");

    return res.status(201).json({
      ...toTeacher(teacher),
      credentials: {
        username: user.username,
        password: user.password
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

app.put("/api/teachers/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    const update = await query(
      `UPDATE teachers
       SET name = $1,
           email = $2,
           subject = $3,
           phone = $4
       WHERE id = $5
       RETURNING *`,
      [payload.name, payload.email, payload.subject, payload.phone, id]
    );

    if (!update.rows.length) return res.status(404).json({ message: "Teacher not found" });

    const teacher = update.rows[0];
    await query("UPDATE users SET name = $1 WHERE id = $2", [teacher.name, teacher.user_id]);

    return res.json(toTeacher(teacher));
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/teachers/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const teacherResult = await query("SELECT user_id FROM teachers WHERE id = $1", [id]);
    if (!teacherResult.rows.length) return res.json({ success: true });

    await query("DELETE FROM users WHERE id = $1", [teacherResult.rows[0].user_id]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/attendance", async (_req, res, next) => {
  try {
    const result = await query("SELECT * FROM attendance ORDER BY date DESC, id DESC");
    return res.json(result.rows.map(toAttendance));
  } catch (error) {
    return next(error);
  }
});

const upsertAttendance = async (req, res, next) => {
  try {
    const payload = req.body;

    const result = await query(
      `INSERT INTO attendance (student_id, date, status, marked_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, date)
       DO UPDATE SET
         status = EXCLUDED.status,
         marked_by = EXCLUDED.marked_by
       RETURNING *`,
      [Number(payload.studentId), payload.date, payload.status, payload.markedBy ? Number(payload.markedBy) : null]
    );

    return res.status(201).json(toAttendance(result.rows[0]));
  } catch (error) {
    return next(error);
  }
};

app.post("/api/attendance/upsert", upsertAttendance);

app.post("/api/attendance", async (req, res, next) => {
  return upsertAttendance(req, res, next);
});

app.delete("/api/attendance/:id", async (req, res, next) => {
  try {
    await query("DELETE FROM attendance WHERE id = $1", [Number(req.params.id)]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/results", async (_req, res, next) => {
  try {
    const result = await query("SELECT * FROM results ORDER BY id DESC");
    return res.json(result.rows.map(toResult));
  } catch (error) {
    return next(error);
  }
});

app.post("/api/results", async (req, res, next) => {
  try {
    const payload = req.body;
    const insert = await query(
      `INSERT INTO results (student_id, subject, score, grade, teacher_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        Number(payload.studentId),
        payload.subject,
        Number(payload.score),
        gradeForScore(payload.score),
        payload.teacherId ? Number(payload.teacherId) : null
      ]
    );

    return res.status(201).json(toResult(insert.rows[0]));
  } catch (error) {
    return next(error);
  }
});

app.put("/api/results/:id", async (req, res, next) => {
  try {
    const payload = req.body;
    const update = await query(
      `UPDATE results
       SET subject = $1,
           score = $2,
           grade = $3
       WHERE id = $4
       RETURNING *`,
      [payload.subject, Number(payload.score), gradeForScore(payload.score), Number(req.params.id)]
    );

    if (!update.rows.length) return res.status(404).json({ message: "Result not found" });
    return res.json(toResult(update.rows[0]));
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/results/:id", async (req, res, next) => {
  try {
    await query("DELETE FROM results WHERE id = $1", [Number(req.params.id)]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/dashboard/teacher/:userId", async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const teacherResult = await query("SELECT * FROM teachers WHERE user_id = $1", [userId]);
    if (!teacherResult.rows.length) return res.status(404).json({ message: "Teacher profile not found" });

    const teacher = toTeacher(teacherResult.rows[0]);
    const studentsResult = await query("SELECT * FROM students WHERE teacher_id = $1 ORDER BY id ASC", [teacher.id]);
    const students = studentsResult.rows.map(toStudent);
    const studentIds = students.map((student) => student.id);

    let attendance = [];
    let results = [];

    if (studentIds.length) {
      const attendanceResult = await query(
        "SELECT * FROM attendance WHERE student_id = ANY($1::int[]) ORDER BY date DESC, id DESC",
        [studentIds]
      );
      attendance = attendanceResult.rows.map(toAttendance);

      const resultsResult = await query(
        "SELECT * FROM results WHERE student_id = ANY($1::int[]) ORDER BY id DESC",
        [studentIds]
      );
      results = resultsResult.rows.map(toResult);
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayAttendance = attendance.filter((item) => item.date === today);
    const presentToday = todayAttendance.filter((item) => item.status === "Present").length;
    const attendanceRateToday = todayAttendance.length ? Math.round((presentToday / todayAttendance.length) * 100) : 0;
    const averageScore = results.length
      ? Number((results.reduce((sum, item) => sum + Number(item.score), 0) / results.length).toFixed(1))
      : 0;

    return res.json({
      teacher,
      students,
      attendance,
      results,
      stats: {
        totalStudents: students.length,
        attendanceRateToday,
        averageScore
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/dashboard/student/:userId", async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const studentResult = await query("SELECT * FROM students WHERE user_id = $1", [userId]);
    if (!studentResult.rows.length) return res.status(404).json({ message: "Student profile not found" });

    const student = toStudent(studentResult.rows[0]);
    const attendanceResult = await query("SELECT * FROM attendance WHERE student_id = $1 ORDER BY date DESC, id DESC", [student.id]);
    const resultsResult = await query("SELECT * FROM results WHERE student_id = $1 ORDER BY id DESC", [student.id]);

    const attendance = attendanceResult.rows.map(toAttendance);
    const results = resultsResult.rows.map(toResult);

    const presentCount = attendance.filter((item) => item.status === "Present").length;
    const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;
    const averageScore = results.length
      ? Number((results.reduce((sum, item) => sum + Number(item.score), 0) / results.length).toFixed(1))
      : 0;

    return res.json({
      student,
      attendance,
      results,
      stats: {
        attendanceRate,
        averageScore,
        totalSubjects: results.length
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.use(express.static(path.resolve(__dirname)));

app.use((err, _req, res, _next) => {
  if (err && err.code === "23505") {
    return res.status(400).json({ message: "A record with this unique value already exists." });
  }

  if (err && err.code === "23503") {
    return res.status(400).json({ message: "Invalid reference to related record." });
  }

  const message = err?.message || "Internal server error";
  return res.status(500).json({ message });
});

if (!process.env.VERCEL) {
  ensureDbInitialized()
    .then(() => {
      app.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Failed to initialize database:", error);
      process.exit(1);
    });
}

module.exports = app;
