import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Wrench,
  PlusCircle,
  FileText,
  Shield,
  ShieldCheck,
  X,
  CalendarCheck,
  Download,
  WashingMachine,
  Bell,
  HandCoins,
  Hand,
  Calendar,
  Settings,
  Clock,
} from "lucide-react";
import "../../styles/Customer/CustomerHome.css";
import ApplianceIcon from "./ApplianceIcon";
import { getMyAppliances, getHealthCertificate } from "../../apis/appliances";
import { getUserInfo } from "../../apis/auth";
import { getMyAS } from "../../apis/as";

const mockAlerts = [
  {
    id: 1,
    Icon: Bell,
    iconBg: "#fff7e6",
    iconColor: "#f59e0b",
    text: "냉장고 필터 교체 주기가 도래했습니다.",
    tag: "소모품 교체",
    tagColor: "#f59e0b",
    tagBg: "#fff7e6",
    appliance: "냉장고",
    dday: 3,
  },
  {
    id: 2,
    Icon: Shield,
    iconBg: "#f0edff",
    iconColor: "#734bcf",
    text: "무상 A/S 기간이 7일 후 종료됩니다.",
    tag: "무상 A/S",
    tagColor: "#734bcf",
    tagBg: "#f0edff",
    appliance: "세탁기",
    dday: 7,
  },
  {
    id: 3,
    Icon: CalendarCheck,
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
    text: "A/S 방문이 2일 후 예정되어 있습니다.",
    tag: "A/S 예약",
    tagColor: "#3b82f6",
    tagBg: "#eff6ff",
    appliance: "에어컨",
    dday: 2,
  },
];

function buildDiagModal(certData) {
  const { cert, applianceId, applianceName, applianceBrand, serialNumber } =
    certData;
  return {
    certId: cert.certId,
    applianceId,
    applianceName,
    applianceBrand,
    serialNumber,
    grade: cert.grade,
    score: cert.score,
    isCertified: cert.isCertified,
    issuedAt: cert.issuedAt,
    updatedAt: cert.updatedAt,
    scoreItems: [
      {
        label: "수리 횟수",
        score: cert.repairCountScore,
        max: 25,
        condition: cert.repairCountCondition,
        icon: <Wrench size={15} />,
      },
      {
        label: "사용 기간",
        score: cert.usagePeriodScore,
        max: 25,
        condition: cert.usagePeriodCondition,
        icon: <Calendar size={15} />,
      },
      {
        label: "교체 부품 중요도",
        score: cert.partImportanceScore,
        max: 25,
        condition: cert.partImportanceCondition,
        icon: <Settings size={15} />,
      },
      {
        label: "최근 수리 일시",
        score: cert.lastRepairedScore,
        max: 25,
        condition: cert.lastRepairedCondition,
        icon: <Clock size={15} />,
      },
    ],
  };
}

const QUICK_MENU = [
  { label: "A/S 신청", Icon: Wrench, path: "/customer/as?reserve=true" },
  {
    label: "가전 등록",
    Icon: PlusCircle,
    path: "/customer/appliances?register=true",
  },
  { label: "진단서 내역", Icon: FileText, path: "/customer/appliances" },
  { label: "정산 / 결제", Icon: HandCoins, path: "/customer/payment" },
];

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

/* ── 원형 게이지 ── */
function ScoreGauge({
  score,
  size = 160,
  strokeWidth = 12,
  color = "#7c5cf7",
  grade,
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const cx = size / 2,
    cy = size / 2;
  return (
    <div className="ch-gauge" style={{ width: size, height: size }}>
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
      <div className="ch-gauge__inner">
        <span className="ch-gauge__num" style={{ color }}>
          {score}
          <span className="ch-gauge__pt">점</span>
        </span>
        {grade && (
          <span className="ch-gauge__grade" style={{ color }}>
            {grade}등급
          </span>
        )}
      </div>
    </div>
  );
}

/* ── 진단서 상세 모달 ── */
function DiagnosticModal({ diag, onClose }) {
  if (!diag) return null;
  const navigate = useNavigate();
  const gm = GRADE_META[diag.grade] || GRADE_META.E;
  function fmt(dt) {
    return dt ? dt.replace("T", " ").slice(0, 16) : "—";
  }

  function handleDownload() {
    if (!diag.isCertified) return;
    const printWindow = window.open("", "_blank", "width=800,height=900");

    // Lucide 스타일 SVG 아이콘 (stroke 2px, round linecap)
    const iconHouse = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#734bcf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/></svg>`;
    const iconWrench = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#734bcf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
    const iconCalendar = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#734bcf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const iconSettings = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#734bcf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    const iconClock = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#734bcf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

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
        <p class="sub">${diag.applianceBrand} ${diag.applianceName ?? ""}</p>
        <div class="grade-box">${diag.grade}등급 · ${diag.score}점</div>
        <table>
          <thead><tr><th>항목</th><th>점수</th><th>상태</th></tr></thead>
          <tbody>${scoreRows}</tbody>
        </table>
        <table>
          <thead><tr><th colspan="2">진단서 정보</th></tr></thead>
          <tbody>
            <tr><td>대상 가전</td><td>${diag.applianceBrand ?? "—"}</td></tr>
            <tr><td>시리얼 넘버</td><td>${diag.serialNumber ?? "—"}</td></tr>
            <tr><td>최초 발급일</td><td>${fmt(diag.issuedAt)}</td></tr>
            <tr><td>최근 갱신일</td><td>${fmt(diag.updatedAt)}</td></tr>
          </tbody>
        </table>
        <p class="footer">본 진단서는 CareFlow에서 자동 발급된 문서입니다.</p>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="ch-modal-overlay" onClick={onClose}>
      <div className="ch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ch-modal__header">
          <div className="ch-modal__header-left">
            <FileText size={18} color="#7c5cf7" />
            <div>
              <p className="ch-modal__sup">제품 건강 진단서 #{diag.certId}</p>
              <h2 className="ch-modal__title">{diag.applianceBrand}</h2>
            </div>
          </div>
          <button className="ch-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="ch-modal__hero">
          <div className="ch-modal__hero-gauge">
            <ScoreGauge
              score={diag.score}
              size={110}
              strokeWidth={9}
              color="#7c5cf7"
            />
          </div>
          <div className="ch-modal__hero-info">
            <div
              className="ch-modal__grade-badge"
              style={{ color: gm.color, background: gm.bg }}
            >
              {diag.grade}등급 · {GRADE_DESC[diag.grade]}
            </div>
            <div className="ch-modal__score-row">
              <span className="ch-modal__score-big">{diag.score}</span>
              <span className="ch-modal__score-denom">/100점</span>
            </div>
            {diag.isCertified ? (
              <div className="ch-modal__cert ch-modal__cert--yes">
                <ShieldCheck size={13} /> CareFlow 인증 완료
              </div>
            ) : (
              <div className="ch-modal__cert ch-modal__cert--no">
                <Shield size={13} /> 미인증
                <span className="ch-modal__cert-hint">
                  B등급·75점↑ 달성 시 자동 부여
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="ch-modal__section">
          <h3 className="ch-modal__section-title">산정 항목별 점수</h3>
          <p className="ch-modal__section-sub">
            4개 항목 각 25점 만점 · 총 100점 환산
          </p>
          <div className="ch-modal__score-items">
            {diag.scoreItems.map((item, i) => {
              const pct = (item.score / item.max) * 100;
              const barColor =
                pct >= 80
                  ? "#16a34a"
                  : pct >= 60
                    ? "#2563eb"
                    : pct >= 32
                      ? "#d97706"
                      : "#dc2626";
              return (
                <div key={i} className="ch-modal__score-item">
                  <div className="ch-modal__score-item-head">
                    <span className="ch-modal__score-item-icon">
                      {item.icon}
                    </span>
                    <span className="ch-modal__score-item-label">
                      <span className="ch-modal__score-item-num">0{i + 1}</span>
                      {item.label}
                    </span>
                    <span
                      className="ch-modal__score-item-pts"
                      style={{ color: barColor }}
                    >
                      {item.score}
                      <span>/{item.max}</span>
                    </span>
                  </div>
                  <div className="ch-modal__score-bar-wrap">
                    <div className="ch-modal__score-bar">
                      <div
                        className="ch-modal__score-bar-fill"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                    <span className="ch-modal__score-condition">
                      {item.condition}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ch-modal__section ch-modal__section--grade-legend">
          <h3 className="ch-modal__section-title">등급 기준</h3>
          <div className="ch-modal__grade-row">
            {Object.entries(GRADE_META).map(([g, meta]) => (
              <div
                key={g}
                className={`ch-modal__grade-cell${diag.grade === g ? " ch-modal__grade-cell--active" : ""}`}
                style={
                  diag.grade === g
                    ? { background: meta.bg, borderColor: meta.color }
                    : {}
                }
              >
                <span
                  className="ch-modal__grade-cell-g"
                  style={{ color: diag.grade === g ? meta.color : "#aaa" }}
                >
                  {g}
                </span>
                <span className="ch-modal__grade-cell-desc">
                  {g === "A"
                    ? "90점↑"
                    : g === "B"
                      ? "75~89"
                      : g === "C"
                        ? "60~74"
                        : g === "D"
                          ? "40~59"
                          : "39↓"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ch-modal__section">
          <h3 className="ch-modal__section-title">발급 정보</h3>
          <table className="ch-modal__table">
            <tbody>
              <tr>
                <td>대상 가전</td>
                <td>{diag.applianceBrand}</td>
              </tr>
              <tr>
                <td>시리얼 넘버</td>
                <td>{diag.serialNumber ?? "—"}</td>
              </tr>
              <tr>
                <td>CareFlow 인증</td>
                <td>
                  {diag.isCertified ? (
                    <span style={{ color: "#16a34a", fontWeight: 700 }}>
                      ✓ 인증
                    </span>
                  ) : (
                    <span style={{ color: "#aaa" }}>미인증</span>
                  )}
                </td>
              </tr>
              <tr>
                <td>최초 발급일</td>
                <td>{fmt(diag.issuedAt)}</td>
              </tr>
              <tr>
                <td>최근 갱신일</td>
                <td>{fmt(diag.updatedAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ch-modal__footer">
          {!diag.isCertified && (
            <p className="ch-modal__footer-note">
              CareFlow 인증(B등급 이상) 제품만 다운로드할 수 있어요.
            </p>
          )}
          <button
            className="ch-modal__footer-btn ch-modal__footer-btn--outline"
            onClick={onClose}
          >
            닫기
          </button>
          <button
            className="ch-modal__footer-btn ch-modal__footer-btn--download"
            onClick={handleDownload}
            disabled={!diag.isCertified}
            title={
              !diag.isCertified
                ? "CareFlow 인증(B등급 이상)을 받은 제품만 다운로드할 수 있어요."
                : undefined
            }
          >
            <Download size={14} /> 진단서 다운로드
          </button>
          <button
            className="ch-modal__footer-btn ch-modal__footer-btn--primary"
            onClick={() => {
              onClose();
              navigate(`/customer/appliances?applianceId=${diag.applianceId}`);
            }}
          >
            <CalendarCheck size={14} /> A/S 이력 보기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 메인 ── */
const STATUS_MAP = { NORMAL: "정상", SOLD: "주의", NEED_REPAIR: "점검 필요" };
const STATUS_COLOR = { 정상: "green", 주의: "orange", "점검 필요": "red" };

function getCategoryName(categoryId) {
  const CATS = {
    11: "냉장고",
    12: "전기밥솥",
    13: "인덕션",
    14: "오븐",
    15: "식기세척기",
    21: "세탁기",
    22: "건조기",
    23: "에어컨",
    24: "공기청정기",
    25: "선풍기",
    26: "청소기",
    31: "TV",
    32: "빔프로젝터",
    41: "사운드바",
    42: "헤드폰",
    43: "스피커",
  };
  return CATS[categoryId] ?? "기타";
}

export default function CustomerHome() {
  const [modalDiag, setModalDiag] = useState(null);
  const [appliances, setAppliances] = useState([]);
  const [latestCert, setLatestCert] = useState(null);
  const [asSchedules, setAsSchedules] = useState([]);
  const [warrantySchedules, setWarrantySchedules] = useState([]);
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    getMyAppliances()
      .then(async (res) => {
        const raw = res.data ?? res;
        setAppliances(
          raw.map((a) => ({
            id: a.applianceId,
            name: getCategoryName(a.categoryId),
            brand: `${a.brand} ${a.modelName}`,
            status: STATUS_MAP[a.status] ?? a.status,
          })),
        );

        /* 보증기간 만료 일정 */
        const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const warrantyItems = raw
          .filter(
            (a) => a.warrantyEndDate && new Date(a.warrantyEndDate) >= today,
          )
          .map((a) => {
            const dt = new Date(a.warrantyEndDate);
            return {
              month: `${dt.getMonth() + 1}월`,
              date: String(dt.getDate()).padStart(2, "0"),
              day: WEEKDAYS[dt.getDay()],
              title: `${a.brand} ${a.modelName} 보증기간 만료`,
              sub: `만료일 ${a.warrantyEndDate.replace(/-/g, ".")}`,
              type: "warranty",
              _date: dt,
            };
          });
        setWarrantySchedules(warrantyItems);

        const results = await Promise.all(
          raw.map((a) =>
            getHealthCertificate(a.applianceId)
              .then((r) => ({
                cert: r.data,
                applianceId: a.applianceId,
                applianceName: getCategoryName(a.categoryId),
                applianceBrand: `${a.brand} ${a.modelName}`,
                serialNumber: a.serialNumber,
              }))
              .catch(() => null),
          ),
        );

        const valid = results.filter(Boolean);

        if (valid.length > 0) {
          setLatestCert(
            valid.sort(
              (a, b) => new Date(b.cert.updatedAt) - new Date(a.cert.updatedAt),
            )[0],
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getUserInfo()
      .then((res) => {
        const data = res.data ?? res;
        setUserName(data.name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
    const EXCLUDED = ["CANCELLED", "PAID"];
    getMyAS()
      .then((res) => {
        const list = res.data ?? [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const items = list
          .filter(
            (item) => item.scheduledDate && !EXCLUDED.includes(item.status),
          )
          .filter((item) => new Date(item.scheduledDate) >= today)
          .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
          .slice(0, 5)
          .map((item) => {
            const dt = new Date(item.scheduledDate);
            return {
              month: `${dt.getMonth() + 1}월`,
              date: String(dt.getDate()).padStart(2, "0"),
              day: WEEKDAYS[dt.getDay()],
              title: `${item.brand} ${item.modelName} A/S 방문`,
              sub: `예정일 ${item.scheduledDate?.replace(/-/g, ".")}`,
              type: "as",
              _date: dt,
            };
          });
        setAsSchedules(items);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="ch-wrap">
      <DiagnosticModal diag={modalDiag} onClose={() => setModalDiag(null)} />

      {/* 0. 인사말 + 통계 */}
      <div className="ch-hero">
        <div className="ch-hero__left">
          <div className="ch-hero__text">
            <h1 className="ch-hero__title">
              안녕하세요, {userName} 고객님!{" "}
              <Hand className="ch-hero__greeting-icon" size={26} />
            </h1>
            <p className="ch-hero__sub">
              CareFlow가 우리집 가전의 건강을 관리해드릴게요.
            </p>
          </div>
          <div className="ch-hero__stats">
            {[
              {
                Icon: WashingMachine,
                color: "purple",
                num: String(appliances.length),
                unit: "대",
                label: "등록된 가전",
                sub: "전체 가전 수",
                path: "/customer/appliances",
              },
              {
                Icon: Wrench,
                color: "green",
                num: "1",
                unit: "건",
                label: "진행 중 A/S",
                sub: "접수된 A/S 건",
                path: "/customer/as",
              },
              {
                Icon: Bell,
                color: "orange",
                num: "3",
                unit: "건",
                label: "확인 필요 알림",
                sub: "새로운 알림",
                path: "/customer/notice",
              },
            ].map(({ Icon, color, num, unit, label, sub, path }) => (
              <div
                key={label}
                className="ch-hero__stat"
                onClick={() => navigate(path)}
              >
                <div
                  className={`ch-hero__stat-icon ch-hero__stat-icon--${color}`}
                >
                  <Icon size={22} />
                </div>
                <div className="ch-hero__stat-body">
                  <p className="ch-hero__stat-num">
                    {num}
                    <span>{unit}</span>
                  </p>
                  <p className="ch-hero__stat-label">{label}</p>
                  <p className="ch-hero__stat-sub">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="ch-hero__illust" aria-hidden="true">
          <img
            src="/src/assets/main.png"
            alt=""
            className="ch-hero__illust-img"
          />
        </div>
      </div>

      {/* 1. 진단서 카드 */}
      {latestCert && (
        <div className="ch-diag-card">
          <div className="ch-diag-card__left">
            <div className="ch-diag-card__title-row">
              <span className="ch-diag-card__title">제품 건강 진단서</span>
              <span className="ch-new-badge">NEW</span>
            </div>
            <p className="ch-diag-card__sub">
              최근 A/S 결과를 분석하여 발급된 진단서입니다.
            </p>

            <div className="ch-diag-card__product">
              <div className="ch-diag-card__product-icon">
                <ApplianceIcon
                  name={latestCert.applianceName}
                  size={72}
                  radius={8}
                />
              </div>
              <div className="ch-diag-card__product-info">
                <p className="ch-diag-card__product-name">
                  {latestCert.applianceBrand} ({latestCert.applianceName})
                </p>
                <p className="ch-diag-card__product-date">
                  최근 진단일{" "}
                  {latestCert.cert.updatedAt
                    ? latestCert.cert.updatedAt.slice(0, 10).replace(/-/g, ".")
                    : "—"}
                </p>
                <div className="ch-diag-card__badges">
                  {latestCert.cert.isCertified && (
                    <span className="ch-badge ch-badge--cert">
                      <ShieldCheck size={11} /> CareFlow 인증
                    </span>
                  )}
                  {latestCert.cert.isCertified && (
                    <span className="ch-badge ch-badge--market">
                      중고거래 활용 가능
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              className="ch-diag-card__btn"
              onClick={() => setModalDiag(buildDiagModal(latestCert))}
            >
              진단서 보기 &gt;
            </button>
          </div>

          <div className="ch-diag-card__right">
            <ScoreGauge
              score={latestCert.cert.score}
              size={160}
              strokeWidth={14}
              color="#7c5cf7"
              grade={latestCert.cert.grade}
            />
            <div className="ch-grade-legend">
              {[
                { g: "A", r: "90~100" },
                { g: "B", r: "70~89" },
                { g: "C", r: "50~69" },
                { g: "D", r: "0~49" },
              ].map(({ g, r }) => (
                <span
                  key={g}
                  className={`ch-grade-pill${g === latestCert.cert.grade ? " ch-grade-pill--active" : ""}`}
                >
                  {g} ({r})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. 중요 알림 */}
      <section className="ch-alerts-section">
        <div className="ch-section__header">
          <h2>
            중요 알림 <span className="ch-alert-count">3</span>
          </h2>
          <button
            className="ch-link-btn"
            onClick={() => navigate("/customer/notice")}
          >
            전체 보기 <ChevronRight size={14} />
          </button>
        </div>
        <div className="ch-alerts-list">
          {mockAlerts.map((a) => (
            <div key={a.id} className="ch-alert-item">
              <div
                className="ch-alert-item__icon"
                style={{ background: a.iconBg, color: a.iconColor }}
              >
                <a.Icon size={16} />
              </div>
              <span className="ch-alert-item__text">{a.text}</span>
              <span
                className="ch-alert-tag"
                style={{ background: a.tagBg, color: a.tagColor }}
              >
                {a.tag}
              </span>
              <span className="ch-alert-appliance">{a.appliance}</span>
              <span className="ch-alert-dday">D-{a.dday}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 내 가전 상태 */}
      <section className="ch-appliance-section">
        <div className="ch-section__header">
          <h2>내 가전 상태</h2>
          <button
            className="ch-link-btn"
            onClick={() => navigate("/customer/appliances")}
          >
            전체 보기 <ChevronRight size={14} />
          </button>
        </div>
        {appliances.length === 0 ? (
          <div className="ch-appliance-empty">
            <div className="ch-appliance-empty__left">
              <WashingMachine size={36} className="ch-appliance-empty__icon" />
              <div>
                <p className="ch-appliance-empty__title">
                  아직 등록된 가전이 없어요
                </p>
                <p className="ch-appliance-empty__sub">
                  가전을 등록하면 상태와 A/S 이력을 한눈에 확인할 수 있어요.
                </p>
              </div>
            </div>
            <button
              className="ch-appliance-empty__btn"
              onClick={() => navigate("/customer/appliances?register=true")}
            >
              <PlusCircle size={14} /> 가전 등록하기
            </button>
          </div>
        ) : (
          <div className="ch-appliance-body">
            <table className="ch-appliance-table">
              <thead>
                <tr>
                  <th>제품</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {appliances.slice(0, 3).map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="ch-appliance-table__product">
                        <ApplianceIcon name={a.name} size={32} radius={6} />
                        <div>
                          <p className="ch-appliance-table__name">{a.name}</p>
                          <p className="ch-appliance-table__brand">{a.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`ch-status-badge ch-status-badge--${STATUS_COLOR[a.status] ?? "green"}`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ch-distribution">
              <p className="ch-distribution__title">가전 상태 분포</p>
              {(() => {
                const total = appliances.length || 1;
                const counts = { 정상: 0, 주의: 0, "점검 필요": 0 };
                appliances.forEach((a) => {
                  if (counts[a.status] !== undefined) counts[a.status]++;
                });
                return [
                  { label: "정상", count: counts["정상"], color: "#22c55e" },
                  { label: "주의", count: counts["주의"], color: "#f59e0b" },
                  {
                    label: "점검 필요",
                    count: counts["점검 필요"],
                    color: "#ef4444",
                  },
                ].map((d) => (
                  <div key={d.label} className="ch-dist-item">
                    <span className="ch-dist-label">{d.label}</span>
                    <div className="ch-dist-bar-wrap">
                      <div
                        className="ch-dist-bar"
                        style={{
                          width: `${Math.round((d.count / total) * 100)}%`,
                          background: d.color,
                        }}
                      />
                    </div>
                    <span className="ch-dist-count">{d.count}대</span>
                  </div>
                ));
              })()}
              <p className="ch-distribution__total">총 {appliances.length}대</p>
            </div>
          </div>
        )}
      </section>

      {/* 5. 예정된 일정 + 빠른 메뉴 */}
      <div className="ch-bottom">
        <div className="ch-schedule">
          <div className="ch-section__header">
            <h2>예정된 일정</h2>
            <button className="ch-link-btn">
              전체 보기 <ChevronRight size={14} />
            </button>
          </div>
          <div className="ch-schedule__list">
            {(() => {
              const schedules = [...asSchedules, ...warrantySchedules]
                .sort((a, b) => a._date - b._date)
                .slice(0, 3);
              return schedules.length === 0 ? (
                <p className="ch-schedule__empty">예정된 일정이 없습니다.</p>
              ) : (
                schedules.map((s, i) => (
                  <div key={i} className="ch-schedule__item">
                    <div className="ch-schedule__date">
                      <span className="ch-schedule__month">{s.month}</span>
                      <span className="ch-schedule__day-num">{s.date}</span>
                      <span className="ch-schedule__day">{s.day}</span>
                    </div>
                    <div className="ch-schedule__info">
                      <p className="ch-schedule__title">{s.title}</p>
                      <p className="ch-schedule__sub">{s.sub}</p>
                    </div>
                    <span
                      className={`ch-tag ${s.type === "warranty" ? "ch-tag--orange" : "ch-tag--blue"}`}
                    >
                      {s.type === "warranty" ? "보증만료" : "A/S 예정"}
                    </span>
                  </div>
                ))
              );
            })()}
          </div>
        </div>

        <div className="ch-quick">
          <h2>빠른 메뉴</h2>
          <div className="ch-quick__grid">
            {QUICK_MENU.map(({ label, Icon, path }) => (
              <button
                key={label}
                className="ch-quick-btn"
                onClick={() => navigate(path)}
              >
                <span className="ch-quick-btn__icon">
                  <Icon size={22} />
                </span>
                <span className="ch-quick-btn__label">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
