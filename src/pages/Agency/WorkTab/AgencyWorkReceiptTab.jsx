import { useState, useEffect } from "react";
import {
  ClipboardList, Clock, Users, Hourglass, XCircle,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Download, MoreVertical, RefreshCw,
  Calendar, AlertTriangle,
} from "lucide-react";
import "../../../styles/Agency/WorkTab/AgencyWorkReceiptTab.css";
import WorkDetailModal from "../../Agency/Modal/WorkDetailModal";
import { AssignDetailModal, ReassignModal } from "../../../pages/Agency/Modal/AssignModals";
import api from "../../../apis/axiosInstance";
import { searchAssignments } from "../../../apis/agency";
import { getAgencyStatusLogs } from "../../../apis/agencyAsStatusLog";


// API 응답 AgencyAsRequestListResponse → 컴포넌트 내부 형식으로 매핑
function mapReceiptItem(r) {
  return {
    requestId:   r.requestId,
    createdAt:   r.createdAt,
    customer:    r.customerName,
    phone:       r.customerPhone,
    productName: "-",                         // 목록 API 미포함 → 상세 API에서 확인
    modelNo:     "-",
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
 
// AsAssignment.status 라벨 — 실제 enum 값 확인 후 필요시 조정하세요 (AssignmentDetailResponse.assignmentStatus와 동일 값 추정)
const ASSIGNMENT_STATUS_MAP = {
  WAITING:     { label: "수락 대기", type: "waiting" },
  ACCEPTED:    { label: "배정 완료", type: "assigned" },
  IN_PROGRESS: { label: "작업 중",   type: "working" },
  COMPLETED:   { label: "완료",      type: "done" },
  CANCELLED:   { label: "취소",      type: "cancelled" },
  REJECTED:    { label: "거절됨",    type: "rejected" },
};
 
// as_status_log.to_status → 라벨 (AgencyWorkMonitorTab의 STATUS_LOG_MAP과 동일 체계)
// AsRequest.status(큰 흐름)와 별개로, 기사의 실시간 진행 상황은 여기서 옴
const ENGINEER_PROGRESS_MAP = {
  WAITING:           { label: "방문 대기",   type: "waiting"  },
  ENGINEER_DEPARTED: { label: "기사 이동 중", type: "waiting"  },
  ENGINEER_ARRIVED:  { label: "기사 도착",   type: "waiting"  },
  IN_PROGRESS:       { label: "작업 중",     type: "visiting" },
  COMPLETED:         { label: "작업 완료",   type: "completed"},
};
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
 
  // 작업 현황 통계 — 별도 API(work-requests/stats) 대신 현재 목록(receiptList)에서 직접 집계
  // (그 API는 대행사 전체 누적 로그 건수를 세는 거라 지금 화면의 목록 건수와 안 맞았음)
  const workStats = {
    waitingCount: receiptList.filter(i => i.status === "AGENCY_RECEIVED").length,
    engineerDepartedCount: receiptList.filter(i => i.status === "ASSIGNED" || i.status === "ACCEPTED").length,
    inProgressCount: receiptList.filter(i => i.status === "IN_PROGRESS").length,
    completedCount: receiptList.filter(i => i.status === "COMPLETED" || i.status === "PAID").length,
  };
 
  // 실시간 배정 현황 (GET /api/agency/as-assignments/search — 오늘 날짜, 전체 상태)
  const [assignments,        setAssignments]        = useState([]);
  const [assignmentsLoading, setAssignmentsLoading]  = useState(false);
  const [assignmentsError,   setAssignmentsError]    = useState(null);
 
  // 접수건별 최신 기사 진행상태 (GET /api/as-status-logs/agency, requestId별 최신 로그만 추출)
  // AsRequest.status는 큰 흐름만 담고 있어서, 기사가 수락/출발/도착/작업중인지는 여기서 보강
  const [latestLogByRequestId, setLatestLogByRequestId] = useState({});
 
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
 
  // (work-requests/stats 별도 호출 제거 — 위에서 receiptList로 직접 계산)
 
  // 실시간 배정 현황 조회
  const fetchAssignments = () => {
    setAssignmentsLoading(true);
    setAssignmentsError(null);
    searchAssignments({}) // 파라미터 없이 호출 → 오늘 날짜, 전체 상태
      .then(res => setAssignments(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        if (err.response?.status === 204) {
          setAssignments([]);
        } else {
          console.error("배정 현황 조회 실패:", err);
          setAssignmentsError("배정 현황을 불러오지 못했습니다.");
        }
      })
      .finally(() => setAssignmentsLoading(false));
  };
 
  useEffect(() => {
    fetchAssignments();
  }, []);
 
  // 접수건별 최신 기사 진행상태 조회 (전체 로그 중 requestId별 가장 최근 것만 추출)
  // AsRequest.status는 큰 흐름만 담고 있어서, 기사가 수락/출발/도착/작업중인지는 이 로그로 보강
  useEffect(() => {
    getAgencyStatusLogs()
      .then((res) => {
        const logs = res.data?.logs ?? [];
        const latest = {};
        for (const log of logs) {
          const prev = latest[log.requestId];
          if (!prev || new Date(log.changedAt) > new Date(prev.changedAt)) {
            latest[log.requestId] = log;
          }
        }
        setLatestLogByRequestId(latest);
      })
      .catch(() => setLatestLogByRequestId({}));
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
              // 기사 진행상태 로그는 "진행 중"인 건에만 참고 — COMPLETED/PAID/CANCELLED처럼
              // 이미 최종 상태에 도달한 건은 로그(WAITING~COMPLETED까지만 기록됨)를 무시하고
              // AsRequest.status를 그대로 보여줘야 함 (안 그러면 PAID인데 "작업 완료"로 잘못 뜸)
              const FINAL_STATUSES = ["COMPLETED", "PAID", "CANCELLED"];
              const latestLog = FINAL_STATUSES.includes(item.status)
                ? null
                : latestLogByRequestId[item.requestId];
              const s = latestLog
                ? (ENGINEER_PROGRESS_MAP[latestLog.toStatus] ?? { label: latestLog.toStatus, type: "waiting" })
                : (STATUS_MAP[item.status] ?? { label: item.status, type: "pending" });
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
        </div>
 
        {/* ── 우측: 실시간 배정 현황 (GET /api/agency/as-assignments/search) ── */}
        <aside className="receipt-body-layout__right">
          <div className="aw-realtime">
            <div className="aw-realtime__header">
              <h2 className="aw-section-title" style={{ marginBottom: 0 }}>실시간 배정 현황</h2>
              <button className="aw-more-link" onClick={fetchAssignments}>
                <RefreshCw size={12} /> 새로고침
              </button>
            </div>
 
            {assignmentsLoading && (
              <p style={{ padding: "12px", color: "#aaa", fontSize: "12px" }}>불러오는 중...</p>
            )}
            {!assignmentsLoading && assignmentsError && (
              <p style={{ padding: "12px", color: "#dc2626", fontSize: "12px" }}>{assignmentsError}</p>
            )}
            {!assignmentsLoading && !assignmentsError && assignments.length === 0 && (
              <p style={{ padding: "12px", color: "#aaa", fontSize: "12px" }}>오늘 예정된 배정이 없습니다.</p>
            )}
 
            {!assignmentsLoading && !assignmentsError && (assignments ?? []).map((a) => {
              const status = ASSIGNMENT_STATUS_MAP[a.assignmentStatus] ?? { label: a.assignmentStatus, type: "waiting" };
              return (
                <div key={a.assignmentId} className="aw-engineer-item">
                  <EngineerAvatar name={a.engineerName} />
                  <div className="aw-engineer-info">
                    <div className="aw-engineer-info__top">
                      <span className="aw-engineer-name">{a.engineerName ?? "미배정"} 기사</span>
                      <span className={`aw-engineer-status aw-engineer-status--${status.type}`}>{status.label}</span>
                    </div>
                    <p className="aw-engineer-specialty">{a.symptomName}</p>
                    <p className="aw-engineer-product">
                      {a.scheduledDate} {a.scheduledTime ?? ""}
                    </p>
                    <p className="aw-engineer-empty" style={{ marginTop: 2 }}>{a.visitAddressDetail}</p>
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
            fetchAssignments();
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
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
}