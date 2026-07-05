import api from "./axiosInstance";

/**
 * 전체 대행사→기사 지급 배치 조회 (기사 이의제기 조정용)
 * GET /api/admin/engineer-payouts?year=&month=&status=
 * status 생략 시 전체(PENDING/PAID/DISPUTED) 조회
 */
export const getAdminEngineerPayouts = (year, month, status) =>
    api.get("/api/admin/engineer-payouts", { params: { year, month, status: status || undefined } });

/**
 * 건별 지급 상태 변경 (보류/재검토 — 기사 이의제기 조정용)
 * PATCH /api/admin/engineer-payouts/{engineerPayoutId}/status
 * body: { status: "DISPUTED" | "PENDING" }
 * - PAID는 대행사의 자체 지급 신고 전용, 이미 PAID인 건은 어떤 변경도 불가
 */
export const updateAdminEngineerPayoutStatus = (engineerPayoutId, status) =>
    api.patch(`/api/admin/engineer-payouts/${engineerPayoutId}/status`, { status });
