import { useState, useRef } from "react";
import { Bell, MessageSquare, ChevronDown, Plus, CalendarCheck, AlertTriangle, ShieldCheck, ArrowLeft, Upload, X, Check, ChevronRight, RotateCcw } from "lucide-react";
import "../../styles/Customer/CustomerAppliances.css";

/* ─────────────────────────────────
   가전 등록 플로우
───────────────────────────────── */
const STEPS = ["기본 정보", "상세 정보", "구매 정보", "등록 완료"];

const PARSED_RESULT = {
  type: "냉장고", brand: "LG", name: "LG 디오스 냉장고",
  model: "M870SN75", purchased: "2024.05.18", store: "LG 베스트샵",
  price: "2,350,000원", warranty: "2024.05.18 ~ 2027.05.17 (3년)",
};

function ApplianceRegisterFlow({ onClose }) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [form, setForm] = useState({ ...PARSED_RESULT });
  const fileRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  function handleFormChange(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <div className="car-flow-wrap">
      {/* 스텝 바 */}
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

      {/* Step 1: 등록 방법 선택 */}
      {step === 1 && (
        <div className="car-step-body">
          <h2 className="car-step-title">등록 방법을 선택해주세요</h2>
          <p className="car-step-sub">원하는 방법으로 쉽고 빠르게 가전을 등록할 수 있어요.</p>
          <div className="car-method-grid">
            {[
              { key: "direct", icon: "✏️", title: "직접 입력", desc: "제품 정보를 직접 입력하여 가전을 등록합니다." },
              { key: "receipt", icon: "📷", title: "영수증 등록", desc: "영수증을 촬영하거나 사진을 올려 제품 정보를 자동으로 입력해드립니다." },
              { key: "qr", icon: "🔲", title: "QR 코드 스캔", desc: "제품의 QR 코드를 스캔하여 간편하게 등록합니다." },
            ].map((m) => (
              <button
                key={m.key}
                className={`car-method-card ${method === m.key ? "car-method-card--selected" : ""}`}
                onClick={() => setMethod(m.key)}
              >
                {method === m.key && <span className="car-method-check"><Check size={11} /></span>}
                <div className="car-method-icon">{m.icon}</div>
                <p className="car-method-title">{m.title}</p>
                <p className="car-method-desc">{m.desc}</p>
              </button>
            ))}
          </div>
          <p className="car-method-note">
            영수증 등록을 선택하면 제품명, 모델번호, 구매일, 보증 정보 등을 자동으로 입력해 드립니다!
          </p>
          <div className="car-step-footer">
            <button className="car-btn-secondary" onClick={onClose}>취소</button>
            <button className="car-btn-primary" disabled={!method} onClick={() => setStep(2)}>
              다음 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 영수증 업로드 */}
      {step === 2 && (
        <div className="car-step-body">
          <h2 className="car-step-title">영수증 또는 제품 이미지를 업로드</h2>
          <p className="car-step-sub">구매일, 구매처, 제품명, 보증 정보 등이 표시된 이미지를 올려주세요.</p>

          {!previewUrl ? (
            <div
              className="car-upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                type="file" accept="image/*" ref={fileRef} style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <div className="car-upload-icon"><Upload size={28} /></div>
              <p className="car-upload-text">이미지를 드래그하거나 클릭해서 업로드</p>
              <p className="car-upload-hint">JPG, PNG, PDF, 파일 크기 최대 10MB</p>
              <button className="car-upload-btn" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
                파일 선택
              </button>
            </div>
          ) : (
            <div className="car-preview-wrap">
              <div className="car-preview-img-wrap">
                <img src={previewUrl} alt="업로드된 영수증" className="car-preview-img" />
                <button className="car-preview-remove" onClick={() => { setUploadedFile(null); setPreviewUrl(null); }}>
                  <X size={14} />
                </button>
              </div>
              <p className="car-preview-name">{uploadedFile?.name}</p>
              <p className="car-preview-size">{uploadedFile ? (uploadedFile.size / 1024).toFixed(1) + " KB" : ""}</p>
              <p className="car-preview-hint">영수증의 날짜와 제품명이 선명하게 보이는지 확인해 주세요.</p>
            </div>
          )}

          <div className="car-step-footer">
            <button className="car-btn-secondary" onClick={() => setStep(1)}><ArrowLeft size={14} /> 이전</button>
            <button className="car-btn-primary" disabled={!previewUrl} onClick={() => setStep(3)}>
              분석하기 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 영수증 분석 결과 */}
      {step === 3 && (
        <div className="car-step-body">
          <h2 className="car-step-title">영수증 분석 결과</h2>
          <p className="car-step-sub">AI가 분석한 결과입니다. 정보를 확인하고 다음 단계로 진행하세요.</p>

          <div className="car-result-wrap">
            {/* 영수증 이미지 */}
            <div className="car-result-receipt">
              {previewUrl
                ? <img src={previewUrl} alt="영수증" className="car-result-receipt-img" />
                : (
                  <div className="car-result-receipt-mock">
                    <div className="car-receipt-mock-header">LG BEST SHOP</div>
                    <div className="car-receipt-mock-body">
                      <div className="car-receipt-mock-row"><span>거래일시</span><span>2024.05.18 13:21:45</span></div>
                      <div className="car-receipt-mock-row"><span>제품명</span><span>LG 디오스 냉장고</span></div>
                      <div className="car-receipt-mock-row"><span>모델번호</span><span>M870SN75</span></div>
                      <div className="car-receipt-mock-row"><span>판매금액</span><span>2,350,000원</span></div>
                      <div className="car-receipt-mock-row"><span>제조사</span><span>LG</span></div>
                      <div className="car-receipt-mock-row"><span>구매처</span><span>LG 베스트샵</span></div>
                    </div>
                    <div className="car-receipt-mock-barcode">||||||||||||||</div>
                  </div>
                )
              }
            </div>

            {/* 파싱된 정보 */}
            <div className="car-result-info">
              <p className="car-result-info__title">인식된 정보</p>
              {[
                { label: "구매일", value: PARSED_RESULT.purchased },
                { label: "제품명", value: PARSED_RESULT.name },
                { label: "모델명", value: PARSED_RESULT.model },
                { label: "제조사", value: PARSED_RESULT.brand },
                { label: "금액",   value: PARSED_RESULT.price },
                { label: "구매처", value: PARSED_RESULT.store },
              ].map(({ label, value }) => (
                <div key={label} className="car-result-row">
                  <span className="car-result-row__label">{label}</span>
                  <span className="car-result-row__value">{value}</span>
                </div>
              ))}
              <p className="car-result-info__note">
                번호 정보는 상세 정보 단계에서 더 수정할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="car-step-footer">
            <button className="car-btn-secondary" onClick={() => setStep(2)}>
              <RotateCcw size={14} /> 다시 업로드
            </button>
            <button className="car-btn-primary" onClick={() => setStep(4)}>
              다음 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 정보 확인 및 수정 */}
      {step === 4 && (
        <div className="car-step-body">
          <h2 className="car-step-title">분석 결과를 확인하고 수정해주세요</h2>
          <p className="car-step-sub">기본 정보를 확인하고 필요시 수정할 수 있습니다.</p>

          <div className="car-confirm-wrap">
            {/* 제품 이미지 미리보기 */}
            <div className="car-confirm-preview">
              {previewUrl
                ? <img src={previewUrl} alt="제품" className="car-confirm-preview-img" />
                : <div className="car-confirm-preview-placeholder">📷</div>
              }
              <p className="car-confirm-preview-name">{form.name}</p>
              <p className="car-confirm-preview-model">{form.model}</p>
            </div>

            {/* 편집 폼 */}
            <div className="car-confirm-form">
              <div className="car-form-row">
                <label>가전 종류</label>
                <select value={form.type} onChange={(e) => handleFormChange("type", e.target.value)}>
                  {["냉장고","세탁기","에어컨","TV","건조기","공기청정기","로봇청소기","기타"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="car-form-row">
                <label>제조사</label>
                <select value={form.brand} onChange={(e) => handleFormChange("brand", e.target.value)}>
                  {["LG","삼성","위니아","대우","기타"].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="car-form-row">
                <label>제품명</label>
                <input value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} />
              </div>
              <div className="car-form-row">
                <label>모델번호</label>
                <input value={form.model} onChange={(e) => handleFormChange("model", e.target.value)} />
              </div>
              <div className="car-form-row">
                <label>구매일</label>
                <input value={form.purchased} onChange={(e) => handleFormChange("purchased", e.target.value)} />
              </div>
              <div className="car-form-row">
                <label>구매처</label>
                <input value={form.store} onChange={(e) => handleFormChange("store", e.target.value)} />
              </div>
              <div className="car-form-warranty">
                <label>예상 보증기간</label>
                <div className="car-form-warranty-val">
                  {form.warranty}
                  <span className="car-form-warranty-info">ℹ️</span>
                </div>
              </div>
            </div>
          </div>

          <div className="car-step-footer">
            <button className="car-btn-secondary" onClick={() => setStep(3)}><ArrowLeft size={14} /> 이전</button>
            <button className="car-btn-primary" onClick={() => setStep(5)}>
              등록하기 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: 등록 완료 */}
      {step === 5 && (
        <div className="car-step-body car-step-body--complete">
          <div className="car-complete-icon">✅</div>
          <h2 className="car-step-title">가전 등록이 완료되었어요!</h2>
          <p className="car-step-sub">새로운 가전이 목록에 추가되었습니다.</p>

          <div className="car-complete-card">
            <div className="car-confirm-preview" style={{ alignItems: "center" }}>
              {previewUrl
                ? <img src={previewUrl} alt="제품" className="car-confirm-preview-img" />
                : <div className="car-confirm-preview-placeholder">❄️</div>
              }
              <p className="car-confirm-preview-name">{form.name}</p>
              <p className="car-confirm-preview-model">{form.model}</p>
            </div>
            <div className="car-complete-info">
              {[
                { label: "가전 종류", value: form.type },
                { label: "제조사",   value: form.brand },
                { label: "모델번호", value: form.model },
                { label: "구매일",   value: form.purchased },
                { label: "구매처",   value: form.store },
                { label: "보증기간", value: form.warranty },
              ].map(({ label, value }) => (
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
      <header className="ca-header">
        <div className="ca-header__left">
          {showRegister ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="ca-back-btn" onClick={() => setShowRegister(false)}>
                <ArrowLeft size={16} /> 뒤로
              </button>
              <div>
                <h1>가전 등록하기</h1>
                <p>새로운 가전을 등록하여 체계적으로 관리하세요.</p>
              </div>
            </div>
          ) : (
            <>
              <h1>내 가전</h1>
              <p>보유하고 있는 가전제품을 한눈에 확인하고 관리하세요.</p>
            </>
          )}
        </div>
        <div className="ca-header__right">
          <button className="ca-icon-btn"><Bell size={20} /></button>
          <button className="ca-icon-btn"><MessageSquare size={20} /></button>
          <div className="ca-profile">
            <div className="ca-avatar">혜</div>
            <span>혜민님</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </header>

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
