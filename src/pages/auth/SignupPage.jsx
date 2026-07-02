import { useState } from "react";
import {
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  ArrowLeft,
  MapPin,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import { ROLES } from "./authConstants";
import "../../styles/Auth/Auth.css";
import { signupAgency, signupCustomer, signupEngineer } from "../../apis/auth";

import { REGIONS } from "../../constants/regions";

function TopNav({ showBack, onBack }) {
  const navigate = useNavigate();
  return (
    <div className="auth-nav">
      <div
        className="auth-nav__logo"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
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
            <div
              className={`auth-stepper__circle ${active ? "active" : ""} ${done ? "done" : ""}`}
            >
              {done ? <Check size={11} /> : n}
            </div>
            <span
              className={`auth-stepper__label ${active ? "active" : ""} ${done ? "done" : ""}`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`auth-stepper__line ${done ? "done" : ""}`} />
            )}
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
      <TopNav showBack={false} />
      <div className="auth-signup-role">
        <div className="auth-card">
          <h2 className="auth-card__title">회원가입</h2>
          <p className="auth-card__sub">계정 유형을 선택해 주세요.</p>
          <div className="auth-role-list">
            {ROLES.filter((r) => r.canSignup).map((r) => (
              <div key={r.key} className="auth-role-row">
                <div
                  className="auth-role-row__img-wrap"
                  style={{ background: r.bg }}
                >
                  <img
                    src={r.img}
                    alt={r.title}
                    className="auth-role-row__img"
                  />
                </div>
                <div className="auth-role-row__body">
                  <p className="auth-role-row__title">{r.title}</p>
                  <p className="auth-role-row__desc">
                    {r.desc.replace("\n", " ")}
                  </p>
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
            <button
              className="auth-link"
              onClick={() => navigate("/auth/login")}
            >
              로그인
            </button>
          </p>
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

  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [agree, setAgree] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    /* 공통 */
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
    /* 주소 */
    regionParent: "",
    regionId: "", // customer: DB region id (integer)
    regionName: "", // agency/engineer: region name string
    addressDetail: "",
    /* 대행사 전용 */
    agencyName: "",
    agencyAddress: "",
    agencyFeeRate: 0,
    businessNumber: "",
    /* 기사 전용 */
    agencyId: "",
  });

  const handleChange = (field) => (value) => {
    setFormError("");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegionParent = (v) =>
    setFormData((prev) => ({
      ...prev,
      regionParent: v,
      regionId: "",
      regionName: "",
    }));

  const subRegions = formData.regionParent
    ? REGIONS[formData.regionParent]
    : [];

  /* 비밀번호 확인 일치 여부 */
  const pwMatch =
    !formData.passwordConfirm || formData.password === formData.passwordConfirm;

  /* 스텝별 제출 버튼 활성화 조건 */
  const step1Disabled = (() => {
    if (!agree) return true;
    if (isCustomer)
      return (
        !formData.email ||
        !formData.name ||
        !formData.password ||
        !formData.passwordConfirm ||
        !pwMatch
      );
    if (roleKey === "agency")
      return (
        !formData.email ||
        !formData.password ||
        !formData.name ||
        !formData.phone ||
        !formData.businessNumber ||
        !formData.agencyName
      );
    if (roleKey === "engineer")
      return (
        !formData.email ||
        !formData.password ||
        !formData.name ||
        !formData.businessNumber
      );
    return !formData.email || !formData.password;
  })();

  const step2Disabled = (() => {
    if (isCustomer)
      return (
        !formData.regionParent || !formData.regionId || !formData.addressDetail
      );
    if (roleKey === "agency") {
      return (
        !formData.regionParent ||
        !formData.regionName ||
        !formData.addressDetail ||
        !formData.agencyAddress ||
        formData.agencyFeeRate === null ||
        formData.agencyFeeRate === ""
      );
    }
    return false;
  })();

  const buildPayload = () => {
    switch (roleKey) {
      case "customer":
        return {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          regionId: Number(formData.regionId),
          addressDetail: formData.addressDetail,
        };
      case "agency":
        return {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phone,
          regionName: formData.regionName,
          addressDetail: formData.addressDetail,
          businessNumber: formData.businessNumber,
          agencyName: formData.agencyName,
          agencyAddress: formData.agencyAddress,
          agencyFeeRate: formData.agencyFeeRate,
        };
      case "engineer":
        return {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phone,
          regionName: formData.regionName,
          addressDetail: formData.addressDetail,
          businessNumber: formData.businessNumber,
        };
      default:
        throw new Error("역할이 선택되지 않았습니다.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      setFormError("");
      setStep(2);
      return;
    }

    if (step === 2) {
      setFormError("");
      try {
        const payload = buildPayload();
        switch (roleKey) {
          case "customer":
            await signupCustomer(payload);
            break;
          case "agency":
            await signupAgency(payload);
            break;
          case "engineer":
            await signupEngineer(payload);
            break;
          default:
            throw new Error("역할이 선택되지 않았습니다.");
        }
        setStep(3);
      } catch (error) {
        console.error(error);
        const data = error.response?.data;
        if (
          data?.errors &&
          Array.isArray(data.errors) &&
          data.errors.length > 0
        ) {
          setFormError(
            data.errors.map((e) => `• ${e.message || e}`).join("\n"),
          );
        } else {
          setFormError(
            data?.message || "회원가입에 실패했습니다. 다시 시도해주세요.",
          );
        }
      }
    }

    if (step === 3) {
      navigate("/auth/login");
    }
  };

  return (
    <div className="auth-page">
      <TopNav showBack onBack={onBack} />
      <div className="auth-signup-form">
        <div className="auth-signup-form__inner">
          <h2 className="auth-signup-form__title">{role.signupTitle}</h2>
          <StepBar current={step} />

          <div className="auth-card auth-card--form">
            <form onSubmit={handleSubmit} className="auth-form">
              {formError && (
                <div
                  className="auth-error-banner"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {formError}
                </div>
              )}

              {/* ── Step 1: 필수 계정 정보 ── */}
              {step === 1 && (
                <>
                  {/* 고객: 이름을 필수로 Step 1에서 수집 */}
                  {isCustomer && (
                    <AuthInput
                      label="이름"
                      placeholder="이름을 입력해주세요"
                      value={formData.name}
                      onChange={handleChange("name")}
                    />
                  )}

                  <AuthInput
                    label="이메일 주소"
                    type="email"
                    placeholder="이메일 주소를 입력해주세요"
                    value={formData.email}
                    onChange={handleChange("email")}
                    rightEl={<span className="auth-input-icon-svg">✉</span>}
                  />
                  <AuthInput
                    label="비밀번호"
                    type={showPw ? "text" : "password"}
                    placeholder="비밀번호를 입력해주세요"
                    value={formData.password}
                    onChange={handleChange("password")}
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
                  {isCustomer && (
                    <>
                      <AuthInput
                        label="비밀번호 확인"
                        type={showPw2 ? "text" : "password"}
                        placeholder="비밀번호를 다시 입력해주세요"
                        value={formData.passwordConfirm}
                        onChange={handleChange("passwordConfirm")}
                        rightEl={
                          <button
                            type="button"
                            className="auth-eye-btn"
                            onClick={() => setShowPw2(!showPw2)}
                          >
                            {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        }
                      />
                      {formData.passwordConfirm && !pwMatch && (
                        <p className="auth-field-error">
                          비밀번호가 일치하지 않습니다.
                        </p>
                      )}
                    </>
                  )}

                  {roleKey === "agency" && (
                    <>
                      <AuthInput
                        label="대표자명"
                        placeholder="대표자 이름을 입력해주세요"
                        value={formData.name}
                        onChange={handleChange("name")}
                      />
                      <AuthInput
                        label="연락처"
                        placeholder="010 - 없이 숫자만 입력해주세요"
                        value={formData.phone}
                        onChange={handleChange("phone")}
                      />
                      <AuthInput
                        label="사업자등록번호"
                        placeholder="- 없이 숫자만 입력해주세요"
                        value={formData.businessNumber}
                        onChange={handleChange("businessNumber")}
                      />
                      <AuthInput
                        label="대행사명"
                        placeholder="대행사명을 입력해주세요"
                        value={formData.agencyName}
                        onChange={handleChange("agencyName")}
                      />
                    </>
                  )}
                  {roleKey === "engineer" && (
                    <>
                      <AuthInput
                        label="이름"
                        placeholder="이름을 입력해주세요"
                        value={formData.name}
                        onChange={handleChange("name")}
                      />
                      <AuthInput
                        label="사업자등록번호"
                        placeholder="- 없이 숫자만 입력해주세요"
                        value={formData.businessNumber}
                        onChange={handleChange("businessNumber")}
                      />
                      <div className="auth-input-wrap">
                        <label className="auth-label">소속 대행사 (선택)</label>
                        <div className="auth-input-box auth-input-box--select">
                          <select
                            className="auth-select"
                            value={formData.agencyId}
                            onChange={(e) =>
                              handleChange("agencyId")(e.target.value)
                            }
                          >
                            <option value="">소속 대행사를 선택해주세요</option>
                            <option value="1">케어플로 서울점</option>
                            <option value="2">케어플로 경기점</option>
                            <option value="3">케어플로 부산점</option>
                          </select>
                          <ChevronDown
                            size={15}
                            className="auth-select-arrow"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <label className="auth-checkbox-label auth-checkbox-label--block">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                    />
                    <span>
                      CareFlow{" "}
                      <button type="button" className="auth-link">
                        이용약관
                      </button>{" "}
                      및{" "}
                      <button type="button" className="auth-link">
                        개인정보처리방침
                      </button>
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
                        value={formData.phone}
                        onChange={handleChange("phone")}
                      />

                      {/* 거주지 안내 배너 */}
                      <div className="auth-addr-banner">
                        <MapPin size={14} className="auth-addr-banner__icon" />
                        <p>
                          거주 지역을 입력하면{" "}
                          <strong>A/S 신청 시 방문 지역이 자동으로 설정</strong>
                          됩니다.
                        </p>
                      </div>

                      {/* 거주 지역 */}
                      <div className="auth-input-wrap">
                        <label className="auth-label">거주 지역</label>
                        <div className="auth-region-row">
                          <div className="auth-input-box auth-input-box--select">
                            <select
                              className="auth-select"
                              value={formData.regionParent}
                              onChange={(e) =>
                                handleRegionParent(e.target.value)
                              }
                            >
                              <option value="">시·도 선택</option>
                              {Object.keys(REGIONS).map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              className="auth-select-arrow"
                            />
                          </div>
                          <div className="auth-input-box auth-input-box--select">
                            <select
                              className="auth-select"
                              value={formData.regionId}
                              onChange={(e) =>
                                handleChange("regionId")(e.target.value)
                              }
                              disabled={!formData.regionParent}
                            >
                              <option value="">구·시 선택</option>
                              {subRegions.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              className="auth-select-arrow"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 상세 주소 */}
                      <AuthInput
                        label="상세 주소"
                        placeholder="동·호수·번지 등을 입력해주세요"
                        value={formData.addressDetail}
                        onChange={handleChange("addressDetail")}
                      />

                      {(formData.regionParent || formData.addressDetail) && (
                        <div className="auth-addr-preview">
                          <Info size={13} />
                          <span>
                            입력한 주소 —{" "}
                            <strong>
                              {[
                                formData.regionParent,
                                formData.regionId
                                  ? subRegions.find(
                                      (r) =>
                                        String(r.id) ===
                                        String(formData.regionId),
                                    )?.name
                                  : "",
                                formData.addressDetail,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </strong>
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {roleKey === "agency" && (
                    <>
                      {/* 거주 지역 */}
                      <div className="auth-input-wrap">
                        <label className="auth-label">거주 지역</label>
                        <div className="auth-region-row">
                          <div className="auth-input-box auth-input-box--select">
                            <select
                              className="auth-select"
                              value={formData.regionParent}
                              onChange={(e) =>
                                handleRegionParent(e.target.value)
                              }
                            >
                              <option value="">시·도 선택</option>
                              {Object.keys(REGIONS).map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              className="auth-select-arrow"
                            />
                          </div>
                          <div className="auth-input-box auth-input-box--select">
                            <select
                              className="auth-select"
                              value={formData.regionName}
                              onChange={(e) =>
                                handleChange("regionName")(e.target.value)
                              }
                              disabled={!formData.regionParent}
                            >
                              <option value="">구·시 선택</option>
                              {subRegions.map((r) => (
                                <option key={r.id} value={r.name}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              className="auth-select-arrow"
                            />
                          </div>
                        </div>
                      </div>
                      <AuthInput
                        label="상세 주소"
                        placeholder="동·호수·번지 등을 입력해주세요"
                        value={formData.addressDetail}
                        onChange={handleChange("addressDetail")}
                      />
                      <AuthInput
                        label="대행사 소재지"
                        placeholder="대행사 주소를 입력해주세요"
                        value={formData.agencyAddress}
                        onChange={handleChange("agencyAddress")}
                      />
                      <AuthInput
                        label="수수료율 (%)"
                        type="number"
                        placeholder="예: 10.5"
                        value={formData.agencyFeeRate || ""}
                        onChange={(v) =>
                          handleChange("agencyFeeRate")(parseFloat(v) || 0)
                        }
                      />
                    </>
                  )}
                  {roleKey === "engineer" && (
                    <>
                      <AuthInput
                        label="휴대폰 번호"
                        placeholder="- 없이 숫자만 입력해주세요"
                        value={formData.phone}
                        onChange={handleChange("phone")}
                      />
                    </>
                  )}
                </>
              )}

              {/* ── Step 3: 가입 완료 ── */}
              {step === 3 && (
                <div className="auth-complete">
                  <div
                    className="auth-complete__avatar"
                    style={{ background: role.bg }}
                  >
                    <img
                      src={role.img}
                      alt={role.title}
                      className="auth-complete__avatar-img"
                    />
                  </div>
                  <h3 className="auth-complete__title">가입이 완료되었어요!</h3>
                  <p className="auth-complete__desc">
                    CareFlow {role.title} 계정이 생성되었습니다.
                    <br />
                    로그인하여 서비스를 이용해보세요.
                  </p>
                  <div className="auth-complete__info">
                    <div className="auth-complete__info-row">
                      <span>이메일</span>
                      <span>{formData.email}</span>
                    </div>
                    {formData.name && (
                      <div className="auth-complete__info-row">
                        <span>이름</span>
                        <span>{formData.name}</span>
                      </div>
                    )}
                    {isCustomer &&
                      (formData.regionParent || formData.addressDetail) && (
                        <div className="auth-complete__info-row">
                          <span>거주지</span>
                          <span>
                            {[
                              formData.regionParent,
                              formData.regionId
                                ? subRegions.find(
                                    (r) =>
                                      String(r.id) ===
                                      String(formData.regionId),
                                  )?.name
                                : formData.regionName,
                              formData.addressDetail,
                            ]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </span>
                        </div>
                      )}
                    <div className="auth-complete__info-row">
                      <span>계정 유형</span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <img
                          src={role.img}
                          alt=""
                          style={{
                            width: 18,
                            height: 18,
                            objectFit: "contain",
                          }}
                        />
                        {role.title}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                {step === 2 && (
                  <button
                    type="button"
                    className="auth-submit-btn"
                    style={{ background: "#e0e0e0", color: "#555", flex: 1 }}
                    onClick={() => { setFormError(""); setStep(1); }}
                  >
                    이전
                  </button>
                )}
                <button
                  type="submit"
                  className="auth-submit-btn"
                  style={{ background: role.color, flex: step === 2 ? 1 : undefined }}
                  disabled={
                    step === 1
                      ? step1Disabled
                      : step === 2
                        ? step2Disabled
                        : false
                  }
                >
                  {step === 3 ? "로그인하러 가기" : "다음"}
                </button>
              </div>
            </form>

            <p className="auth-card__foot">
              이미 계정이 있으신가요?{" "}
              <button
                className="auth-link"
                onClick={() => navigate("/auth/login")}
              >
                로그인
              </button>
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

  if (roleKey)
    return <SignupForm roleKey={roleKey} onBack={() => setRoleKey(null)} />;
  return <RoleSelect onSelect={setRoleKey} />;
}
