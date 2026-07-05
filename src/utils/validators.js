/* 전화번호: '-' 없이 숫자 11자리 */
export const PHONE_REGEX = /^[0-9]{11}$/;
/* 사업자번호: '000-00-00000' 형태 */
export const BUSINESS_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}$/;
/* 비밀번호: 영문+숫자 모두 포함 (백엔드 SignUpRequest.password @Pattern과 동일) */
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

/* 두벌식 자판 매핑 — 한글 자모를 자판 위치가 같은 영문 키로 변환 (한/영 전환 안 하고
   친 경우 대응). 초성/중성/종성 인덱스는 유니코드 한글 완성형 분해 규칙(가~힣) 기준. */
const CHOSEONG = ["r", "R", "s", "e", "E", "f", "a", "q", "Q", "t", "T", "d", "w", "W", "c", "z", "x", "v", "g"];
const JUNGSEONG = ["k", "o", "i", "O", "j", "p", "u", "P", "h", "hk", "ho", "hl", "y", "n", "nj", "np", "nl", "b", "m", "ml", "l"];
const JONGSEONG = ["", "r", "R", "rt", "s", "sw", "sg", "e", "f", "fr", "fa", "fq", "ft", "fx", "fv", "fg", "a", "q", "qt", "t", "T", "d", "w", "c", "z", "x", "v", "g"];

/**
 * 한글 문자열을 두벌식 자판 그대로 영문으로 친 것처럼 변환.
 * 예: "이리나" -> "dlflsk" (한/영 전환을 안 하고 입력했을 때 실제로 찍히는 문자열)
 * 한글 완성형(가~힣) 이외의 문자는 그대로 유지.
 */
export function hangulToQwerty(str) {
  let result = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code >= 0 && code <= 11171) {
      const cho = Math.floor(code / (21 * 28));
      const jung = Math.floor((code % (21 * 28)) / 28);
      const jong = code % 28;
      result += CHOSEONG[cho] + JUNGSEONG[jung] + JONGSEONG[jong];
    } else {
      result += ch;
    }
  }
  return result;
}

/**
 * 비밀번호 규칙 검증 (백엔드 SignUpRequest 검증 + AuthService의
 * validatePasswordDoesNotContainSensitiveInfo 로직과 동일하게 프론트에서 미리 체크)
 * - 비어있으면 검증하지 않음(다른 필수값 체크에서 걸러짐)
 * - 위반 사항이 없으면 빈 문자열 반환
 */
export function getPasswordError(password, { email = "", name = "", phone = "" } = {}) {
  if (!password) return "";

  if (password.length < 8 || password.length > 64) {
    return "비밀번호는 8자 이상 64자 이하로 입력해주세요.";
  }
  if (!PASSWORD_REGEX.test(password)) {
    return "비밀번호는 영문과 숫자를 모두 포함해야 합니다.";
  }

  const lowerPw = password.toLowerCase();

  const emailLocalPart = (email.split("@")[0] || "").toLowerCase();
  if (emailLocalPart.length >= 3 && lowerPw.includes(emailLocalPart)) {
    return "비밀번호에 아이디(이메일)를 포함할 수 없습니다.";
  }

  const normalizedName = (name || "").replace(/\s+/g, "").toLowerCase();
  if (normalizedName.length >= 2 && lowerPw.includes(normalizedName)) {
    return "비밀번호에 이름을 포함할 수 없습니다.";
  }

  // 한/영 전환을 안 하고 이름을 그대로 입력한 경우(예: "이리나" -> "dlflsk")도 차단
  const nameAsQwerty = hangulToQwerty(normalizedName).toLowerCase();
  if (nameAsQwerty.length >= 2 && nameAsQwerty !== normalizedName && lowerPw.includes(nameAsQwerty)) {
    return "비밀번호에 이름을 포함할 수 없습니다.";
  }

  const phoneDigits = phone.replace(/[^0-9]/g, "");
  for (let i = 0; i + 4 <= phoneDigits.length; i++) {
    if (lowerPw.includes(phoneDigits.slice(i, i + 4))) {
      return "비밀번호에 휴대폰 번호를 포함할 수 없습니다.";
    }
  }

  return "";
}

export const formatPhoneInput = (raw) =>
  raw.replace(/[^0-9]/g, "").slice(0, 11);

export const formatBusinessNumberInput = (raw) => {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 10);
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 5);
  const p3 = digits.slice(5, 10);
  return [p1, p2, p3].filter(Boolean).join("-");
};
