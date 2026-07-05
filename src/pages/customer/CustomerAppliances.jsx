import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  CalendarCheck,
  AlertTriangle,
  ShieldCheck,
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
  Calendar,
  Settings,
  Clock,
} from "lucide-react";
import "../../styles/Customer/CustomerAppliances.css";
import "../../styles/Customer/CustomerRepairHistory.css";
import ApplianceIcon from "./ApplianceIcon";
import ReportModal from "./ReportModal";

import {
  getMyAppliances,
  deleteAppliances,
  createAppliance,
  updateAppliance,
  getMyDetailAppliance,
  getHealthCertificate,
} from "../../apis/appliances";
import { getReport } from "../../apis/as";

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
};

function isFormValid(form) {
  return (
    form.categoryParent &&
    form.categorySub &&
    form.brand.trim() &&
    form.modelName.trim() &&
    form.serialNumber.trim() &&
    form.purchaseDate &&
    form.warrantyExpiry
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

  const previewName = form.categorySub
    ? getCategoryName(Number(form.categorySub))
    : "기타";

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
            {/* 왼쪽: 카테고리 아이콘 미리보기 */}
            <div className="car-input-image-col">
              <p className="car-input-section-label">아이콘 미리보기</p>
              <div className="car-icon-preview">
                <ApplianceIcon name={previewName} size={100} radius={18} />
                <p className="car-icon-preview__label">
                  {form.categorySub
                    ? getCategoryName(Number(form.categorySub))
                    : "카테고리를 선택하면\n아이콘이 표시됩니다"}
                </p>
              </div>
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
              <ApplianceIcon name={previewName} size={88} radius={16} />
              <p className="car-confirm-preview-name">{form.modelName}</p>
              <p className="car-confirm-preview-model">{form.serialNumber}</p>
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
          <div className="car-complete-icon">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <h2 className="car-step-title">가전 등록이 완료되었어요!</h2>
          <p className="car-step-sub">새로운 가전이 목록에 추가되었습니다.</p>

          <div className="car-complete-card">
            <div
              className="car-confirm-preview"
              style={{ alignItems: "center" }}
            >
              <ApplianceIcon name={previewName} size={88} radius={16} />
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

/* TABS 카운트는 메인 컴포넌트에서 appliances 기반으로 동적 계산 */
const TAB_KEYS = ["전체", "정상", "주의", "점검 필요"];

const STATUS_COLOR = { 정상: "green", 주의: "orange", "점검 필요": "red" };
const SCORE_COLOR = {
  정상: "#734bcf",
  주의: "#f59e0b",
  "점검 필요": "#ef4444",
};

// const avgScore = Math.round(ALL_APPLIANCES.reduce((s, a) => s + a.score, 0) / ALL_APPLIANCES.length);

function mapCertToView(cert) {
  return {
    certId: cert.certId,
    grade: cert.grade,
    score: cert.score,
    isCertified: cert.isCertified,
    issuedAt: cert.issuedAt
      ? cert.issuedAt.slice(0, 10).replace(/-/g, ".")
      : "—",
    updatedAt: cert.updatedAt
      ? cert.updatedAt.slice(0, 10).replace(/-/g, ".")
      : "—",
    scoreItems: [
      {
        label: "수리 횟수",
        score: cert.repairCountScore,
        max: 25,
        condition: cert.repairCountCondition,
        icon: <Wrench size={13} />,
      },
      {
        label: "사용 기간",
        score: cert.usagePeriodScore,
        max: 25,
        condition: cert.usagePeriodCondition,
        icon: <Calendar size={13} />,
      },
      {
        label: "교체 부품 중요도",
        score: cert.partImportanceScore,
        max: 25,
        condition: cert.partImportanceCondition,
        icon: <Settings size={13} />,
      },
      {
        label: "최근 수리 일시",
        score: cert.lastRepairedScore,
        max: 25,
        condition: cert.lastRepairedCondition,
        icon: <Clock size={13} />,
      },
    ],
  };
}

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
function DiagPanel({ diag, appliance }) {
  function handleDownload() {
    if (!diag.isCertified) return;
    const gm = GRADE_META[diag.grade] || GRADE_META.E;
    const printWindow = window.open("", "_blank", "width=800,height=900");

    const iconWrench = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#734bcf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
    const iconCalendar = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#734bcf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const iconSettings = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#734bcf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    const iconClock = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#734bcf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const iconHouse = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#734bcf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/></svg>`;
    const SCORE_ICONS = [iconWrench, iconCalendar, iconSettings, iconClock];

    const scoreRows = diag.scoreItems
      .map(
        (item, i) => `
      <tr>
        <td><span class="row-icon">${SCORE_ICONS[i]}</span>${item.label}</td>
        <td>${item.score} / ${item.max}</td>
        <td>${item.condition ?? "—"}</td>
      </tr>`,
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>제품 건강 진단서 #${diag.certId}</title>
        <style>
          body { font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; padding: 40px; color: #1a1a2e; }
          h1 { font-size: 22px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
          .sub { color: #888; font-size: 13px; margin-bottom: 24px; margin-left: 30px; }
          .grade-box { display: inline-block; background: ${gm.bg}; color: ${gm.color}; border-radius: 8px; padding: 8px 20px; font-size: 28px; font-weight: 900; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f5f5fb; text-align: left; padding: 8px 12px; font-size: 13px; color: #555; }
          td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; vertical-align: middle; }
          .row-icon { display: inline-flex; align-items: center; margin-right: 6px; vertical-align: middle; }
          .footer { margin-top: 32px; font-size: 12px; color: #aaa; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${iconHouse} 제품 건강 진단서 <span style="color:#888;font-size:14px;font-weight:400">#${diag.certId}</span></h1>
        <p class="sub">${appliance?.brand ?? ""} ${appliance?.name ?? ""}</p>
        <div class="grade-box">${diag.grade}등급 · ${diag.score}점</div>
        <table>
          <thead><tr><th>항목</th><th>점수</th><th>상태</th></tr></thead>
          <tbody>${scoreRows}</tbody>
        </table>
        <table>
          <thead><tr><th colspan="2">진단서 정보</th></tr></thead>
          <tbody>
            <tr><td>제품명</td><td>${appliance?.name ?? "—"}</td></tr>
            <tr><td>시리얼 번호</td><td>${appliance?.serialNumber ?? "—"}</td></tr>
            <tr><td>최초 발급일</td><td>${diag.issuedAt}</td></tr>
            <tr><td>최근 갱신일</td><td>${diag.updatedAt}</td></tr>
          </tbody>
        </table>
        <p class="footer">본 진단서는 CareFlow에서 자동 발급된 문서입니다.</p>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

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
          <button
            className="crh-diag-dl-btn"
            onClick={handleDownload}
            disabled={!diag.isCertified}
            title={
              !diag.isCertified
                ? "CareFlow 인증(B등급 이상)을 받은 제품만 다운로드할 수 있어요."
                : undefined
            }
          >
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
                B등급·75점↑ 달성 시 자동 부여 · 인증 제품만 다운로드 가능
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
    brand: appliance.brand ?? "",
    model: appliance.model ?? "",
    serialNumber: appliance.serialNumber ?? "",
    purchaseDate: appliance.purchaseDate ?? "",
    warrantyExpiry: appliance.warrantyExpiry ?? "",
    // status: appliance.status,
  });
  const [saving, setSaving] = useState(false);

  function handleChange(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  /* 가전 정보 수정 저장 — 백엔드 PUT /api/appliances/{id} 연동
     프론트 UI 필드(model, warrantyExpiry) ↔ 백엔드 필드(modelName, warrantyEndDate) 매핑 필요 */
  async function handleSave() {
    setSaving(true);
    try {
      const res = await updateAppliance(appliance.id, {
        brand: form.brand,
        modelName: form.model,
        serialNumber: form.serialNumber,
        purchaseDate: form.purchaseDate,
        warrantyEndDate: form.warrantyExpiry,
      });
      const updated = res.data;
      onSave({
        ...appliance,
        brand: updated.brand,
        model: updated.modelName,
        serialNumber: updated.serialNumber,
        purchaseDate: updated.purchaseDate,
        warrantyExpiry: updated.warrantyEndDate,
      });
    } catch (error) {
      alert(error.response?.data?.message || "가전 정보 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
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
          <div className="car-field">
            <label>시리얼넘버</label>
            <input
              value={form.serialNumber}
              onChange={(e) => handleChange("serialNumber", e.target.value)}
            />
          </div>
          <div className="car-field">
            <label>구매일자</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => handleChange("purchaseDate", e.target.value)}
            />
          </div>
          <div className="car-field">
            <label>보증 만료일</label>
            <input
              type="date"
              value={form.warrantyExpiry}
              onChange={(e) => handleChange("warrantyExpiry", e.target.value)}
            />
          </div>
          {/* <div className="car-field car-field--full">
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
          </div> */}
        </div>
        <div className="ca-modal__footer">
          <button className="ca-btn-secondary" onClick={onClose}>
            취소
          </button>
          <button
            className="ca-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장하기"}
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
  const [repairs, setRepairs] = useState([]);
  const [diag, setDiag] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const PER_PAGE = 5;

  async function handleReportView(repair) {
    try {
      const res = await getReport(repair.reportId);
      setReportTarget({
        item: { appliance: `${appliance.brand} ${appliance.model}` },
        report: res.data,
      });
    } catch (error) {
      alert(error.response?.data?.message || "보고서를 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    getMyDetailAppliance(appliance.id)
      .then((res) => setRepairs(res.data))
      .catch((err) => console.error("수리 이력 조회 실패:", err));
  }, [appliance.id]);

  useEffect(() => {
    getHealthCertificate(appliance.id)
      .then((res) => setDiag(mapCertToView(res.data)))
      .catch(() => setDiag(null));
  }, [appliance.id]);

  const totalPages = Math.ceil(repairs.length / PER_PAGE);
  const pageRepairs = repairs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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

      {reportTarget && (
        <ReportModal
          item={reportTarget.item}
          report={reportTarget.report}
          onClose={() => setReportTarget(null)}
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
                { label: "시리얼 번호", value: appliance.serialNumber ?? "—" },
                { label: "구매일", value: appliance.purchaseDate ?? "—" },
                {
                  label: "보증 만료일",
                  value: appliance.warrantyExpiry ?? "—",
                  highlight: true,
                },
                { label: "사용 기간", value: appliance.usagePeriod ?? "—" },
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

          <DiagPanel diag={diag} appliance={appliance} />
        </div>

        {/* 요약 + 부품 가로 바 */}
        <div className="crh-meta-bar">
          <div className="crh-meta-bar__section">
            <div className="crh-meta-bar__head">
              <Wrench size={13} color="#734bcf" />
              <span>수리 요약</span>
            </div>
            <div className="crh-meta-bar__stats">
              {(() => {
                const freeCount = repairs.filter(
                  (r) => !r.finalAmount || r.finalAmount === 0,
                ).length;
                const paidCount = repairs.length - freeCount;
                const totalCost = repairs.reduce(
                  (s, r) => s + (r.finalAmount ?? 0),
                  0,
                );
                const firstDate =
                  repairs.length > 0
                    ? repairs[repairs.length - 1].submittedAt?.slice(0, 10)
                    : "—";
                return [
                  { label: "총 수리", value: `${repairs.length}건` },
                  { label: "무상", value: `${freeCount}건` },
                  { label: "유상", value: `${paidCount}건` },
                  {
                    label: "총 비용",
                    value: totalCost.toLocaleString() + "원",
                    accent: true,
                  },
                  { label: "최초 수리일", value: firstDate },
                ];
              })().map((s) => (
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

          {/* 주요 부품 교체 이력 — 백엔드 미제공, 추후 연결
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
                  <span className={`crh-meta-part__count ${p.count > 0 ? "crh-meta-part__count--active" : ""}`}>
                    {p.count}회
                  </span>
                </div>
              ))}
            </div>
          </div>
          */}
        </div>

        {/* 수리 이력 */}
        <div className="crh-section-head">
          <span className="crh-section-title">수리 이력</span>
          <span className="crh-section-count">총 {repairs.length}건</span>
        </div>

        <div className="crh-repair-list">
          {repairs.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 13, padding: "16px 0" }}>
              수리 이력이 없습니다.
            </p>
          ) : (
            pageRepairs.map((r) => {
              const isFree = !r.finalAmount || r.finalAmount === 0;
              const type = isFree ? "무상" : "유상";
              return (
                <div key={r.reportId} className="crh-repair-card">
                  <div className="crh-repair-card__meta">
                    <span className="crh-repair-card__date">
                      {r.submittedAt ? r.submittedAt.slice(0, 10) : "—"}
                    </span>
                    <span
                      className={`crh-type-badge crh-type-badge--${isFree ? "blue" : "orange"}`}
                    >
                      {type}
                    </span>
                    <span className="crh-repair-card__engineer">
                      {r.engineerName ?? "—"}
                    </span>
                    <span className="crh-repair-card__cost">
                      {r.finalAmount != null
                        ? r.finalAmount.toLocaleString() + "원"
                        : "—"}
                    </span>
                    <button
                      className="crh-repair-card__report-btn"
                      onClick={() => handleReportView(r)}
                      disabled={!r.reportId}
                    >
                      <FileText size={12} /> 수리 보고서 보기
                    </button>
                  </div>

                  <div className="crh-repair-card__symptom-row">
                    <span className="crh-repair-card__symptom-label">증상</span>
                    <span className="crh-repair-card__symptom">
                      {r.symptomName ?? "—"}
                    </span>
                  </div>

                  <div className="crh-repair-card__content">
                    <div className="crh-repair-card__box">
                      <p className="crh-repair-card__box-label">진단 내용</p>
                      <p className="crh-repair-card__box-text">
                        {r.diagnosisResult ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
  const navigate = useNavigate();

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
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const applianceId = searchParams.get("applianceId");
    if (!applianceId || appliances.length === 0) return;
    const found = appliances.find((a) => a.id === Number(applianceId));
    if (found) {
      setSelectedAppliance(found);
      setSearchParams({}, { replace: true });
    }
  }, [appliances, searchParams, setSearchParams]);

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
            getMyAppliances().then((res) =>
              setAppliances(res.data.map(mapAppliance)),
            )
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
            </div>

            {/* 가전 그리드 */}
            <div className="ca-grid">
              {appliances.length === 0 && (
                <div className="ca-empty">
                  <div className="ca-empty__left">
                    <ApplianceIcon name="" size={56} radius={14} />
                    <div className="ca-empty__text">
                      <p className="ca-empty__title">
                        아직 등록된 가전이 없어요
                      </p>
                      <p className="ca-empty__sub">
                        가전을 등록하면 상태, 수리 이력, 건강 진단서를
                        <br />
                        한눈에 관리할 수 있어요.
                      </p>
                    </div>
                  </div>
                  <div className="ca-empty__right">
                    <span className="ca-empty__arrow">↓</span>
                    <span className="ca-empty__hint">
                      아래 카드를 눌러 시작해보세요
                    </span>
                  </div>
                </div>
              )}
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
                    <button
                      className="ca-btn-check"
                      onClick={() => navigate("/customer/as?reserve=true")}
                    >
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
                  <span className="ca-stat-icon ca-stat-icon--gray">
                    <Package size={14} />
                  </span>
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
