import api from './axiosInstance';

export const getMyAppliances = () => {
    return api.get("/api/appliances/me");
}

export const deleteAppliances = (applianceId) => {
    return api.delete(`/api/appliances/${applianceId}`);
}