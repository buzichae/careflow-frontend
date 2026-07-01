import { useState, useEffect } from "react";
import engineerImg from "../../assets/기사.png";
import {
  ClipboardList, CheckCircle, Users, HandCoins, Star,
  UserPlus, Megaphone, ChartNoAxesCombined,
} from "lucide-react";
import "../../styles/Agency/AgencyDashboard.css";

const BASE_URL = "http://localhost:8080";

// 공통 fetch 헬퍼 (JWT 자동 첨부)
async function apiFetch(path) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ── 상태 매핑 ──────────────────────────────
const STATUS_MAP = {
  PENDING:           { label: "접수 대기", type: "received" },
  AGENCY_RECEIVED:   { label: "접수",     type: "received" },
  ASSIGNED:          { label: "배정 완료", type: "assigned" },
  ACCEPTED:          { label: "수락 완료", type: "visiting" },
  ENGINEER_DEPARTED: { label: "출발",     type: "visiting" },
  ENGINEER_ARRIVED:  { label: "도착",     type: "working"  },
  IN_PROGRESS:       { label: "수리 중",  type: "working"  },
  COMPLETED:         { label: "완료",     type: "completed"},
  PAID:              { label: "결제 완료", type: "completed"},
  CANCELLED:         { label: "취소",     type: "waiting"  },
};

const SKILL_MAP = {
  BEGINNER:     "초급",
  INTERMEDIATE: "중급",
  EXPERT:       "고급",   // API 명세 기준 EXPERT
};

const noticeData = [
  { id: 1, text: "6월 정산 일정 안내",       date: "2024.06.01" },
  { id: 2, text: "여름철 에어컨 점검 가이드", date: "2024.05.28" },
  { id: 3, text: "서비스 품질 향상 캠페인",   date: "2024.05.20" },
];

function EngineerAvatar({ name, profileImageUrl }) {
  return (
    <div className="engineer-avatar">
      {profileImageUrl
        ? <img src={profileImageUrl} alt={name} />
        : <span>{name?.charAt(0) ?? "?"}</span>}
    </div>
  );
}

export default function AgencyDashboard() {
  // ── state ──────────────────────────────────
  // 7. 대시보드 요약 통계
  const [summary, setSummary]           = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // 15. 우수 기사 TOP3
  const [topEngineers, setTopEngineers] = useState([]);
  const [topLoading, setTopLoading]     = useState(true);

  // 17. 월별 정산 합산
  const now = new Date();
  const [settlementYear]  = useState(now.getFullYear());
  const [settlementMonth] = useState(now.getMonth() + 1);
  const [settlement, setSettlement]     = useState(null);
  const [settlementLoading, setSettlementLoading] = useState(true);

  // 8. 진행 중 작업 목록 (COMPLETED 제외)
  const [workData, setWorkData]         = useState([]);
  const [workLoading, setWorkLoading]   = useState(true);

  // ── fetch ──────────────────────────────────
  useEffect(() => {
    // 7. 대시보드 요약 통계
    apiFetch("/api/agency/stats/summary")
      .then(setSummary)
      .catch(console.error)
      .finally(() => setSummaryLoading(false));

    // 15. 우수 기사 TOP3
    apiFetch("/api/agency/engineers/top3")
      .then(setTopEngineers)
      .catch(console.error)
      .finally(() => setTopLoading(false));

    // 17. 월별 정산 합산
    apiFetch(`/api/agency/settlements/summary?year=${settlementYear}&month=${settlementMonth}`)
      .then(setSettlement)
      .catch(console.error)
      .finally(() => setSettlementLoading(false));

    // 8. A/S 요청 목록 (진행 중 작업 현황용 - 최근 4건만 표시)
    apiFetch("/api/agency/work-requests")
      .then(data => setWorkData(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(console.error)
      .finally(() => setWorkLoading(false));
  }, [settlementYear, settlementMonth]);

  // ── 통계 카드 값 계산 ────────────────────────
  // API 응답: { totalCount, todayNewCount, todayAssignedCount, todayAcceptedCount, todayCancelledCount }
  const statsCards = {
    inProgress:  {
      value: summary?.todayAcceptedCount ?? "-",
      sub:   summary ? `전체 ${summary.totalCount}건` : "로딩 중...",
    },
    todayDone:   {
      // 완료 건수는 10번 API(stats)에 있으나, summary에는 없으므로 todayNewCount 표시
      value: summary?.todayNewCount ?? "-",
      sub:   summary ? `배정 대기 ${summary.todayAssignedCount}건` : "로딩 중...",
    },
    settlement:  {
      value: settlement ? settlement.totalEngineerPayout.toLocaleString() : "-",
      sub:   "기사 지급액 합계",
      up:    true,
    },
    satisfaction: { value: "4.7", sub: "지난달 대비 ▲ 0.2", up: true }, // 별도 API 없음
  };

  // ── 정산 카드 값 ────────────────────────────
  // API 응답: { year, month, totalCount, totalGrossAmount, totalPlatformFee, totalAgencyFee, totalEngineerPayout }
  const settlementValues = {
    totalAmount:     settlement?.totalGrossAmount     ?? 0,
    careflowFee:     settlement?.totalPlatformFee     ?? 0,
    agencyFee:       settlement?.totalAgencyFee       ?? 0,
    engineerPayout:  settlement?.totalEngineerPayout  ?? 0,
    totalCount:      settlement?.totalCount           ?? 0,
  };

  return (
    <div className="agency-dashboard">

      {/* 통계 카드 */}
      <div className="agency-stats">
        <div className="agency-stat-card">
          <div className="agency-stat-card__text">
            <p className="agency-stat-card__value">
              {summaryLoading ? "..." : statsCards.inProgress.value}<span>건</span>
            </p>
            <p className="agency-stat-card__label">오늘 기사 수락</p>
          </div>
          <div className="agency-stat-card__icon agency-stat-card__icon--blue">
            <ClipboardList size={40} strokeWidth={1} />
          </div>
        </div>

        <div className="agency-stat-card">
          <div className="agency-stat-card__text">
            <p className="agency-stat-card__value">
              {summaryLoading ? "..." : statsCards.todayDone.value}<span>건</span>
            </p>
            <p className="agency-stat-card__label">오늘 신규 접수</p>
          </div>
          <div className="agency-stat-card__icon agency-stat-card__icon--green">
            <CheckCircle size={40} strokeWidth={1} />
          </div>
        </div>

        <div className="agency-stat-card">
          <div className="agency-stat-card__text">
            <p className="agency-stat-card__value">
              {summaryLoading ? "..." : (summary?.todayCancelledCount ?? "-")}<span>건</span>
            </p>
            <p className="agency-stat-card__label">오늘 취소</p>
          </div>
          <div className="agency-stat-card__icon agency-stat-card__icon--purple">
            <Users size={40} strokeWidth={1} />
          </div>
        </div>

        <div className="agency-stat-card">
          <div className="agency-stat-card__text">
            <p className="agency-stat-card__value agency-stat-card__value--lg">
              {settlementLoading ? "..." : statsCards.settlement.value}<span>원</span>
            </p>
            <p className="agency-stat-card__label">이번 달 기사 지급액</p>
          </div>
          <div className="agency-stat-card__icon agency-stat-card__icon--blue2">
            <HandCoins size={40} strokeWidth={1} />
          </div>
        </div>

        <div className="agency-stat-card">
          <div className="agency-stat-card__text">
            <p className="agency-stat-card__value">{statsCards.satisfaction.value}<span>/5.0</span></p>
            <p className="agency-stat-card__label">평균 고객 만족도</p>
          </div>
          <div className="agency-stat-card__icon agency-stat-card__icon--amber">
            <Star size={40} strokeWidth={1} />
          </div>
        </div>
      </div>

      <div className="agency-dashboard__content">
        <div className="agency-dashboard__left">

          {/* 진행 중 작업 현황 */}
          <section className="work-section">
            <h2 className="section-title">진행 중 작업 현황</h2>
            <div className="work-funnel">
              <div className="work-funnel__step work-funnel__step--purple">
                <span className="work-funnel__label">접수</span>
                <span className="work-funnel__count">
                  {summaryLoading ? "..." : `${summary?.todayNewCount ?? 0}건`}
                </span>
              </div>
              <div className="work-funnel__arrow">›</div>
              <div className="work-funnel__step work-funnel__step--blue">
                <span className="work-funnel__label">배정</span>
                <span className="work-funnel__count">
                  {summaryLoading ? "..." : `${summary?.todayAssignedCount ?? 0}건`}
                </span>
              </div>
              <div className="work-funnel__arrow">›</div>
              <div className="work-funnel__step work-funnel__step--green">
                <span className="work-funnel__label">수락</span>
                <span className="work-funnel__count">
                  {summaryLoading ? "..." : `${summary?.todayAcceptedCount ?? 0}건`}
                </span>
              </div>
              <div className="work-funnel__arrow">›</div>
              <div className="work-funnel__step work-funnel__step--amber">
                <span className="work-funnel__label">취소</span>
                <span className="work-funnel__count">
                  {summaryLoading ? "..." : `${summary?.todayCancelledCount ?? 0}건`}
                </span>
              </div>
            </div>

            <div className="work-table">
              <div className="work-table__header">
                <span>작업 정보</span><span>고객</span><span>담당 기사</span><span>예약 시간</span><span>상태</span>
              </div>
              {workLoading ? (
                <p style={{ padding: "16px", color: "#aaa", fontSize: "13px" }}>로딩 중...</p>
              ) : workData.length === 0 ? (
                <p style={{ padding: "16px", color: "#aaa", fontSize: "13px" }}>진행 중인 작업이 없습니다.</p>
              ) : (
                workData.map((item) => {
                  const s = STATUS_MAP[item.status] ?? { label: item.status, type: "received" };
                  return (
                    <div key={item.requestId} className="work-table__row">
                      <div className="work-table__product">
                        <div className="work-table__emoji">🔧</div>
                        <div>
                          <p className="work-table__product-name">{item.symptomName}</p>
                          <p className="work-table__product-issue">{item.symptomDesc}</p>
                        </div>
                      </div>
                      <div className="work-table__customer">
                        <p>{item.customerName}</p>
                        <p className="work-table__phone">{item.customerPhone}</p>
                      </div>
                      <div className="work-table__engineer">
                        {item.visitRegionName}
                      </div>
                      <div className="work-table__date">
                        {item.scheduledDate} {item.scheduledTime}
                      </div>
                      <div><span className={`work-badge work-badge--${s.type}`}>{s.label}</span></div>
                    </div>
                  );
                })
              )}
              <button className="work-table__more">작업 목록 전체 보기 ›</button>
            </div>
          </section>

          <div className="agency-bottom">
            <div className="quick-menu">
              <h2 className="section-title">빠른 메뉴</h2>
              <div className="quick-menu__grid">
                <button className="quick-menu__item">
                  <UserPlus size={24} className="quick-menu__icon" /><span>기사 관리</span>
                </button>
                <button className="quick-menu__item">
                  <Megaphone size={24} className="quick-menu__icon" /><span>공지 확인</span>
                </button>
                <button className="quick-menu__item">
                  <HandCoins size={24} className="quick-menu__icon" /><span>정산 내역</span>
                </button>
                <button className="quick-menu__item">
                  <ChartNoAxesCombined size={24} className="quick-menu__icon" /><span>리포트 보기</span>
                </button>
              </div>
            </div>
            <div className="notice-section">
              <div className="notice-section__header">
                <h2 className="section-title" style={{ marginBottom: 0 }}>알림</h2>
                <button className="more-link">더보기 ›</button>
              </div>
              {noticeData.map((n) => (
                <div key={n.id} className="notice-item">
                  <div className="notice-item__dot" />
                  <span className="notice-item__text">{n.text}</span>
                  <span className="notice-item__date">{n.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cta-banner">
            <div className="cta-banner__text">
              <p className="cta-banner__title">더 많은 고객에게 신뢰받는 서비스를 함께 만들어가요!</p>
              <p className="cta-banner__sub">정확한 배정과 신속한 작업으로 고객 만족도를 높여주세요.</p>
            </div>
            <img src={engineerImg} alt="기사" className="cta-banner__img" />
            <button className="cta-banner__btn">작업 배정 요청하기 ›</button>
          </div>
        </div>

        <aside className="agency-dashboard__right">
          {/* 이번 달 실적 요약 - 17번 API 데이터 활용 */}
          <div className="perf-card">
            <div className="perf-card__header">
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                {settlementYear}년 {settlementMonth}월 정산 요약
              </h2>
              <button className="more-link">더보기 ›</button>
            </div>
            <div className="perf-card__body">
              <div className="donut">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#eeeaff" strokeWidth="10" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#5B4FF5" strokeWidth="10"
                    strokeDasharray={`${0.85 * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                    strokeDashoffset={2 * Math.PI * 38 * 0.25}
                    strokeLinecap="round" transform="rotate(-90 50 50)" />
                </svg>
                <div className="donut__label">
                  <span className="donut__pct">
                    {settlementLoading ? "..." : `${settlementValues.totalCount}건`}
                  </span>
                  <span className="donut__sub">정산 건수</span>
                </div>
              </div>
              <div className="perf-list">
                <div className="perf-list__item">
                  <span className="perf-list__dot perf-list__dot--gray" />
                  <span className="perf-list__label">총 매출액</span>
                  <span className="perf-list__val">
                    {settlementLoading ? "..." : `${settlementValues.totalAmount.toLocaleString()}원`}
                  </span>
                </div>
                <div className="perf-list__item">
                  <span className="perf-list__dot perf-list__dot--purple" />
                  <span className="perf-list__label">기사 지급액</span>
                  <span className="perf-list__val">
                    {settlementLoading ? "..." : `${settlementValues.engineerPayout.toLocaleString()}원`}
                  </span>
                </div>
                <div className="perf-list__item">
                  <span className="perf-list__dot perf-list__dot--amber" />
                  <span className="perf-list__label">플랫폼 수수료</span>
                  <span className="perf-list__val">
                    {settlementLoading ? "..." : `${settlementValues.careflowFee.toLocaleString()}원`}
                  </span>
                </div>
                <div className="perf-list__divider" />
                <div className="perf-list__item">
                  <span className="perf-list__label">대행사 수수료</span>
                  <span className="perf-list__val">
                    {settlementLoading ? "..." : `${settlementValues.agencyFee.toLocaleString()}원`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 우수 기사 TOP3 - 15번 API */}
          {/* API 응답: [{ rank, engineerUserId, name, completedCount }] */}
          <div className="top-engineers">
            <div className="top-engineers__header">
              <h2 className="section-title" style={{ marginBottom: 0 }}>우수 기사 TOP 3</h2>
            </div>
            {topLoading ? (
              <p style={{ padding: "12px", color: "#aaa", fontSize: "13px" }}>로딩 중...</p>
            ) : topEngineers.length === 0 ? (
              <p style={{ padding: "12px", color: "#aaa", fontSize: "13px" }}>데이터가 없습니다.</p>
            ) : (
              topEngineers.map((e) => (
                <div key={e.engineerUserId} className="engineer-item">
                  <span className={`engineer-item__rank engineer-item__rank--${e.rank}`}>{e.rank}</span>
                  <EngineerAvatar name={e.name} profileImageUrl={null} />
                  <div className="engineer-item__info">
                    <p className="engineer-item__name">{e.name} 기사</p>
                    <div className="engineer-item__tags">
                      <span className="engineer-tag engineer-tag--specialty">완료 {e.completedCount}건</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 정산 요약 - 17번 API */}
          <div className="settlement-card">
            <div className="settlement-card__header">
              <h2 className="section-title" style={{ marginBottom: 0 }}>정산 요약</h2>
              <button className="more-link">더보기 ›</button>
            </div>
            <p className="settlement-card__sub">이번 달 총 매출액</p>
            <p className="settlement-card__amount">
              {settlementLoading ? "..." : settlementValues.totalAmount.toLocaleString()}
              <span>원</span>
            </p>
            <div className="settlement-card__rows">
              <div className="settlement-card__row">
                <span>CareFlow 수수료</span>
                <span className="settlement-card__fee">
                  - {settlementLoading ? "..." : settlementValues.careflowFee.toLocaleString()} 원
                </span>
              </div>
              <div className="settlement-card__row">
                <span>대행사 수수료</span>
                <span className="settlement-card__fee">
                  - {settlementLoading ? "..." : settlementValues.agencyFee.toLocaleString()} 원
                </span>
              </div>
              <div className="settlement-card__divider" />
              <div className="settlement-card__row">
                <span>기사 지급액 합계</span>
                <span>
                  {settlementLoading ? "..." : settlementValues.engineerPayout.toLocaleString()} 원
                </span>
              </div>
              <div className="settlement-card__row">
                <span>정산 건수</span>
                <span>{settlementLoading ? "..." : settlementValues.totalCount}건</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}