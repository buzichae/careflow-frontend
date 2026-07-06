const STORAGE_KEY = "deviceId";

// 이 브라우저(기기)를 식별하는 UUID를 localStorage에서 가져오거나, 없으면 새로 발급해 저장한다.
// User-Agent만으로 기기를 구분하면 브라우저 업데이트마다 다른 기기로 오인식되는 문제가 있어,
// 로그인 시 X-Device-Id 헤더로 함께 보내 신뢰 기기 판별의 실제 매칭 키로 사용한다.
export function getDeviceId() {
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}
