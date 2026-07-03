import axios from "./axiosInstance";
import api from "./axiosInstance";

export async function getAgencyMe() {
  const res = await axios.get("/api/agency/me");
  return res.data;
}

/**
 * 대행사 A/S 요청 단건 상세 조회
 * GET /api/agency/work-requests/{requestId}/detail
 * → AgencyAsRequestDetailResponse
 *   { requestId, status, customerName, customerPhone,
 *     symptomCode, symptomName, symptomDesc, imageUrls,
 *     brand, modelName, serialNumber, purchaseDate, warrantyEndDate,
 *     assignType, visitRegionName, visitAddressDetail, scheduledDate, scheduledTime,
 *     cancelReason, createdAt, updatedAt }
 */
export function getWorkRequestDetail(requestId) {
  return api.get(`/api/agency/work-requests/${requestId}/detail`);
}


/**
 * 대행사 회원가입 절차 중 기존 등록된 대행사 정보 검색
 * GET /api/agencies/agency?agencyName={agencyName}
 * - 인증 불필요 (회원가입 전 단계)
 * - 200: 기존 데이터 존재 → Agencies 엔티티 반환
 * - 조회 실패(NoSuchElementException) 시 에러 → 프론트에서 "신규 등록"으로 처리
 *
 * ※ 응답이 DTO가 아니라 Agencies 엔티티 그대로 내려옴 (com.careflow.agency.entity.Agencies)
 *   필드: agencyName, businessNumber, agencyAddress, agencyFeeRate, approvalStatus 등
 *   주의: representativeId(User, LAZY 연관관계)가 그대로 포함돼 있어 LazyInitializationException 위험 있음 (백엔드 확인 필요)
 */
export function getAgencyByName(agencyName) {
  return api.get("/api/agencies/agency", { params: { agencyName } });
}
 
/**
 * 배정 상세 조회
 * GET /api/agency/as-assignments/{assignmentId}/detail
 * → AssignmentDetailResponse {
 *     assignmentId, assignmentStatus, assignedAt,
 *     requestId, scheduledDate, scheduledTime, symptomDesc, visitAddressDetail,
 *     symptomName, customerName, customerPhone,
 *     modelName, purchaseDate, warrantyEndDate,
 *     avgRepairCost,                              // Quartz 미집계 시 null
 *     statusLogs: [{ logId, fromStatus, toStatus, memo, createdAt }],
 *     previousWorkReports: [{ reportId, requestId, diagnosisResult, workDurationMin, finalAmount, memo, customerApproved, submittedAt }],
 *     engineerProfile: { profileId, skillLevel, avgRating, totalReviews, introduction } | null
 *   }
 * ※ assignmentId 기준 조회 — 아직 배정 전(기사 미정)인 접수 건은 assignmentId가 없어 호출 불가
 */
export function getAssignmentDetail(assignmentId) {
  return api.get(`/api/agency/as-assignments/${assignmentId}/detail`);
}
 

/**
 * 배정 검색 (날짜 + 상태 필터)
 * GET /api/agency/as-assignments/search?date=&status=
 * - date 생략 시 오늘 날짜 기본값, status 생략 시 전체 상태
 * → AssignmentFilterResponse[] {
 *     assignmentId, assignmentStatus, assignMethod, assignedAt, acceptedAt,
 *     requestId, scheduledDate, scheduledTime, visitAddressDetail,
 *     symptomName, engineerId, engineerName
 *   }
 * - 결과 없으면 204 No Content
 */
export function searchAssignments({ date, status } = {}) {
  return api.get("/api/agency/as-assignments/search", {
    params: {
      date: date || undefined,
      status: status || undefined,
    },
  });
}
 