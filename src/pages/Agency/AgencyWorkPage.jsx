import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ClipboardList, Clock, CheckCircle, Activity,
  XCircle, Search, ChevronDown, Calendar, MoreVertical, Users, AlertTriangle
} from "lucide-react";
import "../../styles/Agency/AgencyWorkPage.css";
import AgencyWorkReceiptTab from "../../pages/Agency/WorkTab/AgencyWorkReceiptTab";
import AgencyWorkAssignTab from "../../pages/Agency/WorkTab/AgencyWorkAssignTab";
import AgencyWorkMonitorTab from "../../pages/Agency/WorkTab/AgencyWorkMonitorTab";


const STATUS_MAP = {
  PENDING:         { label: "접수",      type: "pending"   },
  AGENCY_RECEIVED: { label: "배정 대기", type: "waiting"   },
  ASSIGNED:        { label: "배정 완료", type: "assigned"  },
  ACCEPTED:        { label: "수락 완료", type: "accepted"  },
  IN_PROGRESS:     { label: "진행 중",   type: "visiting"  },
  COMPLETED:       { label: "완료 대기", type: "completed" },
  PAID:            { label: "정산 완료", type: "paid"      },
  CANCELLED:       { label: "취소",      type: "cancelled" },
};

function formatRequestId(requestId, createdAt) {
  const date = new Date(createdAt);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `AS-${yy}${mm}${dd}-${String(requestId).padStart(4, "0")}`;
}

// TODO: API - GET /api/agency/work-requests/stats
const statCards = [
  { label: "전체 접수",   value: 42, today: "+8", icon: ClipboardList, color: "purple" },
  { label: "배정 대기",   value: 12, today: "+3", icon: Clock,         color: "orange" },
  { label: "배정 완료",   value: 18, today: "+4", icon: Users,         color: "blue"   },
  { label: "진행 중",     value: 9,  today: "+1", icon: Activity,      color: "green"  },
  { label: "오늘 완료",   value: 11, today: "+2", icon: CheckCircle,   color: "teal"   },
  { label: "취소 / 반려", value: 2,  today: "+0", icon: XCircle,       color: "red"    },
];

// TODO: API - GET /api/agency/work-requests?status=AGENCY_RECEIVED
const pendingList = [
  { requestId: 1, createdAt: "2024-06-01 09:20", customer: "김민지", product: "디오스 냉장고", brand: "LG",   region: "강남구", scheduledDate: "2024-06-01", scheduledTime: "10:00", assignType: "MANUAL", status: "AGENCY_RECEIVED" },
  { requestId: 2, createdAt: "2024-06-01 09:45", customer: "이영희", product: "그랑데 세탁기", brand: "삼성", region: "송파구", scheduledDate: "2024-06-01", scheduledTime: "14:00", assignType: "AUTO",   status: "AGENCY_RECEIVED" },
  { requestId: 3, createdAt: "2024-06-01 10:10", customer: "박준호", product: "휘센 에어컨",   brand: "LG",   region: "강동구", scheduledDate: "2024-06-01", scheduledTime: "16:00", assignType: "MANUAL", status: "AGENCY_RECEIVED" },
  { requestId: 4, createdAt: "2024-06-01 10:30", customer: "최시연", product: "QLED TV",       brand: "삼성", region: "서초구", scheduledDate: "2024-06-02", scheduledTime: "11:00", assignType: "AUTO",   status: "AGENCY_RECEIVED" },
  { requestId: 5, createdAt: "2024-06-01 11:05", customer: "정유진", product: "식기세척기",    brand: "LG",   region: "강남구", scheduledDate: "2024-06-02", scheduledTime: "15:00", assignType: "MANUAL", status: "AGENCY_RECEIVED" },
];

// TODO: API - GET /api/agency/engineers/realtime-status
const realtimeEngineers = [
  { id: 1, name: "김철수", specialty: "LG 전문",   region: "강남·서초", product: "디오스 냉장고 수리", timeRange: "10:00 ~ 12:30", progress: 60,   isLmsCompleted: true,  profileImageUrl: null, asStatus: "IN_PROGRESS" },
  { id: 2, name: "박민수", specialty: "삼성 전문", region: "송파·강동", product: "그랑데 세탁기 수리", timeRange: "13:30 ~ 16:00", progress: 30,   isLmsCompleted: true,  profileImageUrl: null, asStatus: "ASSIGNED"    },
  { id: 3, name: "이영호", specialty: "LG 전문",   region: "강남·송파", product: null,                timeRange: null,            progress: null, isLmsCompleted: false, profileImageUrl: null, asStatus: null          },
  { id: 4, name: "최지현", specialty: "삼성 전문", region: "서초·관악", product: null,                timeRange: null,            progress: null, isLmsCompleted: true,  profileImageUrl: null, asStatus: null          },
];

// TODO: API - GET /api/agency/notices?limit=3
const notices = [
  { id: 1, text: "여름철 가전 제품 점검 가이드라인 안내", date: "2024.06.01", isNew: true  },
  { id: 2, text: "시스템 점검 안내 (06/05 02:00 ~ 04:00)",  date: "2024.05.30", isNew: false },
  { id: 3, text: "6월 정산 일정 안내",                       date: "2024.05.28", isNew: false },
];

const tabs = ["작업 현황", "접수 목록", "배정 관리", "진행 모니터링", "완료 내역"];

function getEngineerStatusLabel(asStatus, isLmsCompleted) {
  if (!isLmsCompleted) return { label: "배차 불가", type: "lms-fail" };
  switch (asStatus) {
    case "IN_PROGRESS": return { label: "작업 중", type: "working" };
    case "ASSIGNED":    return { label: "이동 중", type: "moving"  };
    default:            return { label: "대기",    type: "waiting" };
  }
}

function EngineerAvatar({ name, profileImageUrl }) {
  const lastName = name ? name.charAt(0) : "?";
  return (
    <div className="aw-engineer-avatar">
      {profileImageUrl ? <img src={profileImageUrl} alt={name} /> : <span>{lastName}</span>}
    </div>
  );
}

function formatSchedule(dateStr, timeStr) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const day = days[d.getDay()];
  return `${mm}.${dd} (${day}) ${timeStr}`;
}

export default function AgencyWorkPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? "작업 현황");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="aw-page">
      {/* 페이지 헤더 */}
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

      {/* 탭별 컨텐츠 분기 */}
      {activeTab === "접수 목록"    && <AgencyWorkReceiptTab />}
      {activeTab === "배정 관리"    && <AgencyWorkAssignTab />}
      {activeTab === "진행 모니터링" && <AgencyWorkMonitorTab />}
      {activeTab === "완료 내역"    && <div className="aw-temp">완료 내역 준비 중</div>}

      {activeTab === "작업 현황" && <>
        {/* 통계 카드 */}
        <div className="aw-stats">
          {statCards.map((s) => (
            <div key={s.label} className="aw-stat-card">
              <div className={`aw-stat-card__icon aw-stat-card__icon--${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="aw-stat-card__label">{s.label}</p>
                <p className="aw-stat-card__value">{s.value}<span>건</span></p>
                <p className="aw-stat-card__today">오늘 {s.today}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="aw-content">
          {/* 좌측 */}
          <div className="aw-left">
            <section className="aw-pending">
              <div className="aw-pending__header">
                <h2 className="aw-section-title">배정 대기 목록</h2>
                <span className="aw-pending__count">총 12건</span>
              </div>

              <div className="aw-filters">
                <div className="aw-filter-select"><span>전체 브랜드</span><ChevronDown size={14} /></div>
                <div className="aw-filter-select"><span>전체 지역</span><ChevronDown size={14} /></div>
                <div className="aw-filter-select"><span>배정 방식</span><ChevronDown size={14} /></div>
                <div className="aw-search">
                  <Search size={14} color="#aaa" />
                  <input
                    type="text"
                    placeholder="고객명, 제품명, 접수번호 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="aw-table">
                <div className="aw-table__header">
                  <span>접수번호</span>
                  <span>접수 시간</span>
                  <span>고객명</span>
                  <span>제품명</span>
                  <span>브랜드</span>
                  <span>지역</span>
                  <span>희망 일정</span>
                  <span>배정 방식</span>
                  <span>상태</span>
                  <span>작업</span>
                </div>
                {pendingList.map((item) => {
                  const s = STATUS_MAP[item.status] || { label: item.status, type: "pending" };
                  const displayId = formatRequestId(item.requestId, item.createdAt);
                  return (
                    <div key={item.requestId} className="aw-table__row">
                      <span className="aw-table__id">{displayId}</span>
                      <span>{item.createdAt.slice(5, 10).replace("-", ".") + " " + item.createdAt.slice(11, 16)}</span>
                      <span>{item.customer}</span>
                      <span>{item.product}</span>
                      <span>{item.brand}</span>
                      <span>{item.region}</span>
                      <span>{formatSchedule(item.scheduledDate, item.scheduledTime)}</span>
                      <span>
                        <span className={`aw-assign-type-badge aw-assign-type-badge--${item.assignType.toLowerCase()}`}>
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
                })}
              </div>

              <button className="aw-more-load">더보기 <ChevronDown size={14} /></button>
            </section>

            {/* 오늘 일정 요약 */}
            <section className="aw-today">
              <h2 className="aw-section-title">오늘 일정 요약</h2>
              <div className="aw-today__cards">
                <div className="aw-today__card aw-today__card--purple">
                  <div className="aw-today__icon"><Calendar size={20} /></div>
                  <p className="aw-today__label">예정된 작업</p>
                  <p className="aw-today__value">24<span>건</span></p>
                </div>
                <div className="aw-today__card aw-today__card--blue">
                  <div className="aw-today__icon"><Activity size={20} /></div>
                  <p className="aw-today__label">진행 중</p>
                  <p className="aw-today__value">9<span>건</span></p>
                </div>
                <div className="aw-today__card aw-today__card--green">
                  <div className="aw-today__icon"><CheckCircle size={20} /></div>
                  <p className="aw-today__label">완료 예정</p>
                  <p className="aw-today__value">11<span>건</span></p>
                </div>
                <div className="aw-today__card aw-today__card--red">
                  <div className="aw-today__icon"><XCircle size={20} /></div>
                  <p className="aw-today__label">취소 / 변경</p>
                  <p className="aw-today__value">2<span>건</span></p>
                </div>
              </div>
            </section>
          </div>

          {/* 우측 */}
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
                        ? <p className="aw-engineer-lms-warn">
                            <AlertTriangle size={11} /> LMS 미이수 — 배차 불가
                          </p>
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

            {/* 공지사항 */}
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
      </>}
    </div>
  );
}