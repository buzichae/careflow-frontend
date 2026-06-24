import { useState } from "react";
import { Eye, EyeOff, ChevronDown, Check, ArrowLeft, MapPin, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import { ROLES } from "./authConstants";
import "../../styles/Auth/Auth.css";

/* 지역 데이터 — regions 테이블 (depth=1 → depth=2) */
const REGIONS = {
  서울특별시: ["강남구", "강서구", "노원구", "마포구", "서초구", "송파구", "용산구", "종로구"],
  경기도:     ["부천시", "성남시", "수원시", "시흥시", "안양시", "의정부시", "화성시"],
  인천광역시: ["남동구", "부평구", "서구",   "연수구", "중구"],
  부산광역시: ["동래구", "부산진구", "사상구", "수영구", "해운대구"],
  대구광역시: ["달서구", "동구",    "북구",   "수성구", "중구"],
  대전광역시: ["대덕구", "서구",    "유성구", "중구"],
  광주광역시: ["광산구", "남구",    "동구",   "북구",   "서구"],
  울산광역시: ["남구",   "동구",    "북구",   "울주군", "중구"],
};

function TopNav({ showBack, onBack }) {
  return (
    <div className="auth-nav">
      <div className="auth-nav__logo">
        <img src={logoImg} alt="CareFlow" className="auth-nav__logo-img" />
        CareFlow
      </div>
      <div className="auth-nav__right">
        {showBack && (
          <button className="auth-nav__back" onClick={onBack}>
            <ArrowLeft size={15} /> 역할 선택으로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}

function AuthInput({ label, type = "text", placeholder, value, onChange, rightEl }) {
  return (
    <div className="auth-input-wrap">
      {label && <label className="auth-label">{label}</label>}
      <div className="auth-input-box">
        <input
          className="auth-input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {rightEl && <span className="auth-input-right">{rightEl}</span>}
      </div>
    </div>
  );
}

function StepBar({ current }) {
  const steps = ["계정 정보", "추가 정보", "가입 완료"];
  return (
    <div className="auth-stepper">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <div key={n} className="auth-stepper__item">
            <div className={`auth-stepper__circle ${active ? "active" : ""} ${done ? "done" : ""}`}>
              {done ? <Check size={11} /> : n}
            </div>
            <span className={`auth-stepper__label ${active ? "active" : ""} ${done ? "done" : ""}`}>{label}</span>
            {i < steps.length - 1 && <div className={`auth-stepper__line ${done ? "done" : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}

function RoleSelect({ onSelect }) {
  const navigate = useNavigate();
  return (
    <div className="auth-page">
      <TopNav showBack onBack={() => navigate("/auth/login")} />
      <div className="auth-signup-role">
        <div className="auth-signup-role__inner">
          <div className="auth-signup-role__left">
            <div className="auth-card">
              <h2 className="auth-card__title">회원가입</h2>
              <p className="auth-card__sub">계정 유형을 선택해 주세요.</p>
              <div className="auth-role-list">
                {ROLES.map((r) => (
                  <div key={r.key} className="auth-role-row">
                    <div className="auth-role-row__img-wrap" style={{ background: r.bg }}>
                      <img src={r.img} alt={r.title} className="auth-role-row__img" />
                    </div>
                    <div className="auth-role-row__body">
                      <p className="auth-role-row__title">{r.title}</p>
                      <p className="auth-role-row__desc">{r.desc.replace("\n", " ")}</p>
                    </div>
                    <button
                      className="auth-role-card__btn"
                      style={{ borderColor: r.color, color: r.color }}
                      onClick={() => onSelect(r.key)}
                    >
                      선택하기
                    </button>
                  </div>
                ))}
              </div>
              <p className="auth-card__foot">
                이미 계정이 있으신가요?{" "}
                <button className="auth-link" onClick={() => navigate("/auth/login")}>로그인</button>
              </p>
            </div>
          </div>

          <div className="auth-signup-role__right">
            <p className="auth-service-title">CareFlow는 다양한 사용자와 함께합니다</p>
            <div className="auth-service-list">
              {ROLES.map((r) => (
                <div key={r.key} className="auth-service-item">
                  <div className="auth-service-item__icon" style={{ background: r.bg }}>
                    <img src={r.img} alt={r.title} className="auth-service-item__img" />
                  </div>
                  <div>
                    <p className="auth-service-item__title">{r.title}</p>
                    <p className="auth-service-item__desc">{r.desc.replace("\n", " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer className="auth-footer">
        <span>© 2026 CareFlow. All rights reserved.</span>
        <div className="auth-footer__links">
          <button>이용약관</button>
          <button>개인정보처리방침</button>
          <button>고객센터</button>
        </div>
      </footer>
    </div>
  );
}

function SignupForm({ roleKey, onBack }) {
  const navigate = useNavigate();
  const role = ROLES.find((r) => r.key === roleKey) || ROLES[0];
  const isCustomer = roleKey === "customer";

  const [step, setStep]   = useState(1);
  const [showPw, setShowPw]   = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  /* 공통 */
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [pw2,     setPw2]     = useState("");
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [agree,   setAgree]   = useState(false);

  /* 고객 전용 — 거주지 (선택) */
  const [regionParent,   setRegionParent]   = useState("");
  const [regionSub,      setRegionSub]      = useState("");
  const [addressDetail,  setAddressDetail]  = useState("");

  /* 대행사 / 기사 전용 */
  const [company,  setCompany]  = useState("");
  const [bizNum,   setBizNum]   = useState("");
  const [agencyId, setAgencyId] = useState("");

  const subRegions = regionParent ? REGIONS[regionParent] : [];

  /* 비밀번호 확인 일치 여부 */
  const pwMatch = !pw2 || pw === pw2;

  /* 스텝별 제출 버튼 활성화 조건 */
  const step1Disabled = (() => {
    if (!agree) return true;
    if (isCustomer) return !email || !name || !pw || !pw2 || !pwMatch;
    return !email || !pw;
  })();

  function handleNext(e) {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else navigate("/auth/login");
  }

  function handleRegionParent(v) {
    setRegionParent(v);
    setRegionSub("");
  }

  return (
    <div className="auth-page">
      <TopNav showBack onBack={onBack} />
      <div className="auth-signup-form">
        <div className="auth-signup-form__inner">
          <h2 className="auth-signup-form__title">{role.signupTitle}</h2>
          <StepBar current={step} />

          <div className="auth-card auth-card--form">
            <form onSubmit={handleNext} className="auth-form">

              {/* ── Step 1: 필수 계정 정보 ── */}
              {step === 1 && (
                <>
                  {/* 고객: 이름을 필수로 Step 1에서 수집 */}
                  {isCustomer && (
                    <AuthInput
                      label="이름"
                      placeholder="이름을 입력해주세요"
                      value={name}
                      onChange={setName}
                    />
                  )}

                  <AuthInput
                    label="이메일 주소"
                    type="email"
                    placeholder="이메일 주소를 입력해주세요"
                    value={email}
                    onChange={setEmail}
                    rightEl={<span className="auth-input-icon-svg">✉</span>}
                  />
                  <AuthInput
                    label="비밀번호"
                    type={showPw ? "text" : "password"}
                    placeholder="비밀번호를 입력해주세요"
                    value={pw}
                    onChange={setPw}
                    rightEl={
                      <button type="button" className="auth-eye-btn" onClick={() => setShowPw(!showPw)}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  {isCustomer && (
                    <>
                      <AuthInput
                        label="비밀번호 확인"
                        type={showPw2 ? "text" : "password"}
                        placeholder="비밀번호를 다시 입력해주세요"
                        value={pw2}
                        onChange={setPw2}
                        rightEl={
                          <button type="button" className="auth-eye-btn" onClick={() => setShowPw2(!showPw2)}>
                            {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        }
                      />
                      {pw2 && !pwMatch && (
                        <p className="auth-field-error">비밀번호가 일치하지 않습니다.</p>
                      )}
                    </>
                  )}

                  {roleKey === "agency" && (
                    <>
                      <AuthInput label="회사명" placeholder="회사명을 입력해주세요" value={company} onChange={setCompany} />
                      <AuthInput label="사업자등록번호" placeholder="- 없이 숫자만 입력해주세요" value={bizNum} onChange={setBizNum} />
                    </>
                  )}
                  {roleKey === "engineer" && (
                    <>
                      <AuthInput label="이름" placeholder="이름을 입력해주세요" value={name} onChange={setName} />
                      <AuthInput label="휴대폰 번호" placeholder="- 없이 숫자만 입력해주세요" value={phone} onChange={setPhone} />
                      <div className="auth-input-wrap">
                        <label className="auth-label">소속 대행사 (선택)</label>
                        <div className="auth-input-box auth-input-box--select">
                          <select className="auth-select" value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
                            <option value="">소속 대행사를 선택해주세요</option>
                            <option value="1">케어플로 서울점</option>
                            <option value="2">케어플로 경기점</option>
                            <option value="3">케어플로 부산점</option>
                          </select>
                          <ChevronDown size={15} className="auth-select-arrow" />
                        </div>
                      </div>
                    </>
                  )}

                  <label className="auth-checkbox-label auth-checkbox-label--block">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                    <span>
                      CareFlow{" "}
                      <button type="button" className="auth-link">이용약관</button>
                      {" "}및{" "}
                      <button type="button" className="auth-link">개인정보처리방침</button>
                      에 동의합니다.
                    </span>
                  </label>
                </>
              )}

              {/* ── Step 2: 추가 정보 ── */}
              {step === 2 && (
                <>
                  {/* 고객: 연락처 + 거주지 (모두 선택) */}
                  {isCustomer && (
                    <>
                      <AuthInput
                        label="연락처 (선택)"
                        placeholder="- 없이 숫자만 입력해주세요"
                        value={phone}
                        onChange={setPhone}
                      />

                      {/* 거주지 안내 배너 */}
                      <div className="auth-addr-banner">
                        <MapPin size={14} className="auth-addr-banner__icon" />
                        <p>
                          거주 지역을 입력하면 <strong>A/S 신청 시 방문 지역이 자동으로 설정</strong>됩니다.
                          입력하지 않아도 신청 시 직접 선택할 수 있어요.
                        </p>
                      </div>

                      {/* 거주 지역 */}
                      <div className="auth-input-wrap">
                        <label className="auth-label">
                          거주 지역 (선택)
                        </label>
                        <div className="auth-region-row">
                          <div className="auth-input-box auth-input-box--select">
                            <select
                              className="auth-select"
                              value={regionParent}
                              onChange={(e) => handleRegionParent(e.target.value)}
                            >
                              <option value="">시·도 선택</option>
                              {Object.keys(REGIONS).map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <ChevronDown size={15} className="auth-select-arrow" />
                          </div>
                          <div className="auth-input-box auth-input-box--select">
                            <select
                              className="auth-select"
                              value={regionSub}
                              onChange={(e) => setRegionSub(e.target.value)}
                              disabled={!regionParent}
                            >
                              <option value="">구·시 선택</option>
                              {subRegions.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <ChevronDown size={15} className="auth-select-arrow" />
                          </div>
                        </div>
                      </div>

                      {/* 상세 주소 */}
                      <AuthInput
                        label="상세 주소 (선택)"
                        placeholder="동·호수·번지 등을 입력해주세요"
                        value={addressDetail}
                        onChange={setAddressDetail}
                      />

                      {(regionParent || addressDetail) && (
                        <div className="auth-addr-preview">
                          <Info size={13} />
                          <span>
                            입력한 주소 —{" "}
                            <strong>
                              {[regionParent, regionSub, addressDetail].filter(Boolean).join(" ")}
                            </strong>
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {roleKey === "agency" && (
                    <>
                      <AuthInput label="대표자명" placeholder="대표자 이름을 입력해주세요" value={name} onChange={setName} />
                      <AuthInput label="연락처" placeholder="- 없이 숫자만 입력해주세요" value={phone} onChange={setPhone} />
                    </>
                  )}
                  {roleKey === "engineer" && (
                    <>
                      <AuthInput label="경력 (년)" placeholder="예: 5" value={company} onChange={setCompany} />
                      <AuthInput label="전문 분야 (선택)" placeholder="예: 냉장고, 에어컨" value={bizNum} onChange={setBizNum} />
                    </>
                  )}
                </>
              )}

              {/* ── Step 3: 가입 완료 ── */}
              {step === 3 && (
                <div className="auth-complete">
                  <div className="auth-complete__avatar" style={{ background: role.bg }}>
                    <img src={role.img} alt={role.title} className="auth-complete__avatar-img" />
                  </div>
                  <h3 className="auth-complete__title">가입이 완료되었어요!</h3>
                  <p className="auth-complete__desc">
                    CareFlow {role.title} 계정이 생성되었습니다.<br />
                    로그인하여 서비스를 이용해보세요.
                  </p>
                  <div className="auth-complete__info">
                    <div className="auth-complete__info-row">
                      <span>이메일</span><span>{email}</span>
                    </div>
                    {isCustomer && name && (
                      <div className="auth-complete__info-row">
                        <span>이름</span><span>{name}</span>
                      </div>
                    )}
                    {isCustomer && (regionParent || addressDetail) && (
                      <div className="auth-complete__info-row">
                        <span>거주지</span>
                        <span>{[regionParent, regionSub, addressDetail].filter(Boolean).join(" ") || "—"}</span>
                      </div>
                    )}
                    <div className="auth-complete__info-row">
                      <span>계정 유형</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <img src={role.img} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
                        {role.title}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                style={{ background: role.color }}
                disabled={step === 1 ? step1Disabled : false}
              >
                {step === 2 && isCustomer ? "건너뛰기 / 다음" : step === 3 ? "로그인하러 가기" : "다음"}
              </button>
            </form>

            <p className="auth-card__foot">
              이미 계정이 있으신가요?{" "}
              <button className="auth-link" onClick={() => navigate("/auth/login")}>로그인</button>
            </p>
          </div>
        </div>
      </div>

      <footer className="auth-footer">
        <span>© 2026 CareFlow. All rights reserved.</span>
        <div className="auth-footer__links">
          <button>이용약관</button>
          <button>개인정보처리방침</button>
          <button>고객센터</button>
        </div>
      </footer>
    </div>
  );
}

export default function SignupPage() {
  const [roleKey, setRoleKey] = useState(null);

  if (roleKey) return <SignupForm roleKey={roleKey} onBack={() => setRoleKey(null)} />;
  return <RoleSelect onSelect={setRoleKey} />;
}
