import api from './axiosInstance';

export const getMyAppliances = () => {
    return api.get("/api/appliances/me");
}