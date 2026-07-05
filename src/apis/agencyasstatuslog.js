import api from "./axiosInstance";

/**
 * 소속 대행사 A/S 상태 변경 이력 목록 조회 (최신순)
 * GET /api/as-status-logs/agency
 *
 * @param {Object} params
 * @param {string}  params.date       - 날짜 필터 (ISO, 예: "2026-07-01")
 * @param {string}  params.toStatus   - 상태 필터 (WAITING/ENGINEER_DEPARTED/ENGINEER_ARRIVED/IN_PROGRESS/COMPLETED)
 * @param {number}  params.engineerId - 상태를 변경한 기사 ID 필터
 * @param {string}  params.keyword    - 접수번호/고객명/제품명 검색
 * → { totalCount, logs: [{ logId, requestId, fromStatus, toStatus, memo, changedByName, changedAt }] }
 */
export function getAgencyStatusLogs(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")
  );
  return api.get("/api/as-status-logs/agency", { params: cleanParams });
}

/**
 * 소속 대행사 A/S to_status 기준 상태별 집계
 * GET /api/as-status-logs/agency/status-summary
 * → { waitingCount, engineerDepartedCount, engineerArrivedCount, inProgressCount, completedCount }
 */
export function getAgencyStatusSummary() {
  return api.get("/api/as-status-logs/agency/status-summary");
}