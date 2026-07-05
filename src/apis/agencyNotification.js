import api from "./axiosInstance";

/**
 * GET /api/agency/notifications
 * 대행사 알림센터 목록 조회 (페이징 + type 필터)
 *
 * @param {Object} params
 * @param {number} params.page  - 0-based 페이지 번호 (기본 0)
 * @param {number} params.size  - 페이지 크기 (기본 10)
 * @param {string} params.type  - 알림 유형 필터 (AS_STATUS/CONSUMABLE/WARRANTY/LMS), ALL이면 미전달
 * @returns {Promise<{
 *   stats: { totalCount, unreadCount, todayCount },
 *   content: Array<{ notificationId, type, title, body, channel, createdAt }>,
 *   totalElements, totalPages, currentPage, size
 * }>}
 */
export const getAgencyNotifications = ({ page = 0, size = 10, type } = {}) => {
  const params = { page, size };
  if (type && type !== "ALL") params.type = type;
  return api.get("/api/agency/notifications", { params });
};

/**
 * 알림 단건 읽음 처리
 * PATCH /api/agency/notifications/{notificationId}/read
 * - 요청 바디 없음
 * - 성공 시 204 No Content (응답 바디 없음)
 */
export const markNotificationAsRead = (notificationId) =>
  api.patch(`/api/agency/notifications/${notificationId}/read`);

/**
 * 알림 전체 읽음 처리
 * PATCH /api/agency/notifications/read-all
 * - 요청 바디 없음 (JWT의 agencyId로 대상 범위 결정)
 * - 성공 시 204 No Content (응답 바디 없음)
 */
export const markAllNotificationsAsRead = () =>
  api.patch(`/api/agency/notifications/read-all`);

