import api from "./axiosInstance";

// 지역 목록 조회 (구 단위)
// GET /api/regions?depth=2  → 구 단위 전체 목록
// GET /api/regions?depth=1  → 시/도 단위 전체 목록
// GET /api/regions?parentId=1 → 특정 시/도 하위 구만
export const getRegions = (depth, parentId) =>
  api.get("/api/regions", { params: { depth, parentId } });