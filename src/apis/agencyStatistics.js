import api from "./axiosInstance";

export const getSummary = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/summary", { params: { dateFrom, dateTo } });

export const getDailyTrend = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/daily-trend", { params: { dateFrom, dateTo } });

export const getHourly = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/hourly", { params: { dateFrom, dateTo } });

export const getCategoryDist = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/category-dist", { params: { dateFrom, dateTo } });

export const getStatusCount = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/status-count", { params: { dateFrom, dateTo } });

export const getEngineerTop5 = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/engineer-top5", { params: { dateFrom, dateTo } });

export const getMonthlySummary = () =>
    api.get("/api/agency/statistics/monthly-summary");

// "최근 주요 지표 요약" 테이블 — 이번 달 + 직전 2개월 비교
export const getRecentPeriods = () =>
    api.get("/api/agency/statistics/recent-periods");

// 탭별 상세 통계 (기사 통계 / 정산 통계 / 고객 통계)
export const getEngineerStats = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/engineers", { params: { dateFrom, dateTo } });

export const getSettlementTrend = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/settlement-trend", { params: { dateFrom, dateTo } });

export const getCustomerStats = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/customers", { params: { dateFrom, dateTo } });

// 리포트 다운로드 4종 (CSV, blob)
export const downloadWorkStatusReport = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/reports/work-status/download", { params: { dateFrom, dateTo }, responseType: "blob" });

export const downloadSettlementReport = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/reports/settlement/download", { params: { dateFrom, dateTo }, responseType: "blob" });

export const downloadEngineerPerformanceReport = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/reports/engineer-performance/download", { params: { dateFrom, dateTo }, responseType: "blob" });

export const downloadCustomerReport = (dateFrom, dateTo) =>
    api.get("/api/agency/statistics/reports/customer/download", { params: { dateFrom, dateTo }, responseType: "blob" });
