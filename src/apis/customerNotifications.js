import axiosInstance from "./axiosInstance";

/**
 * 알림 목록 조회
 * GET /api/customer/notifications?type=&unreadOnly=&page=&size=
 * type이 null/"전체"면 파라미터 생략(전체 조회)
 */
export const getMyNotifications = ({ type, unreadOnly, page = 0, size = 10 }) => {
  return axiosInstance.get("/api/customer/notifications", {
    params: {
      type: type && type !== "전체" ? type : undefined,
      unreadOnly: unreadOnly || undefined,
      page,
      size,
    },
  });
};

/**
 * 알림 카테고리별 요약
 * GET /api/customer/notifications/summary
 * 응답 예시: { total: {count, unreadCount}, AS_STATUS: {...}, CONSUMABLE: {...}, WARRANTY: {...} }
 */
export const getNotificationSummary = () => {
  return axiosInstance.get("/api/customer/notifications/summary");
};

// 알림 단건 읽음 처리
export const markNotificationRead = (notificationId) => {
  return axiosInstance.patch(`/api/customer/notifications/${notificationId}/read`);
};

// 전체 알림 읽음 처리
export const markAllNotificationsRead = () => {
  return axiosInstance.patch(`/api/customer/notifications/read-all`);
};
