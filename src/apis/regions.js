import api from "./axiosInstance";

// 지역명(구·시 단위)으로 region_id 조회
export const getRegionByName = (name) =>
  api.get("/api/regions", { data: { name } });
