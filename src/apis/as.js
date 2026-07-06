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

// 고객용: 본인이 특정 A/S 요청에 작성한 리뷰 조회 (없으면 404)
export const getMyReview = (requestId) =>
    api.get(`/api/customer/as-requests/${requestId}/reviews`);

export const createAsRequest = (payload) =>
    api.post("/api/as-requests", payload);

export const processPayment = (requestId) =>
    api.post(`/api/customer/as-requests/${requestId}/payment`);

export const getPaymentSummary = () =>
    api.get('/api/customer/payments/summary');

// 월별 결제액 추이 (최근 6개월, 오래된 달 → 최신 달 순)
export const getMonthlyPayments = () =>
    api.get('/api/customer/payments/monthly');