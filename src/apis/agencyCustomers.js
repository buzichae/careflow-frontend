import api from "./axiosInstance";

// 대행사 소속 고객 목록 조회 (검색/필터/페이징) — 필터 조건은 쿼리 파라미터로 전달
export const getAgencyCustomers = ({ page = 0, size = 10, keyword, status, joinedFrom, joinedTo } = {}) =>
    api.get("/api/agency/customers", {
        params: { page, size, keyword, status, joinedFrom, joinedTo },
    });

// 특정 고객의 등록 가전 목록 조회
export const getAgencyCustomerAppliances = (userId) =>
    api.get(`/api/agency/customers/${userId}/appliances`);

// 특정 고객의 A/S 접수 이력 조회
export const getAgencyCustomerAsRequests = (userId) =>
    api.get(`/api/agency/customers/${userId}/as-requests`);

// 특정 고객의 결제 내역 조회
export const getAgencyCustomerPayments = (userId) =>
    api.get(`/api/agency/customers/${userId}/payments`);
