import api from "./axiosInstance";

// 수동 배정 - 조건(지역/브랜드/보유기술) 필터링된 후보 기사 목록 조회
export const getAvailableEngineers = (customerId, regionId, brand, skill) =>
  api.get(`/api/customers/${customerId}/engineers/available`, {
    params: { regionId, brand, skill },
  });

// 수동 배정 - 선택한 기사의 가능 일정(날짜/시간대) 조회
export const getEngineerAvailability = (customerId, engineerId, from, to) =>
  api.get(`/api/customers/${customerId}/engineers/${engineerId}/availability`, {
    params: { from, to },
  });

export const getEngineerCustomers = (params) => {
  return api.get("/api/engineer/customers", { params });
};

// 대시보드 전체 데이터 (기사 정보 + 오늘 일정 + 실적 + 알림)
export const getEngineerDashboard = () => api.get("/api/engineer/dashboard");

// 작업 상태 변경 (출발/도착/수리중/완료)
// as_status_logs.to_status 값: ENGINEER_DEPARTED / ENGINEER_ARRIVED / IN_PROGRESS / COMPLETED
export const updateAssignmentStatus = (requestId, status) =>
  api.patch(`/api/engineer/tasks/${requestId}/status`, { status });

// ── 오늘/특정 날짜 배정된 A/S 작업 목록  ──
// 응답: 배열. summary 없음.
export const getEngineerTaskSchedule = (date) =>
  api.get("/api/engineer/schedule", { params: { date } });

// ── 프로필 (engineerProfile.md) ──
export const completeEngineerProfile = (data) =>
  api.put("/api/engineer/profile", data);

export const getEngineerProfile = () =>
  api.get("/api/engineer/profile");

export const updateEngineerProfile = (data) =>
  api.patch("/api/engineer/profile", data);

// ── 근무표 (engineerSchedule.md) — "내 근무표 보기"에서 사용 ──
export const createEngineerWorkSchedule = (workDate, timeSlots) =>
  api.post("/api/engineer/my-schedule", { workDate, timeSlots });

export const getMonthlyWorkSchedule = (year, month) =>
  api.get("/api/engineer/my-schedule", { params: { year, month } });

export const getDailyWorkSchedule = (date) =>
  api.get("/api/engineer/my-schedule/schedule", { params: { date } });

export const deleteEngineerWorkSchedule = (scheduleId) =>
  api.delete(`/api/engineer/my-schedule/${scheduleId}`);

// 작업 목록 조회 (status: "ALL"이면 전체)
export const getEngineerAssignments = (status, page = 0, size = 50) =>
  api.get("/api/engineer/assignments", {
    params: { status: status === "ALL" ? undefined : status, page, size },
  });

// 작업 수락
export const acceptAssignment = (assignmentId) =>
  api.put(`/api/engineer/assignments/${assignmentId}/accept`);

// 작업 거절
export const rejectAssignment = (assignmentId, rejectReason) =>
  api.put(`/api/engineer/assignments/${assignmentId}/reject`, { rejectReason });

// ── 작업 보고서 목록 
export const getWorkReports = (page = 1, size = 20) =>
  api.get("/api/engineer/work-reports", { params: { page, size } });

// ── 작업 보고서 상세 
export const getWorkReportDetail = (reportId) =>
  api.get(`/api/engineer/work-reports/${reportId}`);

// ── 작업 보고서 제출 (기사가 보고서 작성 완료 시)
export const submitWorkReport = (data) =>
  api.post("/api/engineer/work-reports", data);

// ── 보고서 승인 
export const approveWorkReport = (reportId) =>
  api.patch(`/api/engineer/work-reports/${reportId}/approve`);

// 작업 완료 보고서 승인 요청 취소
export const cancelApprovalRequest = (reportId) =>
  api.delete(`/api/engineer/work-reports/${reportId}/approval-request`);

// 고객 상세 조회 (기사 화면)
export const getEngineerCustomerDetail = (customerId) =>
  api.get(`/api/engineer/customers/${customerId}`);

// 실적 현황 요약 (통계 카드 + 차트 + 상세 목록)
export const getSettlementSummary = (dateFrom, dateTo) =>
  api.get("/api/engineer/settlements/summary", { params: { dateFrom, dateTo } });

// 정산 내역 목록 
export const getSettlements = (page = 0, size = 10) =>
  api.get("/api/engineer/settlements", { params: { page, size } });

// 고객 평가(리뷰) 목록 + 요약 
export const getEngineerReviews = (rating, page = 0, size = 10) =>
  api.get("/api/engineer/reviews", {
    params: { rating: rating === "ALL" ? undefined : rating, page, size },
  });