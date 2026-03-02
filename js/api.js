const API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

class ApiClient {
  async getUsers() {
    return request("/users");
  }

  async getUserByRole(role) {
    return request(`/users?role=${encodeURIComponent(role)}`);
  }

  async login(payload) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async getAdminStats() {
    return request("/admin/stats");
  }

  async getDashboardStats() {
    return request("/dashboard/stats");
  }

  async getStudents() {
    return request("/students");
  }

  async getStudentById(id) {
    return request(`/students/${id}`);
  }

  async createStudent(payload) {
    return request("/students", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async updateStudent(id, payload) {
    return request(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }

  async deleteStudent(id) {
    return request(`/students/${id}`, {
      method: "DELETE"
    });
  }

  async getTeachers() {
    return request("/teachers");
  }

  async createTeacher(payload) {
    return request("/teachers", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async updateTeacher(id, payload) {
    return request(`/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }

  async deleteTeacher(id) {
    return request(`/teachers/${id}`, {
      method: "DELETE"
    });
  }

  async getAttendance() {
    return request("/attendance");
  }

  async upsertAttendance(payload) {
    return request("/attendance/upsert", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async addAttendance(payload) {
    return this.upsertAttendance(payload);
  }

  async deleteAttendance(id) {
    return request(`/attendance/${id}`, {
      method: "DELETE"
    });
  }

  async getResults() {
    return request("/results");
  }

  async addResult(payload) {
    return request("/results", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async updateResult(id, payload) {
    return request(`/results/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }

  async deleteResult(id) {
    return request(`/results/${id}`, {
      method: "DELETE"
    });
  }

  async getTeacherDashboard(userId) {
    return request(`/dashboard/teacher/${userId}`);
  }

  async getStudentDashboard(userId) {
    return request(`/dashboard/student/${userId}`);
  }
}

export const api = new ApiClient();
