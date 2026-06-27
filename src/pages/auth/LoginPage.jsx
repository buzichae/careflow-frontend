import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import mainImg from "../../assets/main.png";
import { ROLES } from "./authConstants";
import "../../styles/Auth/Auth.css";
import { loginCustomer } from "../../apis/auth";

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

function RoleSelect({ onSelect }) {
  const navigate = useNavigate();
  return (
    <div className="auth-page">
      <TopNav showBack={false} />
      <div className="auth-landing">
        <div className="auth-landing__inner">
          <div className="auth-landing__hero">
            <h1 className="auth-landing__title">
              더 스마트한 가전 관리,<br />
              <span>CareFlow</span>
            </h1>
            <p className="auth-landing__desc">
              가전의 모든 정보를 한 곳에 모아<br />
              체계적으로 관리하고, 알림과 케어까지<br />
              한 번에 경험하세요.
            </p>
            <div className="auth-landing__img-wrap">
              <img src={mainImg} alt="가전제품" className="auth-landing__main-img" />
            </div>
          </div>

          <div className="auth-landing__panel">
            <div className="auth-card">
              <h2 className="auth-card__title">로그인</h2>
              <p className="auth-card__sub">계정 유형을 선택해 주세요.</p>
              <div className="auth-role-grid">
                {ROLES.map((r) => (
                  <div key={r.key} className="auth-role-card">
                    <div className="auth-role-card__img-wrap" style={{ background: r.bg }}>
                      <img src={r.img} alt={r.title} className="auth-role-card__img" />
                    </div>
                    <p className="auth-role-card__title">{r.title}</p>
                    <p className="auth-role-card__desc">{r.desc}</p>
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
                아직 계정이 없으신가요?{" "}
                <button className="auth-link" onClick={() => navigate("/auth/signup")}>회원가입</button>
              </p>
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

function LoginForm({ roleKey, onBack }) {
  const navigate = useNavigate();
  const role = ROLES.find((r) => r.key === roleKey) || ROLES[0];
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await loginCustomer({ email, password: pw });
      const { token } = res.data;
      localStorage.setItem("token", token);
      navigate(role.dashPath || "/customer/home");
    } catch (error) {
      alert(error.response?.data?.message || "로그인에 실패했습니다.");
    }
  }

  return (
    <div className="auth-page">
      <TopNav showBack onBack={onBack} />
      <div className="auth-login">
        <div className="auth-login__inner">
          <div className="auth-login__left">
            <div className="auth-login__avatar" style={{ background: role.bg }}>
              <img src={role.img} alt={role.title} className="auth-login__avatar-img" />
            </div>
            <h2 className="auth-login__title">{role.loginTitle}</h2>
            <p className="auth-login__sub">CareFlow에 오신 것을 환영합니다!</p>
            <div className="auth-login__img-wrap">
              <img src={mainImg} alt="가전제품" className="auth-login__main-img" />
            </div>
          </div>

          <div className="auth-login__right">
            <div className="auth-card">
              <form onSubmit={handleLogin} className="auth-form">
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
                <div className="auth-row">
                  <label className="auth-checkbox-label">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    로그인 상태 유지
                  </label>
                  <button type="button" className="auth-link">비밀번호 찾기</button>
                </div>
                <button type="submit" className="auth-submit-btn" style={{ background: role.color }}>
                  로그인
                </button>
              </form>

              <div className="auth-divider"><span>또는</span></div>
              <div className="auth-social-btns">
                <button className="auth-social-btn">
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="auth-social-btn__icon" />
                  Google 계정으로 로그인
                </button>
              </div>

              <p className="auth-card__foot">
                아직 계정이 없으신가요?{" "}
                <button className="auth-link" onClick={() => navigate("/auth/signup")}>회원가입</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [roleKey, setRoleKey] = useState(null);

  if (roleKey) return <LoginForm roleKey={roleKey} onBack={() => setRoleKey(null)} />;
  return <RoleSelect onSelect={setRoleKey} />;
}
