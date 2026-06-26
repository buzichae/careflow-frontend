import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, Wrench, PlusCircle,
  MapPin, Star, FileText, Shield, ShieldCheck, X, CalendarCheck, Download,
  WashingMachine, Bell, FileCheck
} from "lucide-react";
import "../../styles/Customer/CustomerHome.css";
import ApplianceIcon from "./ApplianceIcon";

/* ── 목 데이터 ── */
const mockAppliances = [
  { id: 1, name: "냉장고", brand: "LG 디오스 냉장고",   model: "M870SN75",      score: 95, status: "양호", statusColor: "green"  },
  { id: 2, name: "세탁기", brand: "삼성 그랑데 세탁기", model: "WF21A9500KV",   score: 72, status: "주의", statusColor: "orange" },
  { id: 3, name: "에어컨", brand: "LG 휘센 에어컨",     model: "FQ17H9DWA1",    score: 88, status: "양호", statusColor: "green"  },
  { id: 4, name: "TV",     brand: "삼성 QLED TV",        model: "KQ65QC67AFXKR", score: 90, status: "양호", statusColor: "green"  },
];

const mockSchedules = [
  { date: "18", month: "6월", day: "수", title: "세탁기 필터 교체",         sub: "예정일 2024.06.18", tag: "예정", tagColor: "blue" },
  { date: "25", month: "6월", day: "화", title: "냉장고 보증기간 만료 예정", sub: "예정일 2024.06.25", tag: "알림", tagColor: "red"  },
];

const mockNextVisit = {
  dDay: 3, title: "세탁기 A/S", engineer: "김민준 기사",
  rating: 4.9, date: "2024.06.21 (금)", time: "오전 10:00 ~ 12:00", status: "예약 확정",
};

const mockUnreadNotices = [
  { id: 1, icon: "🔑", iconBg: "#fff7e6", iconColor: "#f59e0b", title: "냉장고 필터 교체 주기가 도래했습니다.",  tag: "소모품 교체", tagColor: "#f59e0b", tagBg: "#fff7e6", time: "방금 전"  },
  { id: 2, icon: "🛡",  iconBg: "#f0edff", iconColor: "#734bcf", title: "무상 A/S 기간이 7일 후 종료됩니다.",      tag: "무상 A/S",   tagColor: "#734bcf", tagBg: "#f0edff", time: "1시간 전" },
  { id: 3, icon: "💬", iconBg: "#eff6ff", iconColor: "#3b82f6", title: "A/S 진행 단계가 변경되었습니다.",         tag: "A/S 단계",   tagColor: "#3b82f6", tagBg: "#eff6ff", time: "2시간 전" },
];

/*
  제품 건강 진단서 목 데이터 (DB 스키마 기준)
  - grade: A~E 등급
  - score: 4개 항목 각 25점 만점 환산 총점(0~100)
  - scoreItems: 항목별 획득 점수 + 조건 레이블
    ① 수리 횟수       ② 사용 기간
    ③ 교체 부품 중요도  ④ 최근 수리 완료 일시
  - isCertified: B등급(75점)↑ 자동 부여
  null이면 최근 발급 진단서 없음
*/
const mockDiagnostic = {
  certId: 1,
  applianceId: 1,
  applianceName: "냉장고",
  applianceBrand: "LG 디오스 냉장고",
  purchaseDate: "2022-06-15",
  grade: "B",
  score: 75,
  scoreItems: [
    { label: "수리 횟수",        score: 20, max: 25, condition: "1회",              icon: "🔧" },
    { label: "사용 기간",        score: 20, max: 25, condition: "1년 이상 ~ 3년 미만", icon: "📅" },
    { label: "교체 부품 중요도", score: 20, max: 25, condition: "MINOR 부품만 교체",  icon: "⚙️" },
    { label: "최근 수리 일시",   score: 15, max: 25, condition: "1년 이상 ~ 2년 미만", icon: "🕐" },
  ],
  repairCount: 1,
  partsImportance: "MINOR",
  lastRepairedAt: "2022-12-15 14:30:00",
  isCertified: true,
  issuedAt: "2023-01-10 16:00:00",
  updatedAt: "2023-01-10 16:00:00",
};
// const mockDiagnostic = null; // null로 바꾸면 진단서 없음 레이아웃 확인

/* ── 등급 색상 ── */
const GRADE_META = {
  A: { color: "#16a34a", bg: "#dcfce7", label: "A등급" },
  B: { color: "#2563eb", bg: "#dbeafe", label: "B등급" },
  C: { color: "#d97706", bg: "#fef9c3", label: "C등급" },
  D: { color: "#ea580c", bg: "#ffedd5", label: "D등급" },
  E: { color: "#dc2626", bg: "#fee2e2", label: "E등급" },
};

/* ── 원형 점수 게이지 ── */
function ScoreGauge({ score, size = 100, strokeWidth = 8, color = "#fff" }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const cx = size / 2, cy = size / 2;
  return (
    <div className="ch-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}33`} strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div className="ch-gauge__inner">
        <span className="ch-gauge__num" style={{ color }}>{score}</span>
        <span className="ch-gauge__denom" style={{ color: `${color}aa` }}>/100</span>
      </div>
    </div>
  );
}

/* ── 홈 배너 (간략) ── */
function DiagnosticBanner({ diag, onDetail }) {
  // const gm = GRADE_META[diag.grade] || GRADE_META.E;
  return (
    <div className="ch-diag-banner">
      <div className="ch-diag-banner__content">
        <div className="ch-diag-banner__badge">
          <span className="ch-diag-banner__new">NEW</span>
          제품 건강 진단서
        </div>
        <h3 className="ch-diag-banner__title">
          새로운 진단서가<br />발급되었습니다
        </h3>
        <p className="ch-diag-banner__appliance">
          {diag.applianceBrand} ({diag.applianceName})
        </p>
        <p className="ch-diag-banner__desc">
          A/S 완료 후 수리 보고서를 바탕으로<br />제품의 상태를 종합 진단했어요.
        </p>
        <button className="ch-diag-banner__btn" onClick={onDetail}>
          <FileText size={14} /> 진단서 확인하기 →
        </button>
      </div>
      <div className="ch-diag-banner__visual">
        <ScoreGauge score={diag.score} size={100} strokeWidth={8} color="#fff" />
        <div className="ch-diag-banner__grade-badge">
          {diag.grade}등급
          {diag.isCertified && <ShieldCheck size={12} style={{ marginLeft: 4 }} />}
        </div>
      </div>
    </div>
  );
}

/* 등급별 설명 */
const GRADE_DESC = { A: "최상 상태", B: "양호", C: "보통", D: "주의 필요", E: "불량" };

/* ── 진단서 상세 모달 ── */
function DiagnosticModal({ diag, onClose }) {
  if (!diag) return null;
  const gm = GRADE_META[diag.grade] || GRADE_META.E;

  function fmt(dt) {
    if (!dt) return "—";
    return dt.replace("T", " ").slice(0, 16);
  }

  return (
    <div className="ch-modal-overlay" onClick={onClose}>
      <div className="ch-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── 헤더 ── */}
        <div className="ch-modal__header">
          <div className="ch-modal__header-left">
            <FileText size={18} color="#7c5cf7" />
            <div>
              <p className="ch-modal__sup">제품 건강 진단서 #{diag.certId}</p>
              <h2 className="ch-modal__title">{diag.applianceBrand}</h2>
            </div>
          </div>
          <button className="ch-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* ── 히어로: 등급 + 점수 + 인증 ── */}
        <div className="ch-modal__hero">
          <div className="ch-modal__hero-gauge">
            <ScoreGauge score={diag.score} size={110} strokeWidth={9} color="#7c5cf7" />
          </div>
          <div className="ch-modal__hero-info">
            <div className="ch-modal__grade-badge" style={{ color: gm.color, background: gm.bg }}>
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
                <span className="ch-modal__cert-hint">B등급·75점↑ 달성 시 자동 부여</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 항목별 점수 ── */}
        <div className="ch-modal__section">
          <h3 className="ch-modal__section-title">산정 항목별 점수</h3>
          <p className="ch-modal__section-sub">4개 항목 각 25점 만점 · 총 100점 환산</p>
          <div className="ch-modal__score-items">
            {diag.scoreItems.map((item, i) => {
              const pct = (item.score / item.max) * 100;
              const barColor = pct >= 80 ? "#16a34a" : pct >= 60 ? "#2563eb" : pct >= 32 ? "#d97706" : "#dc2626";
              return (
                <div key={i} className="ch-modal__score-item">
                  <div className="ch-modal__score-item-head">
                    <span className="ch-modal__score-item-icon">{item.icon}</span>
                    <span className="ch-modal__score-item-label">
                      <span className="ch-modal__score-item-num">0{i + 1}</span>
                      {item.label}
                    </span>
                    <span className="ch-modal__score-item-pts" style={{ color: barColor }}>
                      {item.score}<span>/{item.max}</span>
                    </span>
                  </div>
                  <div className="ch-modal__score-bar-wrap">
                    <div className="ch-modal__score-bar">
                      <div
                        className="ch-modal__score-bar-fill"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                    <span className="ch-modal__score-condition">{item.condition}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 등급 기준 범례 ── */}
        <div className="ch-modal__section ch-modal__section--grade-legend">
          <h3 className="ch-modal__section-title">등급 기준</h3>
          <div className="ch-modal__grade-row">
            {Object.entries(GRADE_META).map(([g, meta]) => (
              <div
                key={g}
                className={`ch-modal__grade-cell${diag.grade === g ? " ch-modal__grade-cell--active" : ""}`}
                style={diag.grade === g ? { background: meta.bg, borderColor: meta.color } : {}}
              >
                <span className="ch-modal__grade-cell-g" style={{ color: diag.grade === g ? meta.color : "#aaa" }}>{g}</span>
                <span className="ch-modal__grade-cell-desc">
                  {g === "A" ? "90점↑" : g === "B" ? "75~89" : g === "C" ? "60~74" : g === "D" ? "40~59" : "39↓"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 발급 정보 ── */}
        <div className="ch-modal__section">
          <h3 className="ch-modal__section-title">발급 정보</h3>
          <table className="ch-modal__table">
            <tbody>
              <tr><td>대상 가전</td><td>{diag.applianceBrand}</td></tr>
              <tr>
                <td>CareFlow 인증</td>
                <td>{diag.isCertified
                  ? <span style={{ color: "#16a34a", fontWeight: 700 }}>✓ 인증</span>
                  : <span style={{ color: "#aaa" }}>미인증</span>}
                </td>
              </tr>
              <tr><td>최초 발급일</td><td>{fmt(diag.issuedAt)}</td></tr>
              <tr><td>최근 갱신일</td><td>{fmt(diag.updatedAt)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* ── 푸터 ── */}
        <div className="ch-modal__footer">
          <button className="ch-modal__footer-btn ch-modal__footer-btn--outline" onClick={onClose}>닫기</button>
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

/* stat 목록 */
const STATS_WITH_DIAG = [
  { icon: <WashingMachine />, color: "gray",   num: "7 대", label: "보유 가전",       sub: "등록된 가전 수" },
  { icon: <FileCheck />, color: "purple", num: "1 건", label: "진단서 발급 완료", sub: "최근 진단서"    },
  { icon: <Wrench />, color: "orange", num: "1 건", label: "A/S 진행 중",     sub: "진행 중인 A/S"  },
  { icon: <Bell />, color: "red",    num: "3 건", label: "알림",             sub: "확인 필요"      },
];
const STATS_NO_DIAG = [
  { icon: "📦", color: "gray",   num: "7 대", label: "보유 가전",   sub: "등록된 가전 수" },
  { icon: "🔨", color: "orange", num: "1 건", label: "A/S 진행 중", sub: "진행 중인 A/S"  },
  { icon: "🔔", color: "red",    num: "3 건", label: "알림",         sub: "확인 필요"      },
];

export default function CustomerHome() {
  const [modalDiag, setModalDiag] = useState(null);
  const navigate = useNavigate();

  const diagnostic = mockDiagnostic;
  const stats = diagnostic ? STATS_WITH_DIAG : STATS_NO_DIAG;

  return (
    <div className="ch-wrap">
      {/* 진단서 상세 모달 */}
      <DiagnosticModal diag={modalDiag} onClose={() => setModalDiag(null)} />

      <div className="ch-main">

          {/* ── 상단: 진단서 + 통계 ── */}
          {diagnostic ? (
            <section className="ch-summary ch-summary--has-diag">
              <DiagnosticBanner diag={diagnostic} onDetail={() => setModalDiag(diagnostic)} />
              <div className="ch-stat-cards--2x2">
                {stats.map((s) => (
                  <div key={s.label} className="ch-stat">
                    <div className={`ch-stat__icon ch-stat__icon--${s.color}`}>{s.icon}</div>
                    <p className="ch-stat__num">{s.num}</p>
                    <p className="ch-stat__label">{s.label}<br />{s.sub}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            /* 진단서 없음: 건강지수 카드 + stat 카드 가로 나열 */
            <section className="ch-summary ch-summary--no-diag">
              <div className="ch-health-card">
                <div className="ch-health-card__left">
                  <p className="ch-health-card__label">우리집 가전 건강지수</p>
                  <div className="ch-health-card__score">
                    <span className="ch-health-card__num">89</span>
                    <span className="ch-health-card__denom">/100</span>
                  </div>
                  <span className="ch-health-badge">😊 매우 양호</span>
                </div>
                <div className="ch-health-card__icon">
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                    <circle cx="28" cy="28" r="22" stroke="rgba(255,255,255,0.3)" strokeWidth="5"/>
                    <circle cx="28" cy="28" r="22" stroke="#fff" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - 0.89)}`}
                      strokeLinecap="round" transform="rotate(-90 28 28)"/>
                    <text x="28" y="33" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800">89</text>
                  </svg>
                </div>
              </div>
              {stats.map((s) => (
                <div key={s.label} className="ch-stat">
                  <div className={`ch-stat__icon ch-stat__icon--${s.color}`}>{s.icon}</div>
                  <p className="ch-stat__num">{s.num}</p>
                  <p className="ch-stat__label">{s.label}<br />{s.sub}</p>
                </div>
              ))}
            </section>
          )}

          {/* ── 방문 일정 + 읽지 않은 알림 ── */}
          <div className="ch-info-row">
            <div className="ch-visit-card">
              <div className="ch-visit-card__top">
                <span className="ch-visit-dday">D-{mockNextVisit.dDay}</span>
                <span className="ch-visit-status">{mockNextVisit.status}</span>
              </div>
              <p className="ch-visit-title">{mockNextVisit.title}</p>
              <div className="ch-visit-detail"><MapPin size={12} /><span>{mockNextVisit.date}</span></div>
              <div className="ch-visit-detail"><span style={{ width: 12 }} /><span>{mockNextVisit.time}</span></div>
              <div className="ch-visit-engineer">
                <div className="ch-visit-engineer__avatar">김</div>
                <div>
                  <p className="ch-visit-engineer__name">{mockNextVisit.engineer}</p>
                  <p className="ch-visit-engineer__rating">
                    <Star size={11} fill="#f59e0b" color="#f59e0b" /> {mockNextVisit.rating} · 방문 확정
                  </p>
                </div>
              </div>
              <div className="ch-visit-actions">
                <button className="ch-visit-btn ch-visit-btn--outline">일정 변경</button>
                <button className="ch-visit-btn ch-visit-btn--primary">상세 보기</button>
              </div>
            </div>

            <div className="ch-unread-card">
              <div className="ch-section__header">
                <h2>읽지 않은 알림 <span className="ch-unread-count">3</span></h2>
                <button className="ch-link-btn" onClick={() => navigate("/customer/notice")}>전체 보기 <ChevronRight size={14} /></button>
              </div>
              <div className="ch-unread-list">
                {mockUnreadNotices.map((n) => (
                  <div key={n.id} className="ch-unread-item">
                    <div className="ch-unread-item__icon" style={{ background: n.iconBg, color: n.iconColor }}>{n.icon}</div>
                    <div className="ch-unread-item__info">
                      <p className="ch-unread-item__title">{n.title}</p>
                      <div className="ch-unread-item__meta">
                        <span className="ch-unread-tag" style={{ background: n.tagBg, color: n.tagColor }}>{n.tag}</span>
                        <span className="ch-unread-time">{n.time}</span>
                      </div>
                    </div>
                    <div className="ch-unread-dot" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 내 가전 관리 ── */}
          <section className="ch-section">
            <div className="ch-section__header">
              <h2>내 가전 관리</h2>
              <button className="ch-link-btn" onClick={() => navigate("/customer/appliances")}>전체 보기 <ChevronRight size={14} /></button>
            </div>
            <div className="ch-appliances">
              {mockAppliances.map((a) => (
                <div key={a.id} className="ch-appliance-card">
                  <div className="ch-appliance-card__top">
                    <ApplianceIcon name={a.name} size={64} radius={10} />
                    <span className={`ch-status-badge ch-status-badge--${a.statusColor}`}>{a.status}</span>
                  </div>
                  <p className="ch-appliance-card__name">{a.name}</p>
                  <p className="ch-appliance-card__brand">{a.brand}</p>
                  <p className="ch-appliance-card__model">{a.model}</p>
                  <div className="ch-score-row">
                    <span>{a.score}점</span>
                    <div className="ch-score-bar">
                      <div className="ch-score-bar__fill" style={{ width: `${a.score}%`, background: a.statusColor === "orange" ? "#f59e0b" : "#734bcf" }} />
                    </div>
                  </div>
                  <button className="ch-card-btn" onClick={() => navigate(`/customer/appliances?applianceId=${a.id}`)}>상세 및 이력 보기 &gt;</button>
                </div>
              ))}
            </div>
          </section>

          {/* ── 빠른 메뉴 + 이번 달 일정 ── */}
          <div className="ch-bottom">
            <div className="ch-quick">
              <h2>빠른 메뉴</h2>
              <div className="ch-quick__list">
                <button className="ch-quick-item" onClick={() => navigate("/customer/as?reserve=true")}>
                  <span className="ch-quick-item__icon ch-quick-item__icon--purple"><Wrench size={15} /></span>
                  <span className="ch-quick-item__label">A/S 신청</span>
                  <ChevronRight size={13} className="ch-quick-item__arrow" />
                </button>
                <button className="ch-quick-item" onClick={() => navigate("/customer/appliances?register=true")}>
                  <span className="ch-quick-item__icon ch-quick-item__icon--blue"><PlusCircle size={15} /></span>
                  <span className="ch-quick-item__label">가전 등록</span>
                  <ChevronRight size={13} className="ch-quick-item__arrow" />
                </button>
                {/* <button className="ch-quick-item">
                  <span className="ch-quick-item__icon ch-quick-item__icon--green"><MessageCircle size={15} /></span>
                  <span className="ch-quick-item__label">1:1 문의</span>
                  <ChevronRight size={13} className="ch-quick-item__arrow" />
                </button> */}
              </div>
            </div>

            <div className="ch-schedule">
              <div className="ch-section__header">
                <h2>이번 달 일정</h2>
                <button className="ch-link-btn">전체 보기 <ChevronRight size={14} /></button>
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
                    <span className={`ch-tag ch-tag--${s.tagColor}`}>{s.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 하단 배너 ── */}
          <div className="ch-banner">
            <div className="ch-banner__text">
              <p>새로운 가전을 등록하고</p>
              <p><strong>더 스마트한 관리를 시작해보세요!</strong></p>
            </div>
            <button className="ch-banner__btn" onClick={() => navigate("/customer/appliances?register=true")}>+ 가전 등록하기</button>
          </div>
      </div>
    </div>
  );
}
