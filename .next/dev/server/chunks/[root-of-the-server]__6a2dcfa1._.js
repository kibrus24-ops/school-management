module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/module [external] (module, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("module", () => require("module"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/server/db.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

const { Pool } = __turbopack_context__.r("[externals]/pg [external] (pg, cjs, [project]/node_modules/pg)");
__turbopack_context__.r("[project]/node_modules/dotenv/lib/main.js [app-route] (ecmascript)").config();
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
    } catch  {
        return value;
    }
}
const baseConfig = databaseUrl ? {
    connectionString: sanitizeConnectionString(databaseUrl)
} : {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE
};
const pool = new Pool({
    ...baseConfig,
    ssl: sslEnabled ? {
        rejectUnauthorized: false
    } : false
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
    const tables = [
        "users",
        "teachers",
        "students",
        "attendance",
        "results"
    ];
    for (const table of tables){
        await query(`SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`, [
            table
        ]);
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
        for (const statement of seedStatements){
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
}),
"[project]/app/api/[...path]/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$module__$5b$external$5d$__$28$module$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/module [external] (module, cjs)");
const __TURBOPACK__import$2e$meta__ = {
    get url () {
        return `file://${__turbopack_context__.P("app/api/[...path]/route.js")}`;
    }
};
;
;
const require = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$module__$5b$external$5d$__$28$module$2c$__cjs$29$__["createRequire"])(__TURBOPACK__import$2e$meta__.url);
const { initDb, pool, query } = __turbopack_context__.r("[project]/server/db.js [app-route] (ecmascript)");
const runtime = "nodejs";
let dbInitPromise;
const ensureDbInitialized = async ()=>{
    if (!dbInitPromise) {
        dbInitPromise = initDb().catch((error)=>{
            dbInitPromise = undefined;
            throw error;
        });
    }
    return dbInitPromise;
};
const toUser = (row)=>({
        id: row.id,
        username: row.username,
        name: row.name,
        role: row.role,
        linkedId: row.linked_id
    });
const toStudent = (row)=>({
        id: row.id,
        userId: row.user_id,
        teacherId: row.teacher_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        className: row.class_name,
        guardianPhone: row.guardian_phone
    });
const toTeacher = (row)=>({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        email: row.email,
        subject: row.subject,
        phone: row.phone
    });
const toAttendance = (row)=>({
        id: row.id,
        studentId: row.student_id,
        date: row.date,
        status: row.status,
        markedBy: row.marked_by
    });
const toResult = (row)=>({
        id: row.id,
        studentId: row.student_id,
        subject: row.subject,
        score: Number(row.score),
        grade: row.grade,
        teacherId: row.teacher_id
    });
const gradeForScore = (score)=>{
    const value = Number(score);
    if (value >= 90) return "A";
    if (value >= 80) return "B";
    if (value >= 70) return "C";
    if (value >= 60) return "D";
    return "F";
};
const json = (data, status = 200)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data, {
        status
    });
const badRequest = (message)=>json({
        message
    }, 400);
const notFound = (message = "Not found")=>json({
        message
    }, 404);
const toNumericId = (value)=>{
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
};
const readJson = async (req)=>{
    try {
        return await req.json();
    } catch  {
        return {};
    }
};
const handleError = (error)=>{
    if (error?.code === "23505") {
        return badRequest("A record with this unique value already exists.");
    }
    if (error?.code === "23503") {
        return badRequest("Invalid reference to related record.");
    }
    return json({
        message: error?.message || "Internal server error"
    }, 500);
};
const upsertAttendance = async (payload)=>{
    const result = await query(`INSERT INTO attendance (student_id, date, status, marked_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (student_id, date)
     DO UPDATE SET
       status = EXCLUDED.status,
       marked_by = EXCLUDED.marked_by
     RETURNING *`, [
        Number(payload.studentId),
        payload.date,
        payload.status,
        payload.markedBy ? Number(payload.markedBy) : null
    ]);
    return json(toAttendance(result.rows[0]), 201);
};
const handleRequest = async (req, resolvedParams)=>{
    await ensureDbInitialized();
    const method = req.method;
    const parts = resolvedParams?.path || [];
    if (method === "POST" && parts.length === 2 && parts[0] === "auth" && parts[1] === "login") {
        const { username, password, role, studentId } = await readJson(req);
        const userResult = await query(`SELECT id, username, password, name, role, linked_id
       FROM users
       WHERE username = $1`, [
            username
        ]);
        if (!userResult.rows.length || userResult.rows[0].password !== password) {
            return json({
                message: "Invalid username or password."
            }, 401);
        }
        const user = userResult.rows[0];
        if (role && user.role !== role) {
            return badRequest("Selected role does not match this account.");
        }
        if (user.role === "student") {
            if (!String(studentId || "").trim()) {
                return badRequest("Student ID is required for student login.");
            }
            const student = await query("SELECT id FROM students WHERE user_id = $1", [
                user.id
            ]);
            const studentRow = student.rows[0];
            if (!studentRow || String(studentRow.id) !== String(studentId).trim()) {
                return badRequest("Invalid Student ID.");
            }
        }
        return json(toUser(user));
    }
    if (method === "GET" && parts.length === 1 && parts[0] === "users") {
        const role = req.nextUrl.searchParams.get("role");
        if (role) {
            const result = await query("SELECT id, username, name, role, linked_id FROM users WHERE role = $1 ORDER BY id ASC", [
                role
            ]);
            return json(result.rows.map(toUser));
        }
        const result = await query("SELECT id, username, name, role, linked_id FROM users ORDER BY id ASC");
        return json(result.rows.map(toUser));
    }
    if (method === "GET" && parts.length === 2 && parts[0] === "dashboard" && parts[1] === "stats") {
        const result = await query(`SELECT
         (SELECT COUNT(*)::int FROM students) AS total_students,
         (SELECT COUNT(*)::int FROM teachers) AS total_teachers,
         (SELECT COUNT(DISTINCT class_name)::int FROM students) AS total_classes`);
        const stats = result.rows[0];
        return json({
            totalStudents: stats.total_students,
            totalTeachers: stats.total_teachers,
            totalClasses: stats.total_classes
        });
    }
    if (method === "GET" && parts.length === 2 && parts[0] === "admin" && parts[1] === "stats") {
        const result = await query(`SELECT
         (SELECT COUNT(*)::int FROM students) AS total_students,
         (SELECT COUNT(*)::int FROM teachers) AS total_teachers,
         (
           SELECT COALESCE(ROUND(AVG(CASE WHEN status = 'Present' THEN 100 ELSE 0 END))::int, 0)
           FROM attendance
         ) AS attendance_rate,
         (
           SELECT COALESCE(ROUND(AVG(score)::numeric, 1), 0)
           FROM results
         ) AS average_grade`);
        const row = result.rows[0];
        return json({
            totalStudents: row.total_students,
            totalTeachers: row.total_teachers,
            attendanceRate: row.attendance_rate,
            averageGrade: Number(row.average_grade)
        });
    }
    if (parts[0] === "students") {
        if (method === "GET" && parts.length === 1) {
            const result = await query("SELECT * FROM students ORDER BY id ASC");
            return json(result.rows.map(toStudent));
        }
        if (method === "GET" && parts.length === 2) {
            const id = toNumericId(parts[1]);
            const result = await query("SELECT * FROM students WHERE id = $1", [
                id
            ]);
            if (!result.rows.length) return notFound("Student not found");
            return json(toStudent(result.rows[0]));
        }
        if (method === "POST" && parts.length === 1) {
            const payload = await readJson(req);
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                const studentUserInsert = await client.query(`INSERT INTO users (username, password, name, role, linked_id)
           VALUES (
             (SELECT 'student' || (COALESCE(MAX(id), 0) + 1) FROM students),
             'student123',
             $1,
             'student',
             NULL
           )
           RETURNING id, username, password`, [
                    `${payload.firstName} ${payload.lastName}`
                ]);
                const user = studentUserInsert.rows[0];
                const studentInsert = await client.query(`INSERT INTO students (user_id, teacher_id, first_name, last_name, email, class_name, guardian_phone)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`, [
                    user.id,
                    payload.teacherId ? Number(payload.teacherId) : null,
                    payload.firstName,
                    payload.lastName,
                    payload.email,
                    payload.className,
                    payload.guardianPhone
                ]);
                const student = studentInsert.rows[0];
                await client.query("UPDATE users SET linked_id = $1 WHERE id = $2", [
                    student.id,
                    user.id
                ]);
                await client.query("COMMIT");
                return json({
                    ...toStudent(student),
                    credentials: {
                        username: user.username,
                        password: user.password
                    }
                }, 201);
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            } finally{
                client.release();
            }
        }
        if (method === "PUT" && parts.length === 2) {
            const id = toNumericId(parts[1]);
            const payload = await readJson(req);
            const update = await query(`UPDATE students
         SET teacher_id = $1,
             first_name = $2,
             last_name = $3,
             email = $4,
             class_name = $5,
             guardian_phone = $6
         WHERE id = $7
         RETURNING *`, [
                payload.teacherId ? Number(payload.teacherId) : null,
                payload.firstName,
                payload.lastName,
                payload.email,
                payload.className,
                payload.guardianPhone,
                id
            ]);
            if (!update.rows.length) return notFound("Student not found");
            const student = update.rows[0];
            await query("UPDATE users SET name = $1 WHERE id = $2", [
                `${student.first_name} ${student.last_name}`,
                student.user_id
            ]);
            return json(toStudent(student));
        }
        if (method === "DELETE" && parts.length === 2) {
            const id = toNumericId(parts[1]);
            const studentResult = await query("SELECT user_id FROM students WHERE id = $1", [
                id
            ]);
            if (!studentResult.rows.length) return json({
                success: true
            });
            await query("DELETE FROM users WHERE id = $1", [
                studentResult.rows[0].user_id
            ]);
            return json({
                success: true
            });
        }
    }
    if (parts[0] === "teachers") {
        if (method === "GET" && parts.length === 1) {
            const result = await query("SELECT * FROM teachers ORDER BY id ASC");
            return json(result.rows.map(toTeacher));
        }
        if (method === "POST" && parts.length === 1) {
            const payload = await readJson(req);
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                const teacherUserInsert = await client.query(`INSERT INTO users (username, password, name, role, linked_id)
           VALUES (
             (SELECT 'teacher' || (COALESCE(MAX(id), 0) + 1) FROM teachers),
             'teacher123',
             $1,
             'teacher',
             NULL
           )
           RETURNING id, username, password`, [
                    payload.name
                ]);
                const user = teacherUserInsert.rows[0];
                const teacherInsert = await client.query(`INSERT INTO teachers (user_id, name, email, subject, phone)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`, [
                    user.id,
                    payload.name,
                    payload.email,
                    payload.subject,
                    payload.phone
                ]);
                const teacher = teacherInsert.rows[0];
                await client.query("UPDATE users SET linked_id = $1 WHERE id = $2", [
                    teacher.id,
                    user.id
                ]);
                await client.query("COMMIT");
                return json({
                    ...toTeacher(teacher),
                    credentials: {
                        username: user.username,
                        password: user.password
                    }
                }, 201);
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            } finally{
                client.release();
            }
        }
        if (method === "PUT" && parts.length === 2) {
            const id = toNumericId(parts[1]);
            const payload = await readJson(req);
            const update = await query(`UPDATE teachers
         SET name = $1,
             email = $2,
             subject = $3,
             phone = $4
         WHERE id = $5
         RETURNING *`, [
                payload.name,
                payload.email,
                payload.subject,
                payload.phone,
                id
            ]);
            if (!update.rows.length) return notFound("Teacher not found");
            const teacher = update.rows[0];
            await query("UPDATE users SET name = $1 WHERE id = $2", [
                teacher.name,
                teacher.user_id
            ]);
            return json(toTeacher(teacher));
        }
        if (method === "DELETE" && parts.length === 2) {
            const id = toNumericId(parts[1]);
            const teacherResult = await query("SELECT user_id FROM teachers WHERE id = $1", [
                id
            ]);
            if (!teacherResult.rows.length) return json({
                success: true
            });
            await query("DELETE FROM users WHERE id = $1", [
                teacherResult.rows[0].user_id
            ]);
            return json({
                success: true
            });
        }
    }
    if (parts[0] === "attendance") {
        if (method === "GET" && parts.length === 1) {
            const result = await query("SELECT * FROM attendance ORDER BY date DESC, id DESC");
            return json(result.rows.map(toAttendance));
        }
        if (method === "POST" && (parts.length === 1 || parts.length === 2 && parts[1] === "upsert")) {
            const payload = await readJson(req);
            return upsertAttendance(payload);
        }
        if (method === "DELETE" && parts.length === 2) {
            const id = toNumericId(parts[1]);
            await query("DELETE FROM attendance WHERE id = $1", [
                id
            ]);
            return json({
                success: true
            });
        }
    }
    if (parts[0] === "results") {
        if (method === "GET" && parts.length === 1) {
            const result = await query("SELECT * FROM results ORDER BY id DESC");
            return json(result.rows.map(toResult));
        }
        if (method === "POST" && parts.length === 1) {
            const payload = await readJson(req);
            const insert = await query(`INSERT INTO results (student_id, subject, score, grade, teacher_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`, [
                Number(payload.studentId),
                payload.subject,
                Number(payload.score),
                gradeForScore(payload.score),
                payload.teacherId ? Number(payload.teacherId) : null
            ]);
            return json(toResult(insert.rows[0]), 201);
        }
        if (method === "PUT" && parts.length === 2) {
            const id = toNumericId(parts[1]);
            const payload = await readJson(req);
            const update = await query(`UPDATE results
         SET subject = $1,
             score = $2,
             grade = $3
         WHERE id = $4
         RETURNING *`, [
                payload.subject,
                Number(payload.score),
                gradeForScore(payload.score),
                id
            ]);
            if (!update.rows.length) return notFound("Result not found");
            return json(toResult(update.rows[0]));
        }
        if (method === "DELETE" && parts.length === 2) {
            const id = toNumericId(parts[1]);
            await query("DELETE FROM results WHERE id = $1", [
                id
            ]);
            return json({
                success: true
            });
        }
    }
    if (method === "GET" && parts.length === 3 && parts[0] === "dashboard" && parts[1] === "teacher") {
        const userId = toNumericId(parts[2]);
        const teacherResult = await query("SELECT * FROM teachers WHERE user_id = $1", [
            userId
        ]);
        if (!teacherResult.rows.length) return notFound("Teacher profile not found");
        const teacher = toTeacher(teacherResult.rows[0]);
        const studentsResult = await query("SELECT * FROM students WHERE teacher_id = $1 ORDER BY id ASC", [
            teacher.id
        ]);
        const students = studentsResult.rows.map(toStudent);
        const studentIds = students.map((student)=>student.id);
        let attendance = [];
        let results = [];
        if (studentIds.length) {
            const attendanceResult = await query("SELECT * FROM attendance WHERE student_id = ANY($1::int[]) ORDER BY date DESC, id DESC", [
                studentIds
            ]);
            attendance = attendanceResult.rows.map(toAttendance);
            const resultsResult = await query("SELECT * FROM results WHERE student_id = ANY($1::int[]) ORDER BY id DESC", [
                studentIds
            ]);
            results = resultsResult.rows.map(toResult);
        }
        const today = new Date().toISOString().slice(0, 10);
        const todayAttendance = attendance.filter((item)=>item.date === today);
        const presentToday = todayAttendance.filter((item)=>item.status === "Present").length;
        const attendanceRateToday = todayAttendance.length ? Math.round(presentToday / todayAttendance.length * 100) : 0;
        const averageScore = results.length ? Number((results.reduce((sum, item)=>sum + Number(item.score), 0) / results.length).toFixed(1)) : 0;
        return json({
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
    }
    if (method === "GET" && parts.length === 3 && parts[0] === "dashboard" && parts[1] === "student") {
        const userId = toNumericId(parts[2]);
        const studentResult = await query("SELECT * FROM students WHERE user_id = $1", [
            userId
        ]);
        if (!studentResult.rows.length) return notFound("Student profile not found");
        const student = toStudent(studentResult.rows[0]);
        const attendanceResult = await query("SELECT * FROM attendance WHERE student_id = $1 ORDER BY date DESC, id DESC", [
            student.id
        ]);
        const resultsResult = await query("SELECT * FROM results WHERE student_id = $1 ORDER BY id DESC", [
            student.id
        ]);
        const attendance = attendanceResult.rows.map(toAttendance);
        const results = resultsResult.rows.map(toResult);
        const presentCount = attendance.filter((item)=>item.status === "Present").length;
        const attendanceRate = attendance.length ? Math.round(presentCount / attendance.length * 100) : 0;
        const averageScore = results.length ? Number((results.reduce((sum, item)=>sum + Number(item.score), 0) / results.length).toFixed(1)) : 0;
        return json({
            student,
            attendance,
            results,
            stats: {
                attendanceRate,
                averageScore,
                totalSubjects: results.length
            }
        });
    }
    return notFound("Route not found");
};
async function GET(req, ctx) {
    try {
        const resolvedParams = await ctx.params;
        return await handleRequest(req, resolvedParams);
    } catch (error) {
        return handleError(error);
    }
}
async function POST(req, ctx) {
    try {
        const resolvedParams = await ctx.params;
        return await handleRequest(req, resolvedParams);
    } catch (error) {
        return handleError(error);
    }
}
async function PUT(req, ctx) {
    try {
        const resolvedParams = await ctx.params;
        return await handleRequest(req, resolvedParams);
    } catch (error) {
        return handleError(error);
    }
}
async function DELETE(req, ctx) {
    try {
        const resolvedParams = await ctx.params;
        return await handleRequest(req, resolvedParams);
    } catch (error) {
        return handleError(error);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6a2dcfa1._.js.map