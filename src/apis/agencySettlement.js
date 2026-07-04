import api from "./axiosInstance";

/**
 * 대행사 정산 목록 조회
 * GET /api/agency/settlements?page=&size=
 * - 페이징(page, size)은 쿼리 파라미터
 * - 필터(status, keyword, dateFrom, dateTo)는 GET 요청의 바디로 전달 (백엔드 설계가 그렇게 되어있음)
 *   ※ GET에 바디를 싣는 건 표준 관례는 아니라, 일부 프록시/CDN 환경에서 씹힐 수 있음 — 문제 생기면 이 부분부터 의심
 * → AgencySettlementListResponse { stats, content, totalElements, totalPages, currentPage, size }
 */
export const getAgencySettlements = ({ page, size, status, keyword, dateFrom, dateTo }) =>
  api.get("/api/agency/settlements", {
    params: {
      page,
      size,
      status: status || undefined,
      keyword: keyword || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
  });

/**
 * 정산 상태 변경
 * PATCH /api/agency/settlements/{settlementId}/status
 * body: { status: "APPROVED" | "DISPUTED" | "PENDING" | "PAID" }
 *
 * 전이 규칙 (서버 검증):
 * - PAID 는 최종 상태 → 변경 불가
 * - PAID 로 변경은 APPROVED 상태에서만 허용
 * - 그 외 PENDING / APPROVED / DISPUTED 간은 자유롭게 전이
 */
export const updateSettlementStatus = (settlementId, status) =>
  api.patch(`/api/agency/settlements/${settlementId}/status`, { status });

/**
 * 대행사 소속 기사별 실적 리포트 (월 단위 집계)
 * GET /api/agency/settlements/engineers/performance?year=&month=
 */
export const getEngineerPerformance = (year, month) =>
  api.get("/api/agency/settlements/engineers/performance", { params: { year, month } });

/**
 * 월별 정산 리포트 CSV 다운로드
 * GET /api/agency/settlements/monthly-report/download?year=&month=
 */
export const downloadMonthlySettlementCsv = (year, month) =>
  api.get("/api/agency/settlements/monthly-report/download", {
    params: { year, month },
    responseType: "blob",
  });