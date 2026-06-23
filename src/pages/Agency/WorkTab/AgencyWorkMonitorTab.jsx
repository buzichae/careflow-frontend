import { useState, useEffect } from "react";
import {
  ClipboardList, Clock, Wrench, CheckCircle, Circle,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, MoreVertical, RefreshCw, Phone, MessageCircle,
} from "lucide-react";
import "../../../styles/Agency/WorkTab/AgencyWorkMonitorTab.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/agency/as-assignments/in-progress?page=0&size=10
// as_assignments WHERE status IN (ACCEPTED, IN_PROGRESS, COMPLETED)
// + as_requests + appliances + users + engineer_profiles JOIN
// 자동 갱신: 30초마다 polling or SSE
// ──────────────────────────────────────────

const PROGRESS_STATUS_MAP = {
  ENGINEER_DEPARTED: { label: "기사 이동 중", type: "moving",   color: "blue"   },
  ENGINEER_ARRIVED:  { label: "작업 진행 중", type: "working",  color: "green"  },
  IN_PROGRESS:       { label: "작업 진행 중", type: "working",  color: "green"  },
  COMPLETED:         { label: "고객 확인 대기", type: "confirm", color: "orange" },
};

const statCards = [
  { label: "진행 중",       value: 24, icon: ClipboardList, color: "purple", barColor: "#5B4FF5" },
  { label: "기사 이동 중",  value: 8,  icon: Clock,         color: "blue",   barColor: "#2563eb" },
  { label: "작업 진행 중",  value: 14, icon: Wrench,        color: "green",  barColor: "#16a34a" },
  { label: "고객 확인 대기",value: 3,  icon: CheckCircle,   color: "orange", barColor: "#d97706" },
  { label: "완료",          value: 18, icon: Circle,        color: "gray",   barColor: "#aaa"    },
];

const monitorList = [
  { id: 1, requestId: "AS-20240618-0001", createdAt: "2024.06.18", customer: "김민지",  phone: "010-1234-5678", productName: "LG 디오스 냉장고",   modelNo: "M874GBB231",    engineerName: "김철수 기사", engineerImg: null, progressStatus: "IN_PROGRESS",       currentStep: "작업 중",  updatedAt: "2024.06.18 10:20", engineerRating: 4.9, engineerPhone: "010-1111-2222", visitDate: "2024.06.18 (화) 10:00 ~ 12:00", address: "서울특별시 강남구 역삼로 123-45",
    logs: [
      { time: "10:00", label: "작업 시작", desc: "김철수 기사가 작업을 시작했습니다." },
      { time: "09:35", label: "기사 이동 시작", desc: "김철수 기사가 이동을 시작했습니다." },
      { time: "09:10", label: "작업 배정", desc: "김철수 기사에게 배정됐습니다." },
      { time: "09:00", label: "접수 완료", desc: "A/S 접수가 완료됐습니다." },
    ],
    steps: ["접수", "배정", "이동 중", "작업 중", "완료"],
    currentStepIdx: 3,
    stepTimes: ["06.18 09:00", "06.18 09:10", "06.18 09:35", "06.18 10:00", null],
  },
  { id: 2, requestId: "AS-20240618-0002", createdAt: "2024.06.18", customer: "이영희",  phone: "010-2345-6789", productName: "삼성 세탁기",        modelNo: "WF21T6500KP",   engineerName: "박민수 기사", engineerImg: null, progressStatus: "ENGINEER_DEPARTED", currentStep: "이동 중",  updatedAt: "2024.06.18 09:50", engineerRating: 4.8, engineerPhone: "010-2222-3333", visitDate: "2024.06.18 (화) 14:00 ~ 16:00", address: "서울특별시 송파구 올림픽로 100",
    logs: [
      { time: "09:50", label: "기사 이동 시작", desc: "박민수 기사가 이동을 시작했습니다." },
      { time: "09:30", label: "작업 배정", desc: "박민수 기사에게 배정됐습니다." },
    ],
    steps: ["접수", "배정", "이동 중", "작업 중", "완료"],
    currentStepIdx: 2,
    stepTimes: ["06.18 09:10", "06.18 09:30", "06.18 09:50", null, null],
  },
  { id: 3, requestId: "AS-20240618-0003", createdAt: "2024.06.18", customer: "박준호",  phone: "010-3456-7890", productName: "LG 에어컨",           modelNo: "FQ18HDWHRN",   engineerName: "이영호 기사", engineerImg: null, progressStatus: "IN_PROGRESS",       currentStep: "작업 중",  updatedAt: "2024.06.18 10:10", engineerRating: 4.7, engineerPhone: "010-3333-4444", visitDate: "2024.06.18 (화) 16:00 ~ 18:00", address: "서울특별시 강동구 천호대로 200",
    logs: [{ time: "10:10", label: "작업 시작", desc: "이영호 기사가 작업을 시작했습니다." }],
    steps: ["접수", "배정", "이동 중", "작업 중", "완료"],
    currentStepIdx: 3,
    stepTimes: ["06.18 09:20", "06.18 09:40", "06.18 10:00", "06.18 10:10", null],
  },
  { id: 4, requestId: "AS-20240618-0004", createdAt: "2024.06.18", customer: "최서연",  phone: "010-4567-8901", productName: "삼성 QLED TV",        modelNo: "KQ55QC67AFXKR", engineerName: "최지현 기사", engineerImg: null, progressStatus: "COMPLETED",         currentStep: "고객 확인", updatedAt: "2024.06.18 09:30", engineerRating: 4.6, engineerPhone: "010-4444-5555", visitDate: "2024.06.18 (화) 11:00 ~ 13:00", address: "서울특별시 서초구 강남대로 300",
    logs: [{ time: "09:30", label: "작업 완료", desc: "최지현 기사가 작업을 완료했습니다." }],
    steps: ["접수", "배정", "이동 중", "작업 중", "완료"],
    currentStepIdx: 4,
    stepTimes: ["06.18 08:30", "06.18 08:50", "06.18 09:10", "06.18 09:20", "06.18 09:30"],
  },
  { id: 5, requestId: "AS-20240618-0005", createdAt: "2024.06.18", customer: "정유진",  phone: "010-5678-9012", productName: "LG 식기세척기",       modelNo: "DFB22S",        engineerName: "정유진 기사", engineerImg: null, progressStatus: "IN_PROGRESS",       currentStep: "작업 중",  updatedAt: "2024.06.18 10:35", engineerRating: 4.5, engineerPhone: "010-5555-6666", visitDate: "2024.06.18 (화) 15:00 ~ 17:00", address: "서울특별시 강남구 테헤란로 50",
    logs: [],
    steps: ["접수", "배정", "이동 중", "작업 중", "완료"],
    currentStepIdx: 3,
    stepTimes: ["06.18 09:00", "06.18 09:20", "06.18 10:00", "06.18 10:35", null],
  },
  { id: 6, requestId: "AS-20240618-0006", createdAt: "2024.06.17", customer: "이태훈",  phone: "010-6789-0123", productName: "위니아 김치냉장고",   modelNo: "WQ57DGK",       engineerName: "홍길동 기사", engineerImg: null, progressStatus: "ENGINEER_DEPARTED", currentStep: "이동 중",  updatedAt: "2024.06.18 08:55", engineerRating: 4.4, engineerPhone: "010-6666-7777", visitDate: "2024.06.18 (화) 13:00 ~ 15:00", address: "서울특별시 강북구 미아로 10",
    logs: [],
    steps: ["접수", "배정", "이동 중", "작업 중", "완료"],
    currentStepIdx: 2,
    stepTimes: ["06.17 14:00", "06.17 14:30", "06.18 08:55", null, null],
  },
  { id: 7, requestId: "AS-20240618-0007", createdAt: "2024.06.17", customer: "김수현",  phone: "010-8901-2345", productName: "삼성 에어드레서",     modelNo: "DF60A8500KG",   engineerName: "강이진 기사",          engineerImg: null, progressStatus: "IN_PROGRESS",       currentStep: "작업 중",  updatedAt: "2024.06.18 10:40", engineerRating: null, engineerPhone: null, visitDate: "2024.06.18 (화) 15:00 ~ 17:00", address: "서울특별시 마포구 월드컵로 80",
    logs: [],
    steps: ["접수", "배정", "이동 중", "작업 중", "완료"],
    currentStepIdx: 3,
    stepTimes: ["06.17 15:00", "06.17 15:20", "06.18 10:00", "06.18 10:40", null],
  },
  { id: 8, requestId: "AS-20240618-0008", createdAt: "2024.06.17", customer: "유한나",  phone: "010-9012-3456", productName: "LG 전기오븐",         modelNo: "ML32WW1",       engineerName: "이재훈 기사", engineerImg: null, progressStatus: "COMPLETED",         currentStep: "고객 확인", updatedAt: "2024.06.18 09:45", engineerRating: 4.3, engineerPhone: "010-7777-8888", visitDate: "2024.06.18 (화) 09:00 ~ 11:00", address: "서울특별시 강서구 화곡로 20",
    logs: [],
    steps: ["접수", "배정", "이동 중", "작업 중", "완료"],
    currentStepIdx: 4,
    stepTimes: ["06.17 16:00", "06.17 16:30", "06.18 08:30", "06.18 09:00", "06.18 09:45"],
  },
];

function Avatar({ name, profileImageUrl, size = 32 }) {
  return (
    <div className="wmt-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {profileImageUrl ? <img src={profileImageUrl} alt={name} /> : <span>{name?.charAt(0) ?? "?"}</span>}
    </div>
  );
}

export default function AgencyWorkMonitorTab() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(monitorList[0]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);
  const totalPages = 5;

  const INTERVAL_OPTIONS = [10, 30, 60];

  // 자동 갱신
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      // TODO: API 재호출
      console.log(`${refreshInterval}초마다 갱신`);
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  const selectedStatus = selectedItem ? PROGRESS_STATUS_MAP[selectedItem.progressStatus] : null;

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
          <div
            className="wmt-refresh-select"
            onClick={() => setShowIntervalDropdown(p => !p)}
          >
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
          {/* 필터 */}
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

          {/* 테이블 */}
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
              const s = PROGRESS_STATUS_MAP[item.progressStatus] ?? { label: item.currentStep, type: "working", color: "green" };
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`wmt-table__row ${isSelected ? "wmt-table__row--selected" : ""}`}
                  onClick={() => setSelectedItem(item)}
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
                  <span className="wmt-table__step">{item.currentStep}</span>
                  <span className="wmt-table__updated">{item.updatedAt?.slice(5)}</span>
                  <span className="wmt-table__actions" onClick={(e) => e.stopPropagation()}>
                    <button className="wmt-detail-btn">상세보기</button>
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
              <span className={`wmt-badge wmt-badge--${selectedStatus?.type ?? "working"}`}>
                {selectedStatus?.label ?? selectedItem.currentStep}
              </span>
            </div>

            {/* 접수번호 */}
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

            {/* 진행 현황 스텝 */}
            <div className="wmt-detail__section">
              <p className="wmt-detail__section-label">진행 현황</p>
              <div className="wmt-steps">
                {selectedItem.steps.map((step, i) => (
                  <div key={i} className="wmt-step-item">
                    <div className={`wmt-step-dot ${i <= selectedItem.currentStepIdx ? "wmt-step-dot--done" : ""} ${i === selectedItem.currentStepIdx ? "wmt-step-dot--current" : ""}`} />
                    {i < selectedItem.steps.length - 1 && (
                      <div className={`wmt-step-line ${i < selectedItem.currentStepIdx ? "wmt-step-line--done" : ""}`} />
                    )}
                    <span className={`wmt-step-label ${i === selectedItem.currentStepIdx ? "wmt-step-label--current" : ""}`}>{step}</span>
                    {selectedItem.stepTimes[i] && (
                      <span className="wmt-step-time">{selectedItem.stepTimes[i]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 단계별 로그 */}
            {selectedItem.logs.length > 0 && (
              <div className="wmt-detail__section">
                <p className="wmt-detail__section-label">단계별 로그</p>
                <div className="wmt-logs">
                  {selectedItem.logs.map((log, i) => (
                    <div key={i} className="wmt-log-item">
                      <span className="wmt-log-time">{log.time}</span>
                      <div>
                        <p className="wmt-log-label">{log.label}</p>
                        <p className="wmt-log-desc">{log.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 하단 버튼 */}
            <div className="wmt-detail__footer">
              <button className="wmt-detail__footer-btn wmt-detail__footer-btn--primary">
                <MessageCircle size={13} /> 메시지 보내기
              </button>
              <button className="wmt-detail__footer-btn wmt-detail__footer-btn--outline">
                <Phone size={13} /> 전화 연결
              </button>
              <div className="wmt-detail__footer-dropdown">
                작업 변경 <ChevronDown size={13} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}