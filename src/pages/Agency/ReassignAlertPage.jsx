import { useState } from "react";
import { AlertTriangle, Clock, X, Star,ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/Agency/ReassignAlertPage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/agency/as-assignments/reassign-targets
// as_assignments WHERE status=REJECTED OR (status=WAITING AND assigned_at < NOW()-30min)
// ──────────────────────────────────────────
 
const REASSIGN_LIST = [
  { id: 1, requestId: "AS-001", customer: "김민지", product: "LG 냉장고",    currentEngineer: "김철수", reason: "REJECTED", elapsedMin: 5  },
  { id: 2, requestId: "AS-002", customer: "박서연", product: "삼성 세탁기",  currentEngineer: "이영호", reason: "OVERTIME", elapsedMin: 34 },
  { id: 3, requestId: "AS-003", customer: "최민준", product: "LG 에어컨",    currentEngineer: "박민수", reason: "REJECTED", elapsedMin: 12 },
];
 
const REASON_MAP = {
  REJECTED: { label: "기사 거절",      color: "red"    },
  OVERTIME: { label: "응답 시간 초과", color: "orange" },
};
 
// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/agency/engineers/recommended?requestId=xxx
// ──────────────────────────────────────────
const RECOMMENDED_ENGINEERS = [
  { id: 1, name: "박민수", brand: "LG",   rating: 4.9, availableFrom: "13:00 이후", profileImageUrl: null, isLmsCompleted: true  },
  { id: 2, name: "이영호", brand: "LG",   rating: 4.3, availableFrom: "즉시 가능",  profileImageUrl: null, isLmsCompleted: true  },
];
 
function Avatar({ name, size = 32 }) {
  return (
    <div className="rap-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      <span>{name?.charAt(0) ?? "?"}</span>
    </div>
  );
}
 
// 재배정 모달
function ReassignModal({ onClose, item }) {
  const [selected, setSelected] = useState(null);
 
  const reason = REASON_MAP[item.reason];
 
  const handleManual = () => {
    if (!selected) return;
    // await axios.post("/api/agency/as-assignments/reassign", {
    //   requestId: item.requestId,
    //   newEngineerId: selected,
    //   assignMethod: "MANUAL",
    // });
    alert("선택 배정 완료");
    onClose();
  };
 
  const handleAuto = () => {
    // await axios.post("/api/agency/as-assignments/reassign/auto", {
    //   requestId: item.requestId,
    //   assignMethod: "AUTO",
    // });
    alert("자동 재배정 요청");
    onClose();
  };
 
  return (
    <div className="rap-overlay" onClick={onClose}>
      <div className="rap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rap-modal__header">
          <h2 className="rap-modal__title">재배정</h2>
          <button className="rap-modal__close" onClick={onClose}><X size={16} /></button>
        </div>
 
        <div className="rap-modal__body">
          {/* 접수 정보 */}
          <div className="rap-modal__info-grid">
            <div className="rap-modal__info-item">
              <span className="rap-modal__info-label">접수번호</span>
              <span className="rap-modal__info-value rap-modal__info-value--id">{item.requestId}</span>
            </div>
            <div className="rap-modal__info-item">
              <span className="rap-modal__info-label">고객</span>
              <span className="rap-modal__info-value">{item.customer}</span>
            </div>
            <div className="rap-modal__info-item">
              <span className="rap-modal__info-label">제품</span>
              <span className="rap-modal__info-value">{item.product}</span>
            </div>
            <div className="rap-modal__info-item">
              <span className="rap-modal__info-label">재배차 사유</span>
              <span className={`rap-reason-badge rap-reason-badge--${item.reason.toLowerCase()}`}>
                {reason.label}
              </span>
            </div>
            <div className="rap-modal__info-item rap-modal__info-item--full">
              <span className="rap-modal__info-label">기존 기사</span>
              <div className="rap-modal__engineer-row">
                <Avatar name={item.currentEngineer} size={28} />
                <span className="rap-modal__info-value">{item.currentEngineer}</span>
              </div>
            </div>
          </div>
 
          {/* 추천 기사 */}
          <div className="rap-modal__section">
            <h3 className="rap-modal__section-title">추천 기사</h3>
            <div className="rap-modal__engineer-table">
              <div className="rap-modal__engineer-header">
                <span></span>
                <span>기사</span>
                <span>전문 브랜드</span>
                <span>평점</span>
                <span>오늘 가능 시간</span>
              </div>
              {RECOMMENDED_ENGINEERS.map((e) => (
                <div
                  key={e.id}
                  className={`rap-modal__engineer-row-item ${selected === e.id ? "rap-modal__engineer-row-item--selected" : ""}`}
                  onClick={() => setSelected(e.id)}
                >
                  <input type="radio" readOnly checked={selected === e.id} />
                  <span className="rap-modal__engineer-name-col">
                    <Avatar name={e.name} size={28} />
                    <span className="rap-modal__engineer-name">{e.name}</span>
                  </span>
                  <span>{e.brand}</span>
                  <span className="rap-modal__rating"><Star size={11} /> {e.rating}</span>
                  <span className="rap-modal__avail">{e.availableFrom}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        <div className="rap-modal__footer">
          <button className="rap-modal__btn rap-modal__btn--ghost" onClick={onClose}>취소</button>
          <div className="rap-modal__footer-right">
            <button className="rap-modal__btn rap-modal__btn--secondary" onClick={handleAuto}>자동 재배정</button>
            <button className="rap-modal__btn rap-modal__btn--primary" disabled={!selected} onClick={handleManual}>선택 배정</button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
// 메인 페이지
export default function ReassignAlertPage() {
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();
 
  const rejectedCount = REASSIGN_LIST.filter((i) => i.reason === "REJECTED").length;
  const overtimeCount = REASSIGN_LIST.filter((i) => i.reason === "OVERTIME").length;
 
  return (
    <div className="rap">
      {/* 뒤로가기 */}
      <button className="rap__back-btn" onClick={() => navigate("/agency/work", { state: { tab: "배정 관리" } })}>
       <ChevronLeft size={16} /> 배정 관리로 돌아가기
      </button>
 
      {/* 헤더 */}
      <div className="rap__header">
        <div className="rap__title-row">
          <AlertTriangle size={18} color="#dc2626" />
          <h2 className="rap__title">재배차 알림</h2>
          <span className="rap__count-badge">{REASSIGN_LIST.length}건</span>
        </div>
        <div className="rap__summary">
          <span className="rap__summary-item rap__summary-item--red">⚠ 기사 거절 {rejectedCount}건</span>
          <span className="rap__summary-item rap__summary-item--orange">⚠ 응답 시간 초과 {overtimeCount}건</span>
        </div>
      </div>
 
      {/* 목록 */}
      <div className="rap__table">
        <div className="rap__table-header">
          <span>접수번호</span>
          <span>고객</span>
          <span>제품</span>
          <span>현재 기사</span>
          <span>발생 사유</span>
          <span>경과 시간</span>
          <span>액션</span>
        </div>
        {REASSIGN_LIST.map((item) => {
          const reason = REASON_MAP[item.reason];
          return (
            <div key={item.id} className="rap__table-row">
              <span className="rap__id">{item.requestId}</span>
              <span>{item.customer}</span>
              <span>{item.product}</span>
              <span className="rap__engineer-col">
                <Avatar name={item.currentEngineer} size={26} />
                <span>{item.currentEngineer}</span>
              </span>
              <span>
                <span className={`rap__reason-badge rap__reason-badge--${item.reason.toLowerCase()}`}>
                  {reason.label}
                </span>
              </span>
              <span className={`rap__elapsed ${item.reason === "OVERTIME" ? "rap__elapsed--warn" : ""}`}>
                <Clock size={11} /> {item.elapsedMin}분
              </span>
              <span>
                <button className="rap__reassign-btn" onClick={() => setSelectedItem(item)}>재배정</button>
              </span>
            </div>
          );
        })}
      </div>
 
      {/* 하단 요약 */}
      <div className="rap__footer-summary">
        <span>총 재배차 대상 : <strong>{REASSIGN_LIST.length}건</strong></span>
        <span>기사 거절 : <strong>{rejectedCount}건</strong></span>
        <span>응답 시간 초과 : <strong>{overtimeCount}건</strong></span>
      </div>
 
      {/* 재배정 모달 */}
      {selectedItem && (
        <ReassignModal onClose={() => setSelectedItem(null)} item={selectedItem} />
      )}
    </div>
  );
}
