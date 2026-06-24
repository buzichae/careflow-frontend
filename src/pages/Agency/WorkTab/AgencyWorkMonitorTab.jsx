import { useState, useEffect } from "react";
import {
  ClipboardList, Clock, Wrench, CheckCircle, UserCheck,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, MoreVertical, RefreshCw, Phone, 
} from "lucide-react";
import "../../../styles/Agency/WorkTab/AgencyWorkMonitorTab.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/agency/as-assignments/in-progress?page=0&size=10
// as_assignments WHERE status IN (ACCEPTED, COMPLETED)
// + as_requests + appliances + users(고객) + engineer_profiles JOIN
// + as_status_logs (request_id 기준 최신 로그)
//
// 실시간 갱신: SSE /api/sse/agency/{agencyId}/work-status 구독
// or 자동 polling (현재 구현)
// ──────────────────────────────────────────

// ──────────────────────────────────────────
// as_status_logs.to_status ENUM 기준으로 진행 상태 매핑
// DB ENUM: WAITING / ENGINEER_DEPARTED / ENGINEER_ARRIVED / IN_PROGRESS / COMPLETED
// ──────────────────────────────────────────
const STATUS_LOG_MAP = {
  WAITING:           { label: "방문 대기",   type: "waiting",  stepIdx: 1 },
  ENGINEER_DEPARTED: { label: "기사 이동 중", type: "moving",   stepIdx: 2 },
  ENGINEER_ARRIVED:  { label: "기사 도착",   type: "arrived",  stepIdx: 3 },
  IN_PROGRESS:       { label: "작업 진행 중", type: "working",  stepIdx: 4 },
  COMPLETED:         { label: "작업 완료",   type: "done",     stepIdx: 5 },
};



// 통계 카드 - as_status_logs 기반 집계
const statCards = [
  { label: "전체 진행 중",   value: 25, icon: ClipboardList, color: "purple", barColor: "#5B4FF5" },
  { label: "기사 이동 중",  value: 8,  icon: Clock,         color: "blue",   barColor: "#2563eb" },
  { label: "작업 진행 중",  value: 14, icon: Wrench,        color: "green",  barColor: "#16a34a" },
  { label: "고객 확인 대기",value: 3,  icon: UserCheck,   color: "orange", barColor: "#d97706" },
  { label: "완료",          value: 18, icon: CheckCircle,        color: "gray",   barColor: "#aaa"    },
];

// ──────────────────────────────────────────
//  진행 현황 스텝 - as_status_logs.to_status ENUM 기준
// as_requests.status 흐름과 별개로 기사 현장 단계 추적
// ──────────────────────────────────────────
const WORK_STEPS = [
  { key: "ACCEPTED",          label: "배정 완료" },  // as_assignments.status
  { key: "WAITING",           label: "방문 대기" },  // as_status_logs.to_status
  { key: "ENGINEER_DEPARTED", label: "이동 중"   },
  { key: "ENGINEER_ARRIVED",  label: "도착"      },
  { key: "IN_PROGRESS",       label: "작업 중"   },
  { key: "COMPLETED",         label: "완료"      },
];

// ──────────────────────────────────────────
// TODO: API 연동 포인트 1
// GET /api/agency/as-assignments/in-progress
// 응답 필드:
//   assignmentId, requestId, assignMethod (DB: assign_method ENUM('AUTO','MANUAL'))
//   customerId, customerName, customerPhone
//   productName, modelNo
//   engineerName, engineerPhone, engineerRating, engineerImg
//   latestLogStatus (as_status_logs 최신 to_status)
//   assignmentStatus (as_assignments.status)
//   updatedAt, visitDate, visitAddress
//   logs: [{ toStatus, memo, createdAt }]  ← as_status_logs
//   stepTimes: { ACCEPTED, WAITING, ENGINEER_DEPARTED, ... }
// ──────────────────────────────────────────
const monitorList = [
  {
    id: 1,
    requestId: "AS-20240618-0001", createdAt: "2024.06.18",
    customer: "김민지", phone: "010-1234-5678",
    productName: "LG 디오스 냉장고", modelNo: "M874GBB231",
    engineerName: "김철수 기사", engineerImg: null,
    engineerRating: 4.9, engineerPhone: "010-1111-2222",
    assignMethod: "MANUAL",             // as_requests.assign_type → MANUAL
    assignmentStatus: "ACCEPTED",       // as_assignments.status
    latestLogStatus: "IN_PROGRESS",     // as_status_logs 최신 to_status
    updatedAt: "2024.06.18 10:20",
    visitDate: "2024.06.18 (화) 10:00 ~ 12:00",
    address: "서울특별시 강남구 역삼로 123-45",
    logs: [
      { toStatus: "IN_PROGRESS",       memo: "김철수 기사가 작업을 시작했습니다.", createdAt: "2024-06-18 10:00" },
      { toStatus: "ENGINEER_ARRIVED",  memo: "김철수 기사가 도착했습니다.",       createdAt: "2024-06-18 09:50" },
      { toStatus: "ENGINEER_DEPARTED", memo: "김철수 기사가 출발했습니다.",       createdAt: "2024-06-18 09:35" },
      { toStatus: "WAITING",           memo: "배정이 완료됐습니다.",             createdAt: "2024-06-18 09:10" },
    ],
    stepTimes: {
      ACCEPTED:          "09:10",
      WAITING:           "09:10",
      ENGINEER_DEPARTED: "09:35",
      ENGINEER_ARRIVED:  "09:50",
      IN_PROGRESS:       "10:00",
      COMPLETED:         null,
    },
  },
  {
    id: 2,
    requestId: "AS-20240618-0002", createdAt: "2024.06.18",
    customer: "이영희", phone: "010-2345-6789",
    productName: "삼성 세탁기", modelNo: "WF21T6500KP",
    engineerName: "박민수 기사", engineerImg: null,
    engineerRating: 4.8, engineerPhone: "010-2222-3333",
    assignMethod: "AUTO",
    assignmentStatus: "ACCEPTED",
    latestLogStatus: "ENGINEER_DEPARTED",
    updatedAt: "2024.06.18 09:50",
    visitDate: "2024.06.18 (화) 14:00 ~ 16:00",
    address: "서울특별시 송파구 올림픽로 100",
    logs: [
      { toStatus: "ENGINEER_DEPARTED", memo: "박민수 기사가 출발했습니다.", createdAt: "2024-06-18 09:50" },
      { toStatus: "WAITING",           memo: "배정이 완료됐습니다.",       createdAt: "2024-06-18 09:30" },
    ],
    stepTimes: {
      ACCEPTED: "09:30", WAITING: "09:30",
      ENGINEER_DEPARTED: "09:50", ENGINEER_ARRIVED: null, IN_PROGRESS: null, COMPLETED: null,
    },
  },
  {
    id: 3,
    requestId: "AS-20240618-0003", createdAt: "2024.06.18",
    customer: "박준호", phone: "010-3456-7890",
    productName: "LG 에어컨", modelNo: "FQ18HDWHRN",
    engineerName: "이영호 기사", engineerImg: null,
    engineerRating: 4.7, engineerPhone: "010-3333-4444",
    assignMethod: "MANUAL",
    assignmentStatus: "ACCEPTED",
    latestLogStatus: "IN_PROGRESS",
    updatedAt: "2024.06.18 10:10",
    visitDate: "2024.06.18 (화) 16:00 ~ 18:00",
    address: "서울특별시 강동구 천호대로 200",
    logs: [
      { toStatus: "IN_PROGRESS", memo: "이영호 기사가 작업을 시작했습니다.", createdAt: "2024-06-18 10:10" },
    ],
    stepTimes: {
      ACCEPTED: "09:40", WAITING: "09:40",
      ENGINEER_DEPARTED: "10:00", ENGINEER_ARRIVED: "10:05", IN_PROGRESS: "10:10", COMPLETED: null,
    },
  },
  {
    id: 4,
    requestId: "AS-20240618-0004", createdAt: "2024.06.18",
    customer: "최서연", phone: "010-4567-8901",
    productName: "삼성 QLED TV", modelNo: "KQ55QC67AFXKR",
    engineerName: "최지현 기사", engineerImg: null,
    engineerRating: 4.6, engineerPhone: "010-4444-5555",
    assignMethod: "AUTO",
    assignmentStatus: "COMPLETED",      // as_assignments.status=COMPLETED → 고객 확인 대기
    latestLogStatus: "COMPLETED",       // as_status_logs 최신
    updatedAt: "2024.06.18 09:30",
    visitDate: "2024.06.18 (화) 11:00 ~ 13:00",
    address: "서울특별시 서초구 강남대로 300",
    logs: [
      { toStatus: "COMPLETED", memo: "최지현 기사가 작업을 완료했습니다.", createdAt: "2024-06-18 09:30" },
    ],
    stepTimes: {
      ACCEPTED: "08:50", WAITING: "08:50",
      ENGINEER_DEPARTED: "09:10", ENGINEER_ARRIVED: "09:20", IN_PROGRESS: "09:20", COMPLETED: "09:30",
    },
  },
  {
    id: 5,
    requestId: "AS-20240618-0005", createdAt: "2024.06.18",
    customer: "정유진", phone: "010-5678-9012",
    productName: "LG 식기세척기", modelNo: "DFB22S",
    engineerName: "정유진 기사", engineerImg: null,
    engineerRating: 4.5, engineerPhone: "010-5555-6666",
    assignMethod: "MANUAL",
    assignmentStatus: "ACCEPTED",
    latestLogStatus: "IN_PROGRESS",
    updatedAt: "2024.06.18 10:35",
    visitDate: "2024.06.18 (화) 15:00 ~ 17:00",
    address: "서울특별시 강남구 테헤란로 50",
    logs: [],
    stepTimes: {
      ACCEPTED: "09:20", WAITING: "09:20",
      ENGINEER_DEPARTED: "10:00", ENGINEER_ARRIVED: null, IN_PROGRESS: "10:35", COMPLETED: null,
    },
  },
  {
    id: 6,
    requestId: "AS-20240618-0006", createdAt: "2024.06.17",
    customer: "이태훈", phone: "010-6789-0123",
    productName: "위니아 김치냉장고", modelNo: "WQ57DGK",
    engineerName: "홍길동 기사", engineerImg: null,
    engineerRating: 4.4, engineerPhone: "010-6666-7777",
    assignMethod: "AUTO",
    assignmentStatus: "ACCEPTED",
    latestLogStatus: "ENGINEER_DEPARTED",
    updatedAt: "2024.06.18 08:55",
    visitDate: "2024.06.18 (화) 13:00 ~ 15:00",
    address: "서울특별시 강북구 미아로 10",
    logs: [],
    stepTimes: {
      ACCEPTED: "08:30", WAITING: "08:30",
      ENGINEER_DEPARTED: "08:55", ENGINEER_ARRIVED: null, IN_PROGRESS: null, COMPLETED: null,
    },
  },
  {
    id: 7,
    requestId: "AS-20240618-0007", createdAt: "2024.06.17",
    customer: "김수현", phone: "010-8901-2345",
    productName: "삼성 에어드레서", modelNo: "DF60A8500KG",
    engineerName: "강이진 기사", engineerImg: null,
    engineerRating: null, engineerPhone: null,
    assignMethod: "MANUAL",
    assignmentStatus: "ACCEPTED",
    latestLogStatus: "IN_PROGRESS",
    updatedAt: "2024.06.18 10:40",
    visitDate: "2024.06.18 (화) 15:00 ~ 17:00",
    address: "서울특별시 마포구 월드컵로 80",
    logs: [],
    stepTimes: {
      ACCEPTED: "09:00", WAITING: "09:00",
      ENGINEER_DEPARTED: "10:00", ENGINEER_ARRIVED: null, IN_PROGRESS: "10:40", COMPLETED: null,
    },
  },
  {
    id: 8,
    requestId: "AS-20240618-0008", createdAt: "2024.06.17",
    customer: "유한나", phone: "010-9012-3456",
    productName: "LG 전기오븐", modelNo: "ML32WW1",
    engineerName: "이재훈 기사", engineerImg: null,
    engineerRating: 4.3, engineerPhone: "010-7777-8888",
    assignMethod: "AUTO",
    assignmentStatus: "COMPLETED",
    latestLogStatus: "COMPLETED",
    updatedAt: "2024.06.18 09:45",
    visitDate: "2024.06.18 (화) 09:00 ~ 11:00",
    address: "서울특별시 강서구 화곡로 20",
    logs: [],
    stepTimes: {
      ACCEPTED: "08:00", WAITING: "08:00",
      ENGINEER_DEPARTED: "08:30", ENGINEER_ARRIVED: "09:00", IN_PROGRESS: "09:00", COMPLETED: "09:45",
    },
  },
];

function Avatar({ name, profileImageUrl, size = 32 }) {
  return (
    <div className="wmt-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {profileImageUrl ? <img src={profileImageUrl} alt={name} /> : <span>{name?.charAt(0) ?? "?"}</span>}
    </div>
  );
}

// 현재 스텝 인덱스 계산
function getCurrentStepIdx(latestLogStatus, assignmentStatus) {
  if (assignmentStatus === "COMPLETED" || latestLogStatus === "COMPLETED") return 5;
  const map = { WAITING: 1, ENGINEER_DEPARTED: 2, ENGINEER_ARRIVED: 3, IN_PROGRESS: 4 };
  return map[latestLogStatus] ?? 0;
}

export default function AgencyWorkMonitorTab() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  const totalPages = 5;
  const INTERVAL_OPTIONS = [10, 30, 60];

  // 수정 3: SSE 연동 주석 추가 / 현재는 polling
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      // TODO: API 재호출 or SSE 구독
      // SSE: const source = new EventSource(`/api/sse/agency/${agencyId}/work-status`);
      // source.onmessage = (e) => { setMonitorList(JSON.parse(e.data)); };
      console.log(`${refreshInterval}초마다 갱신`);
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  const selectedStatus = selectedItem
    ? STATUS_LOG_MAP[selectedItem.latestLogStatus]
    : null;

  const selectedStepIdx = selectedItem
    ? getCurrentStepIdx(selectedItem.latestLogStatus, selectedItem.assignmentStatus)
    : 0;

  return (
    <div className="wmt">
      {/* 자동 갱신 토글 */}
      <div className="wmt-refresh-bar">
        <div className="wmt-refresh-bar__left">
          <span className="wmt-refresh-label">자동 갱신</span>
          <div
            className={`wmt-toggle ${autoRefresh ? "wmt-toggle--on" : ""}`}
            onClick={() => setAutoRefresh(p => !p)}
          >
            <div className="wmt-toggle__thumb" />
          </div>
        </div>
        <div className="wmt-refresh-select-wrap">
          <div className="wmt-refresh-select" onClick={() => setShowIntervalDropdown(p => !p)}>
            {refreshInterval}초 <ChevronDown size={13} />
          </div>
          {showIntervalDropdown && (
            <div className="wmt-refresh-dropdown">
              {INTERVAL_OPTIONS.map((sec) => (
                <button
                  key={sec}
                  className={`wmt-refresh-dropdown__item ${refreshInterval === sec ? "wmt-refresh-dropdown__item--active" : ""}`}
                  onClick={() => { setRefreshInterval(sec); setShowIntervalDropdown(false); }}
                >
                  {sec}초
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="wmt-stats">
        {statCards.map((s) => (
          <div key={s.label} className="wmt-stat-card">
            <div className={`wmt-stat-card__icon wmt-stat-card__icon--${s.color}`}>
              <s.icon size={18} />
            </div>
            <div className="wmt-stat-card__body">
              <p className="wmt-stat-card__label">{s.label}</p>
              <p className="wmt-stat-card__value">{s.value}<span>건</span></p>
            </div>
            <div className="wmt-stat-card__bar" style={{ background: `${s.barColor}30` }}>
              <div className="wmt-stat-card__bar-fill" style={{ width: `${(s.value / 24) * 100}%`, background: s.barColor }} />
            </div>
          </div>
        ))}
      </div>

      <div className="wmt-body">
        {/* 좌측 테이블 */}
        <div className="wmt-left">
          <div className="wmt-filters">
            <div className="wmt-filter-select"><span>날짜 선택</span><ChevronDown size={13} /></div>
            <div className="wmt-filter-select"><span>전체 지역</span><ChevronDown size={13} /></div>
            <div className="wmt-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
            <div className="wmt-filter-select"><span>전체 브랜드</span><ChevronDown size={13} /></div>
            <div className="wmt-filter-select"><span>담당 기사</span><ChevronDown size={13} /></div>
            <div className="wmt-search">
              <Search size={13} color="#aaa" />
              <input type="text" placeholder="접수번호, 고객명, 제품명 검색" />
            </div>
            <button className="wmt-reset-btn"><RefreshCw size={13} /> 필터 초기화</button>
          </div>

          <div className="wmt-table-meta">
            <span className="wmt-total">진행 작업 목록 (24건)</span>
          </div>

          <div className="wmt-table">
            <div className="wmt-table__header">
              <span>접수번호</span>
              <span>고객</span>
              <span>제품 정보</span>
              <span>담당 기사</span>
              <span>진행 상태</span>
              <span>현재 단계</span>
              <span>업데이트 시간</span>
              <span>액션</span>
            </div>

            {monitorList.map((item) => {
              const s = STATUS_LOG_MAP[item.latestLogStatus] ?? { label: "대기", type: "waiting" };
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`wmt-table__row ${isSelected ? "wmt-table__row--selected" : ""}`}
                >
                  <span className="wmt-table__id-col">
                    <span className="wmt-table__id">{item.requestId}</span>
                    <span className="wmt-table__date">접수일 {item.createdAt}</span>
                  </span>
                  <span className="wmt-table__customer-col">
                    <span className="wmt-table__customer">{item.customer}</span>
                    <span className="wmt-table__phone">{item.phone}</span>
                  </span>
                  <span className="wmt-table__product-col">
                    <span className="wmt-table__product-name">{item.productName}</span>
                    <span className="wmt-table__model">{item.modelNo}</span>
                  </span>
                  <span className="wmt-table__engineer-col">
                    {item.engineerName
                      ? <><Avatar name={item.engineerName} size={26} /><span>{item.engineerName}</span></>
                      : <span className="wmt-table__no-engineer">-</span>
                    }
                  </span>
                  <span>
                    <span className={`wmt-badge wmt-badge--${s.type}`}>{s.label}</span>
                  </span>
                  <span className="wmt-table__step">{s.label}</span>
                  <span className="wmt-table__updated">{item.updatedAt?.slice(5)}</span>
                  <span className="wmt-table__actions" onClick={(e) => e.stopPropagation()}>
                    <button
                     className={`wmt-detail-btn ${selectedItem?.id === item.id ? "wmt-detail-btn--active" : ""}`}
                     onClick={() => setSelectedItem(item)}
                    >
                     상세보기
                    </button>
                    <button className="wmt-more-btn"><MoreVertical size={14} /></button>
                  </span>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          <div className="wmt-pagination">
            <div className="wmt-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {[1,2,3,4,5].map(p => (
                <button key={p} className={currentPage === p ? "wmt-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="wmt-page-size">10개씩 보기 <ChevronDown size={13} /></div>
          </div>

          <div className="wmt-table-meta">
            <span className="wmt-total">오늘 진행 요약</span>
          </div>
          {/* 오늘 진행 요약 */}
          <div className="wmt-today">
            <div className="wmt-today__cards">
              
              {statCards.map((s) => (
                <div key={s.label} className="wmt-today__card">
                  <div className={`wmt-today__icon wmt-today__icon--${s.color}`}><s.icon size={16} /></div>
                  <p className="wmt-today__label">{s.label}</p>
                  <p className="wmt-today__value">{s.value}<span>건</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측 상세 패널 */}
        {selectedItem && (
          <aside className="wmt-detail">
            <div className="wmt-detail__header">
              <span className="wmt-detail__title">작업 상세 정보</span>
              <span className={`wmt-badge wmt-badge--${selectedStatus?.type ?? "waiting"}`}>
                {selectedStatus?.label ?? "대기"}
              </span>
            </div>

            <p className="wmt-detail__id">{selectedItem.requestId}</p>

            {/* 고객 정보 */}
            <div className="wmt-detail__section">
              <p className="wmt-detail__section-label">고객 정보</p>
              <div className="wmt-detail__row">
                <span>{selectedItem.customer} 고객</span>
                <span className="wmt-detail__phone"><Phone size={11} /> {selectedItem.phone}</span>
              </div>
            </div>

            {/* 제품 정보 */}
            <div className="wmt-detail__section">
              <p className="wmt-detail__section-label">제품 정보</p>
              <p className="wmt-detail__value">{selectedItem.productName} ({selectedItem.modelNo})</p>
            </div>

            {/* 담당 기사 */}
            <div className="wmt-detail__section">
              <div className="wmt-detail__section-header">
                <p className="wmt-detail__section-label">담당 기사</p>
                <button className="wmt-detail__engineer-link">기사 정보 보기</button>
              </div>
              <div className="wmt-detail__engineer-card">
                <Avatar name={selectedItem.engineerName} size={36} />
                <div>
                  <p className="wmt-detail__engineer-name">
                    {selectedItem.engineerName ?? "-"}
                    {selectedItem.engineerRating && <span className="wmt-detail__rating"> ⭐ {selectedItem.engineerRating}</span>}
                  </p>
                  {selectedItem.engineerPhone && (
                    <p className="wmt-detail__engineer-phone">{selectedItem.engineerPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 예약 정보 */}
            <div className="wmt-detail__section">
              <p className="wmt-detail__section-label">예약 정보</p>
              <p className="wmt-detail__value">{selectedItem.visitDate}</p>
              <p className="wmt-detail__address">{selectedItem.address}</p>
            </div>

            {/* 수정 2: 진행 현황 - as_status_logs.to_status ENUM 기준 스텝 */}
            <div className="wmt-detail__section">
              <p className="wmt-detail__section-label">진행 현황</p>
              <div className="wmt-steps">
                {WORK_STEPS.map((step, i) => {
                  const isDone = i <= selectedStepIdx - 1;
                  const isCurrent = i === selectedStepIdx - 1;
                  const stepTime = selectedItem.stepTimes?.[step.key];
                  return (
                    <div key={step.key} className="wmt-step-item">
                      <div className={`wmt-step-dot ${isDone ? "wmt-step-dot--done" : ""} ${isCurrent ? "wmt-step-dot--current" : ""}`} />
                      {i < WORK_STEPS.length - 1 && (
                        <div className={`wmt-step-line ${isDone && !isCurrent ? "wmt-step-line--done" : ""}`} />
                      )}
                      <span className={`wmt-step-label ${isCurrent ? "wmt-step-label--current" : ""}`}>{step.label}</span>
                      {stepTime && <span className="wmt-step-time">{stepTime}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 단계별 로그 - as_status_logs 기반 */}
            {selectedItem.logs.length > 0 && (
              <div className="wmt-detail__section">
                <p className="wmt-detail__section-label">단계별 로그</p>
                <div className="wmt-logs">
                  {selectedItem.logs.map((log, i) => (
                    <div key={i} className="wmt-log-item">
                      <span className="wmt-log-time">{log.createdAt?.slice(11, 16)}</span>
                      <div>
                        <p className="wmt-log-label">{STATUS_LOG_MAP[log.toStatus]?.label ?? log.toStatus}</p>
                        <p className="wmt-log-desc">{log.memo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </aside>
        )}
      </div>
    </div>
  );
}