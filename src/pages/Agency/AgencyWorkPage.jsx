import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  ClipboardList, Clock, CheckCircle, Activity,
  XCircle, Search, ChevronDown, Calendar, MoreVertical, Users, AlertTriangle
} from "lucide-react";
import "../../styles/Agency/AgencyWorkPage.css";
import AgencyWorkReceiptTab  from "../../pages/Agency/WorkTab/AgencyWorkReceiptTab";
import AgencyWorkMonitorTab  from "../../pages/Agency/WorkTab/AgencyWorkMonitorTab";
import AgencyWorkCompleteTab from "../../pages/Agency/WorkTab/AgencyWorkCompleteTab";

const BASE_URL = "http://localhost:8080";

async function apiFetch(path) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (res.status === 204) return [];
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const STATUS_MAP = {
  PENDING:           { label: "접수",      type: "pending"   },
  AGENCY_RECEIVED:   { label: "배정 대기", type: "waiting"   },
  ASSIGNED:          { label: "배정 완료", type: "assigned"  },
  ACCEPTED:          { label: "수락 완료", type: "accepted"  },
  ENGINEER_DEPARTED: { label: "출발",      type: "visiting"  },
  ENGINEER_ARRIVED:  { label: "도착",      type: "visiting"  },
  IN_PROGRESS:       { label: "진행 중",   type: "visiting"  },
  COMPLETED:         { label: "완료",      type: "completed" },
  PAID:              { label: "정산 완료", type: "paid"      },
  CANCELLED:         { label: "취소",      type: "cancelled" },
};

function buildStatCards(stats) {
  return [
    { label: "배정 대기",    value: stats?.waitingCount          ?? "-", icon: Clock,         color: "orange" },
    { label: "기사 출발",    value: stats?.engineerDepartedCount ?? "-", icon: ClipboardList, color: "purple" },
    { label: "기사 도착",    value: stats?.engineerArrivedCount  ?? "-", icon: Users,         color: "blue"   },
    { label: "수리 진행 중", value: stats?.inProgressCount       ?? "-", icon: Activity,      color: "green"  },
    { label: "수리 완료",    value: stats?.completedCount        ?? "-", icon: CheckCircle,   color: "teal"   },
  ];
}

function formatRequestId(requestId, createdAt) {
  const date = new Date(createdAt);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `AS-${yy}${mm}${dd}-${String(requestId).padStart(4, "0")}`;
}

function formatSchedule(dateStr, timeStr) {
  if (!dateStr) return "-";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const day = days[d.getDay()];
  return `${mm}.${dd} (${day}) ${timeStr ?? ""}`;
}

// TODO: 실시간 기사 현황 API 없음 → 더미 유지
const realtimeEngineers = [
  { id: 1, name: "김철수", specialty: "LG 전문",   region: "강남·서초", product: "디오스 냉장고 수리", timeRange: "10:00 ~ 12:30", progress: 60,   isLmsCompleted: true,  profileImageUrl: null, asStatus: "IN_PROGRESS" },
  { id: 2, name: "박민수", specialty: "삼성 전문", region: "송파·강동", product: "그랑데 세탁기 수리", timeRange: "13:30 ~ 16:00", progress: 30,   isLmsCompleted: true,  profileImageUrl: null, asStatus: "ASSIGNED"    },
  { id: 3, name: "이영호", specialty: "LG 전문",   region: "강남·송파", product: null,                timeRange: null,            progress: null, isLmsCompleted: false, profileImageUrl: null, asStatus: null          },
  { id: 4, name: "최지현", specialty: "삼성 전문", region: "서초·관악", product: null,                timeRange: null,            progress: null, isLmsCompleted: true,  profileImageUrl: null, asStatus: null          },
];

// TODO: 공지사항 API 없음 → 더미 유지
const notices = [
  { id: 1, text: "여름철 가전 제품 점검 가이드라인 안내", date: "2024.06.01", isNew: true  },
  { id: 2, text: "시스템 점검 안내 (06/05 02:00 ~ 04:00)",  date: "2024.05.30", isNew: false },
  { id: 3, text: "6월 정산 일정 안내",                       date: "2024.05.28", isNew: false },
];

const tabs = ["작업 현황", "접수 목록", "진행 모니터링", "완료 내역"];

function getEngineerStatusLabel(asStatus, isLmsCompleted) {
  if (!isLmsCompleted) return { label: "배차 불가", type: "lms-fail" };
  switch (asStatus) {
    case "IN_PROGRESS": return { label: "작업 중", type: "working" };
    case "ASSIGNED":    return { label: "이동 중", type: "moving"  };
    default:            return { label: "대기",    type: "waiting" };
  }
}

function EngineerAvatar({ name, profileImageUrl }) {
  return (
    <div className="aw-engineer-avatar">
      {profileImageUrl
        ? <img src={profileImageUrl} alt={name} />
        : <span>{name?.charAt(0) ?? "?"}</span>}
    </div>
  );
}

export default function AgencyWorkPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? "작업 현황");

  // 10번: 작업 현황 상태별 통계
  const [workStats,    setWorkStats]    = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // 8번: A/S 요청 목록
  const [pendingList,    setPendingList]    = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // 필터
  const [searchQuery,  setSearchQuery]  = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter,   setDateFilter]   = useState("");

  useEffect(() => {
    apiFetch("/api/agency/work-requests/stats")
      .then(setWorkStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchPending = useCallback(() => {
    setPendingLoading(true);
    const params = new URLSearchParams();
    if (dateFilter)   params.set("date",   dateFilter);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();
    const url = qs ? `/api/agency/work-requests?${qs}` : "/api/agency/work-requests";

    apiFetch(url)
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const filtered = searchQuery
          ? list.filter(item =>
              item.customerName?.includes(searchQuery) ||
              item.symptomName?.includes(searchQuery)  ||
              String(item.requestId).includes(searchQuery)
            )
          : list;
        setPendingList(filtered);
      })
      .catch(console.error)
      .finally(() => setPendingLoading(false));
  }, [searchQuery, statusFilter, dateFilter]);

  useEffect(() => {
    if (activeTab === "작업 현황") fetchPending();
  }, [activeTab, fetchPending]);

  const statCards = buildStatCards(workStats);

  return (
    <div className="aw-page">
      {/* 헤더 */}
      <div className="aw-header">
        <h1 className="aw-header__title">작업 관리</h1>
        <p className="aw-header__sub">접수 현황을 확인하고 작업을 배정·관리할 수 있습니다.</p>
      </div>

      {/* 탭 */}
      <div className="aw-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`aw-tab ${activeTab === tab ? "aw-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 접수 목록 탭 */}
      {activeTab === "접수 목록"     && <AgencyWorkReceiptTab />}
      {activeTab === "진행 모니터링" && <AgencyWorkMonitorTab />}
      {activeTab === "완료 내역"     && <AgencyWorkCompleteTab />}

      {/* 작업 현황 탭 */}
      {activeTab === "작업 현황" && (
        <>
          {/* 통계 카드 - 10번 API */}
          <div className="aw-stats">
            {statCards.map((s) => (
              <div key={s.label} className="aw-stat-card">
                <div className={`aw-stat-card__icon aw-stat-card__icon--${s.color}`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="aw-stat-card__label">{s.label}</p>
                  <p className="aw-stat-card__value">
                    {statsLoading ? "..." : s.value}<span>건</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="aw-content">
            <div className="aw-left">

              {/* 배정 대기 목록 - 8번 + 9번 API */}
              <section className="aw-pending">
                <div className="aw-pending__header">
                  <h2 className="aw-section-title">배정 대기 목록</h2>
                  <span className="aw-pending__count">총 {pendingList.length}건</span>
                </div>

                <div className="aw-filters">
                  <input
                    type="date"
                    className="aw-filter-date"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                  />
                  <div className="aw-filter-select">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      style={{ border: "none", background: "none", outline: "none", fontSize: "13px", cursor: "pointer" }}
                    >
                      <option value="">전체 상태</option>
                      <option value="PENDING">접수</option>
                      <option value="AGENCY_RECEIVED">배정 대기</option>
                      <option value="ASSIGNED">배정 완료</option>
                      <option value="ACCEPTED">수락 완료</option>
                      <option value="CANCELLED">취소</option>
                    </select>
                    <ChevronDown size={14} />
                  </div>
                  <div className="aw-search">
                    <Search size={14} color="#aaa" />
                    <input
                      type="text"
                      placeholder="고객명, 증상명, 접수번호 검색"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="aw-table">
                  <div className="aw-table__header">
                    <span>접수번호</span>
                    <span>접수 시간</span>
                    <span>고객명</span>
                    <span>증상명</span>
                    <span>방문 지역</span>
                    <span>희망 일정</span>
                    <span>배정 방식</span>
                    <span>상태</span>
                    <span>작업</span>
                  </div>

                  {pendingLoading ? (
                    <p style={{ padding: "16px", color: "#aaa", fontSize: "13px" }}>로딩 중...</p>
                  ) : pendingList.length === 0 ? (
                    <p style={{ padding: "16px", color: "#aaa", fontSize: "13px" }}>조회된 작업이 없습니다.</p>
                  ) : (
                    pendingList.map((item) => {
                      const s = STATUS_MAP[item.status] ?? { label: item.status, type: "pending" };
                      const displayId = formatRequestId(item.requestId, item.createdAt);
                      return (
                        <div key={item.requestId} className="aw-table__row">
                          <span className="aw-table__id">{displayId}</span>
                          <span>{item.createdAt?.slice(5, 16).replace("-", ".")}</span>
                          <span>{item.customerName}</span>
                          <span>{item.symptomName}</span>
                          <span>{item.visitRegionName}</span>
                          <span>{formatSchedule(item.scheduledDate, item.scheduledTime)}</span>
                          <span>
                            <span className={`aw-assign-type-badge aw-assign-type-badge--${item.assignType?.toLowerCase()}`}>
                              {item.assignType === "AUTO" ? "자동" : "수동"}
                            </span>
                          </span>
                          <span><span className={`aw-badge aw-badge--${s.type}`}>{s.label}</span></span>
                          <span className="aw-table__actions">
                            <button className="aw-assign-btn">배정</button>
                            <button className="aw-more-btn"><MoreVertical size={14} /></button>
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
                <button className="aw-more-load" onClick={fetchPending}>
                  새로고침 <ChevronDown size={14} />
                </button>
              </section>

              {/* 작업 현황 요약 - 10번 API */}
              <section className="aw-today">
                <h2 className="aw-section-title">작업 현황 요약</h2>
                <div className="aw-today__cards">
                  <div className="aw-today__card aw-today__card--orange">
                    <div className="aw-today__icon"><Clock size={20} /></div>
                    <p className="aw-today__label">배정 대기</p>
                    <p className="aw-today__value">{statsLoading ? "..." : workStats?.waitingCount ?? 0}<span>건</span></p>
                  </div>
                  <div className="aw-today__card aw-today__card--blue">
                    <div className="aw-today__icon"><Activity size={20} /></div>
                    <p className="aw-today__label">수리 진행 중</p>
                    <p className="aw-today__value">{statsLoading ? "..." : workStats?.inProgressCount ?? 0}<span>건</span></p>
                  </div>
                  <div className="aw-today__card aw-today__card--green">
                    <div className="aw-today__icon"><CheckCircle size={20} /></div>
                    <p className="aw-today__label">수리 완료</p>
                    <p className="aw-today__value">{statsLoading ? "..." : workStats?.completedCount ?? 0}<span>건</span></p>
                  </div>
                  <div className="aw-today__card aw-today__card--purple">
                    <div className="aw-today__icon"><Users size={20} /></div>
                    <p className="aw-today__label">기사 출발</p>
                    <p className="aw-today__value">{statsLoading ? "..." : workStats?.engineerDepartedCount ?? 0}<span>건</span></p>
                  </div>
                </div>
              </section>
            </div>

            {/* 우측 - 실시간 배정 현황 & 공지사항 */}
            <aside className="aw-right">
              <div className="aw-realtime">
                <div className="aw-realtime__header">
                  <h2 className="aw-section-title" style={{ marginBottom: 0 }}>실시간 배정 현황</h2>
                  <button className="aw-more-link">전체 보기 ›</button>
                </div>
                {realtimeEngineers.map((e) => {
                  const engineerStatus = getEngineerStatusLabel(e.asStatus, e.isLmsCompleted);
                  return (
                    <div key={e.id} className="aw-engineer-item">
                      <EngineerAvatar name={e.name} profileImageUrl={e.profileImageUrl} />
                      <div className="aw-engineer-info">
                        <div className="aw-engineer-info__top">
                          <span className="aw-engineer-name">{e.name} 기사</span>
                          <span className={`aw-engineer-status aw-engineer-status--${engineerStatus.type}`}>
                            {engineerStatus.label}
                          </span>
                        </div>
                        <p className="aw-engineer-specialty">{e.specialty} / {e.region}</p>
                        {!e.isLmsCompleted
                          ? <p className="aw-engineer-lms-warn"><AlertTriangle size={11} /> LMS 미이수 — 배차 불가</p>
                          : e.product
                            ? <>
                                <p className="aw-engineer-product">{e.product} {e.timeRange}</p>
                                <div className="aw-progress-bar">
                                  <div className="aw-progress-bar__fill" style={{ width: `${e.progress}%` }} />
                                </div>
                                <p className="aw-progress-label">진행률 {e.progress}%</p>
                              </>
                            : <p className="aw-engineer-empty">배정 가능한 작업이 없습니다.</p>
                        }
                      </div>
                    </div>
                  );
                })}
                <button className="aw-schedule-btn">
                  <Calendar size={14} /> 기사 근무표 보기
                </button>
              </div>

              <div className="aw-notice">
                <div className="aw-notice__header">
                  <h2 className="aw-section-title" style={{ marginBottom: 0 }}>공지사항</h2>
                  <button className="aw-more-link">전체 보기 ›</button>
                </div>
                {notices.map((n) => (
                  <div key={n.id} className="aw-notice-item">
                    <div className="aw-notice-item__left">
                      {n.isNew && <span className="aw-notice-badge">필독</span>}
                      <span className="aw-notice-text">{n.text}</span>
                    </div>
                    <span className="aw-notice-date">{n.date}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}