import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Clock,
  MapPin,
  Wrench,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  RefreshCw,
  Phone,
} from "lucide-react";
import "../../../styles/Agency/WorkTab/AgencyWorkMonitorTab.css";
import "../../../styles/Agency/WorkTab/Agencyworkmonitortab.additions.css";
import { getInProgressAssignments } from "../../../apis/agencyAssignment";
import { getAgencyStatusLogs } from "../../../apis/agencyAsStatusLog";

// as_status_logs.to_status ENUM → UI 표현 매핑
const STATUS_LOG_MAP = {
  WAITING: { label: "방문 대기", type: "waiting" },
  ENGINEER_DEPARTED: { label: "기사 이동 중", type: "moving" },
  ENGINEER_ARRIVED: { label: "기사 도착", type: "arrived" },
  IN_PROGRESS: { label: "작업 진행 중", type: "working" },
  COMPLETED: { label: "작업 완료", type: "done" },
};

// 진행 단계 순서 (stepTimes 키와 동일)
const WORK_STEPS = [
  { key: "ACCEPTED", label: "배정 완료" },
  { key: "WAITING", label: "방문 대기" },
  { key: "ENGINEER_DEPARTED", label: "이동 중" },
  { key: "ENGINEER_ARRIVED", label: "도착" },
  { key: "IN_PROGRESS", label: "작업 중" },
  { key: "COMPLETED", label: "완료" },
];

// latestLogStatus 필터 옵션
const LOG_STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "WAITING", label: "방문 대기" },
  { value: "ENGINEER_DEPARTED", label: "기사 이동 중" },
  { value: "ENGINEER_ARRIVED", label: "기사 도착" },
  { value: "IN_PROGRESS", label: "작업 진행 중" },
  { value: "COMPLETED", label: "작업 완료" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const INTERVAL_OPTIONS = [10, 30, 60];

// 아직 상태 로그(as_status_logs)가 없더라도, 배정이 수락(ACCEPTED)된 순간부터는
// 논리적으로 "방문 대기" 상태이므로 이를 기본값으로 보정해서 상태를 계산
function resolveStatus(latestLogStatus, assignmentStatus) {
  if (latestLogStatus && STATUS_LOG_MAP[latestLogStatus])
    return STATUS_LOG_MAP[latestLogStatus];
  if (assignmentStatus === "ACCEPTED") return STATUS_LOG_MAP.WAITING;
  return { label: "대기", type: "waiting" };
}

// 현재 스텝 인덱스 계산 (WORK_STEPS 기준) — 반환값은 "현재 활성 단계"의 인덱스
function getCurrentStepIdx(latestLogStatus, assignmentStatus) {
  if (assignmentStatus === "COMPLETED" || latestLogStatus === "COMPLETED")
    return 5;
  const map = {
    WAITING: 1,
    ENGINEER_DEPARTED: 2,
    ENGINEER_ARRIVED: 3,
    IN_PROGRESS: 4,
  };
  if (latestLogStatus && map[latestLogStatus] != null)
    return map[latestLogStatus];
  // 상태 로그가 아직 안 쌓였어도 배정 수락(ACCEPTED) 상태라면 "방문 대기" 단계로 간주
  if (assignmentStatus === "ACCEPTED") return 1;
  return 0;
}

// 날짜+시간 문자열 조합 → UI 표시용
function formatVisitDateTime(visitDate, visitTime) {
  if (!visitDate) return "-";
  return visitTime ? `${visitDate} ${visitTime}` : visitDate;
}

// ISO 날짜시간 → "MM.DD HH:mm"
function formatUpdatedAt(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${min}`;
}

// createdAt ISO → "YYYY.MM.DD"
function formatCreatedAt(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function Avatar({ name, profileImageUrl, size = 32 }) {
  return (
    <div
      className="wmt-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {profileImageUrl ? (
        <img src={profileImageUrl} alt={name} />
      ) : (
        <span>{name?.charAt(0) ?? "?"}</span>
      )}
    </div>
  );
}

export default function AgencyWorkMonitorTab() {
  // ── 필터 상태 ──
  const [filters, setFilters] = useState({
    date: "",
    latestLogStatus: "",
    brand: "",
    keyword: "",
  });

  // ── 페이지네이션 상태 ──
  const [page, setPage] = useState(0); // 0-based (API 기준)
  const [size, setSize] = useState(10);

  // ── API 응답 상태 (진행 중 배정 목록) ──
  const [content, setContent] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ── 상태 요약 통계 ──
  // 기존엔 별도 API(status-summary)를 썼는데, 그 API는 as_status_logs가 있는 건만 카운트해서
  // "방금 수락돼서 로그가 아직 없는 건"(=방문 대기여야 함)이 어디에도 안 잡히는 문제가 있었음.
  // → 테이블에 실제로 보여주는 것과 동일한 resolveStatus() 기준으로 직접 집계해서 항상 일치하게 함.
  const [summary, setSummary] = useState({
    waitingCount: 0,
    engineerDepartedCount: 0,
    engineerArrivedCount: 0,
    inProgressCount: 0,
    completedCount: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(false);

  // ── 전체 상태 변경 이력 (GET /api/as-status-logs/agency) ──
  const [statusLogs, setStatusLogs] = useState([]);
  const [statusLogsTotal, setStatusLogsTotal] = useState(0);
  const [statusLogsLoading, setStatusLogsLoading] = useState(false);
  const [statusLogsError, setStatusLogsError] = useState(null);
  const [statusLogsVisible, setStatusLogsVisible] = useState(20); // 더보기용

  // ── UI 상태 ──
  const [selectedItem, setSelectedItem] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── 진행 중 배정 목록 조회 (좌측 테이블) ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getInProgressAssignments({
        page,
        size,
        date: filters.date || undefined,
        latestLogStatus: filters.latestLogStatus || undefined,
        brand: filters.brand || undefined,
        keyword: filters.keyword || undefined,
      });
      setContent(data.content ?? []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 0);
      // 선택 항목이 있었으면 갱신된 데이터로 교체
      if (selectedItem) {
        const refreshed = (data.content ?? []).find(
          (i) => i.assignmentId === selectedItem.assignmentId,
        );
        setSelectedItem(refreshed ?? null);
      }
    } catch (err) {
      console.error("진행 중 배정 조회 실패:", err);
      setError("데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, size, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 상태 요약 통계 집계 ──
  // 페이지네이션과 무관하게 "전체" 진행 중 배정을 가져와서 resolveStatus() 기준으로 카운트
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const { data } = await getInProgressAssignments({ page: 0, size: 1000 });
      const list = data.content ?? [];
      const counts = {
        waitingCount: 0,
        engineerDepartedCount: 0,
        engineerArrivedCount: 0,
        inProgressCount: 0,
        completedCount: 0,
      };
      list.forEach((item) => {
        const s = resolveStatus(item.latestLogStatus, item.assignmentStatus);
        if (s.type === "waiting") counts.waitingCount += 1;
        else if (s.type === "moving") counts.engineerDepartedCount += 1;
        else if (s.type === "arrived") counts.engineerArrivedCount += 1;
        else if (s.type === "working") counts.inProgressCount += 1;
        else if (s.type === "done") counts.completedCount += 1;
      });
      setSummary(counts);
    } catch (err) {
      console.error("상태 요약 집계 실패:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ── 전체 상태 변경 이력 조회 (좌측 상단 필터 재사용: date·상태·키워드) ──
  const fetchStatusLogs = useCallback(async () => {
    setStatusLogsLoading(true);
    setStatusLogsError(null);
    try {
      const { data } = await getAgencyStatusLogs({
        date: filters.date || undefined,
        toStatus: filters.latestLogStatus || undefined,
        keyword: filters.keyword || undefined,
      });
      setStatusLogs(data.logs ?? []);
      setStatusLogsTotal(data.totalCount ?? 0);
      setStatusLogsVisible(20); // 필터 변경 시 "더보기" 노출 개수 초기화
    } catch (err) {
      console.error("상태 변경 이력 조회 실패:", err);
      setStatusLogsError("상태 변경 이력을 불러오는 데 실패했습니다.");
    } finally {
      setStatusLogsLoading(false);
    }
  }, [filters]);

  // 필터·페이지 변경 시 재조회
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchSummary();
    fetchStatusLogs();
  }, [fetchSummary, fetchStatusLogs]);

  // 자동 갱신 polling (배정 목록 + 요약 + 이력 모두 갱신)
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchData();
      fetchSummary();
      fetchStatusLogs();
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, fetchData, fetchSummary, fetchStatusLogs]);

  const handleRefreshNow = () => {
    fetchData();
    fetchSummary();
    fetchStatusLogs();
  };

  // ── 필터 핸들러 ──
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0); // 필터 변경 시 첫 페이지로
  };

  const handleResetFilters = () => {
    setFilters({ date: "", latestLogStatus: "", brand: "", keyword: "" });
    setPage(0);
  };

  // ── 통계 카드 목록 (status-summary API 기반, 5개) ──
  const statCards = [
    {
      label: "방문 대기",
      value: summary.waitingCount,
      icon: ClipboardList,
      color: "purple",
    },
    {
      label: "기사 이동 중",
      value: summary.engineerDepartedCount,
      icon: Clock,
      color: "purple",
    },
    {
      label: "기사 도착",
      value: summary.engineerArrivedCount,
      icon: MapPin,
      color: "purple",
    },
    {
      label: "작업 진행 중",
      value: summary.inProgressCount,
      icon: Wrench,
      color: "purple",
    },
    {
      label: "완료",
      value: summary.completedCount,
      icon: CheckCircle,
      color: "purple",
    },
  ];

  // ── 선택 항목 상태 ──
  const selectedStatus = selectedItem
    ? resolveStatus(selectedItem.latestLogStatus, selectedItem.assignmentStatus)
    : null;
  const selectedStepIdx = selectedItem
    ? getCurrentStepIdx(
        selectedItem.latestLogStatus,
        selectedItem.assignmentStatus,
      )
    : 0;

  // ── 페이지 버튼 목록 (최대 5개 표시) ──
  const pageNumbers = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i);
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    return Array.from({ length: 5 }, (_, i) => start + i);
  })();

  return (
    <div className="wmt">
      {/* 자동 갱신 토글 */}
      <div className="wmt-refresh-bar">
        <div className="wmt-refresh-bar__left">
          <span className="wmt-refresh-label">자동 갱신</span>
          <div
            className={`wmt-toggle ${autoRefresh ? "wmt-toggle--on" : ""}`}
            onClick={() => setAutoRefresh((p) => !p)}
          >
            <div className="wmt-toggle__thumb" />
          </div>
        </div>
        <div className="wmt-refresh-select-wrap">
          <div
            className="wmt-refresh-select"
            onClick={() => setShowIntervalDropdown((p) => !p)}
          >
            {refreshInterval}초 <ChevronDown size={13} />
          </div>
          {showIntervalDropdown && (
            <div className="wmt-refresh-dropdown">
              {INTERVAL_OPTIONS.map((sec) => (
                <button
                  key={sec}
                  className={`wmt-refresh-dropdown__item ${refreshInterval === sec ? "wmt-refresh-dropdown__item--active" : ""}`}
                  onClick={() => {
                    setRefreshInterval(sec);
                    setShowIntervalDropdown(false);
                  }}
                >
                  {sec}초
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="wmt-refresh-now-btn"
          onClick={handleRefreshNow}
          title="지금 새로고침"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* 통계 카드 (상태 요약: GET /api/as-status-logs/agency/status-summary) */}
      <div className="wmt-stats">
        {statCards.map((s) => (
          <div key={s.label} className="wmt-stat-card">
            <div className="wmt-stat-card__text">
              <p className="wmt-stat-card__value">
                {summaryLoading ? "..." : s.value}
                <span>건</span>
              </p>
              <p className="wmt-stat-card__label">{s.label}</p>
            </div>
            <div
              className={`wmt-stat-card__icon wmt-stat-card__icon--${s.color}`}
            >
              <s.icon size={40} strokeWidth={1} />
            </div>
          </div>
        ))}
      </div>

      <div className="wmt-filters">
        {/* 날짜 필터 */}
        <input
          type="date"
          className="wmt-filter-date"
          value={filters.date}
          onChange={(e) => handleFilterChange("date", e.target.value)}
        />

        {/* 진행 상태 필터 */}
        <select
          className="wmt-filter-select"
          value={filters.latestLogStatus}
          onChange={(e) =>
            handleFilterChange("latestLogStatus", e.target.value)
          }
        >
          {LOG_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* 브랜드 필터 */}
        <input
          type="text"
          className="wmt-filter-brand"
          placeholder="브랜드"
          value={filters.brand}
          onChange={(e) => handleFilterChange("brand", e.target.value)}
        />

        {/* 키워드 검색 */}
        <div className="wmt-search">
          <Search size={13} color="#aaa" />
          <input
            type="text"
            placeholder="접수번호, 고객명, 제품명 검색"
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
          />
        </div>

        <button className="wmt-reset-btn" onClick={handleResetFilters}>
          <RefreshCw size={13} /> 필터 초기화
        </button>
      </div>

      <div className="wmt-body">
        {/* 좌측 테이블 */}
        <div className="wmt-left">
          <div className="wmt-table-meta">
            <span className="wmt-total">
              진행 작업 목록 ({totalElements}건)
            </span>
          </div>

          {/* 에러 메시지 */}
          {error && <p className="wmt-error">{error}</p>}

          <div className="wmt-table">
            <div className="wmt-table__header">
              <span>접수번호</span>
              <span>고객</span>
              <span>제품 정보</span>
              <span>담당 기사</span>
              <span>진행 상태</span>
              <span>업데이트 시간</span>
              <span>액션</span>
            </div>

            {loading && (
              <div className="wmt-loading">데이터를 불러오는 중...</div>
            )}

            {!loading && content.length === 0 && (
              <div className="wmt-empty">진행 중인 배정이 없습니다.</div>
            )}

            {!loading &&
              content.map((item) => {
                const s = resolveStatus(
                  item.latestLogStatus,
                  item.assignmentStatus,
                );
                const isSelected =
                  selectedItem?.assignmentId === item.assignmentId;
                return (
                  <div
                    key={item.assignmentId}
                    className={`wmt-table__row ${isSelected ? "wmt-table__row--selected" : ""}`}
                  >
                    <span className="wmt-table__id-col">
                      <span className="wmt-table__id">#{item.requestId}</span>
                      <span className="wmt-table__date">
                        접수일 {formatCreatedAt(item.createdAt)}
                      </span>
                    </span>
                    <span className="wmt-table__customer-col">
                      <span className="wmt-table__customer">
                        {item.customerName}
                      </span>
                      <span className="wmt-table__phone">
                        {item.customerPhone}
                      </span>
                    </span>
                    <span className="wmt-table__product-col">
                      <span className="wmt-table__product-name">
                        {item.productName}
                      </span>
                      <span className="wmt-table__model">{item.modelNo}</span>
                    </span>
                    <span className="wmt-table__engineer-col">
                      {item.engineerName ? (
                        <span className="wmt-table__engineer-name">
                          {item.engineerName}
                        </span>
                      ) : (
                        <span className="wmt-table__no-engineer">-</span>
                      )}
                    </span>
                    <span>
                      <span className={`wmt-badge wmt-badge--${s.type}`}>
                        {s.label}
                      </span>
                    </span>
                    <span className="wmt-table__updated">
                      {formatUpdatedAt(item.updatedAt)}
                    </span>
                    <span
                      className="wmt-table__actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className={`wmt-detail-btn ${isSelected ? "wmt-detail-btn--active" : ""}`}
                        onClick={() =>
                          setSelectedItem(isSelected ? null : item)
                        }
                      >
                        {isSelected ? "닫기" : "상세"}
                      </button>
                      {/* <button className="wmt-more-btn"><MoreVertical size={14} /></button> */}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* 페이지네이션 */}
          <div className="wmt-pagination">
            <div className="wmt-pagination__left">
              <button onClick={() => setPage(0)} disabled={page === 0}>
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft size={14} />
              </button>
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  className={page === p ? "wmt-pagination__active" : ""}
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setPage(Math.max(0, totalPages - 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronsRight size={14} />
              </button>
            </div>
            {/* 페이지 크기 선택 */}
            {/* <div className="wmt-page-size-wrap">
              <div className="wmt-page-size" onClick={() => setShowSizeDropdown(p => !p)}>
                {size}개씩 보기 <ChevronDown size={13} />
              </div>
              {showSizeDropdown && (
                <div className="wmt-refresh-dropdown">
                  {PAGE_SIZE_OPTIONS.map(s => (
                    <button
                      key={s}
                      className={`wmt-refresh-dropdown__item ${size === s ? "wmt-refresh-dropdown__item--active" : ""}`}
                      onClick={() => { setSize(s); setPage(0); setShowSizeDropdown(false); }}
                    >
                      {s}개씩
                    </button>
                  ))}
                </div>
              )}
            </div> */}
          </div>

          {/* 상태 변경 이력 (GET /api/as-status-logs/agency) */}
          <div className="wmt-table-meta">
            <span className="wmt-total">
              상태 변경 이력 ({statusLogsTotal}건)
            </span>
          </div>

          {statusLogsError && <p className="wmt-error">{statusLogsError}</p>}

          <div className="wmt-logs-panel">
            {statusLogsLoading ? (
              <div className="wmt-loading">이력을 불러오는 중...</div>
            ) : statusLogs.length === 0 ? (
              <div className="wmt-empty">상태 변경 이력이 없습니다.</div>
            ) : (
              <>
                {statusLogs.slice(0, statusLogsVisible).map((log) => {
                  const toStatus = STATUS_LOG_MAP[log.toStatus] ?? {
                    label: log.toStatus,
                    type: "waiting",
                  };
                  const fromLabel = log.fromStatus
                    ? (STATUS_LOG_MAP[log.fromStatus]?.label ?? log.fromStatus)
                    : "접수";
                  return (
                    <div key={log.logId} className="wmt-log-row">
                      <span className="wmt-log-row__id">#{log.requestId}</span>
                      <span className="wmt-log-row__transition">
                        {fromLabel}{" "}
                        <span className="wmt-log-row__arrow">→</span>{" "}
                        <span
                          className={`wmt-badge wmt-badge--${toStatus.type}`}
                        >
                          {toStatus.label}
                        </span>
                      </span>
                      <span className="wmt-log-row__memo">
                        {log.memo || "-"}
                      </span>
                      <span className="wmt-log-row__by">
                        {log.changedByName ?? "-"}
                      </span>
                      <span className="wmt-log-row__time">
                        {formatUpdatedAt(log.changedAt)}
                      </span>
                    </div>
                  );
                })}
                {statusLogsVisible < statusLogs.length && (
                  <button
                    className="wmt-logs-more-btn"
                    onClick={() => setStatusLogsVisible((v) => v + 20)}
                  >
                    더보기 ({statusLogs.length - statusLogsVisible}건 남음)
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 우측 상세 패널 */}
        {selectedItem && (
          <aside className="wmt-detail">
            <div className="wmt-detail__header">
              <span className="wmt-detail__title">작업 상세 정보</span>
              <span
                className={`wmt-badge wmt-badge--${selectedStatus?.type ?? "waiting"}`}
              >
                {selectedStatus?.label ?? "대기"}
              </span>
            </div>

            <p className="wmt-detail__id">#{selectedItem.requestId}</p>
            <p className="wmt-detail__created">
              접수일 {formatCreatedAt(selectedItem.createdAt)}
            </p>

            {/* 고객 정보 */}
            <div className="wmt-detail__section">
              <p className="wmt-detail__section-label">고객 정보</p>
              <div className="wmt-detail__row">
                <span>{selectedItem.customerName} 고객</span>
                <span className="wmt-detail__phone">
                  <Phone size={11} /> {selectedItem.customerPhone}
                </span>
              </div>
            </div>

            {/* 제품 정보 */}
            <div className="wmt-detail__section">
              <p className="wmt-detail__section-label">제품 정보</p>
              <p className="wmt-detail__value">
                {selectedItem.productName} ({selectedItem.modelNo ?? "-"})
              </p>
            </div>

            {/* 담당 기사 */}
            <div className="wmt-detail__section">
              <div className="wmt-detail__section-header">
                <p className="wmt-detail__section-label">담당 기사</p>
              </div>
              <div className="wmt-detail__engineer-card">
                <Avatar
                  name={selectedItem.engineerName}
                  profileImageUrl={selectedItem.engineerImg}
                  size={36}
                />
                <div>
                  <p className="wmt-detail__engineer-name">
                    {selectedItem.engineerName ?? "-"}
                    {selectedItem.engineerRating != null && (
                      <span className="wmt-detail__rating">
                        {" "}
                        ⭐ {selectedItem.engineerRating}
                      </span>
                    )}
                  </p>
                  {selectedItem.engineerPhone && (
                    <p className="wmt-detail__engineer-phone">
                      {selectedItem.engineerPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 예약 정보 */}
            <div className="wmt-detail__section">
              <p className="wmt-detail__section-label">예약 정보</p>
              <p className="wmt-detail__value">
                {formatVisitDateTime(
                  selectedItem.visitDate,
                  selectedItem.visitTime,
                )}
              </p>
              <p className="wmt-detail__address">{selectedItem.visitAddress}</p>
            </div>

            {/* 진행 현황 스텝 */}
            <div className="wmt-detail__section">
              <p className="wmt-detail__section-label">진행 현황</p>
              <div className="wmt-steps">
                {WORK_STEPS.map((step, i) => {
                  const isDone = i < selectedStepIdx;
                  const isCurrent = i === selectedStepIdx;
                  const stepTime = selectedItem.stepTimes?.[step.key];
                  return (
                    <div key={step.key} className="wmt-step-item">
                      <div
                        className={`wmt-step-dot ${isDone ? "wmt-step-dot--done" : ""} ${isCurrent ? "wmt-step-dot--current" : ""}`}
                      />
                      {i < WORK_STEPS.length - 1 && (
                        <div
                          className={`wmt-step-line ${isDone ? "wmt-step-line--done" : ""}`}
                        />
                      )}
                      <span
                        className={`wmt-step-label ${isDone ? "wmt-step-label--done" : ""} ${isCurrent ? "wmt-step-label--current" : ""}`}
                      >
                        {step.label}
                      </span>
                      {stepTime && (
                        <span className="wmt-step-time">{stepTime}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 단계별 로그 (해당 건의 전체 이력에서 requestId로 필터링) */}
            {(() => {
              const itemLogs = statusLogs.filter(
                (l) => l.requestId === selectedItem.requestId,
              );
              if (itemLogs.length === 0) return null;
              return (
                <div className="wmt-detail__section">
                  <p className="wmt-detail__section-label">단계별 로그</p>
                  <div className="wmt-logs">
                    {itemLogs.map((log) => (
                      <div key={log.logId} className="wmt-log-item">
                        <span className="wmt-log-time">
                          {log.changedAt?.slice(11, 16)}
                        </span>
                        <div>
                          <p className="wmt-log-label">
                            {STATUS_LOG_MAP[log.toStatus]?.label ??
                              log.toStatus}
                          </p>
                          <p className="wmt-log-desc">{log.memo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </aside>
        )}
      </div>
    </div>
  );
}
