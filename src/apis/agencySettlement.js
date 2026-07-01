import api from "./axiosInstance";

/**
 * 대행사 정산 목록 조회
 * GET /api/agency/settlements
 */
export const getAgencySettlements = (params) =>
    api.get("/api/agency/settlements", { params });

/**
 * 대행사 정산 요약 통계 (통계 카드용)
 * GET /api/agency/settlements/summary
 */
export const getAgencySettlementSummary = (year, month) =>
    api.get("/api/agency/settlements/summary", { params: { year, month } });

/**
 * 정산 상태 변경
 * PATCH /api/agency/settlements/{settlementId}/status
 */
export const updateSettlementStatus = (settlementId, status) =>
    api.patch(`/api/agency/settlements/${settlementId}/status`, { status });

/**
 * 월별 정산 리포트 CSV 다운로드
 * GET /api/agency/settlements/monthly-report/download?year=&month=
 * - responseType: "blob" 으로 받아 브라우저 다운로드 트리거
 */
export const downloadMonthlySettlementCsv = (year, month) =>
    api.get("/api/agency/settlements/monthly-report/download", {
        params: { year, month },
        responseType: "blob",
    });
