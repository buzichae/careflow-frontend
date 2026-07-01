import api from "./axiosInstance";

export const signupCustomer = (data) =>
  api.post("/api/auth/signup", data);

export const signupAgency = (data) => 
    // 현재 409 오류 발생
  api.post("/api/agencies/signup", data);

export const signupEngineer = (data) =>
  api.post("/api/engineers/signup", data);

export const login = (data) =>
  api.post("/api/auth/login", data);

export const logout = () =>
  api.post("/api/auth/logout");

// 고객 정보 조회
export const getUserInfo = () => api.get("/api/users/me");

// 고객 정보 수정
export const updateUserProfile = (data) => api.patch("/api/users/me", data);

// 지역명으로 regionId 조회 -> regionId로 넘기도록 수정 필요
export const getRegionByName = (name) => api.get("/api/regions", { data: { name } });