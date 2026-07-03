import api from "./axiosInstance";

/**
 * 소속 대행사 A/S 상태 변경 이력 목록 조회 (최신순)
 * GET /api/as-status-logs/agency
 * → { totalCount, logs: [{ logId, requestId, fromStatus, toStatus, memo, changedByName, changedAt }] }
 */
export function getAgencyStatusLogs() {
  return api.get("/api/as-status-logs/agency");
}

/**
 * 소속 대행사 A/S to_status 기준 상태별 집계
 * GET /api/as-status-logs/agency/status-summary
 * → { waitingCount, engineerDepartedCount, engineerArrivedCount, inProgressCount, completedCount }
 */
export function getAgencyStatusSummary() {
  return api.get("/api/as-status-logs/agency/status-summary");
}