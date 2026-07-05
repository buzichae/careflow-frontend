import axiosInstance from "./axiosInstance"; // lms.js와 동일한 axios 인스턴스 사용 (경로 확인 필요)

/**
 * 알림 목록 조회
 * GET /api/engineer/notifications?type=&page=&size=
 * type이 "ALL"이면 파라미터 생략(전체 조회)
 */
export const getMyNotifications = ({ type, page = 0, size = 10 }) => {
  return axiosInstance.get("/api/engineer/notifications", {
    params: {
      type: type && type !== "ALL" ? type : undefined,
      page,
      size,
    },
  });
};

/**
 * 알림 유형별 건수 요약
 * GET /api/engineer/notifications/summary
 * 응답 예시: { ALL: 12, AS_STATUS: 5, LMS: 3, CONSUMABLE: 2, WARRANTY: 2 }
 */
export const getNotificationSummary = () => {
  return axiosInstance.get("/api/engineer/notifications/summary");
};

// [신규 — 백엔드 확인 필요] 알림 단건 읽음 처리
// ⚠ 실제 엔드포인트가 다를 수 있습니다. 백엔드에 이 API 또는 동등한 기능이
// 있는지 확인해주세요. 응답에 isRead 필드 자체도 아직 없어서, 함께 추가 요청이 필요합니다.
export const markNotificationRead = (notificationId) => {
  return axiosInstance.patch(`/api/engineer/notifications/${notificationId}/read`);
};

// [신규 — 백엔드 확인 필요] 선택한 여러 알림 읽음 처리
export const markNotificationsRead = (notificationIds) => {
  return axiosInstance.patch(`/api/engineer/notifications/read`, { notificationIds });
};

// [신규 — 백엔드 확인 필요] 전체 알림 읽음 처리
export const markAllNotificationsRead = () => {
  return axiosInstance.patch(`/api/engineer/notifications/read-all`);
};