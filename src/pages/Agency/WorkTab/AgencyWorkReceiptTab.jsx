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

// ── 더미: 실시간 기사 현황 (API 없음) ────────
const realtimeEngineers = [
  { id: 1, name: "김철수", specialty: "LG 전문",   region: "강남·서초", product: "디오스 냉장고 수리", timeRange: "10:00 ~ 12:30", progress: 60,   isLmsCompleted: true,  profileImageUrl: null, asStatus: "IN_PROGRESS" },
  { id: 2, name: "박민수", specialty: "삼성 전문", region: "송파·강동", product: "그랑데 세탁기 수리", timeRange: "13:30 ~ 16:00", progress: 30,   isLmsCompleted: true,  profileImageUrl: null, asStatus: "ASSIGNED"    },
  { id: 3, name: "이영호", specialty: "LG 전문",   region: "강남·송파", product: null,                timeRange: null,            progress: null, isLmsCompleted: false, profileImageUrl: null, asStatus: null          },
  { id: 4, name: "최지현", specialty: "삼성 전문", region: "서초·관악", product: null,                timeRange: null,            progress: null, isLmsCompleted: true,  profileImageUrl: null, asStatus: null          },
];

// ── 기존 접수 목록 더미 ───────────────────────
const receiptList = [
  { requestId: 1, createdAt: "2024-06-18 09:20", customer: "김민지", phone: "010-1234-5678", productName: "LG 디오스 냉장고",   modelNo: "M874GBB231",    symptomDesc: "냉장이 잘 되지 않아요",  visitDate: "2024-06-20", startTime: "10:00", endTime: "12:00", type: "출장 A/S",  status: "AGENCY_RECEIVED", assignStatus: null,       overtimeMin: 0,  engineerName: null,          assignedAt: null },
  { requestId: 2, createdAt: "2024-06-18 09:45", customer: "이영희", phone: "010-2345-6789", productName: "삼성 그랑데 세탁기", modelNo: "WF21T6500KP",   symptomDesc: "세탁기 배수가 안 돼요", visitDate: "2024-06-19", startTime: "14:00", endTime: "16:00", type: "출장 A/S",  status: "ASSIGNED",        assignStatus: "WAITING",  overtimeMin: 18, engineerName: "김철수 기사", assignedAt: "2024-06-18 09:35" },
  { requestId: 3, createdAt: "2024-06-18 10:10", customer: "박준호", phone: "010-3456-7890", productName: "LG 휘센 에어컨",     modelNo: "FQ18HDWHRN",   symptomDesc: "에어컨에서 냄새가 나요", visitDate: "2024-06-19", startTime: "16:00", endTime: "18:00", type: "출장 A/S",  status: "ACCEPTED",        assignStatus: "ACCEPTED", overtimeMin: 0,  engineerName: "박민수 기사", assignedAt: "2024-06-18 10:00" },
  { requestId: 4, createdAt: "2024-06-18 10:30", customer: "최서연", phone: "010-4567-8901", productName: "삼성 QLED TV",       modelNo: "KQ55QC674FXKR", symptomDesc: "화면이 나오지 않아요",  visitDate: "2024-06-20", startTime: "11:00", endTime: "13:00", type: "설치/점검", status: "AGENCY_RECEIVED", assignStatus: null,       overtimeMin: 0,  engineerName: null,          assignedAt: null },
  { requestId: 5, createdAt: "2024-06-18 11:05", customer: "정유진", phone: "010-5678-9012", productName: "LG 식기세척기",      modelNo: "DFB22S",        symptomDesc: "물이 새요",            visitDate: "2024-06-21", startTime: "09:00", endTime: "11:00", type: "출장 A/S",  status: "ASSIGNED",        assignStatus: "WAITING",  overtimeMin: 32, engineerName: "이영호 기사", assignedAt: "2024-06-18 11:00" },
  { requestId: 6, createdAt: "2024-06-18 11:30", customer: "이태훈", phone: "010-6789-0123", productName: "위니아 김치냉장고",  modelNo: "WQ57DGK",       symptomDesc: "김치가 너무 시원해요",  visitDate: "2024-06-21", startTime: "13:00", endTime: "15:00", type: "출장 A/S",  status: "CANCELLED",       assignStatus: "REJECTED", overtimeMin: 0,  engineerName: "홍길동 기사", assignedAt: "2024-06-18 11:20" },
  { requestId: 7, createdAt: "2024-06-18 12:15", customer: "홍길동", phone: "010-7890-1234", productName: "LG 오브제 냉장고",   modelNo: "M872MEE312",   symptomDesc: "소음이 심해요",         visitDate: "2024-06-22", startTime: "10:00", endTime: "12:00", type: "출장 A/S",  status: "AGENCY_RECEIVED", assignStatus: null,       overtimeMin: 0,  engineerName: null,          assignedAt: null },
  { requestId: 8, createdAt: "2024-06-18 13:20", customer: "김수현", phone: "010-8901-2345", productName: "삼성 에어드레서",    modelNo: "DF60A8500KG",  symptomDesc: "전원이 안 켜져요",      visitDate: "2024-06-22", startTime: "15:00", endTime: "17:00", type: "출장 A/S",  status: "ASSIGNED",        assignStatus: "WAITING",  overtimeMin: 5,  engineerName: "최지현 기사", assignedAt: "2024-06-18 13:10" },
];

const statCards = [
  { label: "전체 접수",      value: 42, today: "+8", icon: ClipboardList, color: "purple" },
  { label: "배정 대기",      value: 12, today: "+3", icon: Clock,         color: "orange" },
  { label: "기사 수락 대기", value: 18, today: "+4", icon: Users,         color: "blue"   },
  { label: "배정 완료",      value: 7,  today: "+1", icon: Hourglass,     color: "amber"  },
  { label: "취소 / 반려",    value: 5,  today: "+0", icon: XCircle,       color: "red"    },
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
  const totalPages = 5;

  const [workDetailModal,   setWorkDetailModal]   = useState(null);
  const [assignDetailModal, setAssignDetailModal] = useState(null);
  const [reassignModal,     setReassignModal]     = useState(null);

  // 10번 API: 작업 현황 통계
  const [workStats, setWorkStats] = useState(DUMMY_STATS);

  useEffect(() => {
    apiFetch("/api/agency/work-requests/stats")
      .then(setWorkStats)
      .catch(() => setWorkStats(DUMMY_STATS));
  }, []);

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
            <span className="receipt-total">총 42건</span>
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

            {receiptList.map((item) => {
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

          {/* 페이지네이션 (기존 그대로) */}
          <div className="receipt-pagination">
            <div className="receipt-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {[1,2,3,4,5].map(p => (
                <button key={p} className={currentPage === p ? "receipt-pagination__page--active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
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
      {assignDetailModal && <AssignDetailModal onClose={() => setAssignDetailModal(null)} item={assignDetailModal} />}
      {reassignModal     && <ReassignModal     onClose={() => setReassignModal(null)}     item={reassignModal} />}
    </div>
  );
}