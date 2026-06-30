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
