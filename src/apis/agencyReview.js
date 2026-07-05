import api from "./axiosInstance";

/**
 * GET /api/agency/reviews
 * 대행사 리뷰 목록 조회 (페이징 + 필터 조건 쿼리 파라미터)
 *
 * @param {Object} params
 * @param {number} params.page    - 0-based 페이지 번호 (기본 0)
 * @param {number} params.size    - 페이지 크기 (기본 10)
 * @param {Object} params.filter  - 필터 조건 (rating, engineerId, isVisible, dateFrom, dateTo, keyword)
 * @returns {Promise<{
 *   stats: { avgRating, totalCount, fiveStarRate, newThisMonth, ... },
 *   content: Array,
 *   totalElements, totalPages, currentPage, size
 * }>}
 */
export const getAgencyReviews = ({ page = 0, size = 10, filter = {} } = {}) =>
  api.get("/api/agency/reviews", {
    params: { page, size, ...filter },
  });
