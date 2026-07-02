import api from "./axiosInstance";

// 기사용
export const getMyLmsContents = () =>
    api.get("/api/lms/contents");

export const getLmsContent = (contentId) =>
    api.get(`/api/lms/contents/${contentId}`);

export const completeContent = (contentId) =>
    api.post(`/api/lms/contents/${contentId}/complete`);

export const getMyLmsStatus = () =>
    api.get("/api/lms/status");

// 관리자용
export const getAdminLmsContents = (params) =>
    api.get("/api/lms/admin/contents/filter", { params });

export const createLmsContent = (data) =>
    api.post("/api/lms/admin/contents", data);

export const updateLmsContent = (contentId, data) =>
    api.put(`/api/lms/admin/contents/${contentId}`, data);

export const deactivateLmsContent = (contentId) =>
    api.patch(`/api/lms/admin/contents/${contentId}/deactivate`);

export const activateLmsContent = (contentId) =>
    api.patch(`/api/lms/admin/contents/${contentId}/activate`);

export const getEngineerConfirmations = (engineerUserId, year) =>
    api.get(`/api/lms/admin/engineers/${engineerUserId}/confirmations`, {
        params: year ? { year } : {}
    });

// 대행사용
export const getAgencyEngineersLmsStatus = (agencyId) =>
    api.get(`/api/lms/agency/${agencyId}/engineers/lms-status`);

export const sendLmsNotification = (agencyId, engineerUserId) =>
    api.post(`/api/lms/agency/${agencyId}/engineers/${engineerUserId}/notify-lms`);