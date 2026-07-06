import api from "./axiosInstance";

export const signupCustomer = (data) =>
  api.post("/api/auth/signup", data);

export const signupAgency = (data) => 
    // 현재 409 오류 발생
  api.post("/api/agencies/signup", data);

export const signupEngineer = (data) =>
  api.post("/api/engineer/signup", data);

export const login = (data) =>
  api.post("/api/auth/login", data);

export const logout = () =>
  api.post("/api/auth/logout");

// 고객 정보 조회
export const getUserInfo = () => api.get("/api/users/me");

// 고객 정보 수정
export const updateUserProfile = (data) => api.patch("/api/users/me", data);

// 비밀번호 찾기
export const sendPasswordResetCode = (email) =>
  api.post("/api/auth/password/send-code", { email });

export const verifyPasswordResetCode = (email, code) =>
  api.post("/api/auth/password/verify-code", { email, code });

export const resetPassword = (email, code, newPassword) =>
  api.post("/api/auth/password/reset", { email, code, newPassword });