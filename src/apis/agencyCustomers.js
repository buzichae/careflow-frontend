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

// 고객 정보 수정 (이름/연락처/상세주소) — null 필드는 기존 값 유지
export const updateAgencyCustomer = (userId, { name, phone, addressDetail } = {}) =>
    api.patch(`/api/agency/customers/${userId}`, { name, phone, addressDetail });

// 고객 비밀번호 초기화 — 임시 비밀번호를 생성해 고객 이메일로 발송
export const resetAgencyCustomerPassword = (userId) =>
    api.patch(`/api/agency/customers/${userId}/reset-password`);

// 고객 차단 (status=SUSPENDED로 전환, 로그인 즉시 차단됨)
export const blockAgencyCustomer = (userId) =>
    api.patch(`/api/agency/customers/${userId}/block`);

// 고객 차단 해제 (status=ACTIVE로 복원)
export const unblockAgencyCustomer = (userId) =>
    api.patch(`/api/agency/customers/${userId}/unblock`);
