import api from "./axiosInstance";
import { useState, useEffect } from "react";

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

// [신규 — 백엔드 확인 필요] 교체 부품 목록 조회 (드롭다운 검색용)
// repair_parts 마스터 테이블 기준: repairPartId, partCode, partName, spec, baseUnitPrice
// is_active=true인 것만 내려줘야 함(단종 부품 제외)
// 응답 예시: [{ repairPartId: 1, partCode: "COMP-AC-R410A-1HP", partName: "컴프레서", spec: "1HP R410A", baseUnitPrice: 150000 }, ...]
export const getRepairParts = (search) =>
  api.get("/api/engineer/repair-parts", { params: { search } });

// [신규 — 백엔드 확인 필요] 담당 고객들이 보유한 가전 브랜드 목록 (중복 제거)
// brand 컬럼이 ENUM이 아니라 자유 텍스트(VARCHAR)라 마스터 테이블이 없음.
// 실제 등록된 값 기준으로 드롭다운을 채우려면 이런 distinct 조회 API가 필요합니다.
// 예시 응답: ["삼성", "LG", "소니", "월풀"]
export const getEngineerCustomerBrands = () =>
  api.get("/api/engineer/customers/brands");

// 대시보드 전체 데이터 (기사 정보 + 오늘 일정 + 실적 + 알림)
export const getEngineerDashboard = () => api.get("/api/engineer/dashboard");

// 작업 상태 변경 (출발/도착/수리중/완료)
// as_status_logs.to_status 값: ENGINEER_DEPARTED / ENGINEER_ARRIVED / IN_PROGRESS / COMPLETED
export const updateAssignmentStatus = (requestId, status) =>
  api.patch(`/api/engineer/tasks/${requestId}/status`, null, {
    params: { newStatus: status },
  });

// ── 오늘/특정 날짜 배정된 A/S 작업 목록  ──
// 응답: 배열. summary 없음.
export const getEngineerTaskSchedule = (date) =>
  api.get("/api/engineer/schedule", { params: { date } });


export const getEngineerProfile = () =>
  api.get("/api/engineer/profile");

// 최초 프로필 등록 (회원가입 직후)
export const createEngineerProfile = (data) =>
  api.post("/api/engineer/profile", data);

// 프로필 수정
export const updateEngineerProfile = (data) =>
  api.put("/api/engineer/profile", data);

// [수정] PR로 실제 엔드포인트 확정됨 — 기사 전용이 아니라 전 역할 공용 API.
// PUT /api/auth/password
// body: { currentPassword, newPassword }
// 응답: 200 성공 / 400 현재 비밀번호 불일치·새 비밀번호 규칙 위반·현재와 동일 / 403 소셜 로그인 전용 계정
export const changePassword = (currentPassword, newPassword) =>
  api.put("/api/auth/password", { currentPassword, newPassword });


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

/**
 * 작업 보고서 '신규 작성' 화면 진입 시 초기 데이터 조회 API
 * - 백엔드의 /work-reports/{reportId} 상세 조회와의 라우팅 충돌을 피하기 위해 /form-data 경로 사용
 * - Query String 파라미터로 requestId를 전달합니다.
 */
export const getReportFormData = (requestId) =>
    api.get("/api/engineer/work-reports/form-data", { params: { requestId } });

// ── 작업 보고서 제출 (기사가 보고서 작성 완료 시, 최초 생성)
export const submitWorkReport = (data) =>
  api.post("/api/engineer/work-reports", data);

// [신규] 작업 보고서 수정 (SUBMITTED 상태에서 승인 전까지만 가능 — APPROVED는
// EngineerReportSubmitPage에서 화면 단에서 이미 차단하지만, 백엔드에서도
// status가 APPROVED인 경우 403/409로 막아주는 검증이 필요합니다.)
export const updateWorkReport = (reportId, data) =>
  api.put(`/api/engineer/work-reports/${reportId}`, data);

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
export const getSettlementSummary = (dateFrom, dateTo, brand, status) =>
  api.get("/api/engineer/settlements/summary", { params: { dateFrom, dateTo, brand, status } });

// 정산 내역 목록 
export const getSettlements = (page = 0, size = 10) =>
  api.get("/api/engineer/settlements", { params: { page, size } });

// 고객 평가(리뷰) 목록 + 요약 
export const getEngineerReviews = (rating, page = 0, size = 10) =>
  api.get("/api/engineer/reviews", {
    params: { rating: rating === "ALL" ? undefined : rating, page, size },
  });

  // 리뷰 통계 (평균 평점 + 평점 분포)
export const getEngineerReviewStats = () =>
  api.get("/api/engineer/reviews/stats");