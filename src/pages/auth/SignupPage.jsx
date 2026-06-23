import { useState } from "react";
import { Eye, EyeOff, ChevronDown, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import { ROLES } from "./authConstants";
import "../../styles/Auth/Auth.css";

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
  const [step, setStep] = useState(1);
  const [showPw, setShowPw]   = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [email,    setEmail]    = useState("");
  const [pw,       setPw]       = useState("");
  const [pw2,      setPw2]      = useState("");
  const [name,     setName]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [company,  setCompany]  = useState("");
  const [bizNum,   setBizNum]   = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [agree,    setAgree]    = useState(false);

  function handleNext(e) {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else navigate("/auth/login");
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

              {step === 1 && (
                <>
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
                  {roleKey === "customer" && (
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

              {step === 2 && (
                <>
                  {roleKey === "customer" && (
                    <>
                      <AuthInput label="이름 (선택)" placeholder="이름을 입력해주세요" value={name} onChange={setName} />
                      <AuthInput label="휴대폰 번호 (선택)" placeholder="- 없이 숫자만 입력해주세요" value={phone} onChange={setPhone} />
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
                      <span>이메일</span><span>{email || "user@careflow.kr"}</span>
                    </div>
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
                disabled={step === 1 && !agree}
              >
                {step === 3 ? "로그인하러 가기" : "다음"}
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
