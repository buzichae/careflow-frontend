/* 전화번호: '-' 없이 숫자 11자리 */
export const PHONE_REGEX = /^[0-9]{11}$/;
/* 사업자번호: '000-00-00000' 형태 */
export const BUSINESS_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}$/;

export const formatPhoneInput = (raw) =>
  raw.replace(/[^0-9]/g, "").slice(0, 11);

export const formatBusinessNumberInput = (raw) => {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 10);
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 5);
  const p3 = digits.slice(5, 10);
  return [p1, p2, p3].filter(Boolean).join("-");
};
