import { AuthService } from "./auth.js";

// Small DOM helper for concise selectors.
const qs = (selector, parent = document) => parent.querySelector(selector);

class LoginController {
  constructor() {
    this.form = qs("#loginForm");
    this.error = qs("#loginError");
    this.roleSelect = qs("#role");
    this.studentIdGroup = qs("#studentIdGroup");
    this.studentIdInput = qs("#studentId");
    this.submit = qs("#loginBtn");
    this.submitLabel = this.submit?.querySelector("span");
  }

  init() {
    AuthService.redirectIfAuthenticated();

    // Toggle student ID field based on selected role.
    this.roleSelect?.addEventListener("change", () => this.toggleStudentIdField());
    this.toggleStudentIdField();

    this.form?.addEventListener("submit", (event) => this.handleSubmit(event));
  }

  toggleStudentIdField() {
    const isStudent = this.roleSelect.value === "student";
    this.studentIdGroup.classList.toggle("is-hidden", !isStudent);
    this.studentIdInput.required = isStudent;
    if (!isStudent) this.studentIdInput.value = "";
  }

  async handleSubmit(event) {
    event.preventDefault();
    this.error.textContent = "";

    const role = this.roleSelect.value;
    const username = qs("#username").value.trim();
    const password = qs("#password").value.trim();
    const studentId = this.studentIdInput.value.trim();

    // Client-side validation before simulated API call.
    if (!role || !username || !password) {
      this.error.textContent = "Role, username, and password are required.";
      return;
    }

    if (role === "student" && !studentId) {
      this.error.textContent = "Student ID is required for student login.";
      return;
    }

    this.submit.disabled = true;
    if (this.submitLabel) {
      this.submitLabel.textContent = "Signing in...";
    } else {
      this.submit.textContent = "Signing in...";
    }

    try {
      const user = await AuthService.login({ username, password, role, studentId });
      window.location.href = AuthService.dashboardPathForRole(user.role);
    } catch (err) {
      this.error.textContent = err.message || "Login failed. Please try again.";
    } finally {
      this.submit.disabled = false;
      if (this.submitLabel) {
        this.submitLabel.textContent = "Login";
      } else {
        this.submit.textContent = "Login";
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginController = new LoginController();
  loginController.init();
});
