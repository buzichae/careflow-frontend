import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ChevronDown, ChevronRight, X,
  User, Phone,  Calendar, Clock,
  MapPin,  CheckCircle, 
} from "lucide-react";
import "../../styles/Engineer/Engineerworkpage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/assignments?status=&page=0&size=10
// as_assignments WHERE engineer_id = 로그인기사
// + as_requests + appliances + users(고객) + symptoms JOIN
// + as_status_logs 최신 to_status
// + expected_repair_costs (예상 수리 비용)
//
// 수락: PUT /api/engineer/assignments/{assignmentId}/accept
//   → as_assignments.status = ACCEPTED
// 거절: PUT /api/engineer/assignments/{assignmentId}/reject
//   → as_assignments.status = REJECTED, reject_reason 입력
//
// as_assignments.status ENUM: WAITING / ACCEPTED / REJECTED / COMPLETED
// as_status_logs.to_status ENUM: WAITING / ENGINEER_DEPARTED / ENGINEER_ARRIVED / IN_PROGRESS / COMPLETED
// ──────────────────────────────────────────

// 탭 - as_assignments.status 기준
const TABS = [
  { key: "ALL",      label: "전체",    count: 22 },
  { key: "WAITING",  label: "배정 대기", count: 3  },
  { key: "ACCEPTED", label: "진행 중",  count: 5  },
  { key: "COMPLETED",label: "완료",    count: 12 },
  { key: "REJECTED", label: "취소",    count: 2  },
];

// 작업 진행 단계 - as_status_logs.to_status 기준
const WORK_STEPS = [
  { key: "WAITING",            label: "배정 대기", icon: "📋" },
  { key: "ENGINEER_DEPARTED",  label: "출발",     icon: "🚗" },
  { key: "ENGINEER_ARRIVED",   label: "도착",     icon: "📍" },
  { key: "IN_PROGRESS",        label: "작업 중",  icon: "🔧" },
  { key: "COMPLETED",          label: "완료",     icon: "✅" },
];

// 배지 매핑
const ASSIGN_STATUS_MAP = {
  WAITING:   { label: "배정 대기", type: "waiting"  },
  ACCEPTED:  { label: "진행 중",   type: "accepted" },
  REJECTED:  { label: "취소",     type: "rejected" },
  COMPLETED: { label: "완료",     type: "completed"},
};

const LOG_STATUS_MAP = {
  WAITING:           { label: "배정 대기", type: "waiting"   },
  ENGINEER_DEPARTED: { label: "출발",     type: "departed"  },
  ENGINEER_ARRIVED:  { label: "도착",     type: "arrived"   },
  IN_PROGRESS:       { label: "작업 중",  type: "progress"  },
  COMPLETED:         { label: "완료",     type: "completed" },
};

// ──────────────────────────────────────────
// 더미 데이터
// assignStatus → as_assignments.status
// logStatus    → as_status_logs.to_status (최신)
// isNew        → assigned_at 기준 신규 여부
// ──────────────────────────────────────────
const workList = [
  {
    assignmentId: 1,
    requestId: "AS-2024-0601-0001",
    assignStatus: "WAITING",   // as_assignments.status
    logStatus: "WAITING",      // as_status_logs.to_status
    isNew: true,
    productName: "LG 에어컨 벽걸이형", modelNo: "LG 벽걸이 에어컨 SQ07BCAWBS",
    productImageUrl: null, purchaseDate: "2022.06.15", warrantyEnd: "~2025.06.14 (D-348)",
    customerName: "홍길동", customerPhone: "010-1234-5678",
    address: "서울 강남구 테헤란로 123, 101동 1004호",
    symptomDesc: "에어컨이 시원하지 않고 바람이 약해요.",
    scheduledDate: "2024.06.01 (토)", scheduledTime: "10:00 - 11:00",
    visitTime: "오늘 10:00",
    estimatedCostMin: 120000, estimatedCostMax: 180000,
    imageUrl: null,
  },
  {
    assignmentId: 2,
    requestId: "AS-2024-0601-0002",
    assignStatus: "ACCEPTED",
    logStatus: "ENGINEER_DEPARTED",
    isNew: false,
    productName: "삼성 그랑데 세탁기", modelNo: "WF21T6500KP",
    productImageUrl: null, purchaseDate: "2021.03.10", warrantyEnd: "~2024.03.09 (만료)",
    customerName: "이영희", customerPhone: "010-9876-5432",
    address: "경기 성남시 분당구 정자일로 45",
    symptomDesc: "세탁 중 소음 발생",
    scheduledDate: "2024.06.01 (토)", scheduledTime: "09:20",
    visitTime: "09:20 출발",
    estimatedCostMin: 50000, estimatedCostMax: 100000,
    imageUrl: null,
  },
  {
    assignmentId: 3,
    requestId: "AS-2024-0601-0003",
    assignStatus: "ACCEPTED",
    logStatus: "ENGINEER_ARRIVED",
    isNew: false,
    productName: "LG 디오스 냉장고", modelNo: "M874GBB231",
    productImageUrl: null, purchaseDate: "2020.05.20", warrantyEnd: "~2023.05.19 (만료)",
    customerName: "박인수", customerPhone: "010-2222-3333",
    address: "서울 송파구 올림픽로 300, 202동 305호",
    symptomDesc: "냉장 온도 이상",
    scheduledDate: "2024.06.01 (토)", scheduledTime: "10:05",
    visitTime: "10:05 도착",
    estimatedCostMin: 80000, estimatedCostMax: 150000,
    imageUrl: null,
  },
  {
    assignmentId: 4,
    requestId: "AS-2024-0601-0004",
    assignStatus: "ACCEPTED",
    logStatus: "IN_PROGRESS",
    isNew: false,
    productName: "위니아 김치냉장고", modelNo: "WQ57DGK",
    productImageUrl: null, purchaseDate: "2019.11.01", warrantyEnd: "~2022.10.31 (만료)",
    customerName: "최지연", customerPhone: "010-4444-5555",
    address: "인천 연수구 센트럴로 194, 1502호",
    symptomDesc: "냉각 불량",
    scheduledDate: "2024.06.01 (토)", scheduledTime: "11:10",
    visitTime: "11:10 작업 중",
    estimatedCostMin: 70000, estimatedCostMax: 120000,
    imageUrl: null,
  },
  {
    assignmentId: 5,
    requestId: "AS-2024-0601-0005",
    assignStatus: "COMPLETED",
    logStatus: "COMPLETED",
    isNew: false,
    productName: "LG 휘센 스탠드 에어컨", modelNo: "FQ18WDWAS",
    productImageUrl: null, purchaseDate: "2023.01.15", warrantyEnd: "~2026.01.14 (D-593)",
    customerName: "정우성", customerPhone: "010-6666-7777",
    address: "경기 용인시 수지구 죽전로 152",
    symptomDesc: "냉방 약함",
    scheduledDate: "2024.06.01 (토)", scheduledTime: "15:30",
    visitTime: "15:30 완료",
    estimatedCostMin: 60000, estimatedCostMax: 100000,
    imageUrl: null,
  },
  {
    assignmentId: 6,
    requestId: "AS-2024-0531-0099",
    assignStatus: "REJECTED",
    logStatus: "WAITING",
    isNew: false,
    productName: "삼성 비스포크 냉장고", modelNo: "RF85C9141AP",
    productImageUrl: null, purchaseDate: "2023.06.01", warrantyEnd: "~2026.05.31 (D-364)",
    customerName: "김수현", customerPhone: "010-8888-9999",
    address: "서울 강남구 역삼로 100",
    symptomDesc: "문 이상",
    scheduledDate: "어제", scheduledTime: "14:20",
    visitTime: "어제 14:20 취소",
    estimatedCostMin: 30000, estimatedCostMax: 60000,
    imageUrl: null,
  },
];

// 오늘의 실적 더미 (settlements + reviews 집계)
const todayStats = { done: 2, expectedEarning: 280000, avgRating: 4.8 };

function ProductImg({ url, size = 52 }) {
  return (
    <div className="ewp-product-img" style={{ width: size, height: size }}>
      {url ? <img src={url} alt="제품" /> : <span>📦</span>}
    </div>
  );
}

// 작업 진행 단계 컴포넌트
function WorkSteps({ logStatus }) {
  const currentIdx = WORK_STEPS.findIndex(s => s.key === logStatus);
  return (
    <div className="ewp-steps">
      {WORK_STEPS.map((step, i) => {
        const isDone    = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} className="ewp-step">
            <div className={`ewp-step__dot ${isDone ? "ewp-step__dot--done" : ""} ${isCurrent ? "ewp-step__dot--current" : ""}`}>
              <span>{step.icon}</span>
            </div>
            {i < WORK_STEPS.length - 1 && (
              <div className={`ewp-step__line ${i < currentIdx ? "ewp-step__line--done" : ""}`} />
            )}
            <p className={`ewp-step__label ${isCurrent ? "ewp-step__label--current" : ""}`}>{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function EngineerWorkPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState(workList[0]);
  const navigate = useNavigate();

  const filteredList = activeTab === "ALL"
    ? workList
    : workList.filter(w => w.assignStatus === activeTab);

  const handleAccept = (id) => {
    // TODO: PUT /api/engineer/assignments/{id}/accept
    // → as_assignments.status = ACCEPTED
    alert(`${id} 수락`);
  };

  const handleReject = (id) => {
    // TODO: PUT /api/engineer/assignments/{id}/reject
    // → as_assignments.status = REJECTED, reject_reason 필요
    alert(`${id} 거절`);
  };

  return (
    <div className="ewp">
      {/* 헤더 */}
      <div className="ewp-header">
        <h1 className="ewp-header__title">작업 관리</h1>
        <p className="ewp-header__sub">배정된 작업을 확인하고 관리할 수 있습니다.</p>
      </div>

      {/* 탭 - as_assignments.status 기준 */}
      <div className="ewp-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`ewp-tab ${activeTab === tab.key ? "ewp-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && <span className={`ewp-tab__count ${activeTab === tab.key ? "ewp-tab__count--active" : ""}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="ewp-filters">
        <div className="ewp-search">
          <Search size={13} color="#aaa" />
          <input type="text" placeholder="고객명, 연락처, 모델명, 주소 검색" />
        </div>
        <div className="ewp-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
        <div className="ewp-filter-select"><span>전체 지역</span><ChevronDown size={13} /></div>
        <div className="ewp-filter-select"><span>전체 날짜</span><ChevronDown size={13} /></div>
        <div className="ewp-filter-date"><span>2024.06.01 ~ 2024.06.30</span></div>
        <button className="ewp-schedule-btn" onClick={() => navigate("/engineer/my-schedule")}>
  📋     내 근무표 보기
        </button>
      </div>

      <div className="ewp-body">
        {/* 좌측 */}
        <div className="ewp-left">
          {/* 상태 요약 - as_assignments.status 집계 */}
          <div className="ewp-summary">
            <p className="ewp-summary__title">상태 요약</p>
            {TABS.filter(t => t.key !== "ALL").map(t => (
              <div key={t.key} className="ewp-summary__row">
                <span className={`ewp-summary__dot ewp-summary__dot--${t.key.toLowerCase()}`} />
                <span className="ewp-summary__label">{t.label}</span>
                <span className="ewp-summary__count">{t.count}</span>
              </div>
            ))}
            <div className="ewp-summary__divider" />
            <div className="ewp-summary__row">
              <span className="ewp-summary__label ewp-summary__label--total">전체</span>
              <span className="ewp-summary__count ewp-summary__count--total">22</span>
            </div>

            {/* 미니 달력 */}
            <div className="ewp-mini-cal">
              <div className="ewp-mini-cal__header">
                <button><ChevronDown size={13} style={{ transform: "rotate(90deg)" }} /></button>
                <span>2024년 6월</span>
                <button><ChevronDown size={13} style={{ transform: "rotate(-90deg)" }} /></button>
              </div>
              <div className="ewp-mini-cal__grid">
                {["월","화","수","목","금","토","일"].map(d => <span key={d} className="ewp-mini-cal__head">{d}</span>)}
                {[26,27,28,29,30,31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,1,2,3,4,5,6].map((d,i) => (
                  <span key={i} className={`ewp-mini-cal__day ${i < 6 || i > 35 ? "ewp-mini-cal__day--other" : ""} ${d === 1 && i === 6 ? "ewp-mini-cal__day--today" : ""}`}>{d}</span>
                ))}
              </div>
            </div>

            {/* 오늘의 실적 */}
            <div className="ewp-today-stats">
              <p className="ewp-today-stats__title">오늘의 실적</p>
              <div className="ewp-today-stats__row">
                <CheckCircle size={13} color="#16a34a" />
                <span className="ewp-today-stats__label">완료 건수</span>
                <span className="ewp-today-stats__value">{todayStats.done}건</span>
              </div>
              <div className="ewp-today-stats__row">
                <span style={{ fontSize: 13 }}>💰</span>
                <span className="ewp-today-stats__label">예상 수익</span>
                <span className="ewp-today-stats__value">{todayStats.expectedEarning.toLocaleString()}원</span>
              </div>
              <div className="ewp-today-stats__row">
                <span style={{ color: "#f5a623", fontSize: 13 }}>★</span>
                <span className="ewp-today-stats__label">평균 평점</span>
                <span className="ewp-today-stats__value">{todayStats.avgRating} / 5.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* 중앙: 작업 목록 */}
        <div className="ewp-center">
          <div className="ewp-list-header">
            <span className="ewp-list-count">작업 목록 ({filteredList.length})</span>
            <div className="ewp-sort-select">최신순 <ChevronDown size={13} /></div>
          </div>

          <div className="ewp-list">
            {filteredList.map(item => {
              const aStatus = ASSIGN_STATUS_MAP[item.assignStatus];
              const lStatus = LOG_STATUS_MAP[item.logStatus];
              const isSelected = selectedItem?.assignmentId === item.assignmentId;

              return (
                <div
                  key={item.assignmentId}
                  className={`ewp-card ${isSelected ? "ewp-card--selected" : ""} ${item.assignStatus === "WAITING" ? "ewp-card--new" : ""}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <ProductImg url={item.productImageUrl} size={52} />
                  <div className="ewp-card__info">
                    <div className="ewp-card__badges">
                      <span className={`ewp-badge ewp-badge--${aStatus.type}`}>{aStatus.label}</span>
                      {item.isNew && <span className="ewp-badge ewp-badge--new">신규</span>}
                      {item.logStatus !== "WAITING" && (
                        <span className={`ewp-badge ewp-badge--log-${lStatus.type}`}>{lStatus.label}</span>
                      )}
                    </div>
                    <p className="ewp-card__product">{item.productName}</p>
                    <p className="ewp-card__customer">{item.customerName} 고객 · {item.customerPhone}</p>
                    <p className="ewp-card__address">{item.address}</p>
                  </div>
                  <div className="ewp-card__right">
                    <span className={`ewp-card__time ${item.assignStatus === "WAITING" ? "ewp-card__time--urgent" : ""}`}>
                      {item.visitTime}
                    </span>
                    {item.assignStatus === "WAITING" ? (
                      <div className="ewp-card__actions">
                        <button className="ewp-accept-btn" onClick={e => { e.stopPropagation(); handleAccept(item.assignmentId); }}>수락</button>
                        <button className="ewp-reject-btn" onClick={e => { e.stopPropagation(); handleReject(item.assignmentId); }}>거절</button>
                      </div>
                    ) : (
                      <ChevronRight size={16} color="#aaa" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 우측: 작업 상세 - E-10 요구사항 */}
        {selectedItem && (
          <aside className="ewp-detail">
            <div className="ewp-detail__header">
              <div className="ewp-detail__badges">
                <span className={`ewp-badge ewp-badge--${ASSIGN_STATUS_MAP[selectedItem.assignStatus].type}`}>
                  {ASSIGN_STATUS_MAP[selectedItem.assignStatus].label}
                </span>
                {selectedItem.isNew && <span className="ewp-badge ewp-badge--new">신규</span>}
              </div>
              <button className="ewp-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
            </div>

            <div className="ewp-detail__body">
              {/* 제품 + 제목 */}
              <div className="ewp-detail__product-row">
                <ProductImg url={selectedItem.productImageUrl} size={48} />
                <div>
                  <p className="ewp-detail__product">{selectedItem.productName}</p>
                  <p className="ewp-detail__request-id">{selectedItem.requestId}</p>
                </div>
              </div>

              {/* 수락/거절 버튼 (배정 대기 시) */}
              {selectedItem.assignStatus === "WAITING" && (
                <div className="ewp-detail__action-btns">
                  <button className="ewp-detail__accept-btn" onClick={() => handleAccept(selectedItem.assignmentId)}>수락하기</button>
                  <button className="ewp-detail__reject-btn" onClick={() => handleReject(selectedItem.assignmentId)}>거절하기</button>
                </div>
              )}

              {/* 고객 정보 - E-10: 작업 전 고객 연락처 확인 */}
              <div className="ewp-detail__section">
                <div className="ewp-detail__section-header">
                  <p className="ewp-detail__section-label">고객 정보</p>
                  <button className="ewp-detail__link">상세 보기</button>
                </div>
                <div className="ewp-detail__row"><User size={12} /><span>{selectedItem.customerName} 고객</span></div>
                <div className="ewp-detail__row"><Phone size={12} /><span>{selectedItem.customerPhone}</span></div>
                <div className="ewp-detail__row"><MapPin size={12} /><span>{selectedItem.address}</span></div>
              </div>

              {/* 제품 정보 - appliances 테이블 */}
              <div className="ewp-detail__section">
                <p className="ewp-detail__section-label">제품 정보</p>
                <div className="ewp-detail__info-row"><span className="ewp-detail__info-label">모델명</span><span>{selectedItem.modelNo}</span></div>
                <div className="ewp-detail__info-row"><span className="ewp-detail__info-label">구매일</span><span>{selectedItem.purchaseDate}</span></div>
                <div className="ewp-detail__info-row"><span className="ewp-detail__info-label">보증기간</span><span>{selectedItem.warrantyEnd}</span></div>
              </div>

              {/* 증상 - symptoms.name + as_requests.symptom_desc */}
              <div className="ewp-detail__section">
                <p className="ewp-detail__section-label">증상</p>
                <p className="ewp-detail__symptom">{selectedItem.symptomDesc}</p>
                {selectedItem.imageUrl && <img src={selectedItem.imageUrl} alt="증상 사진" className="ewp-detail__symptom-img" />}
              </div>

              {/* 방문 일정 - as_requests.scheduled_date, scheduled_time */}
              <div className="ewp-detail__section">
                <p className="ewp-detail__section-label">방문 일정</p>
                <div className="ewp-detail__row"><Calendar size={12} /><span>{selectedItem.scheduledDate}</span></div>
                <div className="ewp-detail__row"><Clock size={12} /><span>{selectedItem.scheduledTime}</span></div>
              </div>

              {/* 예상 수리 비용 - expected_repair_costs */}
              <div className="ewp-detail__section">
                <p className="ewp-detail__section-label">예상 수리 비용</p>
                <p className="ewp-detail__cost">
                  {selectedItem.estimatedCostMin.toLocaleString()}원 ~ {selectedItem.estimatedCostMax.toLocaleString()}원
                </p>
              </div>

              {/* 작업 진행 단계 - as_status_logs.to_status */}
              <div className="ewp-detail__section">
                <p className="ewp-detail__section-label">작업 진행 단계</p>
                <WorkSteps logStatus={selectedItem.logStatus} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}