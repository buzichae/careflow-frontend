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
 * 대행사→기사 지급 완료 처리
 * PATCH /api/agency/engineer-payouts/{engineerPayoutId}/pay
 * - CareFlow는 이 자금을 집행하지 않으므로 계좌 등록 여부를 검증하지 않는다(대행사 자체 신고)
 * - 이미 PAID인 배치를 다시 호출해도 에러 없이 204(멱등)
 */
export const payEngineerPayout = (engineerPayoutId) =>
  api.patch(`/api/agency/engineer-payouts/${engineerPayoutId}/pay`);

/**
 * 대행사→기사 지급 건별 상태 변경 (보류/재검토 — 대행사 자체 판단)
 * PATCH /api/agency/engineer-payouts/{engineerPayoutId}/status
 * body: { status: "DISPUTED" | "PENDING" }
 * - PAID는 payEngineerPayout() 전용, 이미 PAID인 건은 어떤 변경도 불가(409)
 */
export const updateEngineerPayoutStatus = (engineerPayoutId, status) =>
  api.patch(`/api/agency/engineer-payouts/${engineerPayoutId}/status`, { status });

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