import axios from "axios";
import { getDeviceId } from "../utils/deviceId";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if(token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // 신뢰 기기 판별용 기기 식별 토큰 — 로그인 시 백엔드가 이 값으로 기기를 구분/등록한다
    config.headers["X-Device-Id"] = getDeviceId();

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.dispatchEvent(new CustomEvent("session-expired"));
        }
        return Promise.reject(error);
    }
);

export default api;