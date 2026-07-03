import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import mainImg from "../../assets/main.png";
import { parseJwt, ROLE_DASH } from "../../utils/auth";
import "../../styles/Auth/Auth.css";
import { login } from "../../apis/auth";

function AuthInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  rightEl,
}) {
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

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setFormError("");
    try {
      const res = await login({ email, password: pw });
      const { accessToken } = res.data;
      localStorage.setItem("token", accessToken);
      const payload = parseJwt(accessToken);
      const dashPath = ROLE_DASH[payload?.role] ?? "/customer/home";
      navigate(dashPath);
    } catch (error) {
      setFormError(error.response?.data?.message || "로그인에 실패했습니다.");
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  return (
    <div className="auth-page">
      <div className="auth-nav">
        <div
          className="auth-nav__logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <img src={logoImg} alt="CareFlow" className="auth-nav__logo-img" />
          CareFlow
        </div>
      </div>

      <div className="auth-landing">
        <div className="auth-landing__inner">
          <div className="auth-landing__hero">
            <h1 className="auth-landing__title">
              더 스마트한 가전 관리,
              <br />
              <span>CareFlow</span>
            </h1>
            <p className="auth-landing__desc">
              가전의 모든 정보를 한 곳에 모아
              <br />
              체계적으로 관리하고, 알림과 케어까지
              <br />한 번에 경험하세요.
            </p>
            <div className="auth-landing__img-wrap">
              <img
                src={mainImg}
                alt="가전제품"
                className="auth-landing__main-img"
              />
            </div>
          </div>

          <div className="auth-landing__panel">
            <div className="auth-card">
              <h2 className="auth-card__title">로그인</h2>
              <form onSubmit={handleLogin} className="auth-form">
                {formError && (
                  <div className="auth-error-banner">{formError}</div>
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
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPw(!showPw)}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <div className="auth-row">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    로그인 상태 유지
                  </label>
                  <button type="button" className="auth-link" onClick={() => navigate("/auth/forgot-password")}>
                    비밀번호 찾기
                  </button>
                </div>
                <button type="submit" className="auth-submit-btn">
                  로그인
                </button>
              </form>

              <div className="auth-divider">
                <span>또는</span>
              </div>
              <div className="auth-social-btns">
                <button className="auth-social-btn" onClick={handleGoogleLogin}>
                  <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="auth-social-btn__icon"
                  />
                  Google 계정으로 로그인
                </button>
              </div>

              <p className="auth-card__foot">
                아직 계정이 없으신가요?{" "}
                <button
                  className="auth-link"
                  onClick={() => navigate("/auth/signup")}
                >
                  회원가입
                </button>
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
