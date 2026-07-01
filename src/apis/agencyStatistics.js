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
