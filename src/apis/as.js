import api from "./axiosInstace";

export const getMyAS = () => {
    return api.get("/api/as-requests/me");
}