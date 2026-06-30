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
} from "lucide-react";
import "../../styles/Customer/CustomerHome.css";
import ApplianceIcon from "./ApplianceIcon";
import { getMyAppliances } from "../../apis/appliances";
import { getUserInfo } from "../../apis/auth";

/* ── 목 데이터 ── */
const mockAppliances = [
  {
    id: 1,
    name: "냉장고",
    brand: "LG 디오스 냉장고",
    score: 95,
    status: "양호",
    statusColor: "green",
  },
  {
    id: 2,
    name: "세탁기",
    brand: "삼성 그랑데 세탁기",
    score: 72,
    status: "주의",
    statusColor: "orange",
  },
  {
    id: 3,
    name: "에어컨",
    brand: "LG 휘센 에어컨",
    score: 88,
    status: "양호",
    statusColor: "green",
  },
  {
    id: 4,
    name: "TV",
    brand: "삼성 QLED TV",
    score: 90,
    status: "양호",
    statusColor: "green",
  },
];

const mockAlerts = [
  {
    id: 1,
    icon: "🔔",
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
    icon: "🛡",
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
    icon: "📅",
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

const mockSchedules = [
  {
    date: "18",
    month: "6월",
    day: "수",
    title: "세탁기 필터 교체",
    sub: "예정일 2024.06.18",
  },
  {
    date: "25",
    month: "6월",
    day: "화",
    title: "냉장고 보증기간 만료 예정",
    sub: "예정일 2024.06.25",
  },
  {
    date: "02",
    month: "7월",
    day: "화",
    title: "에어컨 정기 점검",
    sub: "예정일 2024.07.02",
  },
];

const mockDiagnostic = {
  certId: 1,
  applianceId: 1,
  applianceName: "냉장고",
  applianceBrand: "LG 디오스 냉장고",
  purchaseDate: "2022-06-15",
  grade: "B",
  score: 75,
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
  repairCount: 1,
  partsImportance: "MINOR",
  lastRepairedAt: "2022-12-15 14:30:00",
  isCertified: true,
  issuedAt: "2023-01-10 16:00:00",
  updatedAt: "2023-01-10 16:00:00",
};

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
  const gm = GRADE_META[diag.grade] || GRADE_META.E;
  function fmt(dt) {
    return dt ? dt.replace("T", " ").slice(0, 16) : "—";
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
          <button
            className="ch-modal__footer-btn ch-modal__footer-btn--outline"
            onClick={onClose}
          >
            닫기
          </button>
          <button className="ch-modal__footer-btn ch-modal__footer-btn--download">
            <Download size={14} /> 진단서 다운로드
          </button>
          <button className="ch-modal__footer-btn ch-modal__footer-btn--primary">
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
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    getMyAppliances()
      .then((res) => {
        const data = res.data ?? res;
        setAppliances(
          data.map((a) => ({
            id: a.applianceId,
            name: getCategoryName(a.categoryId),
            brand: `${a.brand} ${a.modelName}`,
            status: STATUS_MAP[a.status] ?? a.status,
          })),
        );
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
  });

  return (
    <div className="ch-wrap">
      <DiagnosticModal diag={modalDiag} onClose={() => setModalDiag(null)} />

      {/* 0. 인사말 + 통계 */}
      <div className="ch-hero">
        <div className="ch-hero__left">
          <div className="ch-hero__text">
            <h1 className="ch-hero__title">안녕하세요, {userName}님! 👋</h1>
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
              <ApplianceIcon name="냉장고" size={72} radius={8} />
            </div>
            <div className="ch-diag-card__product-info">
              <p className="ch-diag-card__product-name">
                LG 디오스 냉장고 (냉장고)
              </p>
              <p className="ch-diag-card__product-date">
                최근 진단일 2024.06.18
              </p>
              <div className="ch-diag-card__badges">
                <span className="ch-badge ch-badge--cert">
                  <ShieldCheck size={11} /> CareFlow 인증
                </span>
                <span className="ch-badge ch-badge--market">
                  중고거래 활용 가능
                </span>
              </div>
            </div>
          </div>

          <button
            className="ch-diag-card__btn"
            onClick={() => setModalDiag(mockDiagnostic)}
          >
            진단서 보기 &gt;
          </button>
        </div>

        <div className="ch-diag-card__right">
          <ScoreGauge
            score={75}
            size={160}
            strokeWidth={14}
            color="#7c5cf7"
            grade="B"
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
                className={`ch-grade-pill${g === "B" ? " ch-grade-pill--active" : ""}`}
              >
                {g} ({r})
              </span>
            ))}
          </div>
        </div>
      </div>

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
                {a.icon}
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
        <div className="ch-appliance-body">
          <table className="ch-appliance-table">
            <thead>
              <tr>
                <th>제품</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {appliances.slice(0, 5).map((a) => (
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
            {mockSchedules.map((s, i) => (
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
                <span className="ch-tag ch-tag--blue">예정</span>
              </div>
            ))}
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
