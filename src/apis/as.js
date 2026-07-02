import api from "./axiosInstance";

export const getMyAS = () => {
    return api.get("/api/as-requests/me");
}

export const getAsRequestDetail = (requestId) =>
    api.get(`/api/as-requests/${requestId}`);

export const getReport = (reportId) =>
    api.get(`/api/engineer/work-reports/${reportId}`);

export const approveReport = (reportId) =>
    api.patch(`/api/engineer/work-reports/${reportId}/approve`);

export const cancelAsRequest = async(requestId, cancelReason) => {
    const response = await api.patch(
        `/api/as-requests/${requestId}/cancel`,
        null,
        {
            params:{
                cancelReason,
            },
        }
    );
    return response.data;
}

export const review = async(requestId, rating, content) => {
    const response = await api.post(
        `/api/customer/as-requests/${requestId}/reviews`,
        { rating, content }
    );

    return response.data;
}

export const createAsRequest = (payload) =>
    api.post("/api/as-requests", payload);

export const processPayment = (requestId) =>
    api.post(`/api/customer/as-requests/${requestId}/payment`);