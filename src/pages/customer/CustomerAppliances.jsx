import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  CalendarCheck,
  AlertTriangle,
  ShieldCheck,
  Upload,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ArrowLeft,
  Info,
  Wrench,
  Package,
  FileText,
  Shield,
  Download,
  Trash2,
  Pencil,
} from "lucide-react";
import "../../styles/Customer/CustomerAppliances.css";
import "../../styles/Customer/CustomerRepairHistory.css";
import ApplianceIcon from "./ApplianceIcon";

import {
  getMyAppliances,
  deleteAppliances,
  createAppliance,
} from "../../apis/appliances";

/* ─────────────────────────────────
   카테고리 데이터
───────────────────────────────── */
const CATEGORIES = {
  1: {
    label: "주방가전",
    sub: {
      11: "냉장고",
      12: "전기밥솥",
      13: "인덕션",
      14: "오븐",
      15: "식기세척기",
    },
  },
  2: {
    label: "생활가전",
    sub: {
      21: "세탁기",
      22: "건조기",
      23: "에어컨",
      24: "공기청정기",
      25: "선풍기",
      26: "청소기",
    },
  },
  3: { label: "영상가전", sub: { 31: "TV", 32: "빔프로젝터" } },
  4: {
    label: "음향가전",
    sub: { 41: "사운드바", 42: "홈시어터", 43: "스피커" },
  },
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
            <div
              className={`car-stepper__circle ${active ? "car-stepper__circle--active" : ""} ${done ? "car-stepper__circle--done" : ""}`}
            >
              {done ? <Check size={12} /> : n}
            </div>
            <span
              className={`car-stepper__label ${active ? "car-stepper__label--active" : ""} ${done ? "car-stepper__label--done" : ""}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`car-stepper__line ${done ? "car-stepper__line--done" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── 등록 플로우 ─── */
function ApplianceRegisterFlow({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const fileRef = useRef(null);

  async function handleRegister() {
    try {
      await createAppliance({
        categoryId: Number(form.categorySub),
        brand: form.brand,
        modelName: form.modelName,
        serialNumber: form.serialNumber,
        purchaseDate: form.purchaseDate,
        warrantyEndDate: form.warrantyExpiry,
      });
      setStep(3);
      onCreated?.();
    } catch (error) {
      alert(error.response?.data?.message || "가전 등록에 실패했습니다.");
    }
  }

  const subCategories = form.categoryParent
    ? CATEGORIES[form.categoryParent].sub
    : {};

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
    { label: "카테고리", value: categoryLabel },
    { label: "브랜드", value: form.brand },
    { label: "모델명", value: form.modelName },
    { label: "시리얼 번호", value: form.serialNumber },
    { label: "구매 일자", value: form.purchaseDate },
    { label: "보증 만료일", value: form.warrantyExpiry },
    { label: "가전 상태", value: form.status },
  ];

  return (
    <div className="car-flow-wrap">
      <Stepper step={step} />

      {/* ── Step 1: 정보 입력 ── */}
      {step === 1 && (
        <div className="car-step-body">
          <h2 className="car-step-title">가전 정보를 입력해주세요</h2>
          <p className="car-step-sub">
            필수 항목을 모두 입력하면 다음 단계로 진행할 수 있습니다.
          </p>

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
                    type="file"
                    accept="image/*"
                    ref={fileRef}
                    style={{ display: "none" }}
                    onChange={(e) => handleImage(e.target.files[0])}
                  />
                  <div className="car-upload-icon">
                    <Upload size={22} />
                  </div>
                  <p className="car-upload-text" style={{ fontSize: 12 }}>
                    클릭 또는 드래그
                  </p>
                  <p className="car-upload-hint">JPG, PNG (최대 10MB)</p>
                </div>
              ) : (
                <div
                  className="car-preview-wrap"
                  style={{ alignItems: "center" }}
                >
                  <div className="car-preview-img-wrap">
                    <img
                      src={imageUrl}
                      alt="제품"
                      className="car-confirm-preview-img"
                    />
                    <button
                      className="car-preview-remove"
                      onClick={() => {
                        setImageFile(null);
                        setImageUrl(null);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="car-preview-name" style={{ fontSize: 11 }}>
                    {imageFile?.name}
                  </p>
                </div>
              )}
            </div>

            {/* 오른쪽: 폼 필드 */}
            <div className="car-input-fields-col">
              {/* 카테고리 */}
              <p className="car-input-section-label">
                카테고리 <span className="car-required">*</span>
              </p>
              <div className="car-category-row">
                <div className="car-select-wrap">
                  <select
                    value={form.categoryParent}
                    onChange={(e) =>
                      handleChange("categoryParent", e.target.value)
                    }
                    className="car-select"
                  >
                    <option value="">대분류 선택</option>
                    {Object.entries(CATEGORIES).map(([id, { label }]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="car-select-icon" />
                </div>
                <div className="car-select-wrap">
                  <select
                    value={form.categorySub}
                    onChange={(e) =>
                      handleChange("categorySub", e.target.value)
                    }
                    className="car-select"
                    disabled={!form.categoryParent}
                  >
                    <option value="">소분류 선택</option>
                    {Object.entries(subCategories).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="car-select-icon" />
                </div>
              </div>

              {/* 기본 정보 */}
              <p className="car-input-section-label" style={{ marginTop: 16 }}>
                기본 정보
              </p>
              <div className="car-fields-grid">
                <div className="car-field">
                  <label>
                    브랜드 <span className="car-required">*</span>
                  </label>
                  <input
                    placeholder="예: LG, 삼성, 위니아"
                    value={form.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                  />
                </div>
                <div className="car-field">
                  <label>
                    모델명 <span className="car-required">*</span>
                  </label>
                  <input
                    placeholder="예: LG 디오스 냉장고"
                    value={form.modelName}
                    onChange={(e) => handleChange("modelName", e.target.value)}
                  />
                </div>
                <div className="car-field car-field--full">
                  <label>
                    시리얼 번호 <span className="car-required">*</span>
                  </label>
                  <input
                    placeholder="예: M870SN75"
                    value={form.serialNumber}
                    onChange={(e) =>
                      handleChange("serialNumber", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* 구매 & 보증 */}
              <p className="car-input-section-label" style={{ marginTop: 16 }}>
                구매 및 보증 정보
              </p>
              <div className="car-fields-grid">
                <div className="car-field">
                  <label>
                    구매 일자 <span className="car-required">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) =>
                      handleChange("purchaseDate", e.target.value)
                    }
                  />
                </div>
                <div className="car-field">
                  <label>
                    보증 만료일 <span className="car-required">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.warrantyExpiry}
                    onChange={(e) =>
                      handleChange("warrantyExpiry", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* 가전 상태 */}
              <p className="car-input-section-label" style={{ marginTop: 16 }}>
                가전 상태 <span className="car-required">*</span>
              </p>
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
            <button className="car-btn-secondary" onClick={onClose}>
              취소
            </button>
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
          <p className="car-step-sub">
            등록 전 정보를 최종 확인합니다. 수정이 필요하면 이전 단계로
            돌아가세요.
          </p>

          <div className="car-confirm-wrap">
            <div className="car-confirm-preview">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="제품"
                  className="car-confirm-preview-img"
                />
              ) : (
                <div className="car-confirm-preview-placeholder">📷</div>
              )}
              <p className="car-confirm-preview-name">{form.modelName}</p>
              <p className="car-confirm-preview-model">{form.serialNumber}</p>
              <span
                className={`car-confirm-status car-confirm-status--${form.status === "정상" ? "green" : form.status === "주의" ? "orange" : "red"}`}
              >
                {form.status}
              </span>
            </div>

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
            <button className="car-btn-secondary" onClick={() => setStep(1)}>
              이전으로
            </button>
            <button className="car-btn-primary" onClick={handleRegister}>
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
            <div
              className="car-confirm-preview"
              style={{ alignItems: "center" }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="제품"
                  className="car-confirm-preview-img"
                />
              ) : (
                <div className="car-confirm-preview-placeholder">📦</div>
              )}
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
            <button className="car-btn-primary" onClick={onClose}>
              목록으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────
   가전 목록 데이터
───────────────────────────────── */
// const ALL_APPLIANCES = [
//   { id: 1, name: "냉장고",     brand: "LG 디오스 냉장고",    model: "M870SN75",      usagePeriod: "2년 3개월", score: 95, status: "정상",    certified: true,  repairCount: 5 },
//   { id: 2, name: "세탁기",     brand: "삼성 그랑데 세탁기",  model: "WF21A9500KV",   usagePeriod: "1년 8개월", score: 72, status: "주의",    certified: false, repairCount: 2 },
//   { id: 3, name: "에어컨",     brand: "LG 휘센 에어컨",      model: "FQ17H9DWA1",    usagePeriod: "3년 1개월", score: 88, status: "정상",    certified: true,  repairCount: 1 },
//   { id: 4, name: "TV",         brand: "삼성 QLED TV",         model: "KQ65QC67AFXKR", usagePeriod: "2년 6개월", score: 90, status: "정상",    certified: true,  repairCount: 0 },
//   { id: 5, name: "공기청정기", brand: "삼성 블루스카이",      model: "AX60R5580WBD",  usagePeriod: "1년 2개월", score: 85, status: "정상",    certified: true,  repairCount: 1 },
//   { id: 6, name: "로봇청소기", brand: "LG 코드제로 R9",      model: "R958GA",         usagePeriod: "2년 9개월", score: 45, status: "점검 필요", certified: false, repairCount: 3 },
//   { id: 7, name: "건조기",     brand: "삼성 그랑데 건조기",  model: "DV17T9720SV",   usagePeriod: "1년 4개월", score: 78, status: "정상",    certified: true,  repairCount: 1 },
//   { id: 8, name: "가습기",     brand: "사오미 스마트 가습기", model: "MJJSQ05DY",     usagePeriod: "6개월",     score: 92, status: "정상",    certified: true,  repairCount: 0 },
// ];

/* TABS 카운트는 메인 컴포넌트에서 appliances 기반으로 동적 계산 */
const TAB_KEYS = ["전체", "정상", "주의", "점검 필요"];

const STATUS_COLOR = { 정상: "green", 주의: "orange", "점검 필요": "red" };
const SCORE_COLOR = {
  정상: "#734bcf",
  주의: "#f59e0b",
  "점검 필요": "#ef4444",
};

// const avgScore = Math.round(ALL_APPLIANCES.reduce((s, a) => s + a.score, 0) / ALL_APPLIANCES.length);

/* ─────────────────────────────────
   수리 이력 데이터
───────────────────────────────── */
const DETAIL = {
  serial: "23KG89A00123",
  purchased: "2023.05.12",
  warranty: "~ 2026.05.11 (무상)",
  period: "1년 1개월",
  registered: "2023.05.15",
  summary: {
    total: 5,
    free: 3,
    paid: 2,
    totalCost: "315,000원",
    firstDate: "2024.06.17",
    nextDate: "2024.09.15",
  },
  parts: [
    { name: "컴프레서", count: 0 },
    { name: "온도센서", count: 1 },
    { name: "팬 모터", count: 1 },
    { name: "도어 패킹", count: 1 },
    { name: "재생 히터", count: 0 },
  ],
  repairs: [
    {
      id: "AS-240617-0001",
      date: "2024.06.17 10:15",
      symptom: "냉장실 냉동이 약함",
      symptomTag: "냉방/냉동",
      diagnosis: "냉각 팬 모터 불량\n냉기 순환 문제 확인",
      treatment: "냉각 팬 모터 교체\n냉매 압력 점검",
      type: "유상",
      engineer: "정우성 기사",
      rating: 4.8,
      cost: "120,000원",
    },
    {
      id: "AS-240413-0002",
      date: "2024.04.13 14:20",
      symptom: "냉장실 물 고임",
      symptomTag: "냉방/냉동",
      diagnosis: "배수구 막힘\n배수 호스 오염",
      treatment: "배수구 청소\n배수 호스 교체",
      type: "무상",
      engineer: "이재훈 기사",
      rating: 4.9,
      cost: "0원",
    },
    {
      id: "AS-240201-0003",
      date: "2024.02.01 09:30",
      symptom: "소음 발생",
      symptomTag: "기타",
      diagnosis: "컴프레서 진동\n발생 확인",
      treatment: "컴프레서 고정 보강\n진동 패드 부착",
      type: "무상",
      engineer: "박현우 기사",
      rating: 4.7,
      cost: "0원",
    },
    {
      id: "AS-231015-0004",
      date: "2023.10.15 11:45",
      symptom: "냉장실 온도 높음",
      symptomTag: "냉방/냉동",
      diagnosis: "온도센서 불량\n센서 값 오류",
      treatment: "온도센서 교체\n온도 보정",
      type: "유상",
      engineer: "최지훈 기사",
      rating: 4.9,
      cost: "85,000원",
    },
    {
      id: "AS-230602-0005",
      date: "2023.06.02 16:10",
      symptom: "문 닫힘 불량",
      symptomTag: "기타",
      diagnosis: "도어 패킹 손상\n밀폐력 저하",
      treatment: "도어 패킹 교체\n도어 정렬 조정",
      type: "무상",
      engineer: "김민수 기사",
      rating: 4.8,
      cost: "110,000원",
    },
  ],
};

const DIAGNOSTICS = {
  1: {
    certId: 1,
    grade: "B",
    score: 75,
    isCertified: true,
    issuedAt: "2024.06.17",
    scoreItems: [
      { label: "수리 횟수", score: 20, max: 25, condition: "1회", icon: "🔧" },
      {
        label: "사용 기간",
        score: 20,
        max: 25,
        condition: "1년 이상 ~ 3년 미만",
        icon: "📅",
      },
      {
        label: "교체 부품 중요도",
        score: 20,
        max: 25,
        condition: "MINOR 부품만 교체",
        icon: "⚙️",
      },
      {
        label: "최근 수리 일시",
        score: 15,
        max: 25,
        condition: "1년 이상 ~ 2년 미만",
        icon: "🕐",
      },
    ],
  },
  2: {
    certId: 2,
    grade: "C",
    score: 62,
    isCertified: false,
    issuedAt: "2024.03.05",
    scoreItems: [
      { label: "수리 횟수", score: 15, max: 25, condition: "2회", icon: "🔧" },
      {
        label: "사용 기간",
        score: 18,
        max: 25,
        condition: "1년 이상 ~ 3년 미만",
        icon: "📅",
      },
      {
        label: "교체 부품 중요도",
        score: 14,
        max: 25,
        condition: "MAJOR 부품 교체",
        icon: "⚙️",
      },
      {
        label: "최근 수리 일시",
        score: 15,
        max: 25,
        condition: "1년 이상 ~ 2년 미만",
        icon: "🕐",
      },
    ],
  },
  3: null,
  6: {
    certId: 6,
    grade: "D",
    score: 48,
    isCertified: false,
    issuedAt: "2024.05.20",
    scoreItems: [
      {
        label: "수리 횟수",
        score: 10,
        max: 25,
        condition: "3회 이상",
        icon: "🔧",
      },
      {
        label: "사용 기간",
        score: 15,
        max: 25,
        condition: "3년 이상",
        icon: "📅",
      },
      {
        label: "교체 부품 중요도",
        score: 13,
        max: 25,
        condition: "CRITICAL 부품 교체",
        icon: "⚙️",
      },
      {
        label: "최근 수리 일시",
        score: 10,
        max: 25,
        condition: "6개월 이내",
        icon: "🕐",
      },
    ],
  },
};

const GRADE_META = {
  A: { color: "#16a34a", bg: "#dcfce7" },
  B: { color: "#2563eb", bg: "#dbeafe" },
  C: { color: "#d97706", bg: "#fef9c3" },
  D: { color: "#ea580c", bg: "#ffedd5" },
  E: { color: "#dc2626", bg: "#fee2e2" },
};
const GRADE_DESC = {
  A: "최상 상태",
  B: "양호",
  C: "보통",
  D: "주의 필요",
  E: "불량",
};

/* ─── 원형 점수 게이지 ─── */
function ScoreGauge({ score, size = 110, strokeWidth = 9, color = "#7c5cf7" }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const cx = size / 2,
    cy = size / 2;
  return (
    <div
      className="crh-gauge"
      style={{ width: size, height: size, position: "relative", flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`${color}22`}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 11, color: `${color}99` }}>/100</span>
      </div>
    </div>
  );
}

/* ─── 진단서 패널 ─── */
function DiagPanel({ diag }) {
  if (!diag) {
    return (
      <div className="crh-panel crh-panel--diag crh-panel--diag-empty">
        <div className="crh-panel__title">
          <FileText size={14} color="#aaa" /> 제품 건강 진단서
        </div>
        <div className="crh-diag-empty">
          <p className="crh-diag-empty__msg">아직 발급된 진단서가 없습니다.</p>
          <p className="crh-diag-empty__sub">
            A/S 완료 후 수리 보고서가 작성되면
            <br />
            제품 건강 진단서가 자동 발급됩니다.
          </p>
        </div>
      </div>
    );
  }
  const gm = GRADE_META[diag.grade] || GRADE_META.E;
  return (
    <div className="crh-panel crh-panel--diag">
      <div className="crh-diag-header">
        <div className="crh-diag-header__left">
          <FileText size={14} color="#7c5cf7" />
          <span className="crh-diag-header__title">제품 건강 진단서</span>
          <span className="crh-diag-header__id">#{diag.certId}</span>
        </div>
        <div className="crh-diag-header__right">
          <span className="crh-diag-header__date">발급 {diag.issuedAt}</span>
          <button className="crh-diag-dl-btn">
            <Download size={12} /> 다운로드
          </button>
        </div>
      </div>

      <div className="crh-diag-hero">
        <ScoreGauge
          score={diag.score}
          size={100}
          strokeWidth={8}
          color="#7c5cf7"
        />
        <div className="crh-diag-hero__info">
          <div
            className="crh-diag-grade"
            style={{ color: gm.color, background: gm.bg }}
          >
            {diag.grade}등급 · {GRADE_DESC[diag.grade]}
          </div>
          <div className="crh-diag-score-row">
            <span className="crh-diag-score-big">{diag.score}</span>
            <span className="crh-diag-score-denom">/100점</span>
          </div>
          {diag.isCertified ? (
            <div className="crh-diag-cert crh-diag-cert--yes">
              <ShieldCheck size={12} /> CareFlow 인증 완료
            </div>
          ) : (
            <div className="crh-diag-cert crh-diag-cert--no">
              <Shield size={12} /> 미인증
              <span className="crh-diag-cert__hint">
                B등급·75점↑ 달성 시 자동 부여
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="crh-diag-items">
        {diag.scoreItems.map((s) => (
          <div key={s.label} className="crh-diag-item">
            <span className="crh-diag-item__icon">{s.icon}</span>
            <span className="crh-diag-item__label">{s.label}</span>
            <div className="crh-diag-item__bar">
              <div
                className="crh-diag-item__fill"
                style={{ width: `${(s.score / s.max) * 100}%` }}
              />
            </div>
            <span className="crh-diag-item__score">
              {s.score}
              <span>/{s.max}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 삭제 확인 모달 ─── */
function DeleteConfirmModal({ appliance, onConfirm, onClose }) {
  return (
    <div className="ca-modal-overlay" onClick={onClose}>
      <div className="ca-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ca-modal__icon">
          <Trash2 size={28} color="#ef4444" />
        </div>
        <h3 className="ca-modal__title">가전을 삭제하시겠어요?</h3>
        <p className="ca-modal__desc">
          <strong>{appliance.brand}</strong> ({appliance.model})을
          <br />
          목록에서 삭제합니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="ca-modal__footer">
          <button className="ca-btn-secondary" onClick={onClose}>
            취소
          </button>
          <button className="ca-btn-danger" onClick={onConfirm}>
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 가전 정보 수정 모달 ─── */
function ApplianceEditModal({ appliance, onSave, onClose }) {
  const [form, setForm] = useState({
    brand: appliance.brand,
    model: appliance.model,
    status: appliance.status,
  });

  function handleChange(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <div className="ca-modal-overlay" onClick={onClose}>
      <div
        className="ca-modal ca-modal--edit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ca-modal__header">
          <Pencil size={16} color="#734bcf" />
          <h3 className="ca-modal__title ca-modal__title--sm">
            가전 정보 수정
          </h3>
        </div>
        <div className="ca-edit-fields">
          <div className="car-field">
            <label>브랜드</label>
            <input
              value={form.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
            />
          </div>
          <div className="car-field">
            <label>모델명</label>
            <input
              value={form.model}
              onChange={(e) => handleChange("model", e.target.value)}
            />
          </div>
          <div className="car-field car-field--full">
            <label>가전 상태</label>
            <div className="car-status-row">
              {["정상", "주의", "점검 필요"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`car-status-chip ${form.status === s ? `car-status-chip--${s === "정상" ? "green" : s === "주의" ? "orange" : "red"} car-status-chip--active` : ""}`}
                  onClick={() => handleChange("status", s)}
                >
                  {s === "정상" ? "😊" : s === "주의" ? "⚠️" : "🔴"} {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="ca-modal__footer">
          <button className="ca-btn-secondary" onClick={onClose}>
            취소
          </button>
          <button
            className="ca-btn-primary"
            onClick={() => onSave({ ...appliance, ...form })}
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 수리 이력 상세 화면 ─── */
function DetailView({ appliance, onBack, onUpdate }) {
  const [page, setPage] = useState(1);
  const [showEdit, setShowEdit] = useState(false);
  const diag = DIAGNOSTICS[appliance.id] ?? null;
  const PER_PAGE = 5;
  const totalPages = Math.ceil(DETAIL.repairs.length / PER_PAGE);
  const pageRepairs = DETAIL.repairs.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  return (
    <div className="crh-wrap">
      {showEdit && (
        <ApplianceEditModal
          appliance={appliance}
          onSave={(updated) => {
            onUpdate(updated);
            setShowEdit(false);
          }}
          onClose={() => setShowEdit(false)}
        />
      )}

      <button
        className="crh-back-btn"
        onClick={onBack}
        style={{ margin: "12px 0 0" }}
      >
        <ArrowLeft size={18} /> 내 가전 목록으로
      </button>

      <div className="crh-detail-body">
        {/* 상단 2열 패널: 가전정보 + 건강 진단서 */}
        <div className="crh-top-panels">
          <div className="crh-panel crh-panel--info">
            <div className="crh-appliance-header">
              <ApplianceIcon name={appliance.name} size={64} radius={10} />
              <div>
                <p className="crh-appliance-name">{appliance.brand}</p>
                <p className="crh-appliance-model">{appliance.model}</p>
                {appliance.certified && (
                  <span className="crh-cert-pill">careflow 인증</span>
                )}
              </div>
            </div>
            <div className="crh-info-rows">
              {[
                { label: "시리얼 번호", value: DETAIL.serial },
                { label: "구매일", value: DETAIL.purchased },
                { label: "보증 기간", value: DETAIL.warranty, highlight: true },
                { label: "사용 기간", value: DETAIL.period },
                { label: "등록일", value: DETAIL.registered },
              ].map((r) => (
                <div key={r.label} className="crh-info-row">
                  <span className="crh-info-label">{r.label}</span>
                  <span
                    className={`crh-info-value ${r.highlight ? "crh-info-value--highlight" : ""}`}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
            <button className="crh-edit-btn" onClick={() => setShowEdit(true)}>
              <Pencil size={13} /> 가전 정보 수정
            </button>
          </div>

          <DiagPanel diag={diag} />
        </div>

        {/* 요약 + 부품 가로 바 */}
        <div className="crh-meta-bar">
          <div className="crh-meta-bar__section">
            <div className="crh-meta-bar__head">
              <Wrench size={13} color="#734bcf" />
              <span>수리 요약</span>
            </div>
            <div className="crh-meta-bar__stats">
              {[
                { label: "총 수리", value: `${DETAIL.summary.total}건` },
                { label: "무상", value: `${DETAIL.summary.free}건` },
                { label: "유상", value: `${DETAIL.summary.paid}건` },
                {
                  label: "총 비용",
                  value: DETAIL.summary.totalCost,
                  accent: true,
                },
                { label: "최초 수리일", value: DETAIL.summary.firstDate },
              ].map((s) => (
                <div key={s.label} className="crh-meta-stat">
                  <span className="crh-meta-stat__label">{s.label}</span>
                  <span
                    className={`crh-meta-stat__value ${s.accent ? "crh-meta-stat__value--accent" : ""}`}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="crh-meta-bar__divider" />

          <div className="crh-meta-bar__section">
            <div className="crh-meta-bar__head">
              <Package size={13} color="#734bcf" />
              <span>주요 부품 교체 이력</span>
            </div>
            <div className="crh-meta-bar__parts">
              {DETAIL.parts.map((p) => (
                <div key={p.name} className="crh-meta-part">
                  <span className="crh-meta-part__name">{p.name}</span>
                  <span
                    className={`crh-meta-part__count ${p.count > 0 ? "crh-meta-part__count--active" : ""}`}
                  >
                    {p.count}회
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 수리 이력 */}
        <div className="crh-section-head">
          <span className="crh-section-title">수리 이력</span>
          <span className="crh-section-count">
            총 {DETAIL.repairs.length}건
          </span>
        </div>

        <div className="crh-repair-list">
          {pageRepairs.map((r) => (
            <div key={r.id} className="crh-repair-card">
              <div className="crh-repair-card__meta">
                <span className="crh-repair-card__id">{r.id}</span>
                <span className="crh-repair-card__date">{r.date}</span>
                <span
                  className={`crh-symptom-tag crh-symptom-tag--${r.symptomTag === "기타" ? "gray" : "purple"}`}
                >
                  {r.symptomTag}
                </span>
                <span
                  className={`crh-type-badge crh-type-badge--${r.type === "무상" ? "blue" : "orange"}`}
                >
                  {r.type}
                </span>
                <span className="crh-repair-card__engineer">
                  {r.engineer} <em>★ {r.rating}</em>
                </span>
                <span className="crh-repair-card__cost">{r.cost}</span>
              </div>

              <div className="crh-repair-card__symptom-row">
                <span className="crh-repair-card__symptom-label">증상</span>
                <span className="crh-repair-card__symptom">{r.symptom}</span>
              </div>

              <div className="crh-repair-card__content">
                <div className="crh-repair-card__box">
                  <p className="crh-repair-card__box-label">진단 내용</p>
                  <p className="crh-repair-card__box-text">{r.diagnosis}</p>
                </div>
                <div className="crh-repair-card__box">
                  <p className="crh-repair-card__box-label">처리 내용</p>
                  <p className="crh-repair-card__box-text">{r.treatment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="crh-pagination">
            <button
              className="crh-page-btn"
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`crh-page-btn ${page === i + 1 ? "crh-page-btn--active" : ""}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="crh-page-btn"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        <div className="crh-hint">
          <Info size={15} />
          수리, 점검, 부품 교체 이력을 모두 확인할 수 있습니다.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────
   메인 컴포넌트
───────────────────────────────── */
/* 백엔드 ApplianceStatus ENUM → UI 표시 문자열 매핑 */
const STATUS_MAP = {
  NORMAL: "정상",
  SOLD: "주의",
  NEED_REPAIR: "점검 필요",
};

/* categoryId로 카테고리명 유도 */
function getCategoryName(categoryId) {
  for (const parent of Object.values(CATEGORIES)) {
    if (parent.sub[categoryId]) return parent.sub[categoryId];
  }
  return "기타";
}

/* purchaseDate(YYYY-MM-DD)로 사용 기간 계산 */
function calcUsagePeriod(purchaseDate) {
  if (!purchaseDate) return null;
  const start = new Date(purchaseDate);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years === 0) return `${months}개월`;
  if (months === 0) return `${years}년`;
  return `${years}년 ${months}개월`;
}

/* 백엔드 응답 → UI 데이터 변환 */
function mapAppliance(a) {
  return {
    id: a.applianceId,
    name: getCategoryName(a.categoryId),
    brand: a.brand,
    model: a.modelName,
    serialNumber: a.serialNumber,
    purchaseDate: a.purchaseDate,
    warrantyExpiry: a.warrantyEndDate,
    status: STATUS_MAP[a.status] ?? a.status,
    usagePeriod: calcUsagePeriod(a.purchaseDate),
    // score: —,       // 백엔드 미제공, 추후 연결
    // certified: —,   // 백엔드 미제공, 추후 연결
    // repairCount: —, // 백엔드 미제공, 추후 연결
  };
}

export default function CustomerAppliances() {
  const [activeTab, setActiveTab] = useState("전체");
  const [showRegister, setShowRegister] = useState(false);
  const [selectedAppliance, setSelectedAppliance] = useState(null);
  const [appliances, setAppliances] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    getMyAppliances()
      .then((res) => setAppliances(res.data.map(mapAppliance)))
      .catch((err) => console.error("가전 목록 조회 실패:", err));
  }, []);

  useEffect(() => {
    if (searchParams.get("register") === "true") {
      setShowRegister(true);
      setSearchParams({}, { replace: true });
    }
    const applianceId = searchParams.get("applianceId");
    if (applianceId) {
      const found = appliances.find((a) => a.id === Number(applianceId));
      if (found) setSelectedAppliance(found);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  {
    /** 가전 삭제 */
  }
  const handleDelete = async (applianceId) => {
    try {
      await deleteAppliances(applianceId);

      setAppliances((prev) => prev.filter((a) => a.id !== applianceId));

      setDeleteTarget(null);

      alert("가전제품이 삭제되었습니다.");
    } catch (error) {
      console.error("삭제 실패: " + error);
      alert("삭제에 실패했습니다.");
    }
  };

  function handleUpdate(updated) {
    setAppliances((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a)),
    );
    setSelectedAppliance(updated);
  }

  const TABS = TAB_KEYS.map((key) => ({
    key,
    label: key,
    count:
      key === "전체"
        ? appliances.length
        : appliances.filter((a) => a.status === key).length,
  }));

  const filtered =
    activeTab === "전체"
      ? appliances
      : appliances.filter((a) => a.status === activeTab);

  /* ── 수리 이력 상세 화면 ── */
  if (selectedAppliance) {
    return (
      <DetailView
        appliance={selectedAppliance}
        onBack={() => setSelectedAppliance(null)}
        onUpdate={handleUpdate}
      />
    );
  }

  return (
    <div className="ca-wrap">
      {deleteTarget && (
        <DeleteConfirmModal
          appliance={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {showRegister && (
        <ApplianceRegisterFlow
          onClose={() => setShowRegister(false)}
          onCreated={() =>
            getMyAppliances().then((res) => setAppliances(res.data.map(mapAppliance)))
          }
        />
      )}

      {!showRegister && (
        <div className="ca-body">
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
                    <ApplianceIcon name={a.name} size={80} radius={12} />
                    <div className="ca-card__badges">
                      {/* 인증은 추후에 다시 연결 */}
                      {/* {a.certified && (
                        <span className="ca-cert-badge">
                          careflow
                          <br />
                          인증
                        </span>
                      )} */}
                      <span
                        className={`ca-status-badge ca-status-badge--${STATUS_COLOR[a.status]}`}
                      >
                        {a.status === "정상"
                          ? "😊"
                          : a.status === "주의"
                            ? "⚠️"
                            : "🔴"}{" "}
                        {a.status}
                      </span>
                    </div>
                  </div>
                  <p className="ca-card__name">{a.name}</p>
                  <p className="ca-card__brand">{a.brand}</p>
                  <p className="ca-card__model">{a.model}</p>
                  {a.usagePeriod && (
                    <p className="ca-card__period">
                      사용 기간 · {a.usagePeriod}
                    </p>
                  )}
                  {/* <div className="ca-score-row">
                    <span className="ca-score-num">{a.score}점</span>
                    <div className="ca-score-bar">
                      <div
                        className="ca-score-bar__fill"
                        style={{
                          width: `${a.score}%`,
                          background: SCORE_COLOR[a.status],
                        }}
                      />
                    </div>
                  </div> */}
                  {/* 백엔드 미제공 */}
                  <div className="ca-card__actions">
                    <button
                      className="ca-btn-detail"
                      onClick={() => setSelectedAppliance(a)}
                    >
                      상세 및 이력 보기
                    </button>
                    <button className="ca-btn-check">
                      <CalendarCheck size={13} /> A/S 예약
                    </button>
                  </div>
                  <button
                    className="ca-btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(a);
                    }}
                    title="가전 삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {/* 가전 등록 카드 */}
              <div
                className="ca-card ca-card--add"
                onClick={() => setShowRegister(true)}
              >
                <div className="ca-add-icon">
                  <Plus size={28} strokeWidth={1.5} />
                </div>
                <p className="ca-add-label">가전 등록하기</p>
                <p className="ca-add-sub">새로운 가전을 등록하고 관리하세요.</p>
              </div>
            </div>

            {/* 하단 배너 */}
            {/* <div className="ca-banner">
            <div className="ca-banner__text">
              <p>새로운 가전을 등록하고</p>
              <p><strong>더 스마트한 관리를 시작해보세요!</strong></p>
            </div>
            <button className="ca-banner__btn" onClick={() => setShowRegister(true)}>+ 가전 등록하기</button>
          </div> */}
          </div>

          {/* ══ 우측 사이드바 ══ */}
          <aside className="ca-sidebar">
            <div className="ca-side-card">
              <p className="ca-side-card__title">가전 현황</p>
              <div className="ca-stat-list">
                <div className="ca-stat-row">
                  <span className="ca-stat-icon ca-stat-icon--gray">📦</span>
                  <span className="ca-stat-label">전체 가전</span>
                  <span className="ca-stat-value">{appliances.length} 대</span>
                </div>
                <div className="ca-stat-row">
                  <span className="ca-stat-icon ca-stat-icon--green">
                    <ShieldCheck size={14} />
                  </span>
                  <span className="ca-stat-label">정상</span>
                  <span className="ca-stat-value ca-stat-value--green">
                    {appliances.filter((a) => a.status === "정상").length} 대
                  </span>
                </div>
                <div className="ca-stat-row">
                  <span className="ca-stat-icon ca-stat-icon--orange">
                    <AlertTriangle size={14} />
                  </span>
                  <span className="ca-stat-label">주의</span>
                  <span className="ca-stat-value ca-stat-value--orange">
                    {appliances.filter((a) => a.status === "주의").length} 대
                  </span>
                </div>
                <div className="ca-stat-row">
                  <span className="ca-stat-icon ca-stat-icon--red">🔴</span>
                  <span className="ca-stat-label">점검 필요</span>
                  <span className="ca-stat-value ca-stat-value--red">
                    {appliances.filter((a) => a.status === "점검 필요").length}{" "}
                    대
                  </span>
                </div>
              </div>
            </div>

            {/* 평균 건강지수 — score 백엔드 미제공, 추후 연결
            <div className="ca-side-card ca-health-summary">
              <p className="ca-side-card__title">평균 건강지수</p>
              <div className="ca-health-gauge">
                ...
              </div>
            </div>
            */}

            {/* CareFlow 인증 현황 — certified 백엔드 미제공, 추후 연결
            <div className="ca-side-card">
              <p className="ca-side-card__title">CareFlow 인증 현황</p>
              ...
            </div>
            */}
          </aside>
        </div>
      )}
    </div>
  );
}
