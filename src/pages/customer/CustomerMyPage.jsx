import { useState } from "react";
import { Eye, EyeOff, ChevronDown, User, Lock, MapPin, Check, AlertCircle } from "lucide-react";
import "../../styles/Customer/CustomerMyPage.css";

const REGIONS = {
  서울특별시: ["강남구","강서구","노원구","마포구","서초구","송파구","용산구","종로구"],
  경기도: ["부천시","성남시","수원시","시흥시","안양시","의정부시","화성시"],
  인천광역시: ["남동구","부평구","서구","연수구","중구"],
  부산광역시: ["동래구","부산진구","사상구","수영구","해운대구"],
  대구광역시: ["달서구","동구","북구","수성구","중구"],
  대전광역시: ["대덕구","서구","유성구","중구"],
  광주광역시: ["광산구","남구","동구","북구","서구"],
  울산광역시: ["남구","동구","북구","울주군","중구"],
};

/* 섹션 카드 */
function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="cmp-card">
      <div className="cmp-card__head">
        <Icon size={17} className="cmp-card__head-icon" />
        <h3 className="cmp-card__title">{title}</h3>
      </div>
      <div className="cmp-card__body">{children}</div>
    </div>
  );
}

/* 인풋 행 */
function Field({ label, required, children }) {
  return (
    <div className="cmp-field">
      <label className="cmp-field__label">
        {label}
        {required && <span className="cmp-field__required">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, rightEl, readOnly }) {
  return (
    <div className={`cmp-input-wrap${readOnly ? " cmp-input-wrap--readonly" : ""}`}>
      <input
        className="cmp-input"
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      {rightEl && <div className="cmp-input-right">{rightEl}</div>}
    </div>
  );
}

/* 토스트 */
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`cmp-toast cmp-toast--${type}`}>
      {type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
      {msg}
    </div>
  );
}

export default function CustomerMyPage() {
  /* ── 기본 정보 ── */
  const [name,  setName]  = useState("플로우");
  const [phone, setPhone] = useState("");
  const [infoMsg, setInfoMsg] = useState(null);

  /* ── 비밀번호 ── */
  const [curPw,  setCurPw]  = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showNew2, setShowNew2] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  /* ── 거주지 ── */
  const [regionParent,  setRegionParent]  = useState("");
  const [regionSub,     setRegionSub]     = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [addrMsg, setAddrMsg] = useState(null);

  const subRegions = regionParent ? REGIONS[regionParent] : [];
  const pwMatch = !newPw2 || newPw === newPw2;

  function toast(setter, type, msg) {
    setter({ type, msg });
    setTimeout(() => setter(null), 3000);
  }

  function handleInfoSave(e) {
    e.preventDefault();
    if (!name.trim()) return toast(setInfoMsg, "error", "이름을 입력해주세요.");
    toast(setInfoMsg, "success", "기본 정보가 저장되었습니다.");
  }

  function handlePwSave(e) {
    e.preventDefault();
    if (!curPw) return toast(setPwMsg, "error", "현재 비밀번호를 입력해주세요.");
    if (newPw.length < 6) return toast(setPwMsg, "error", "새 비밀번호는 6자 이상이어야 합니다.");
    if (!pwMatch) return toast(setPwMsg, "error", "새 비밀번호가 일치하지 않습니다.");
    setCurPw(""); setNewPw(""); setNewPw2("");
    toast(setPwMsg, "success", "비밀번호가 변경되었습니다.");
  }

  function handleAddrSave(e) {
    e.preventDefault();
    toast(setAddrMsg, "success", "거주지가 저장되었습니다.");
  }

  function handleRegionParent(v) {
    setRegionParent(v);
    setRegionSub("");
  }

  return (
    <div className="cmp-page">
      {/* 프로필 헤더 */}
      <div className="cmp-profile-hero">
        <div className="cmp-profile-hero__avatar">🏢</div>
        <div className="cmp-profile-hero__info">
          <p className="cmp-profile-hero__name">{name || "플로우"}</p>
          <p className="cmp-profile-hero__email">user@careflow.kr</p>
          <span className="cmp-profile-hero__badge">고객</span>
        </div>
      </div>

      <div className="cmp-sections">
        {/* ── 기본 정보 ── */}
        <SectionCard icon={User} title="기본 정보">
          <form onSubmit={handleInfoSave} className="cmp-form">
            <Field label="이름" required>
              <Input value={name} onChange={setName} placeholder="이름을 입력해주세요" />
            </Field>
            <Field label="이메일">
              <Input value="user@careflow.kr" readOnly />
            </Field>
            <Field label="연락처">
              <Input value={phone} onChange={setPhone} placeholder="- 없이 숫자만 입력해주세요" type="tel" />
            </Field>
            {infoMsg && <Toast msg={infoMsg.msg} type={infoMsg.type} />}
            <div className="cmp-form__footer">
              <button type="submit" className="cmp-btn cmp-btn--primary">저장</button>
            </div>
          </form>
        </SectionCard>

        {/* ── 비밀번호 변경 ── */}
        <SectionCard icon={Lock} title="비밀번호 변경">
          <form onSubmit={handlePwSave} className="cmp-form">
            <Field label="현재 비밀번호" required>
              <Input
                value={curPw}
                onChange={setCurPw}
                type={showCur ? "text" : "password"}
                placeholder="현재 비밀번호를 입력해주세요"
                rightEl={
                  <button type="button" className="cmp-eye-btn" onClick={() => setShowCur(p => !p)}>
                    {showCur ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </Field>
            <Field label="새 비밀번호" required>
              <Input
                value={newPw}
                onChange={setNewPw}
                type={showNew ? "text" : "password"}
                placeholder="새 비밀번호 (6자 이상)"
                rightEl={
                  <button type="button" className="cmp-eye-btn" onClick={() => setShowNew(p => !p)}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </Field>
            <Field label="새 비밀번호 확인" required>
              <Input
                value={newPw2}
                onChange={setNewPw2}
                type={showNew2 ? "text" : "password"}
                placeholder="새 비밀번호를 다시 입력해주세요"
                rightEl={
                  <button type="button" className="cmp-eye-btn" onClick={() => setShowNew2(p => !p)}>
                    {showNew2 ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
              {newPw2 && !pwMatch && (
                <p className="cmp-field-error">비밀번호가 일치하지 않습니다.</p>
              )}
            </Field>
            {pwMsg && <Toast msg={pwMsg.msg} type={pwMsg.type} />}
            <div className="cmp-form__footer">
              <button type="submit" className="cmp-btn cmp-btn--primary">변경</button>
            </div>
          </form>
        </SectionCard>

        {/* ── 거주지 ── */}
        <SectionCard icon={MapPin} title="거주지 설정">
          <p className="cmp-section-desc">
            거주지를 설정하면 A/S 신청 시 방문 지역이 자동으로 채워집니다.
          </p>
          <form onSubmit={handleAddrSave} className="cmp-form">
            <Field label="지역">
              <div className="cmp-region-row">
                <div className="cmp-select-wrap">
                  <select
                    className="cmp-select"
                    value={regionParent}
                    onChange={(e) => handleRegionParent(e.target.value)}
                  >
                    <option value="">시·도 선택</option>
                    {Object.keys(REGIONS).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="cmp-select-icon" />
                </div>
                <div className="cmp-select-wrap">
                  <select
                    className="cmp-select"
                    value={regionSub}
                    onChange={(e) => setRegionSub(e.target.value)}
                    disabled={!regionParent}
                  >
                    <option value="">구·시 선택</option>
                    {subRegions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="cmp-select-icon" />
                </div>
              </div>
            </Field>
            <Field label="상세 주소">
              <Input
                value={addressDetail}
                onChange={setAddressDetail}
                placeholder="동·호수·번지 등 상세 주소를 입력해주세요"
              />
            </Field>
            {(regionParent || addressDetail) && (
              <div className="cmp-addr-preview">
                <MapPin size={12} />
                <span>{[regionParent, regionSub, addressDetail].filter(Boolean).join(" ")}</span>
              </div>
            )}
            {addrMsg && <Toast msg={addrMsg.msg} type={addrMsg.type} />}
            <div className="cmp-form__footer">
              <button type="submit" className="cmp-btn cmp-btn--primary">저장</button>
            </div>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
