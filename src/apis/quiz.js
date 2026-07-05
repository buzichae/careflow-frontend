import api from "./axiosInstance";

// ─────────────────────────────────────────────
// 기사용
// ─────────────────────────────────────────────

// 응시 자격 현황 조회
export const getQuizStatus = () =>
    api.get("/api/quiz/status");

// 본인 계층 현재 연도 문항 조회 (정답 제외)
export const getQuizQuestions = () =>
    api.get("/api/quiz/questions");

// 퀴즈 제출 및 채점
export const submitQuiz = (data) =>
    api.post("/api/quiz/attempts", data);

// 본인 응시 이력 조회
export const getMyQuizAttempts = () =>
    api.get("/api/quiz/attempts/me");

// ─────────────────────────────────────────────
// 관리자용
// ─────────────────────────────────────────────

// 문항 목록 조회 (필터)
export const getAdminQuizQuestions = (params) =>
    api.get("/api/quiz/admin/questions", { params });

// 문항 등록
export const createQuizQuestion = (data) =>
    api.post("/api/quiz/admin/questions", data);

// 문항 수정
export const updateQuizQuestion = (questionId, data) =>
    api.put(`/api/quiz/admin/questions/${questionId}`, data);

// 문항 비활성화
export const deactivateQuizQuestion = (questionId) =>
    api.patch(`/api/quiz/admin/questions/${questionId}/deactivate`);

// 문항 삭제
export const deleteQuizQuestion = (questionId) =>
    api.delete(`/api/quiz/admin/questions/${questionId}`);

// 미등록/미완성 계층 조회 (대시보드 경고 배너용)
export const getUnderRegisteredTiers = (year) =>
    api.get("/api/quiz/admin/unregistered-tiers", { params: { year } });

// 기사별 응시 이력 조회
export const getAdminQuizAttempts = (engineerUserId) =>
    api.get("/api/quiz/admin/attempts", { params: { engineerUserId } });

// ─────────────────────────────────────────────
// 대행사용
// ─────────────────────────────────────────────

// 소속 기사 응시 이력 조회
export const getAgencyEngineerQuizAttempts = (agencyId, engineerUserId, year) =>
    api.get(`/api/quiz/agency/${agencyId}/engineers/${engineerUserId}/attempts`, {
        params: year ? { year } : {}
    });