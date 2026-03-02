import { api } from "./api.js";
import { AuthService } from "./auth.js";

const qs = (selector, parent = document) => parent.querySelector(selector);
const esc = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const gradeForScore = (score) => {
  const num = Number(score);
  if (num >= 90) return "A";
  if (num >= 80) return "B";
  if (num >= 70) return "C";
  if (num >= 60) return "D";
  return "F";
};

class SchoolManagementApp {
  constructor() {
    this.page = document.body.dataset.page;
    this.user = null;
  }

  init() {
    if (this.page === "login") {
      AuthService.redirectIfAuthenticated();
      this.initLogin();
      return;
    }

    this.user = AuthService.requireAuth();
    if (!this.user) return;
    this.enforceAccessByRole();
    this.bindShellEvents();
    this.setActiveNav();

    const userLabel = qs("[data-current-user]");
    if (userLabel && this.user) userLabel.textContent = this.user.name;

    if (this.page === "dashboard") this.initDashboard();
    if (this.page === "students") this.initStudents();
    if (this.page === "teachers") this.initTeachers();
    if (this.page === "attendance") this.initAttendance();
    if (this.page === "results") this.initResults();
    if (this.page === "teacher") this.initTeacherDashboard();
    if (this.page === "student") this.initStudentDashboard();
  }

  enforceAccessByRole() {
    const pageRoles = {
      dashboard: ["admin"],
      students: ["admin"],
      teachers: ["admin"],
      attendance: ["admin"],
      results: ["admin"],
      teacher: ["teacher"],
      student: ["student"]
    };

    const allowed = pageRoles[this.page];
    if (!allowed) return;
    AuthService.enforceRole(this.user, allowed);
  }

  bindShellEvents() {
    const logoutBtn = qs("[data-logout]");
    const menuToggle = qs("#menuToggle");
    const sidebar = qs("#sidebar");

    if (logoutBtn) logoutBtn.addEventListener("click", () => AuthService.logout());
    if (menuToggle && sidebar) {
      menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
    }
  }

  setActiveNav() {
    const active = qs(`.nav-link[data-nav='${this.page}']`);
    if (active) active.classList.add("active");
  }

  initLogin() {
    const form = qs("#loginForm");
    const error = qs("#loginError");
    const roleSelect = qs("#role");
    const studentIdGroup = qs("#studentIdGroup");
    const studentIdInput = qs("#studentId");

    // Show Student ID field only for student role.
    const toggleRoleIdFields = () => {
      const isStudent = roleSelect.value === "student";

      studentIdGroup.classList.toggle("is-hidden", !isStudent);
      studentIdInput.required = isStudent;
      if (!isStudent) studentIdInput.value = "";
    };

    roleSelect?.addEventListener("change", toggleRoleIdFields);
    toggleRoleIdFields();

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";

      const role = qs("#role").value;
      const username = qs("#username").value.trim();
      const password = qs("#password").value.trim();
      const studentId = qs("#studentId").value.trim();

      // Basic client-side validation before calling the fake backend.
      if (!role || !username || !password) {
        error.textContent = "Role, username, and password are required.";
        return;
      }

      if (role === "student" && !studentId) {
        error.textContent = "Student ID is required for student login.";
        return;
      }

      const submit = qs("#loginBtn");
      submit.disabled = true;
      submit.textContent = "Signing in...";

      try {
        const user = await AuthService.login({ username, password, role, studentId });
        window.location.href = AuthService.dashboardPathForRole(user.role);
      } catch (err) {
        error.textContent = err.message;
      } finally {
        submit.disabled = false;
        submit.textContent = "Login";
      }
    });
  }

  async initDashboard() {
    const statsRoot = qs("#statsGrid");
    const studentsRoot = qs("#recentStudents");
    const teachersRoot = qs("#recentTeachers");

    const [stats, students, teachers] = await Promise.all([
      api.getDashboardStats(),
      api.getStudents(),
      api.getTeachers()
    ]);

    statsRoot.innerHTML = `
      <article class="card">
        <div class="stat-label">Total Students</div>
        <div class="stat-value">${stats.totalStudents}</div>
      </article>
      <article class="card">
        <div class="stat-label">Total Teachers</div>
        <div class="stat-value">${stats.totalTeachers}</div>
      </article>
      <article class="card">
        <div class="stat-label">Total Classes</div>
        <div class="stat-value">${stats.totalClasses}</div>
      </article>
    `;

    studentsRoot.innerHTML = students
      .slice(0, 5)
      .map((s) => `<tr><td>${esc(`${s.firstName} ${s.lastName}`)}</td><td>${esc(s.className)}</td></tr>`)
      .join("");

    teachersRoot.innerHTML = teachers
      .slice(0, 5)
      .map((t) => `<tr><td>${esc(t.name)}</td><td>${esc(t.subject)}</td></tr>`)
      .join("");
  }

  async initStudents() {
    const form = qs("#studentForm");
    const message = qs("#studentMsg");
    const hiddenId = qs("#studentId");
    const table = qs("#studentsTableBody");
    const teacherSelect = qs("#studentTeacher");

    const readForm = () => ({
      firstName: qs("#firstName").value.trim(),
      lastName: qs("#lastName").value.trim(),
      email: qs("#studentEmail").value.trim(),
      className: qs("#className").value.trim(),
      guardianPhone: qs("#guardianPhone").value.trim(),
      teacherId: qs("#studentTeacher").value
    });

    const validate = (payload) => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (Object.values(payload).some((v) => !v)) return "All fields are required.";
      if (!emailPattern.test(payload.email)) return "Enter a valid email address.";
      return "";
    };

    const loadTeacherOptions = async () => {
      const teachers = await api.getTeachers();
      teacherSelect.innerHTML = '<option value="">Select teacher</option>' +
        teachers.map((teacher) => `<option value="${teacher.id}">${esc(teacher.name)}</option>`).join("");
    };

    const render = async () => {
      const [students, teachers] = await Promise.all([api.getStudents(), api.getTeachers()]);
      const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher.name]));
      table.innerHTML = students
        .map(
          (s) => `<tr>
            <td>${esc(`${s.firstName} ${s.lastName}`)}</td>
            <td>${esc(s.email)}</td>
            <td>${esc(s.className)}</td>
            <td>${esc(teacherMap.get(s.teacherId) || "Unassigned")}</td>
            <td>
              <div class="actions">
                <button class="btn btn-secondary" data-action="edit" data-id="${s.id}">Edit</button>
                <button class="btn btn-danger" data-action="delete" data-id="${s.id}">Delete</button>
              </div>
            </td>
          </tr>`
        )
        .join("");
    };

    await loadTeacherOptions();
    await render();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.className = "text-error";
      message.textContent = "";

      const payload = readForm();
      const errorText = validate(payload);
      if (errorText) {
        message.textContent = errorText;
        return;
      }

      if (hiddenId.value) {
        await api.updateStudent(hiddenId.value, payload);
        message.className = "text-success";
        message.textContent = "Student updated successfully.";
      } else {
        const created = await api.createStudent(payload);
        message.className = "text-success";
        message.textContent = `Student added. Login: ${created.credentials.username} / ${created.credentials.password} (Student ID: ${created.id})`;
      }

      form.reset();
      hiddenId.value = "";
      await render();
    });

    qs("#studentReset")?.addEventListener("click", () => {
      form.reset();
      hiddenId.value = "";
      message.textContent = "";
    });

    table.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const id = Number(button.dataset.id);
      const students = await api.getStudents();

      if (button.dataset.action === "delete") {
        await api.deleteStudent(id);
        await render();
      }

      if (button.dataset.action === "edit") {
        const student = students.find((item) => item.id === id);
        if (!student) return;
        hiddenId.value = student.id;
        qs("#firstName").value = student.firstName;
        qs("#lastName").value = student.lastName;
        qs("#studentEmail").value = student.email;
        qs("#className").value = student.className;
        qs("#guardianPhone").value = student.guardianPhone;
        qs("#studentTeacher").value = student.teacherId ? String(student.teacherId) : "";
        message.className = "text-success";
        message.textContent = "Editing student record.";
      }
    });
  }

  async initTeachers() {
    const form = qs("#teacherForm");
    const message = qs("#teacherMsg");
    const hiddenId = qs("#teacherId");
    const table = qs("#teachersTableBody");

    const readForm = () => ({
      name: qs("#teacherName").value.trim(),
      email: qs("#teacherEmail").value.trim(),
      subject: qs("#teacherSubject").value.trim(),
      phone: qs("#teacherPhone").value.trim()
    });

    const validate = (payload) => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (Object.values(payload).some((v) => !v)) return "All fields are required.";
      if (!emailPattern.test(payload.email)) return "Enter a valid email address.";
      return "";
    };

    const render = async () => {
      const teachers = await api.getTeachers();
      table.innerHTML = teachers
        .map(
          (t) => `<tr>
            <td>${esc(t.name)}</td>
            <td>${esc(t.email)}</td>
            <td>${esc(t.subject)}</td>
            <td>${esc(t.phone)}</td>
            <td>
              <div class="actions">
                <button class="btn btn-secondary" data-action="edit" data-id="${t.id}">Edit</button>
                <button class="btn btn-danger" data-action="delete" data-id="${t.id}">Delete</button>
              </div>
            </td>
          </tr>`
        )
        .join("");
    };

    await render();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.className = "text-error";
      message.textContent = "";

      const payload = readForm();
      const errorText = validate(payload);
      if (errorText) {
        message.textContent = errorText;
        return;
      }

      if (hiddenId.value) {
        await api.updateTeacher(hiddenId.value, payload);
        message.className = "text-success";
        message.textContent = "Teacher updated successfully.";
      } else {
        const created = await api.createTeacher(payload);
        message.className = "text-success";
        message.textContent = `Teacher added. Login: ${created.credentials.username} / ${created.credentials.password}`;
      }

      form.reset();
      hiddenId.value = "";
      await render();
    });

    qs("#teacherReset")?.addEventListener("click", () => {
      form.reset();
      hiddenId.value = "";
      message.textContent = "";
    });

    table.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const id = Number(button.dataset.id);
      const teachers = await api.getTeachers();

      if (button.dataset.action === "delete") {
        await api.deleteTeacher(id);
        await render();
      }

      if (button.dataset.action === "edit") {
        const teacher = teachers.find((item) => item.id === id);
        if (!teacher) return;
        hiddenId.value = teacher.id;
        qs("#teacherName").value = teacher.name;
        qs("#teacherEmail").value = teacher.email;
        qs("#teacherSubject").value = teacher.subject;
        qs("#teacherPhone").value = teacher.phone;
        message.className = "text-success";
        message.textContent = "Editing teacher record.";
      }
    });
  }

  async initAttendance() {
    const form = qs("#attendanceForm");
    const message = qs("#attendanceMsg");
    const studentSelect = qs("#attendanceStudent");
    const table = qs("#attendanceTableBody");

    const [students, attendance] = await Promise.all([api.getStudents(), api.getAttendance()]);
    studentSelect.innerHTML = '<option value="">Select student</option>' +
      students.map((s) => `<option value="${s.id}">${esc(`${s.firstName} ${s.lastName}`)}</option>`).join("");

    const render = async () => {
      const [studentRows, rows] = await Promise.all([api.getStudents(), api.getAttendance()]);
      const studentMap = new Map(studentRows.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));

      table.innerHTML = rows
        .map((item) => {
          const statusClass =
            item.status === "Present"
              ? "badge-success"
              : item.status === "Late"
                ? "badge-warning"
                : "badge-danger";

          return `<tr>
            <td>${esc(studentMap.get(item.studentId) || "Unknown")}</td>
            <td>${esc(item.date)}</td>
            <td><span class="badge ${statusClass}">${esc(item.status)}</span></td>
            <td><button class="btn btn-danger" data-delete-attendance="${item.id}">Delete</button></td>
          </tr>`;
        })
        .join("");
    };

    qs("#attendanceDate").value = new Date().toISOString().split("T")[0];
    if (attendance.length) await render();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.className = "text-error";
      message.textContent = "";

      const studentId = Number(studentSelect.value);
      const date = qs("#attendanceDate").value;
      const status = qs("#attendanceStatus").value;

      if (!studentId || !date || !status) {
        message.textContent = "Please complete all attendance fields.";
        return;
      }

      await api.addAttendance({ studentId, date, status });
      message.className = "text-success";
      message.textContent = "Attendance recorded successfully.";
      form.reset();
      qs("#attendanceDate").value = new Date().toISOString().split("T")[0];
      await render();
    });

    table.addEventListener("click", async (event) => {
      const btn = event.target.closest("button[data-delete-attendance]");
      if (!btn) return;
      await api.deleteAttendance(Number(btn.dataset.deleteAttendance));
      await render();
    });

    await render();
  }

  async initResults() {
    const form = qs("#resultForm");
    const message = qs("#resultMsg");
    const studentSelect = qs("#resultStudent");
    const table = qs("#resultsTableBody");

    const students = await api.getStudents();
    studentSelect.innerHTML = '<option value="">Select student</option>' +
      students.map((s) => `<option value="${s.id}">${esc(`${s.firstName} ${s.lastName}`)}</option>`).join("");

    const render = async () => {
      const [studentRows, rows] = await Promise.all([api.getStudents(), api.getResults()]);
      const studentMap = new Map(studentRows.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));

      table.innerHTML = rows
        .map(
          (r) => `<tr>
            <td>${esc(studentMap.get(r.studentId) || "Unknown")}</td>
            <td>${esc(r.subject)}</td>
            <td>${esc(r.score)}</td>
            <td>${esc(r.grade)}</td>
            <td><button class="btn btn-danger" data-delete-result="${r.id}">Delete</button></td>
          </tr>`
        )
        .join("");
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.className = "text-error";
      message.textContent = "";

      const studentId = Number(studentSelect.value);
      const subject = qs("#resultSubject").value.trim();
      const score = Number(qs("#resultScore").value);

      if (!studentId || !subject || Number.isNaN(score)) {
        message.textContent = "Please complete all result fields.";
        return;
      }

      if (score < 0 || score > 100) {
        message.textContent = "Score must be between 0 and 100.";
        return;
      }

      await api.addResult({ studentId, subject, score, grade: gradeForScore(score) });
      message.className = "text-success";
      message.textContent = "Result added successfully.";
      form.reset();
      await render();
    });

    table.addEventListener("click", async (event) => {
      const btn = event.target.closest("button[data-delete-result]");
      if (!btn) return;
      await api.deleteResult(Number(btn.dataset.deleteResult));
      await render();
    });

    await render();
  }

  async initTeacherDashboard() {
    const statsRoot = qs("#teacherStats");
    const studentsBody = qs("#teacherStudentsBody");
    const attendanceForm = qs("#teacherAttendanceForm");
    const attendanceMsg = qs("#teacherAttendanceMsg");
    const attendanceStudent = qs("#teacherAttendanceStudent");
    const attendanceDate = qs("#teacherAttendanceDate");
    const attendanceStatus = qs("#teacherAttendanceStatus");
    const attendanceBody = qs("#teacherAttendanceBody");
    const resultForm = qs("#teacherResultForm");
    const resultMsg = qs("#teacherResultMsg");
    const resultId = qs("#teacherResultId");
    const resultStudent = qs("#teacherResultStudent");
    const resultSubject = qs("#teacherResultSubject");
    const resultScore = qs("#teacherResultScore");
    const resultsBody = qs("#teacherResultsBody");
    const filterStudent = qs("#teacherFilterStudent");

    const renderStudentOptions = (students, includeAll = false) => {
      const allOption = includeAll ? '<option value="">All students</option>' : '<option value="">Select student</option>';
      return allOption + students
        .map((student) => `<option value="${student.id}">${esc(`${student.firstName} ${student.lastName}`)}</option>`)
        .join("");
    };

    const render = async () => {
      const dashboard = await api.getTeacherDashboard(this.user.id);
      const studentMap = new Map(dashboard.students.map((student) => [student.id, `${student.firstName} ${student.lastName}`]));
      const selectedFilter = Number(filterStudent.value) || null;

      statsRoot.innerHTML = `
        <article class="card">
          <div class="stat-label">Assigned Students</div>
          <div class="stat-value">${dashboard.stats.totalStudents}</div>
        </article>
        <article class="card">
          <div class="stat-label">Today's Attendance</div>
          <div class="stat-value">${dashboard.stats.attendanceRateToday}%</div>
        </article>
        <article class="card">
          <div class="stat-label">Average Grade</div>
          <div class="stat-value">${dashboard.stats.averageScore}</div>
        </article>
      `;

      studentsBody.innerHTML = dashboard.students
        .map(
          (student) => `<tr>
            <td>${esc(`${student.firstName} ${student.lastName}`)}</td>
            <td>${esc(student.className)}</td>
            <td>${esc(student.email)}</td>
          </tr>`
        )
        .join("");

      const attendanceRows = selectedFilter
        ? dashboard.attendance.filter((item) => item.studentId === selectedFilter)
        : dashboard.attendance;

      attendanceBody.innerHTML = attendanceRows
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((item) => {
          const badgeClass = item.status === "Present" ? "badge-success" : "badge-danger";
          return `<tr>
            <td>${esc(studentMap.get(item.studentId) || "Unknown")}</td>
            <td>${esc(item.date)}</td>
            <td><span class="badge ${badgeClass}">${esc(item.status)}</span></td>
            <td><button class="btn btn-secondary" type="button" data-edit-attendance="${item.studentId}|${item.date}|${item.status}">Edit</button></td>
          </tr>`;
        })
        .join("");

      const resultRows = selectedFilter
        ? dashboard.results.filter((item) => item.studentId === selectedFilter)
        : dashboard.results;

      resultsBody.innerHTML = resultRows
        .map(
          (item) => `<tr>
            <td>${esc(studentMap.get(item.studentId) || "Unknown")}</td>
            <td>${esc(item.subject)}</td>
            <td>${esc(item.score)}</td>
            <td>${esc(item.grade)}</td>
            <td>
              <div class="actions">
                <button class="btn btn-secondary" type="button" data-edit-result="${item.id}">Edit</button>
                <button class="btn btn-danger" type="button" data-delete-result="${item.id}">Delete</button>
              </div>
            </td>
          </tr>`
        )
        .join("");
    };

    const initial = await api.getTeacherDashboard(this.user.id);
    attendanceStudent.innerHTML = renderStudentOptions(initial.students);
    resultStudent.innerHTML = renderStudentOptions(initial.students);
    filterStudent.innerHTML = renderStudentOptions(initial.students, true);
    attendanceDate.value = new Date().toISOString().split("T")[0];
    await render();

    filterStudent.addEventListener("change", render);

    attendanceForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      attendanceMsg.className = "text-error";
      attendanceMsg.textContent = "";

      const studentId = Number(attendanceStudent.value);
      const date = attendanceDate.value;
      const status = attendanceStatus.value;

      if (!studentId || !date || !status) {
        attendanceMsg.textContent = "Please fill all attendance fields.";
        return;
      }

      await api.upsertAttendance({ studentId, date, status, markedBy: this.user.linkedId });
      attendanceMsg.className = "text-success";
      attendanceMsg.textContent = "Attendance saved successfully.";
      attendanceForm.reset();
      attendanceDate.value = new Date().toISOString().split("T")[0];
      await render();
    });

    attendanceBody.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-edit-attendance]");
      if (!button) return;

      const [studentId, date, status] = button.dataset.editAttendance.split("|");
      attendanceStudent.value = studentId;
      attendanceDate.value = date;
      attendanceStatus.value = status;
      attendanceMsg.className = "text-success";
      attendanceMsg.textContent = "Editing attendance record.";
    });

    resultForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      resultMsg.className = "text-error";
      resultMsg.textContent = "";

      const studentId = Number(resultStudent.value);
      const subject = resultSubject.value.trim();
      const score = Number(resultScore.value);

      if (!studentId || !subject || Number.isNaN(score)) {
        resultMsg.textContent = "Please fill all grade fields.";
        return;
      }

      if (score < 0 || score > 100) {
        resultMsg.textContent = "Score must be between 0 and 100.";
        return;
      }

      if (resultId.value) {
        await api.updateResult(resultId.value, { subject, score });
        resultMsg.className = "text-success";
        resultMsg.textContent = "Grade updated successfully.";
      } else {
        await api.addResult({ studentId, subject, score, teacherId: this.user.linkedId });
        resultMsg.className = "text-success";
        resultMsg.textContent = "Grade added successfully.";
      }

      resultForm.reset();
      resultId.value = "";
      await render();
    });

    resultsBody.addEventListener("click", async (event) => {
      const editButton = event.target.closest("button[data-edit-result]");
      const deleteButton = event.target.closest("button[data-delete-result]");

      if (deleteButton) {
        await api.deleteResult(Number(deleteButton.dataset.deleteResult));
        await render();
        return;
      }

      if (editButton) {
        const rows = await api.getResults();
        const row = rows.find((item) => item.id === Number(editButton.dataset.editResult));
        if (!row) return;

        resultId.value = String(row.id);
        resultStudent.value = String(row.studentId);
        resultSubject.value = row.subject;
        resultScore.value = String(row.score);
        resultMsg.className = "text-success";
        resultMsg.textContent = "Editing grade entry.";
      }
    });
  }

  async initStudentDashboard() {
    const welcome = qs("#studentWelcome");
    const statsRoot = qs("#studentStats");
    const attendanceBody = qs("#studentAttendanceBody");
    const resultsBody = qs("#studentResultsBody");

    const dashboard = await api.getStudentDashboard(this.user.id);
    welcome.textContent = `Welcome, ${dashboard.student.firstName}`;

    statsRoot.innerHTML = `
      <article class="card">
        <div class="stat-label">Attendance %</div>
        <div class="stat-value">${dashboard.stats.attendanceRate}%</div>
      </article>
      <article class="card">
        <div class="stat-label">Average Grade</div>
        <div class="stat-value">${dashboard.stats.averageScore}</div>
      </article>
      <article class="card">
        <div class="stat-label">Total Subjects</div>
        <div class="stat-value">${dashboard.stats.totalSubjects}</div>
      </article>
    `;

    attendanceBody.innerHTML = dashboard.attendance
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((item) => {
        const badgeClass = item.status === "Present" ? "badge-success" : "badge-danger";
        return `<tr>
          <td>${esc(item.date)}</td>
          <td><span class="badge ${badgeClass}">${esc(item.status)}</span></td>
        </tr>`;
      })
      .join("");

    resultsBody.innerHTML = dashboard.results
      .map(
        (item) => `<tr>
          <td>${esc(item.subject)}</td>
          <td>${esc(item.score)}</td>
          <td>${esc(item.grade)}</td>
        </tr>`
      )
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new SchoolManagementApp();
  app.init();
});
