import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

export const signupCustomer = (data) =>
  api.post("/api/auth/signup", data);

export const signupAgency = (data) => 
    // 현재 409 오류 발생
  api.post("/api/agencies/signup", data);

export const signupEngineer = (data) =>
  api.post("/api/engineers/signup", data);

export const login = (data) =>
  api.post("/api/auth/login", data);