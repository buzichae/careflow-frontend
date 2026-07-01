export function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function getRoleFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const payload = parseJwt(token);
  return payload?.role ?? null;
}

export const ROLE_DASH = {
  CUSTOMER: "/customer/home",
  ENGINEER: "/engineer/dashboard",
  AGENCY:   "/agency/dashboard",
  ADMIN:    "/admin/dashboard",
};
