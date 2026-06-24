import { useState, useRef } from "react";
import { Plus, CalendarCheck, AlertTriangle, ShieldCheck, Upload, X, Check, ChevronRight, ChevronDown } from "lucide-react";
import "../../styles/Customer/CustomerAppliances.css";



/* ─────────────────────────────────
   카테고리 데이터
───────────────────────────────── */
const CATEGORIES = {
  1: { label: "주방가전", sub: { 11: "냉장고", 12: "전기밥솥", 13: "인덕션", 14: "오븐", 15: "식기세척기" } },
  2: { label: "생활가전", sub: { 21: "세탁기", 22: "건조기", 23: "에어컨", 24: "공기청정기", 25: "선풍기", 26: "청소기" } },
  3: { label: "영상가전", sub: { 31: "TV", 32: "빔프로젝터" } },
  4: { label: "음향가전", sub: { 41: "사운드바", 42: "홈시어터", 43: "스피커" } },
};

const STEPS = ["정보 입력", "내용 확인", "등록 완료"];

const EMPTY_FORM = {
  categoryParent: "",
  categorySub: "",
  brand: "",
  modelName: "",
  serialNumber: "",
  purchaseDate: "",
  warrantyExpiry: "",
  status: "정상",
};

function isFormValid(form) {
  return (
    form.categoryParent &&
    form.categorySub &&
    form.brand.trim() &&
    form.modelName.trim() &&
    form.serialNumber.trim() &&
    form.purchaseDate &&
    form.warrantyExpiry &&
    form.status
  );
}

/* ─── 스텝 바 ─── */
function Stepper({ step }) {
  return (
    <div className="car-stepper">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className="car-stepper__item">
            <div className={`car-stepper__circle ${active ? "car-stepper__circle--active" : ""} ${done ? "car-stepper__circle--done" : ""}`}>
              {done ? <Check size={12} /> : n}
            </div>
            <span className={`car-stepper__label ${active ? "car-stepper__label--active" : ""} ${done ? "car-stepper__label--done" : ""}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`car-stepper__line ${done ? "car-stepper__line--done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── 등록 플로우 ─── */
function ApplianceRegisterFlow({ onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const fileRef = useRef(null);

  const subCategories = form.categoryParent ? CATEGORIES[form.categoryParent].sub : {};

  function handleChange(k, v) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "categoryParent") next.categorySub = "";
      return next;
    });
  }

  function handleImage(file) {
    if (!file) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  }

  function handleDrop(e) {
    e.preventDefault();
    handleImage(e.dataTransfer.files[0]);
  }

  const categoryLabel =
    form.categoryParent && form.categorySub
      ? `${CATEGORIES[form.categoryParent].label} > ${subCategories[form.categorySub]}`
      : "";

  const CONFIRM_ROWS = [
    { label: "카테고리",     value: categoryLabel },
    { label: "브랜드",       value: form.brand },
    { label: "모델명",       value: form.modelName },
    { label: "시리얼 번호",  value: form.serialNumber },
    { label: "구매 일자",    value: form.purchaseDate },
    { label: "보증 만료일",  value: form.warrantyExpiry },
    { label: "가전 상태",    value: form.status },
  ];

  return (
    <div className="car-flow-wrap">
      <Stepper step={step} />

      {/* ── Step 1: 정보 입력 ── */}
      {step === 1 && (
        <div className="car-step-body">
          <h2 className="car-step-title">가전 정보를 입력해주세요</h2>
          <p className="car-step-sub">필수 항목을 모두 입력하면 다음 단계로 진행할 수 있습니다.</p>

          <div className="car-input-layout">
            {/* 왼쪽: 이미지 업로드 */}
            <div className="car-input-image-col">
              <p className="car-input-section-label">제품 이미지</p>
              {!imageUrl ? (
                <div
                  className="car-upload-zone car-upload-zone--sm"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    type="file" accept="image/*" ref={fileRef} style={{ display: "none" }}
                    onChange={(e) => handleImage(e.target.files[0])}
                  />
                  <div className="car-upload-icon"><Upload size={22} /></div>
                  <p className="car-upload-text" style={{ fontSize: 12 }}>클릭 또는 드래그</p>
                  <p className="car-upload-hint">JPG, PNG (최대 10MB)</p>
                </div>
              ) : (
                <div className="car-preview-wrap" style={{ alignItems: "center" }}>
                  <div className="car-preview-img-wrap">
                    <img src={imageUrl} alt="제품" className="car-confirm-preview-img" />
                    <button className="car-preview-remove" onClick={() => { setImageFile(null); setImageUrl(null); }}>
                      <X size={14} />
                    </button>
                  </div>
                  <p className="car-preview-name" style={{ fontSize: 11 }}>{imageFile?.name}</p>
                </div>
              )}
            </div>

            {/* 오른쪽: 폼 필드 */}
            <div className="car-input-fields-col">
              {/* 카테고리 */}
              <p className="car-input-section-label">카테고리 <span className="car-required">*</span></p>
              <div className="car-category-row">
                <div className="car-select-wrap">
                  <select
                    value={form.categoryParent}
                    onChange={(e) => handleChange("categoryParent", e.target.value)}
                    className="car-select"
                  >
                    <option value="">대분류 선택</option>
                    {Object.entries(CATEGORIES).map(([id, { label }]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="car-select-icon" />
                </div>
                <div className="car-select-wrap">
                  <select
                    value={form.categorySub}
                    onChange={(e) => handleChange("categorySub", e.target.value)}
                    className="car-select"
                    disabled={!form.categoryParent}
                  >
                    <option value="">소분류 선택</option>
                    {Object.entries(subCategories).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="car-select-icon" />
                </div>
              </div>

              {/* 기본 정보 */}
              <p className="car-input-section-label" style={{ marginTop: 16 }}>기본 정보</p>
              <div className="car-fields-grid">
                <div className="car-field">
                  <label>브랜드 <span className="car-required">*</span></label>
                  <input
                    placeholder="예: LG, 삼성, 위니아"
                    value={form.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                  />
                </div>
                <div className="car-field">
                  <label>모델명 <span className="car-required">*</span></label>
                  <input
                    placeholder="예: LG 디오스 냉장고"
                    value={form.modelName}
                    onChange={(e) => handleChange("modelName", e.target.value)}
                  />
                </div>
                <div className="car-field car-field--full">
                  <label>시리얼 번호 <span className="car-required">*</span></label>
                  <input
                    placeholder="예: M870SN75"
                    value={form.serialNumber}
                    onChange={(e) => handleChange("serialNumber", e.target.value)}
                  />
                </div>
              </div>

              {/* 구매 & 보증 */}
              <p className="car-input-section-label" style={{ marginTop: 16 }}>구매 및 보증 정보</p>
              <div className="car-fields-grid">
                <div className="car-field">
                  <label>구매 일자 <span className="car-required">*</span></label>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => handleChange("purchaseDate", e.target.value)}
                  />
                </div>
                <div className="car-field">
                  <label>보증 만료일 <span className="car-required">*</span></label>
                  <input
                    type="date"
                    value={form.warrantyExpiry}
                    onChange={(e) => handleChange("warrantyExpiry", e.target.value)}
                  />
                </div>
              </div>

              {/* 가전 상태 */}
              <p className="car-input-section-label" style={{ marginTop: 16 }}>가전 상태 <span className="car-required">*</span></p>
              <div className="car-status-row">
                {["정상", "주의", "점검 필요"].map((s) => (
                  <button
                    key={s}
                    className={`car-status-chip ${form.status === s ? `car-status-chip--${s === "정상" ? "green" : s === "주의" ? "orange" : "red"} car-status-chip--active` : ""}`}
                    onClick={() => handleChange("status", s)}
                    type="button"
                  >
                    {s === "정상" ? "😊" : s === "주의" ? "⚠️" : "🔴"} {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="car-step-footer">
            <button className="car-btn-secondary" onClick={onClose}>취소</button>
            <button
              className="car-btn-primary"
              disabled={!isFormValid(form)}
              onClick={() => setStep(2)}
            >
              다음 — 내용 확인 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: 내용 확인 ── */}
      {step === 2 && (
        <div className="car-step-body">
          <h2 className="car-step-title">입력 내용을 확인해주세요</h2>
          <p className="car-step-sub">등록 전 정보를 최종 확인합니다. 수정이 필요하면 이전 단계로 돌아가세요.</p>

          <div className="car-confirm-wrap">
            {/* 이미지 프리뷰 */}
            <div className="car-confirm-preview">
              {imageUrl
                ? <img src={imageUrl} alt="제품" className="car-confirm-preview-img" />
                : <div className="car-confirm-preview-placeholder">📷</div>
              }
              <p className="car-confirm-preview-name">{form.modelName}</p>
              <p className="car-confirm-preview-model">{form.serialNumber}</p>
              <span className={`car-confirm-status car-confirm-status--${form.status === "정상" ? "green" : form.status === "주의" ? "orange" : "red"}`}>
                {form.status}
              </span>
            </div>

            {/* 정보 목록 */}
            <div className="car-result-info">
              {CONFIRM_ROWS.map(({ label, value }) => (
                <div key={label} className="car-result-row">
                  <span className="car-result-row__label">{label}</span>
                  <span className="car-result-row__value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="car-step-footer">
            <button className="car-btn-secondary" onClick={() => setStep(1)}>이전으로</button>
            <button className="car-btn-primary" onClick={() => setStep(3)}>
              등록하기 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: 등록 완료 ── */}
      {step === 3 && (
        <div className="car-step-body car-step-body--complete">
          <div className="car-complete-icon">✅</div>
          <h2 className="car-step-title">가전 등록이 완료되었어요!</h2>
          <p className="car-step-sub">새로운 가전이 목록에 추가되었습니다.</p>

          <div className="car-complete-card">
            <div className="car-confirm-preview" style={{ alignItems: "center" }}>
              {imageUrl
                ? <img src={imageUrl} alt="제품" className="car-confirm-preview-img" />
                : <div className="car-confirm-preview-placeholder">📦</div>
              }
              <p className="car-confirm-preview-name">{form.modelName}</p>
              <p className="car-confirm-preview-model">{form.serialNumber}</p>
            </div>
            <div className="car-complete-info">
              {CONFIRM_ROWS.map(({ label, value }) => (
                <div key={label} className="car-result-row">
                  <span className="car-result-row__label">{label}</span>
                  <span className="car-result-row__value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="car-step-footer car-step-footer--center">
            <button className="car-btn-primary" onClick={onClose}>목록으로 돌아가기</button>
          </div>
        </div>
      )}
    </div>
  );
}

const ALL_APPLIANCES = [
  { id: 1, name: "냉장고",     brand: "LG 디오스 냉장고",    model: "M870SN75",      usagePeriod: "2년 3개월", score: 95, status: "정상",    certified: true  },
  { id: 2, name: "세탁기",     brand: "삼성 그랑데 세탁기",  model: "WF21A9500KV",   usagePeriod: "1년 8개월", score: 72, status: "주의",    certified: false },
  { id: 3, name: "에어컨",     brand: "LG 휘센 에어컨",      model: "FQ17H9DWA1",    usagePeriod: "3년 1개월", score: 88, status: "정상",    certified: true  },
  { id: 4, name: "TV",         brand: "삼성 QLED TV",         model: "KQ65QC67AFXKR", usagePeriod: "2년 6개월", score: 90, status: "정상",    certified: true  },
  { id: 5, name: "공기청정기", brand: "삼성 블루스카이",      model: "AX60R5580WBD",  usagePeriod: "1년 2개월", score: 85, status: "정상",    certified: true  },
  { id: 6, name: "로봇청소기", brand: "LG 코드제로 R9",      model: "R958GA",         usagePeriod: "2년 9개월", score: 45, status: "점검 필요", certified: false },
  { id: 7, name: "건조기",     brand: "삼성 그랑데 건조기",  model: "DV17T9720SV",   usagePeriod: "1년 4개월", score: 78, status: "정상",    certified: true  },
  { id: 8, name: "가습기",     brand: "사오미 스마트 가습기", model: "MJJSQ05DY",     usagePeriod: "6개월",     score: 92, status: "정상",    certified: true  },
];

const TABS = [
  { key: "전체",    label: "전체",    count: 8 },
  { key: "정상",    label: "정상",    count: 6 },
  { key: "주의",    label: "주의",    count: 1 },
  { key: "점검 필요", label: "점검 필요", count: 1 },
];

const STATUS_COLOR = { "정상": "green", "주의": "orange", "점검 필요": "red" };
const SCORE_COLOR  = { "정상": "#734bcf", "주의": "#f59e0b", "점검 필요": "#ef4444" };

const UPCOMING = [
  { name: "세탁기",     desc: "필터 교체 주기 도래",      dDay: 3,  color: "orange" },
  { name: "에어컨",     desc: "정기 점검 예정",            dDay: 12, color: "blue"   },
  { name: "냉장고",     desc: "보증 기간 만료 예정",       dDay: 28, color: "purple" },
];

const avgScore = Math.round(ALL_APPLIANCES.reduce((s, a) => s + a.score, 0) / ALL_APPLIANCES.length);

export default function CustomerAppliances() {
  const [activeTab, setActiveTab] = useState("전체");
  const [showRegister, setShowRegister] = useState(false);

  const filtered = activeTab === "전체"
    ? ALL_APPLIANCES
    : ALL_APPLIANCES.filter((a) => a.status === activeTab);

  return (
    <div className="ca-wrap">

      {/* 헤더 */}

      {showRegister && <ApplianceRegisterFlow onClose={() => setShowRegister(false)} />}

      {/* 바디: 좌측 메인 + 우측 사이드바 */}
      {!showRegister && <div className="ca-body">

        {/* ══ 좌측 메인 ══ */}
        <div className="ca-main">

          {/* 탭 + 정렬 */}
          <div className="ca-toolbar">
            <div className="ca-tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`ca-tab ${activeTab === t.key ? "ca-tab--active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>
            <div className="ca-sort">
              <span>등록순</span>
              <ChevronDown size={14} />
            </div>
          </div>

          {/* 가전 그리드 */}
          <div className="ca-grid">
            {filtered.map((a) => (
              <div key={a.id} className="ca-card">
                <div className="ca-card__top">
                  <div className="ca-card__img" />
                  <div className="ca-card__badges">
                    {a.certified && <span className="ca-cert-badge">careflow<br />인증</span>}
                    <span className={`ca-status-badge ca-status-badge--${STATUS_COLOR[a.status]}`}>
                      {a.status === "정상" ? "😊" : a.status === "주의" ? "⚠️" : "🔴"} {a.status}
                    </span>
                  </div>
                </div>
                <p className="ca-card__name">{a.name}</p>
                <p className="ca-card__brand">{a.brand}</p>
                <p className="ca-card__model">{a.model}</p>
                <p className="ca-card__period">사용 기간 · {a.usagePeriod}</p>
                <div className="ca-score-row">
                  <span className="ca-score-num">{a.score}점</span>
                  <div className="ca-score-bar">
                    <div className="ca-score-bar__fill" style={{ width: `${a.score}%`, background: SCORE_COLOR[a.status] }} />
                  </div>
                </div>
                <div className="ca-card__actions">
                  <button className="ca-btn-detail">상세 및 이력 보기</button>
                  <button className="ca-btn-check"><CalendarCheck size={13} /> 점검 예약</button>
                </div>
              </div>
            ))}

            {/* 가전 등록 카드 */}
            <div className="ca-card ca-card--add" onClick={() => setShowRegister(true)}>
              <div className="ca-add-icon"><Plus size={28} strokeWidth={1.5} /></div>
              <p className="ca-add-label">가전 등록하기</p>
              <p className="ca-add-sub">새로운 가전을 등록하고 관리하세요.</p>
            </div>
          </div>

          {/* 하단 배너 */}
          <div className="ca-banner">
            <div className="ca-banner__text">
              <p>새로운 가전을 등록하고</p>
              <p><strong>더 스마트한 관리를 시작해보세요!</strong></p>
            </div>
            <button className="ca-banner__btn" onClick={() => setShowRegister(true)}>+ 가전 등록하기</button>
          </div>
        </div>

        {/* ══ 우측 사이드바 ══ */}
        <aside className="ca-sidebar">

          {/* 가전 현황 요약 */}
          <div className="ca-side-card">
            <p className="ca-side-card__title">가전 현황</p>
            <div className="ca-stat-list">
              <div className="ca-stat-row">
                <span className="ca-stat-icon ca-stat-icon--gray">📦</span>
                <span className="ca-stat-label">전체 가전</span>
                <span className="ca-stat-value">8 대</span>
              </div>
              <div className="ca-stat-row">
                <span className="ca-stat-icon ca-stat-icon--green"><ShieldCheck size={14} /></span>
                <span className="ca-stat-label">정상</span>
                <span className="ca-stat-value ca-stat-value--green">6 대</span>
              </div>
              <div className="ca-stat-row">
                <span className="ca-stat-icon ca-stat-icon--orange"><AlertTriangle size={14} /></span>
                <span className="ca-stat-label">주의</span>
                <span className="ca-stat-value ca-stat-value--orange">1 대</span>
              </div>
              <div className="ca-stat-row">
                <span className="ca-stat-icon ca-stat-icon--red">🔴</span>
                <span className="ca-stat-label">점검 필요</span>
                <span className="ca-stat-value ca-stat-value--red">1 대</span>
              </div>
            </div>
          </div>

          {/* 평균 건강지수 */}
          <div className="ca-side-card ca-health-summary">
            <p className="ca-side-card__title">평균 건강지수</p>
            <div className="ca-health-gauge">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="42" fill="none" stroke="#f0f0f8" strokeWidth="10" />
                <circle cx="55" cy="55" r="42" fill="none" stroke="#734bcf" strokeWidth="10"
                  strokeDasharray={`${(avgScore / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                  strokeDashoffset={2 * Math.PI * 42 * 0.25} strokeLinecap="round" />
                <text x="55" y="51" textAnchor="middle" fontSize="22" fontWeight="900" fill="#1a1a2e">{avgScore}</text>
                <text x="55" y="66" textAnchor="middle" fontSize="10" fill="#888">/ 100점</text>
              </svg>
              <div className="ca-health-labels">
                {ALL_APPLIANCES.map((a) => (
                  <div key={a.id} className="ca-health-label-row">
                    <span className="ca-health-dot" style={{ background: SCORE_COLOR[a.status] }} />
                    <span className="ca-health-name">{a.name}</span>
                    <span className="ca-health-score">{a.score}점</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 관리 일정 알림 */}
          <div className="ca-side-card">
            <p className="ca-side-card__title">관리 일정 알림</p>
            <div className="ca-upcoming-list">
              {UPCOMING.map((u, i) => (
                <div key={i} className="ca-upcoming-item">
                  <div className={`ca-upcoming-dday ca-upcoming-dday--${u.color}`}>D-{u.dDay}</div>
                  <div className="ca-upcoming-info">
                    <p className="ca-upcoming-name">{u.name}</p>
                    <p className="ca-upcoming-desc">{u.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CareFlow 인증 현황 */}
          <div className="ca-side-card">
            <p className="ca-side-card__title">CareFlow 인증 현황</p>
            <div className="ca-cert-summary">
              <div className="ca-cert-bar-wrap">
                <div className="ca-cert-bar">
                  <div className="ca-cert-bar__fill" style={{ width: `${(6 / 8) * 100}%` }} />
                </div>
                <span className="ca-cert-ratio">6 / 8 대</span>
              </div>
              <p className="ca-cert-desc">보유 가전의 <strong>75%</strong>가 CareFlow 인증을 받았어요.</p>
              <div className="ca-cert-chips">
                {ALL_APPLIANCES.map((a) => (
                  <span key={a.id} className={`ca-cert-chip ${a.certified ? "ca-cert-chip--on" : "ca-cert-chip--off"}`}>
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </aside>
      </div>}
    </div>
  );
}
