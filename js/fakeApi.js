// Simulated backend storage key.
const STORAGE_KEY = "sms_fake_db_v2";

// Base seed data for a complete role-based demo.
const seedData = {
  users: [
    { id: 1, username: "admin", password: "admin123", name: "School Admin", role: "admin", linkedId: null },
    { id: 2, username: "teacher.sarah", password: "teacher123", name: "Sarah Lee", role: "teacher", linkedId: 1 },
    { id: 3, username: "teacher.david", password: "teacher123", name: "David Khan", role: "teacher", linkedId: 2 },
    { id: 4, username: "student.aiden", password: "student123", name: "Aiden Cole", role: "student", linkedId: 1 },
    { id: 5, username: "student.mia", password: "student123", name: "Mia Turner", role: "student", linkedId: 2 },
    { id: 6, username: "student.noah", password: "student123", name: "Noah Reed", role: "student", linkedId: 3 }
  ],
  teachers: [
    { id: 1, userId: 2, name: "Sarah Lee", email: "sarah.lee@school.com", subject: "Math", phone: "555-3001" },
    { id: 2, userId: 3, name: "David Khan", email: "david.khan@school.com", subject: "Science", phone: "555-3002" }
  ],
  students: [
    {
      id: 1,
      userId: 4,
      teacherId: 1,
      firstName: "Aiden",
      lastName: "Cole",
      email: "aiden.cole@school.com",
      className: "Grade 8",
      guardianPhone: "555-1010"
    },
    {
      id: 2,
      userId: 5,
      teacherId: 1,
      firstName: "Mia",
      lastName: "Turner",
      email: "mia.turner@school.com",
      className: "Grade 8",
      guardianPhone: "555-2020"
    },
    {
      id: 3,
      userId: 6,
      teacherId: 2,
      firstName: "Noah",
      lastName: "Reed",
      email: "noah.reed@school.com",
      className: "Grade 9",
      guardianPhone: "555-3030"
    }
  ],
  attendance: [
    { id: 1, studentId: 1, date: "2026-02-24", status: "Present", markedBy: 1 },
    { id: 2, studentId: 2, date: "2026-02-24", status: "Absent", markedBy: 1 },
    { id: 3, studentId: 3, date: "2026-02-24", status: "Present", markedBy: 2 },
    { id: 4, studentId: 1, date: "2026-02-25", status: "Present", markedBy: 1 }
  ],
  results: [
    { id: 1, studentId: 1, subject: "Mathematics", score: 88, grade: "B", teacherId: 1 },
    { id: 2, studentId: 2, subject: "Mathematics", score: 93, grade: "A", teacherId: 1 },
    { id: 3, studentId: 3, subject: "Science", score: 84, grade: "B", teacherId: 2 }
  ]
};

const delay = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);
const nextId = (items) => (items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1);

const getLetterGrade = (score) => {
  const value = Number(score);
  if (value >= 90) return "A";
  if (value >= 80) return "B";
  if (value >= 70) return "C";
  if (value >= 60) return "D";
  return "F";
};

// Reads and validates data from localStorage.
const readDb = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return clone(seedData);
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.users || !parsed.students || !parsed.teachers || !parsed.attendance || !parsed.results) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
      return clone(seedData);
    }
    return parsed;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return clone(seedData);
  }
};

const writeDb = (db) => localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

const findTeacherByUser = (db, userId) => db.teachers.find((teacher) => teacher.userId === userId);
const findStudentByUser = (db, userId) => db.students.find((student) => student.userId === userId);
const fullName = (student) => `${student.firstName} ${student.lastName}`;

class FakeApi {
  // Returns all users from localStorage.
  async getUsers() {
    await delay();
    return readDb().users;
  }

  // Returns users filtered by role.
  async getUserByRole(role) {
    await delay();
    return readDb().users.filter((user) => user.role === role);
  }

  // Adds a generic user account (used for dynamic login support).
  async addUser(payload) {
    await delay();
    const db = readDb();
    const usernameExists = db.users.some((user) => user.username === payload.username);
    if (usernameExists) throw new Error("Username already exists.");

    const newUser = {
      id: nextId(db.users),
      username: payload.username,
      password: payload.password,
      name: payload.name,
      role: payload.role,
      linkedId: payload.linkedId ?? null
    };

    db.users.push(newUser);
    writeDb(db);
    return newUser;
  }

  // Auth simulation with role and optional student ID validation.
  async login({ username, password, role, studentId }) {
    await delay();
    const db = readDb();

    // First validate credentials.
    const user = db.users.find((item) => item.username === username && item.password === password);
    if (!user) throw new Error("Invalid username or password.");

    // Then validate selected role against account role.
    if (role && user.role !== role) {
      throw new Error("Selected role does not match this account.");
    }

    // Student login requires student ID in addition to credentials.
    if (user.role === "student") {
      if (!String(studentId || "").trim()) {
        throw new Error("Student ID is required for student login.");
      }

      const student = db.students.find((item) => item.userId === user.id);
      if (!student || String(student.id) !== String(studentId).trim()) {
        throw new Error("Invalid Student ID.");
      }
    }

    return { id: user.id, username: user.username, name: user.name, role: user.role, linkedId: user.linkedId };
  }

  async getAdminStats() {
    await delay();
    const db = readDb();
    const attendanceCount = db.attendance.length;
    const presentCount = db.attendance.filter((item) => item.status === "Present").length;
    const resultScores = db.results.map((item) => item.score);

    const attendanceRate = attendanceCount ? Math.round((presentCount / attendanceCount) * 100) : 0;
    const averageGrade = resultScores.length
      ? Number((resultScores.reduce((sum, score) => sum + Number(score), 0) / resultScores.length).toFixed(1))
      : 0;

    return {
      totalStudents: db.students.length,
      totalTeachers: db.teachers.length,
      attendanceRate,
      averageGrade
    };
  }

  // Backward-compatible alias for older dashboard code.
  async getDashboardStats() {
    const stats = await this.getAdminStats();
    const db = readDb();
    const totalClasses = new Set(db.students.map((student) => student.className)).size;
    return {
      totalStudents: stats.totalStudents,
      totalTeachers: stats.totalTeachers,
      totalClasses
    };
  }

  async getStudents() {
    await delay();
    return readDb().students;
  }

  async getStudentById(id) {
    await delay();
    const student = readDb().students.find((item) => item.id === Number(id));
    if (!student) throw new Error("Student not found");
    return student;
  }

  async createStudent(payload) {
    await delay();
    const db = readDb();
    const newStudentId = nextId(db.students);
    const userId = nextId(db.users);
    const username = `student${newStudentId}`;
    const password = "student123";

    const newUser = {
      id: userId,
      username,
      password,
      name: `${payload.firstName} ${payload.lastName}`,
      role: "student",
      linkedId: newStudentId
    };

    const newStudent = {
      id: newStudentId,
      userId,
      teacherId: Number(payload.teacherId),
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      className: payload.className,
      guardianPhone: payload.guardianPhone
    };

    db.users.push(newUser);
    db.students.push(newStudent);
    writeDb(db);

    return {
      ...newStudent,
      credentials: { username, password }
    };
  }

  async updateStudent(id, payload) {
    await delay();
    const db = readDb();
    const index = db.students.findIndex((item) => item.id === Number(id));
    if (index < 0) throw new Error("Student not found");

    const updated = {
      ...db.students[index],
      teacherId: Number(payload.teacherId),
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      className: payload.className,
      guardianPhone: payload.guardianPhone
    };

    db.students[index] = updated;

    const account = db.users.find((item) => item.id === updated.userId);
    if (account) account.name = fullName(updated);

    writeDb(db);
    return updated;
  }

  async deleteStudent(id) {
    await delay();
    const db = readDb();
    const student = db.students.find((item) => item.id === Number(id));
    if (!student) return { success: true };

    db.students = db.students.filter((item) => item.id !== Number(id));
    db.attendance = db.attendance.filter((item) => item.studentId !== Number(id));
    db.results = db.results.filter((item) => item.studentId !== Number(id));
    db.users = db.users.filter((item) => item.id !== student.userId);

    writeDb(db);
    return { success: true };
  }

  async getTeachers() {
    await delay();
    return readDb().teachers;
  }

  async createTeacher(payload) {
    await delay();
    const db = readDb();
    const newTeacherId = nextId(db.teachers);
    const userId = nextId(db.users);
    const username = `teacher${newTeacherId}`;
    const password = "teacher123";

    const newUser = {
      id: userId,
      username,
      password,
      name: payload.name,
      role: "teacher",
      linkedId: newTeacherId
    };

    const newTeacher = {
      id: newTeacherId,
      userId,
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      phone: payload.phone
    };

    db.users.push(newUser);
    db.teachers.push(newTeacher);
    writeDb(db);

    return {
      ...newTeacher,
      credentials: { username, password }
    };
  }

  async updateTeacher(id, payload) {
    await delay();
    const db = readDb();
    const index = db.teachers.findIndex((item) => item.id === Number(id));
    if (index < 0) throw new Error("Teacher not found");

    const updated = {
      ...db.teachers[index],
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      phone: payload.phone
    };

    db.teachers[index] = updated;

    const account = db.users.find((item) => item.id === updated.userId);
    if (account) account.name = updated.name;

    writeDb(db);
    return updated;
  }

  async deleteTeacher(id) {
    await delay();
    const db = readDb();
    const teacher = db.teachers.find((item) => item.id === Number(id));
    if (!teacher) return { success: true };

    db.teachers = db.teachers.filter((item) => item.id !== Number(id));
    db.students = db.students.map((student) =>
      student.teacherId === Number(id) ? { ...student, teacherId: null } : student
    );
    db.users = db.users.filter((item) => item.id !== teacher.userId);

    writeDb(db);
    return { success: true };
  }

  async getAttendance() {
    await delay();
    return readDb().attendance;
  }

  async upsertAttendance(payload) {
    await delay();
    const db = readDb();
    const existingIndex = db.attendance.findIndex(
      (item) => item.studentId === Number(payload.studentId) && item.date === payload.date
    );

    if (existingIndex >= 0) {
      db.attendance[existingIndex] = { ...db.attendance[existingIndex], ...payload };
      writeDb(db);
      return db.attendance[existingIndex];
    }

    const entry = { id: nextId(db.attendance), ...payload };
    db.attendance.push(entry);
    writeDb(db);
    return entry;
  }

  // Backward-compatible alias for older attendance code.
  async addAttendance(payload) {
    return this.upsertAttendance(payload);
  }

  async deleteAttendance(id) {
    await delay();
    const db = readDb();
    db.attendance = db.attendance.filter((item) => item.id !== Number(id));
    writeDb(db);
    return { success: true };
  }

  async getResults() {
    await delay();
    return readDb().results;
  }

  async addResult(payload) {
    await delay();
    const db = readDb();
    const entry = {
      id: nextId(db.results),
      studentId: Number(payload.studentId),
      subject: payload.subject,
      score: Number(payload.score),
      grade: getLetterGrade(payload.score),
      teacherId: Number.isFinite(Number(payload.teacherId)) ? Number(payload.teacherId) : 0
    };

    db.results.push(entry);
    writeDb(db);
    return entry;
  }

  async updateResult(id, payload) {
    await delay();
    const db = readDb();
    const index = db.results.findIndex((item) => item.id === Number(id));
    if (index < 0) throw new Error("Result not found");

    db.results[index] = {
      ...db.results[index],
      subject: payload.subject,
      score: Number(payload.score),
      grade: getLetterGrade(payload.score)
    };

    writeDb(db);
    return db.results[index];
  }

  async deleteResult(id) {
    await delay();
    const db = readDb();
    db.results = db.results.filter((item) => item.id !== Number(id));
    writeDb(db);
    return { success: true };
  }

  async getTeacherDashboard(userId) {
    await delay();
    const db = readDb();
    const teacher = findTeacherByUser(db, Number(userId));
    if (!teacher) throw new Error("Teacher profile not found");

    const students = db.students.filter((student) => student.teacherId === teacher.id);
    const studentIds = new Set(students.map((student) => student.id));
    const attendance = db.attendance.filter((item) => studentIds.has(item.studentId));
    const results = db.results.filter((item) => studentIds.has(item.studentId));

    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = attendance.filter((item) => item.date === today);
    const presentToday = todayAttendance.filter((item) => item.status === "Present").length;
    const attendanceRateToday = todayAttendance.length ? Math.round((presentToday / todayAttendance.length) * 100) : 0;
    const averageScore = results.length
      ? Number((results.reduce((sum, item) => sum + Number(item.score), 0) / results.length).toFixed(1))
      : 0;

    return {
      teacher,
      students,
      attendance,
      results,
      stats: {
        totalStudents: students.length,
        attendanceRateToday,
        averageScore
      }
    };
  }

  async getStudentDashboard(userId) {
    await delay();
    const db = readDb();
    const student = findStudentByUser(db, Number(userId));
    if (!student) throw new Error("Student profile not found");

    const attendance = db.attendance.filter((item) => item.studentId === student.id);
    const results = db.results.filter((item) => item.studentId === student.id);

    const presentCount = attendance.filter((item) => item.status === "Present").length;
    const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;
    const averageScore = results.length
      ? Number((results.reduce((sum, item) => sum + Number(item.score), 0) / results.length).toFixed(1))
      : 0;

    return {
      student,
      attendance,
      results,
      stats: {
        attendanceRate,
        averageScore,
        totalSubjects: results.length
      }
    };
  }
}

export const api = new FakeApi();
