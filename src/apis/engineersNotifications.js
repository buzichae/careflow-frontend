import axiosInstance from "./axiosInstance"; 
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
 *
 * ⚠ 이 엔드포인트가 실제로 없다면, 목록 API의 totalElements를
 *   type별로 개별 요청해서 합산하는 방식으로 대체해야 합니다.
 */
export const getNotificationSummary = () => {
  return axiosInstance.get("/api/engineer/notifications/summary");
};