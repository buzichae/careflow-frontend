import api from "./axiosInstance";

/**
 * GET /api/agency/as-assignments/in-progress
 * 진행 중 배정 목록 조회 (페이지네이션 + 필터 + stats)
 *
 * @param {Object} params
 * @param {number}  params.page            - 0-based 페이지 번호 (기본 0)
 * @param {number}  params.size            - 페이지 크기 (기본 10)
 * @param {string}  params.date            - 날짜 필터 (ISO, 예: "2026-07-01")
 * @param {number}  params.regionId        - 지역 ID 필터
 * @param {string}  params.latestLogStatus - 로그 상태 필터
 * @param {string}  params.brand           - 브랜드 필터
 * @param {number}  params.engineerId      - 기사 ID 필터
 * @param {string}  params.keyword         - 접수번호/고객명/제품명 검색
 * @returns {Promise<{
 *   stats: { totalCount, movingCount, inProgressCount, completedCount },
 *   content: Array,
 *   totalElements: number,
 *   totalPages: number,
 *   currentPage: number,
 *   size: number
 * }>}
 */
export const getInProgressAssignments = (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")
  );
  return api.get("/api/agency/as-assignments/in-progress", { params: cleanParams });
};
