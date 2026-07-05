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

/**
 * 건별 정산 상태 변경 (보류/재검토 — CareFlow→대행사 지급 상태)
 * PATCH /api/admin/settlements/{settlementId}/status
 * body: { status: "DISPUTED" | "PENDING" }
 * - PAID는 approveAdminSettlement/approveAllAdminSettlements의 배치 승인 전용, 이 API로는 불가
 * - 이미 PAID인 건은 어떤 변경도 불가
 */
export const updateAdminSettlementStatus = (settlementId, status) =>
    api.patch(`/api/admin/settlements/${settlementId}/status`, { status });

/**
 * 배치 단위 정산 상태 변경 (보류/재검토 — platform_settlements 배치 자체)
 * PATCH /api/admin/settlements/{agencyId}/batch-status?year=&month=
 * body: { status: "DISPUTED" | "PENDING" }
 * - PAID는 approveAdminSettlement/approveAllAdminSettlements 전용, 이 API로는 불가
 * - 이미 PAID인 배치는 어떤 변경도 불가(실제 송금이 끝난 불변 기록)
 */
export const updateAdminBatchStatus = (agencyId, year, month, status) =>
    api.patch(`/api/admin/settlements/${agencyId}/batch-status`, { status }, { params: { year, month } });
