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

// 대행사(AGENCY) 계정의 슈퍼 계정(대표 담당자) 여부
// - true: 슈퍼 계정, false: 일반 관리자 계정, null: 토큰 없음 또는 AGENCY 역할이 아님
export function getIsRepresentativeFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const payload = parseJwt(token);
  return payload?.isRepresentative ?? null;
}

export const ROLE_DASH = {
  CUSTOMER: "/customer/home",
  ENGINEER: "/engineer/dashboard",
  AGENCY:   "/agency/dashboard",
  ADMIN:    "/admin/dashboard",
};
