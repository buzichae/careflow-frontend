import api from "./axiosInstance";

/**
 * GET /api/agency/engineers/recommended?requestId={id}
 * A/S 요청 기반 추천 기사 목록 (LMS 이수 완료 + 해당 날짜 근무 가능)
 */
export const getRecommendedEngineers = (requestId) =>
  api.get("/api/agency/engineers/recommended", { params: { requestId } });

/**
 * GET /api/agency/engineers/realtime-status
 * 소속 기사 실시간 배정 현황
 */
export const getEngineersRealtimeStatus = () =>
  api.get("/api/agency/engineers/realtime-status");

/**
 * GET /api/agency/engineers/{id}/settlements
 * 기사 정산 내역 조회
 */
export const getEngineerSettlements = (engineerUserId) =>
  api.get(`/api/agency/engineers/${engineerUserId}/settlements`);

/**
 * GET /api/agency/engineers/{id}/lms
 * 기사 LMS 교육 이수 현황
 */
export const getEngineerLms = (engineerUserId) =>
  api.get(`/api/agency/engineers/${engineerUserId}/lms`);

/**
 * GET /api/agency/engineers/{id}/reviews
 * 기사 수신 리뷰 목록
 */
export const getEngineerReviews = (engineerUserId) =>
  api.get(`/api/agency/engineers/${engineerUserId}/reviews`);
