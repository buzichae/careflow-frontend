import api from './axiosInstance';

export const getMyAppliances = () => {
    return api.get("/api/appliances/me");
}

export const deleteAppliances = (applianceId) => {
    return api.delete(`/api/appliances/${applianceId}`);
}

export const createAppliance = (data) =>
    api.post("/api/appliances", { ...data, registerMethod: "MANUAL" });

export const getMyDetailAppliance = (applianceId) => {
    return api.get(`/api/appliances/${applianceId}/repair-history`);
}