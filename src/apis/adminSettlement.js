import api from "./axiosInstance";

/**
 * 전체 대행사 대상 월별 정산 현황 조회 (요약 + 대행사별 목록)
 * GET /api/admin/settlements?year=&month=
 */
export const getAdminSettlements = (year, month) =>
    api.get("/api/admin/settlements", { params: { year, month } });

/**
 * 특정 대행사 건별 정산 내역 조회
 * GET /api/admin/settlements/{agencyId}/details?year=&month=
 */
export const getAdminSettlementDetails = (agencyId, year, month) =>
    api.get(`/api/admin/settlements/${agencyId}/details`, { params: { year, month } });

/**
 * 단일 대행사 지급 승인
 * PATCH /api/admin/settlements/{agencyId}/approve?year=&month=
 */
export const approveAdminSettlement = (agencyId, year, month) =>
    api.patch(`/api/admin/settlements/${agencyId}/approve`, null, { params: { year, month } });

/**
 * 미지급 전체 일괄 승인
 * PATCH /api/admin/settlements/approve-all?year=&month=
 */
export const approveAllAdminSettlements = (year, month) =>
    api.patch("/api/admin/settlements/approve-all", null, { params: { year, month } });
