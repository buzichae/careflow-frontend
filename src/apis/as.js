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

// 증상별 예상 수리 비용 조회 (avgCost가 null이면 아직 집계 전 — "데이터 수집 중")
export const getExpectedRepairCost = (symptomId) =>
    api.get(`/api/as-requests/expected-cost/${symptomId}`);

// 토스페이먼츠 결제위젯 successUrl 리다이렉트로 받은 값을 그대로 백엔드에 전달해 승인 확정
export const processPayment = (requestId, { paymentKey, orderId, amount }) =>
    api.post(`/api/customer/as-requests/${requestId}/payment`, {
        paymentKey,
        orderId,
        amount,
    });

export const getPaymentSummary = () =>
    api.get('/api/customer/payments/summary');

// 월별 결제액 추이 (최근 6개월, 오래된 달 → 최신 달 순)
export const getMonthlyPayments = () =>
    api.get('/api/customer/payments/monthly');