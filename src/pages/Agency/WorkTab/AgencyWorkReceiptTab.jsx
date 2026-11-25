import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Clock, MapPin, Users, Hourglass, XCircle,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Download, MoreVertical, RefreshCw,
  Calendar, AlertTriangle,
} from "lucide-react";
import "../../../styles/Agency/WorkTab/AgencyWorkReceiptTab.css";
import WorkDetailModal from "../../Agency/Modal/WorkDetailModal";
import { AssignDetailModal, ReassignModal } from "../../../pages/Agency/Modal/AssignModals";
import api from "../../../apis/axiosInstance";
import { searchAssignments } from "../../../apis/agency";
import { getAgencyStatusLogs } from "../../../apis/agencyasstatuslog";


// API 응답 AgencyAsRequestListResponse → 컴포넌트 내부 형식으로 매핑
// assignStatus/engineerName/assignedAt/overtimeMin은 배정 데이터가 없는 기본값(아직 배정 전 건)이며,
// enrichWithAssignment()에서 GET /api/agency/as-assignments 조회 결과로 실제 값을 덮어씀
function mapReceiptItem(r) {
  return {
    requestId:   r.requestId,
    createdAt:   r.createdAt,
    customer:    r.customerName,
    phone:       r.customerPhone,
    productName: r.brand ?? "-",
    modelNo:     r.modelName ?? "-",
    symptomDesc: r.symptomDesc,
    region:      r.visitRegionName ?? "-",
    visitDate:   r.scheduledDate,
    startTime:   r.scheduledTime ?? "-",
    endTime:     "-",
    type:        r.assignType === "AUTO" ? "자동 A/S" : r.assignType === "MANUAL" ? "수동 A/S" : "-",
    status:      r.status,
    assignmentId: null,
    assignStatus: null,
    engineerName: null,
    assignedAt:   null,
    overtimeMin:  0,
  };
}

// requestId별 최신 배정 건(assignmentByRequestId)을 접수 항목에 병합
// - assignStatus(WAITING/ACCEPTED/REJECTED/COMPLETED)로 재배정 필요 여부(getReassignReason) 판별 가능해짐
// - WAITING 상태일 때만 assignedAt 기준 경과 시간(overtimeMin)을 계산 (30분 초과 시 재배정 대상)
function enrichWithAssignment(item, assignmentByRequestId) {
  const a = assignmentByRequestId[item.requestId];
  if (!a) return item;

  const overtimeMin = (a.status === "WAITING" && a.assignedAt)
    ? Math.max(0, Math.floor((Date.now() - new Date(a.assignedAt).getTime()) / 60000))
    : 0;

  return {
    ...item,
    assignmentId: a.assignmentId,
    assignStatus: a.status,
    engineerName: a.engineerName,
    assignedAt:   a.assignedAt,
    overtimeMin,
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

// 날짜 input(type=date)용 "YYYY-MM-DD" 포맷
function toInputDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// 접수 목록을 CSV로 변환해서 다운로드 (엑셀에서 바로 열림)
function downloadCsv(rows) {
  const header = ["접수번호", "접수일시", "고객명", "연락처", "브랜드", "모델명", "신청증상", "지역", "희망방문일", "유형", "상태"];
  const lines = rows.map((item) => {
    const displayId = formatRequestId(item.requestId, item.createdAt);
    const dt = formatDateTime(item.createdAt);
    const statusLabel = STATUS_MAP[item.status]?.label ?? item.status;
    return [
      displayId, `${dt.date} ${dt.time}`, item.customer, item.phone,
      item.productName, item.modelNo, item.symptomDesc, item.region,
      `${item.visitDate} ${item.startTime}`, item.type, statusLabel,
    ].map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",");
  });
  const csv = "\uFEFF" + [header.join(","), ...lines].join("\n"); // BOM 포함(엑셀 한글 깨짐 방지)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `접수목록_${toInputDate(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
 
// ══════════════════════════════════════════════
export default function AgencyWorkReceiptTab() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
 
  const [workDetailModal,   setWorkDetailModal]   = useState(null);
  const [assignDetailModal, setAssignDetailModal] = useState(null);
  const [reassignModal,     setReassignModal]     = useState(null);
 
  // 접수 목록 상태
  const [receiptList, setReceiptList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [totalCount,  setTotalCount]  = useState(0);
 
  // 실시간 배정 현황 (GET /api/agency/as-assignments/search — 오늘 날짜, 전체 상태)
  const [assignments,        setAssignments]        = useState([]);
  const [assignmentsLoading, setAssignmentsLoading]  = useState(false);
  const [assignmentsError,   setAssignmentsError]    = useState(null);
 
  // 접수건별 최신 기사 진행상태 (GET /api/as-status-logs/agency, requestId별 최신 로그만 추출)
  // AsRequest.status는 큰 흐름만 담고 있어서, 기사가 수락/출발/도착/작업중인지는 여기서 보강
  const [latestLogByRequestId, setLatestLogByRequestId] = useState({});

  // 접수건별 최신 배정 정보 (GET /api/agency/as-assignments — 날짜 제한 없이 전체 배정 내역 조회)
  // 기사 거절(REJECTED)/30분 미수락(WAITING) 건에서 "재배정 필요" 배지·버튼을 노출하기 위해
  // requestId별로 가장 최근 배정 건만 골라서 assignStatus/engineerName/assignedAt을 보강한다
  const [assignmentByRequestId, setAssignmentByRequestId] = useState({});

  // ── 필터 상태 (기존엔 UI만 있고 실제 필터링 로직이 없었음) ──
  // 날짜는 기본적으로 "전체" 기간을 보여주도록 비워둠 (사용자가 직접 선택할 때만 필터링)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate:   "",
    brand:     "",
    region:    "",
    type:      "",
    status:    "",
    keyword:   "",
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ startDate: "", endDate: "", brand: "", region: "", type: "", status: "", keyword: "" });
    setCurrentPage(1);
  };

  // 작업 현황 통계 — 별도 API(work-requests/stats) 대신 현재 목록(receiptList)에서 직접 집계
  // (그 API는 대행사 전체 누적 로그 건수를 세는 거라 지금 화면의 목록 건수와 안 맞았음)
  // ACCEPTED(배정 완료)건은 latestLog로 실제 진행 단계를 확인해서
  //  - 로그가 없거나 WAITING이면 "방문 대기"
  //  - ENGINEER_DEPARTED/ENGINEER_ARRIVED로 넘어갔으면 그때부터 "기사 출발"
  // 로 나눠서 집계 (예전엔 ACCEPTED가 통째로 "기사 출발"에 잡혀서 방문 대기 중인 건도 출발한 것처럼 보였음)
  const workStats = {
    waitingCount: receiptList.filter(i => i.status === "AGENCY_RECEIVED").length,
    visitWaitingCount: receiptList.filter(i => {
      if (i.status !== "ACCEPTED") return false;
      const log = latestLogByRequestId[i.requestId];
      return !log || log.toStatus === "WAITING";
    }).length,
    engineerDepartedCount: receiptList.filter(i => {
      if (i.status === "ASSIGNED") return true;
      if (i.status === "ACCEPTED") {
        const log = latestLogByRequestId[i.requestId];
        return log && (log.toStatus === "ENGINEER_DEPARTED" || log.toStatus === "ENGINEER_ARRIVED");
      }
      return false;
    }).length,
    inProgressCount: receiptList.filter(i => i.status === "IN_PROGRESS").length,
    completedCount: receiptList.filter(i => i.status === "COMPLETED" || i.status === "PAID").length,
  };
 
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

  // 접수건별 최신 배정 정보 조회 (GET /api/agency/as-assignments — 날짜/상태 제한 없는 전체 배정 내역)
  // 한 requestId에 배정 이력이 여러 건일 수 있어(재배정 등) assignedAt이 가장 최근인 것만 채택
  const fetchAllAssignments = () => {
    api.get("/api/agency/as-assignments")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const latest = {};
        for (const a of list) {
          const prev = latest[a.requestId];
          if (!prev || new Date(a.assignedAt) > new Date(prev.assignedAt)) {
            latest[a.requestId] = a;
          }
        }
        setAssignmentByRequestId(latest);
      })
      .catch((err) => {
        if (err.response?.status !== 204) console.error("배정 내역 조회 실패:", err);
        setAssignmentByRequestId({});
      });
  };

  useEffect(() => {
    fetchAllAssignments();
  }, []);

  // 배정 변경/재배정/반려 등 모달 액션 성공 후 공통 갱신
  // (접수 목록 + 실시간 배정 현황 + 배정 이력 맵 전부 다시 조회)
  const refreshAll = () => {
    api.get("/api/agency/work-requests")
      .then(res => {
        const mapped = (Array.isArray(res.data) ? res.data : []).map(mapReceiptItem);
        setReceiptList(mapped);
        setTotalCount(mapped.length);
        setTotalPages(Math.max(1, Math.ceil(mapped.length / 10)));
      })
      .catch(() => {});
    fetchAssignments();
    fetchAllAssignments();
  };

  // 브랜드/지역 드롭다운 옵션 (실제 데이터에서 고유값 추출)
  const brandOptions  = [...new Set(receiptList.map(i => i.productName).filter(Boolean))];
  const regionOptions = [...new Set(receiptList.map(i => i.region).filter(v => v && v !== "-"))];

  // 배정 정보(assignStatus/engineerName/assignedAt/overtimeMin)를 접수 목록에 병합
  // — 필터/테이블/재배정 판별(getReassignReason)은 모두 이 병합된 목록을 사용해야 함
  const enrichedList = receiptList.map((item) => enrichWithAssignment(item, assignmentByRequestId));

  // 실제 필터링 (날짜/브랜드/지역/유형/상태/검색어) — 이전엔 UI만 있고 아무 것도 걸러내지 않았음
  const filteredList = enrichedList.filter((item) => {
    if (filters.startDate && item.createdAt.slice(0, 10) < filters.startDate) return false;
    if (filters.endDate && item.createdAt.slice(0, 10) > filters.endDate) return false;
    if (filters.brand && item.productName !== filters.brand) return false;
    if (filters.region && item.region !== filters.region) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.keyword) {
      const kw = filters.keyword.trim().toLowerCase();
      const displayId = formatRequestId(item.requestId, item.createdAt).toLowerCase();
      const haystack = `${item.customer} ${item.productName} ${item.modelNo} ${displayId}`.toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    return true;
  });

  // 클라이언트 페이지네이션 (백엔드 페이징 미지원 → 필터링된 목록을 10개씩 슬라이싱)
  const filteredTotalCount = filteredList.length;
  const filteredTotalPages = Math.max(1, Math.ceil(filteredTotalCount / 10));
  const pagedList = filteredList.slice((currentPage - 1) * 10, currentPage * 10);
 
  // 통계 카드 (workStats 기반)
  const statCards = [
    { label: "전체 접수",      value: totalCount,                            icon: ClipboardList, color: "purple" },
    { label: "배정 대기",      value: workStats.waitingCount,                icon: Clock,         color: "orange" },
    { label: "방문 대기",      value: workStats.visitWaitingCount,           icon: MapPin,        color: "teal"   },
    { label: "기사 출발",      value: workStats.engineerDepartedCount,       icon: Users,         color: "blue"   },
    { label: "수리 진행 중",   value: workStats.inProgressCount,             icon: Hourglass,     color: "amber"  },
    { label: "수리 완료",      value: workStats.completedCount,              icon: XCircle,       color: "red"    },
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
 
      {/* ── 실시간 배정 현황 (테이블 위, 전체 폭 가로 배너) ── */}
      <div className="aw-realtime aw-realtime--top">
        <div className="aw-realtime__header">
          <h2 className="aw-section-title" style={{ marginBottom: 0 }}>실시간 배정 현황</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="aw-schedule-btn aw-schedule-btn--compact"
              onClick={() => navigate("/agency/engineers")}
            >
              <Calendar size={14} /> 기사 근무표 보기
            </button>
            <button className="aw-more-link" onClick={fetchAssignments}>
              <RefreshCw size={12} /> 새로고침
            </button>
          </div>
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

        {!assignmentsLoading && !assignmentsError && assignments.length > 0 && (
          <div className="aw-realtime__row">
            {assignments.map((a) => {
              const status = ASSIGNMENT_STATUS_MAP[a.assignmentStatus] ?? { label: a.assignmentStatus, type: "waiting" };
              return (
                <div key={a.assignmentId} className="aw-engineer-item aw-engineer-item--card">
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
          </div>
        )}
      </div>

      {/* ── 필터 + 테이블 + 페이지네이션 (전체 폭) ── */}
      <div className="receipt-body-layout__left">
 
          {/* 필터 바 (실제 동작하도록 date input / select / 검색 / 엑셀 다운로드 연결) */}
          <div className="receipt-filters">
            <div className="receipt-filter-date">
              <input
                type="date"
                value={filters.startDate}
                onChange={e => handleFilterChange("startDate", e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "12px", color: "#444", fontFamily: "inherit", background: "none" }}
              />
              <span>~</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => handleFilterChange("endDate", e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "12px", color: "#444", fontFamily: "inherit", background: "none" }}
              />
            </div>

            <select className="receipt-filter-select" value={filters.brand} onChange={e => handleFilterChange("brand", e.target.value)}>
              <option value="">전체 브랜드</option>
              {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select className="receipt-filter-select" value={filters.region} onChange={e => handleFilterChange("region", e.target.value)}>
              <option value="">전체 지역</option>
              {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <select className="receipt-filter-select" value={filters.type} onChange={e => handleFilterChange("type", e.target.value)}>
              <option value="">전체 유형</option>
              <option value="자동 A/S">자동 A/S</option>
              <option value="수동 A/S">수동 A/S</option>
            </select>

            <select className="receipt-filter-select" value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}>
              <option value="">전체 상태</option>
              {Object.entries(STATUS_MAP).map(([key, v]) => (
                <option key={key} value={key}>{v.label}</option>
              ))}
            </select>

            <div className="receipt-search">
              <Search size={14} color="#aaa" />
              <input
                type="text"
                placeholder="고객명, 제품명, 접수번호 검색"
                value={filters.keyword}
                onChange={e => handleFilterChange("keyword", e.target.value)}
              />
            </div>

            <button className="receipt-reset-btn" onClick={handleResetFilters}>
              <RefreshCw size={13} /> 필터 초기화
            </button>

            <button className="receipt-excel-btn" onClick={() => downloadCsv(filteredList)}>
              <Download size={14} /> 엑셀 다운로드
            </button>
          </div>
 
          {/* 테이블 메타 */}
          <div className="receipt-table-meta">
            <span className="receipt-total">총 {filteredTotalCount}건</span>
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
              {Array.from({ length: Math.min(filteredTotalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 2, filteredTotalPages - 4));
                return start + i;
              }).filter(p => p <= filteredTotalPages).map(p => (
                <button key={p} className={currentPage === p ? "receipt-pagination__page--active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(filteredTotalPages, p + 1))} disabled={currentPage === filteredTotalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(filteredTotalPages)} disabled={currentPage === filteredTotalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="receipt-page-size">
              <span>10개씩 보기</span><ChevronDown size={13} />
            </div>
          </div>
        </div>

      {workDetailModal && (
        <WorkDetailModal
          onClose={() => setWorkDetailModal(null)}
          detail={workDetailModal}
          onSuccess={refreshAll}
        />
      )}
      {assignDetailModal && (
        <AssignDetailModal
          onClose={() => setAssignDetailModal(null)}
          item={assignDetailModal}
          onSuccess={refreshAll}
        />
      )}
      {reassignModal && (
        <ReassignModal
          onClose={() => setReassignModal(null)}
          item={reassignModal}
          onSuccess={refreshAll}
        />
      )}
    </div>
  );
}