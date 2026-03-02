import { api } from "./api.js";

// Storage key for the logged-in user session.
const AUTH_KEY = "sms_auth_user";

const inPages = () => window.location.pathname.includes("/pages/");
const indexPath = () => (inPages() ? "../index.html" : "./index.html");
const rolePagePath = (role) => {
  const page = role === "admin" ? "admin.html" : role === "teacher" ? "teacher.html" : "student.html";
  return inPages() ? `./${page}` : `./pages/${page}`;
};

export class AuthService {
  // Returns the current session user object.
  static getUser() {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  static isAuthenticated() {
    return Boolean(this.getUser());
  }

  // Simulated login through fake API with role-aware validation.
  static async login({ username, password, role, studentId }) {
    const user = await api.login({ username, password, role, studentId });
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  }

  static logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = indexPath();
  }

  // Protects non-login routes.
  static requireAuth() {
    const user = this.getUser();
    if (!user) {
      window.location.href = indexPath();
      return null;
    }
    return user;
  }

  // Redirect authenticated users away from login page.
  static redirectIfAuthenticated() {
    const user = this.getUser();
    if (user) window.location.href = rolePagePath(user.role);
  }

  // Restrict a page to specific roles.
  static enforceRole(user, allowedRoles) {
    if (!user || allowedRoles.includes(user.role)) return;
    window.location.href = rolePagePath(user.role);
  }

  static dashboardPathForRole(role) {
    return rolePagePath(role);
  }
}
