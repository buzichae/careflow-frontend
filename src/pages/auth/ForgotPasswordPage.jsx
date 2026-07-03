import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logoImg from "../../assets/logo.png";
import customerImg from "../../assets/고객.png";
import "../../styles/Auth/Auth.css";
import {
  sendPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
} from "../../apis/auth";

const STEPS = ["이메일 확인", "코드 인증", "비밀번호 변경"];
const CODE_TIMEOUT = 300; // 5분

function Stepper({ step }) {
  return (
    <div className="auth-stepper">
      {STEPS.map((label, i) => (
        <span key={i} className="auth-stepper__item" style={{ flex: i < STEPS.length - 1 ? "1" : "none" }}>
          <span className={`auth-stepper__circle ${i < step ? "done" : i === step ? "active" : ""}`}>
            {i < step ? "✓" : i + 1}
          </span>
          <span className={`auth-stepper__label ${i < step ? "done" : i === step ? "active" : ""}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <span className={`auth-stepper__line ${i < step ? "done" : ""}`} />
          )}
        </span>
      ))}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(CODE_TIMEOUT);
  const timerRef = useRef(null);

  useEffect(() => {
    if (step === 1) {
      setTimer(CODE_TIMEOUT);
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  async function handleSendCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetCode(email);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || "이메일 발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError("");
    if (timer === 0) {
      setError("인증 코드가 만료되었습니다. 코드를 다시 요청해주세요.");
      return;
    }
    setLoading(true);
    try {
      await verifyPasswordResetCode(email, code);
      clearInterval(timerRef.current);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "인증 코드가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetCode(email);
      setTimer(CODE_TIMEOUT);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) { clearInterval(timerRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
      setCode("");
    } catch (err) {
      setError(err.response?.data?.message || "코드 재발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    if (newPw.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, code, newPw);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-nav">
        <div className="auth-nav__logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src={logoImg} alt="CareFlow" className="auth-nav__logo-img" />
          CareFlow
        </div>
      </div>

      <div className="auth-signup-role" style={{ alignItems: "flex-start", paddingTop: "48px" }}>
        <div className="auth-card" style={{ width: "100%", maxWidth: "480px" }}>
          <h2 className="auth-card__title">비밀번호 찾기</h2>

          {step < 3 && <Stepper step={step} />}

          {error && <div className="auth-error-banner">{error}</div>}

          {/* Step 0: 이메일 입력 */}
          {step === 0 && (
            <form onSubmit={handleSendCode} className="auth-form">
              <p className="auth-card__sub" style={{ marginTop: 0, wordBreak: "keep-all", overflowWrap: "break-word" }}>
                가입 시 사용한 이메일 주소를 입력하면 인증 코드를 보내드립니다.
              </p>
              <div className="auth-input-wrap">
                <label className="auth-label">이메일 주소</label>
                <div className="auth-input-box">
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="이메일 주소를 입력해주세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "발송 중..." : "인증 코드 받기"}
              </button>
              <p className="auth-card__foot">
                <button className="auth-link" type="button" onClick={() => navigate("/auth/login")}>
                  로그인으로 돌아가기
                </button>
              </p>
            </form>
          )}

          {/* Step 1: 코드 입력 */}
          {step === 1 && (
            <form onSubmit={handleVerifyCode} className="auth-form">
              <p className="auth-card__sub" style={{ marginTop: 0, wordBreak: "keep-all", overflowWrap: "break-word" }}>
                <strong>{email}</strong>로 발송된 6자리 인증 코드를 입력해주세요.
              </p>
              <div className="auth-input-wrap">
                <label className="auth-label">인증 코드</label>
                <div className="auth-input-box">
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="6자리 코드 입력"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    style={{ letterSpacing: "0.2em", fontWeight: 700 }}
                  />
                  <span className="auth-input-right" style={{ color: timer < 60 ? "#e53e3e" : "#5B4FF5", fontWeight: 700, fontSize: "13px" }}>
                    {formatTime(timer)}
                  </span>
                </div>
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading || timer === 0}>
                {loading ? "확인 중..." : "코드 확인"}
              </button>
              <p className="auth-card__foot">
                코드를 받지 못하셨나요?{" "}
                <button className="auth-link" type="button" onClick={handleResendCode} disabled={loading}>
                  재발송
                </button>
              </p>
            </form>
          )}

          {/* Step 2: 새 비밀번호 */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="auth-form">
              <p className="auth-card__sub" style={{ marginTop: 0 }}>
                새로운 비밀번호를 입력해주세요.
              </p>
              <div className="auth-input-wrap">
                <label className="auth-label">새 비밀번호</label>
                <div className="auth-input-box">
                  <input
                    className="auth-input"
                    type={showPw ? "text" : "password"}
                    placeholder="8자 이상 입력해주세요"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    required
                  />
                  <span className="auth-input-right">
                    <button type="button" className="auth-eye-btn" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </div>
              </div>
              <div className="auth-input-wrap">
                <label className="auth-label">비밀번호 확인</label>
                <div className="auth-input-box">
                  <input
                    className="auth-input"
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="비밀번호를 다시 입력해주세요"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    required
                  />
                  <span className="auth-input-right">
                    <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </div>
                {confirmPw && newPw !== confirmPw && (
                  <span className="auth-field-error">비밀번호가 일치하지 않습니다.</span>
                )}
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </form>
          )}

          {/* Step 3: 완료 */}
          {step === 3 && (
            <div className="auth-complete">
              <div className="auth-complete__avatar" style={{ background: "#f0f0ff" }}>
                <img src={customerImg} alt="완료" className="auth-complete__avatar-img" />
              </div>
              <p className="auth-complete__title">비밀번호가 변경되었습니다</p>
              <p className="auth-complete__desc">
                새 비밀번호로 로그인해주세요.
              </p>
              <button
                className="auth-submit-btn"
                style={{ marginTop: "8px" }}
                onClick={() => navigate("/auth/login")}
              >
                로그인하러 가기
              </button>
            </div>
          )}
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
