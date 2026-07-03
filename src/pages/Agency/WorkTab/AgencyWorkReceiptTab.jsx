import { useState, useEffect } from "react";
import {
  ClipboardList, Clock, Users, Hourglass, XCircle,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Download, MoreVertical, RefreshCw,
  Activity, CheckCircle, Calendar, AlertTriangle,
} from "lucide-react";
import "../../../styles/Agency/WorkTab/AgencyWorkReceiptTab.css";
import WorkDetailModal from "../../Agency/Modal/WorkDetailModal";
import { AssignDetailModal, ReassignModal } from "../../../pages/Agency/Modal/AssignModals";
import api from "../../../apis/axiosInstance";

// 통계 API (as_status_log 기반)는 기존 fetch 패턴 유지
const BASE_URL = "http://localhost:8080";

async function apiFetch(path) {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// API 응답 AgencyAsRequestListResponse → 컴포넌트 내부 형식으로 매핑
function mapReceiptItem(r) {
  return {
    requestId:   r.requestId,
    createdAt:   r.createdAt,
    customer:    r.customerName,
    phone:       r.customerPhone,
    productName: r.brand ?? "-",
    modelNo:     r.modelName ?? "-",
    symptomDesc: r.symptomDesc,
    visitDate:   r.scheduledDate,
    startTime:   r.scheduledTime ?? "-",
    endTime:     "-",
    type:        r.assignType === "AUTO" ? "자동 A/S" : r.assignType === "MANUAL" ? "수동 A/S" : "-",
    status:      r.status,
    assignStatus: null,   // 배정 데이터 별도 — 재배정 로직 비활성 (assignmentId 조회는 모달 내부에서 처리)
    engineerName: null,
    assignedAt:   null,
    overtimeMin:  0,
  };
}

// ── 상태 맵 ───────────────────────────────────
const STATUS_MAP = {
  PENDING:         { label: "접수",          type: "pending"   },
  AGENCY_RECEIVED: { label: "배정 대기",      type: "waiting"   },
  ASSIGNED:        { label: "기사 수락 대기",  type: "accepted"  },
  ACCEPTED:        { label: "배정 완료",      type: "assigned"  },
  IN_PROGRESS:     { label: "진행 중",        type: "visiting"  },
  COMPLETED:       { label: "완료 대기",      type: "completed" },
  PAID:            { label: "정산 완료",      type: "paid"      },
  CANCELLED:       { label: "취소 / 반려",    type: "cancelled" },
};

// ── 더미: 작업 현황 통계 ──────────────────────
const DUMMY_STATS = {
  waitingCount: 12,
  engineerDepartedCount: 5,
  engineerArrivedCount: 3,
  inProgressCount: 8,
  completedCount: 47,
};

// ── 실시간 기사 현황 (백엔드 미구현 — 임시 빈 배열 유지) ────────
const realtimeEngineers = [
  { id: 1, name: "김철수", specialty: "LG 전문",   region: "강남·서초", product: "디오스 냉장고 수리", timeRange: "10:00 ~ 12:30", progress: 60,   isLmsCompleted: true,  profileImageUrl: null, asStatus: "IN_PROGRESS" },
  { id: 2, name: "박민수", specialty: "삼성 전문", region: "송파·강동", product: "그랑데 세탁기 수리", timeRange: "13:30 ~ 16:00", progress: 30,   isLmsCompleted: true,  profileImageUrl: null, asStatus: "ASSIGNED"    },
  { id: 3, name: "이영호", specialty: "LG 전문",   region: "강남·송파", product: null,                timeRange: null,            progress: null, isLmsCompleted: false, profileImageUrl: null, asStatus: null          },
  { id: 4, name: "최지현", specialty: "삼성 전문", region: "서초·관악", product: null,                timeRange: null,            progress: null, isLmsCompleted: true,  profileImageUrl: null, asStatus: null          },
];


// ── 헬퍼 ──────────────────────────────────────
function getReassignReason(item) {
  if (item.assignStatus === "REJECTED") return "rejected";
  if (item.assignStatus === "WAITING" && item.overtimeMin >= 30) return "overtime";
  return null;
}

function getActionType(item) {
  const reassignReason = getReassignReason(item);
  if (reassignReason) return { type: "reassign", reason: reassignReason };
  if (item.status === "ACCEPTED") return { type: "assignDetail" };
  if (item.status === "ASSIGNED") return { type: "assignDetail" };
  return { type: "workDetail" };
}

function formatRequestId(requestId, createdAt) {
  const date = new Date(createdAt);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `AS-${yy}${mm}${dd}-${String(requestId).padStart(4, "0")}`;
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const days = ["일","월","화","수","목","금","토"];
  const yy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const day = days[d.getDay()];
  const hh = String(d.getHours()).padStart(2,"0");
  const min = String(d.getMinutes()).padStart(2,"0");
  return { date: `${yy}.${mm}.${dd} (${day})`, time: `${hh}:${min}` };
}

function formatVisitDate(dateStr, startTime, endTime) {
  const d = new Date(dateStr);
  const days = ["일","월","화","수","목","금","토"];
  const yy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const day = days[d.getDay()];
  return `${yy}.${mm}.${dd} (${day})\n${startTime} ~ ${endTime}`;
}

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

// ══════════════════════════════════════════════
export default function AgencyWorkReceiptTab() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);

  const [workDetailModal,   setWorkDetailModal]   = useState(null);
  const [assignDetailModal, setAssignDetailModal] = useState(null);
  const [reassignModal,     setReassignModal]     = useState(null);

  // 접수 목록 상태
  const [receiptList, setReceiptList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [totalCount,  setTotalCount]  = useState(0);

  // 통계 (as_status_log 기반)
  const [workStats, setWorkStats] = useState(DUMMY_STATS);

  // 접수 목록 조회 (GET /api/agency/work-requests)
  useEffect(() => {
    setListLoading(true);
    api.get("/api/agency/work-requests")
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        const mapped = data.map(mapReceiptItem);
        setReceiptList(mapped);
        setTotalCount(mapped.length);
        setTotalPages(Math.max(1, Math.ceil(mapped.length / 10)));
      })
      .catch(() => setReceiptList([]))
      .finally(() => setListLoading(false));
  }, []);

  // 작업 현황 통계 조회 (GET /api/agency/work-requests/stats)
  useEffect(() => {
    apiFetch("/api/agency/work-requests/stats")
      .then(data => { if (data) setWorkStats(data); })
      .catch(() => {});
  }, []);

  // 클라이언트 페이지네이션 (백엔드 페이징 미지원 → 전체 목록을 10개씩 슬라이싱)
  const pagedList = receiptList.slice((currentPage - 1) * 10, currentPage * 10);

  // 통계 카드 (workStats 기반)
  const statCards = [
    { label: "전체 접수",      value: totalCount,                        today: "",  icon: ClipboardList, color: "purple" },
    { label: "배정 대기",      value: workStats?.waitingCount ?? 0,      today: "",  icon: Clock,         color: "orange" },
    { label: "기사 출발",      value: workStats?.engineerDepartedCount ?? 0, today: "", icon: Users,       color: "blue"   },
    { label: "수리 진행 중",   value: workStats?.inProgressCount ?? 0,   today: "",  icon: Hourglass,     color: "amber"  },
    { label: "수리 완료",      value: workStats?.completedCount ?? 0,    today: "",  icon: XCircle,       color: "red"    },
  ];

  const handleAction = (item) => {
    const action = getActionType(item);
    if (action.type === "reassign")          setReassignModal({ ...item, reassignReason: action.reason });
    else if (action.type === "assignDetail") setAssignDetailModal(item);
    else                                     setWorkDetailModal(item);
  };

  return (
    <div className="receipt-tab">

      {/* ── 통계 카드 ── */}
      <div className="receipt-stats">
        {statCards.map((s) => (
          <div key={s.label} className="receipt-stat-card">
            <div className="receipt-stat-card__text">
              <p className="receipt-stat-card__value">{s.value}<span>건</span></p>
              <p className="receipt-stat-card__label">{s.label}</p>
              <p className="receipt-stat-card__today">오늘 {s.today}</p>
            </div>
            <div className={`receipt-stat-card__icon receipt-stat-card__icon--${s.color}`}>
              <s.icon size={40} strokeWidth={1} />
            </div>
          </div>
        ))}
      </div>

      {/* ── 메인: 좌측(필터+테이블+페이지네이션) + 우측(실시간배정현황) ── */}
      <div className="receipt-body-layout">
        <div className="receipt-body-layout__left">

          {/* 필터 바 (기존 그대로) */}
          <div className="receipt-filters">
            <div className="receipt-filter-date">
              <span>2024.06.01 ~ 2024.06.30</span>
              <Download size={14} color="#aaa" />
            </div>
            <div className="receipt-filter-select"><span>전체 브랜드</span><ChevronDown size={14} /></div>
            <div className="receipt-filter-select"><span>전체 지역</span><ChevronDown size={14} /></div>
            <div className="receipt-filter-select"><span>전체 유형</span><ChevronDown size={14} /></div>
            <div className="receipt-filter-select"><span>전체 상태</span><ChevronDown size={14} /></div>
            <div className="receipt-search">
              <Search size={14} color="#aaa" />
              <input type="text" placeholder="고객명, 제품명, 접수번호 검색" />
            </div>
            <button className="receipt-excel-btn">
              <Download size={14} /> 엑셀 다운로드
            </button>
          </div>

          {/* 테이블 메타 */}
          <div className="receipt-table-meta">
            <span className="receipt-total">총 {totalCount}건</span>
            <div className="receipt-table-meta__right">
              <div className="receipt-sort-select">최신순 <ChevronDown size={13} /></div>
            </div>
          </div>

          {/* 테이블 (기존 그대로) */}
          <div className="receipt-table">
            <div className="receipt-table__header">
              <span>접수번호</span>
              <span>접수 일시</span>
              <span>고객명</span>
              <span>연락처</span>
              <span>제품 정보</span>
              <span>신청 증상</span>
              <span>희망 방문 일정</span>
              <span>유형</span>
              <span>상태</span>
              <span></span>
            </div>

            {listLoading && (
              <div style={{ padding: "24px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                불러오는 중...
              </div>
            )}
            {!listLoading && pagedList.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                접수 내역이 없습니다.
              </div>
            )}
            {!listLoading && pagedList.map((item) => {
              const reassignReason = getReassignReason(item);
              const action = getActionType(item);
              const s = STATUS_MAP[item.status] ?? { label: item.status, type: "pending" };
              const displayId = formatRequestId(item.requestId, item.createdAt);
              const dt = formatDateTime(item.createdAt);
              const visit = formatVisitDate(item.visitDate, item.startTime, item.endTime);

              let badgeLabel = s.label, badgeType = s.type, subLabel = null, subType = null;
              if (reassignReason === "rejected")      { badgeLabel = "재배차 필요"; badgeType = "reassign"; subLabel = "기사 취소"; subType = "rejected"; }
              else if (reassignReason === "overtime") { badgeLabel = "재배차 필요"; badgeType = "reassign"; subLabel = `${item.overtimeMin}분 초과`; subType = "overtime"; }
              else if (item.status === "ASSIGNED" && item.overtimeMin > 0) { subLabel = `수락 대기 ${item.overtimeMin}분`; subType = "waiting"; }

              const showEngineer = item.status === "ASSIGNED" && item.engineerName && !reassignReason;

              return (
                <div key={item.requestId} className={`receipt-table__row ${reassignReason ? "receipt-table__row--alert" : ""}`}>
                  <span className="receipt-table__id">{displayId}</span>
                  <span className="receipt-table__datetime">
                    <span>{dt.date}</span>
                    <span className="receipt-table__time">{dt.time}</span>
                  </span>
                  <span className="receipt-table__customer">{item.customer}</span>
                  <span className="receipt-table__phone">{item.phone}</span>
                  <span className="receipt-table__product">
                    <span className="receipt-table__product-name">{item.productName}</span>
                    <span className="receipt-table__model">{item.modelNo}</span>
                  </span>
                  <span className="receipt-table__symptom">{item.symptomDesc}</span>
                  <span className="receipt-table__visit">
                    {visit.split("\n").map((line, i) => (
                      <span key={i} className={i === 1 ? "receipt-table__visit-time" : ""}>{line}</span>
                    ))}
                  </span>
                  <span className="receipt-table__type">{item.type}</span>
                  <span className="receipt-table__status-col">
                    <span className={`receipt-badge receipt-badge--${badgeType}`}>{badgeLabel}</span>
                    {showEngineer && <span className="receipt-engineer-label">{item.engineerName}</span>}
                    {subLabel && (
                      <span className={`receipt-sub-label receipt-sub-label--${subType}`}>
                        {subType === "rejected" && <RefreshCw size={10} />}
                        {subType === "overtime" && <Clock size={10} />}
                        {subLabel}
                      </span>
                    )}
                  </span>
                  <span className="receipt-table__actions">
                    {action.type === "reassign" ? (
                      <button className="receipt-reassign-btn" onClick={() => handleAction(item)}>재배정</button>
                    ) : (
                      <button className="receipt-detail-btn" onClick={() => handleAction(item)}>상세보기</button>
                    )}
                    <button className="receipt-more-btn"><MoreVertical size={14} /></button>
                  </span>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          <div className="receipt-pagination">
            <div className="receipt-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                return start + i;
              }).filter(p => p <= totalPages).map(p => (
                <button key={p} className={currentPage === p ? "receipt-pagination__page--active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="receipt-page-size">
              <span>10개씩 보기</span><ChevronDown size={13} />
            </div>
          </div>

          {/* ── 작업 현황 요약 카드 (10번 API) ── */}
          <section className="aw-today">
            <h2 className="aw-section-title">오늘 작업 현황 요약</h2>
            <div className="aw-today__cards">
              <div className="aw-today__card aw-today__card--orange">
                <div className="aw-today__icon"><Clock size={20} /></div>
                <p className="aw-today__label">배정 대기</p>
                <p className="aw-today__value">{workStats?.waitingCount ?? 0}<span>건</span></p>
              </div>
              <div className="aw-today__card aw-today__card--blue">
                <div className="aw-today__icon"><Activity size={20} /></div>
                <p className="aw-today__label">수리 진행 중</p>
                <p className="aw-today__value">{workStats?.inProgressCount ?? 0}<span>건</span></p>
              </div>
              <div className="aw-today__card aw-today__card--green">
                <div className="aw-today__icon"><CheckCircle size={20} /></div>
                <p className="aw-today__label">수리 완료</p>
                <p className="aw-today__value">{workStats?.completedCount ?? 0}<span>건</span></p>
              </div>
              <div className="aw-today__card aw-today__card--purple">
                <div className="aw-today__icon"><Users size={20} /></div>
                <p className="aw-today__label">기사 출발</p>
                <p className="aw-today__value">{workStats?.engineerDepartedCount ?? 0}<span>건</span></p>
              </div>
            </div>
          </section>
        </div>

        {/* ── 우측: 실시간 배정 현황 ── */}
        <aside className="receipt-body-layout__right">
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
                      <span className={`aw-engineer-status aw-engineer-status--${engineerStatus.type}`}>{engineerStatus.label}</span>
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
        </aside>
      </div>

      {workDetailModal   && <WorkDetailModal   onClose={() => setWorkDetailModal(null)}   detail={workDetailModal} />}
      {assignDetailModal && (
        <AssignDetailModal
          onClose={() => setAssignDetailModal(null)}
          item={assignDetailModal}
          onSuccess={() => {
            // 배정 취소/재배정 후 목록 갱신
            api.get("/api/agency/work-requests")
              .then(res => {
                const mapped = (Array.isArray(res.data) ? res.data : []).map(mapReceiptItem);
                setReceiptList(mapped);
                setTotalCount(mapped.length);
                setTotalPages(Math.max(1, Math.ceil(mapped.length / 10)));
              })
              .catch(() => {});
          }}
        />
      )}
      {reassignModal && (
        <ReassignModal
          onClose={() => setReassignModal(null)}
          item={reassignModal}
          onSuccess={() => {
            api.get("/api/agency/work-requests")
              .then(res => {
                const mapped = (Array.isArray(res.data) ? res.data : []).map(mapReceiptItem);
                setReceiptList(mapped);
                setTotalCount(mapped.length);
                setTotalPages(Math.max(1, Math.ceil(mapped.length / 10)));
              })
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}