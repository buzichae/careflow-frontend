import { useState } from "react";
import { X, Clock, MapPin, Star } from "lucide-react";
import "../../../styles/Agency/Modal/AssignModals.css";

// ──────────────────────────────────────────
// 공통 아바타
// ──────────────────────────────────────────
function Avatar({ name, profileImageUrl, size = 36 }) {
  return (
    <div className="am-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {profileImageUrl
        ? <img src={profileImageUrl} alt={name} />
        : <span>{name?.charAt(0) ?? "?"}</span>
      }
    </div>
  );
}

// ══════════════════════════════════════════
// 1. 변경 모달 (수락 대기 → 기사 변경)
// ══════════════════════════════════════════
// TODO: API
// GET  /api/agency/engineers/recommended?requestId=xxx  → 추천 기사 목록
// POST /api/agency/as-assignments/change
//   { assignmentId, newEngineerId, assignedBy, assignMethod: "MANUAL" }
//   → 기존 assignment status=REJECTED + 신규 INSERT + as_status_logs 기록

const CHANGE_ENGINEERS = [
  { id: 1, name: "김철수", brand: "LG 전문",   region: "강남구 · 2.1km", rating: 4.9, availableFrom: "13:00 이후", profileImageUrl: null, isLmsCompleted: true  },
  { id: 2, name: "박민수", brand: "삼성 전문",  region: "송파구 · 3.4km", rating: 4.8, availableFrom: "14:00 이후", profileImageUrl: null, isLmsCompleted: true  },
  { id: 3, name: "이영호", brand: "LG 전문",   region: "강남구 · 4.0km", rating: 4.7, availableFrom: "09:00 가능", profileImageUrl: null, isLmsCompleted: false },
];

export function ChangeEngineerModal({ onClose, item }) {
  const [selected, setSelected] = useState(null);

  const handleChange = () => {
    if (!selected) return;
    // await axios.post("/api/agency/as-assignments/change", {
    //   assignmentId: item.assignmentId,
    //   newEngineerId: selected,
    //   assignedBy: currentUser.userId,
    //   assignMethod: "MANUAL",
    // });
    alert("기사 변경 완료");
    onClose();
  };

  return (
    <div className="am-overlay" onClick={onClose}>
      <div className="am" onClick={(e) => e.stopPropagation()}>
        <div className="am__header">
          <h2 className="am__title">기사 변경</h2>
          <button className="am__close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="am__body">
          {/* 현재 배정 기사 */}
          <section className="am__section">
            <h3 className="am__section-title">현재 배정 기사</h3>
            <div className="am__current-card">
              <Avatar name={item?.engineerName} profileImageUrl={null} size={40} />
              <div className="am__current-info">
                <p className="am__current-name">{item?.engineerName ?? "-"}</p>
                <div className="am__current-meta">
                  <span className="am__meta-item">
                    <Clock size={11} /> 배정 시간: {item?.assignedAt?.slice(5, 16).replace("-", ".")}
                  </span>
                  <span className="am__meta-item am__meta-item--warn">
                    <Clock size={11} /> 남은 수락 시간: {30 - (item?.overtimeMin ?? 0)}분
                  </span>
                </div>
              </div>
              <span className="am__waiting-badge">수락 대기</span>
            </div>
          </section>

          {/* 추천 기사 목록 */}
          <section className="am__section">
            <h3 className="am__section-title">추천 기사 목록</h3>
            <div className="am__engineer-table">
              <div className="am__engineer-table-header">
                <span></span>
                <span>기사명</span>
                <span>전문 브랜드</span>
                <span>활동 지역</span>
                <span>평점</span>
                <span>오늘 가용 시간</span>
              </div>
              {CHANGE_ENGINEERS.map((e) => (
                <div
                  key={e.id}
                  className={`am__engineer-row ${selected === e.id ? "am__engineer-row--selected" : ""} ${!e.isLmsCompleted ? "am__engineer-row--disabled" : ""}`}
                  onClick={() => e.isLmsCompleted && setSelected(e.id)}
                >
                  <span>
                    <input type="radio" readOnly checked={selected === e.id} disabled={!e.isLmsCompleted} />
                  </span>
                  <span className="am__engineer-name-col">
                    <Avatar name={e.name} profileImageUrl={e.profileImageUrl} size={28} />
                    <span>{e.name}</span>
                    {!e.isLmsCompleted && <span className="am__lms-fail">배차 불가</span>}
                  </span>
                  <span>{e.brand}</span>
                  <span className="am__region"><MapPin size={11} /> {e.region}</span>
                  <span className="am__rating"><Star size={11} /> {e.rating}</span>
                  <span>{e.availableFrom}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="am__footer">
          <button className="am__btn am__btn--ghost" onClick={onClose}>취소</button>
          <button className="am__btn am__btn--primary" disabled={!selected} onClick={handleChange}>
            배정 변경
          </button>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════
// 2. 상세 모달 (배정 완료 → 상세보기)
// ══════════════════════════════════════════
// TODO: API
// GET /api/agency/as-assignments/:assignmentId/detail
// PUT /api/agency/as-assignments/:assignmentId/schedule  → 일정 변경
// DELETE /api/agency/as-assignments/:assignmentId        → 배정 취소 (status=REJECTED + 재배차)
// POST /api/agency/as-assignments/reassign               → 재배정 요청

export function AssignDetailModal({ onClose, item }) {
  return (
    <div className="am-overlay" onClick={onClose}>
      <div className="am" onClick={(e) => e.stopPropagation()}>
        <div className="am__header">
          <h2 className="am__title">배정 상세</h2>
          <button className="am__close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="am__body">
          {/* 접수 정보 */}
          <section className="am__section">
            <h3 className="am__section-title">접수 정보</h3>
            <div className="am__grid">
              <div className="am__field"><span className="am__label">접수번호</span><span className="am__value am__value--id">{item?.displayId}</span></div>
              <div className="am__field"><span className="am__label">접수 유형</span><span className="am__value">{item?.type}</span></div>
            </div>
          </section>

          {/* 고객 정보 */}
          <section className="am__section">
            <h3 className="am__section-title">고객 정보</h3>
            <div className="am__grid">
              <div className="am__field"><span className="am__label">고객명</span><span className="am__value">{item?.customer}</span></div>
              <div className="am__field"><span className="am__label">연락처</span><span className="am__value">{item?.phone}</span></div>
            </div>
          </section>

          {/* 제품 정보 */}
          <section className="am__section">
            <h3 className="am__section-title">제품 정보</h3>
            <div className="am__grid">
              <div className="am__field"><span className="am__label">제품명</span><span className="am__value">{item?.productName}</span></div>
              <div className="am__field"><span className="am__label">모델명</span><span className="am__value">{item?.modelNo}</span></div>
            </div>
          </section>

          {/* 담당 기사 */}
          <section className="am__section">
            <h3 className="am__section-title">담당 기사 정보</h3>
            <div className="am__current-card">
              <Avatar name={item?.engineerName} profileImageUrl={null} size={40} />
              <div className="am__current-info">
                <p className="am__current-name">{item?.engineerName}</p>
                <div className="am__current-meta">
                  <span className="am__meta-item">
                    <Clock size={11} /> 기사 수락 시간: {item?.assignedAt?.slice(5, 16).replace("-", ".")}
                  </span>
                </div>
              </div>
              <span className="am__accepted-badge">수락 완료</span>
            </div>
          </section>

          {/* 예약 일정 */}
          <section className="am__section">
            <h3 className="am__section-title">예약 일정</h3>
            <div className="am__grid">
              <div className="am__field am__field--full">
                <span className="am__label">방문 일정</span>
                <span className="am__value">{item?.visitDate} {item?.startTime} ~ {item?.endTime}</span>
              </div>
            </div>
          </section>

          {/* 안내 */}
          <div className="am__notice">
            ⚠ 기사가 이미 수락한 상태입니다. 변경 시 기사에게 알림이 발송됩니다.
          </div>
        </div>

        <div className="am__footer">
          <button className="am__btn am__btn--ghost" onClick={onClose}>닫기</button>
          <div className="am__footer-right">
            <button className="am__btn am__btn--outline">일정 변경</button>
            <button className="am__btn am__btn--danger">배정 취소</button>
            <button className="am__btn am__btn--secondary">재배정 요청</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════
// 3 & 4. 재배정 모달 (재배차 필요 & 기사 거절 공통)
// ══════════════════════════════════════════
// TODO: API
// GET  /api/agency/engineers/recommended?requestId=xxx
// POST /api/agency/as-assignments/reassign
//   { assignmentId, newEngineerId, assignedBy, assignMethod }
//   → 기존 REJECTED + 신규 INSERT + as_status_logs 기록

const REASSIGN_ENGINEERS = [
  { id: 1, name: "김철수", brand: "LG 전문",  distance: "2km", rating: 4.9, availableFrom: "13:00 이후", profileImageUrl: null, isLmsCompleted: true  },
  { id: 2, name: "박민수", brand: "삼성 전문", distance: "3km", rating: 4.2, availableFrom: "11:00 이후", profileImageUrl: null, isLmsCompleted: true  },
  { id: 3, name: "이영호", brand: "LG 전문",  distance: "4km", rating: 4.7, availableFrom: "09:00 가능", profileImageUrl: null, isLmsCompleted: false },
];

export function ReassignModal({ onClose, item }) {
  const [selected, setSelected] = useState(null);

  const isRejected = item?.assignStatus === "REJECTED";
  const reason = isRejected ? "기사 거절" : "30분 초과 미수락";

  const handleManualAssign = () => {
    if (!selected) return;
    // await axios.post("/api/agency/as-assignments/reassign", {
    //   assignmentId: item.assignmentId,
    //   newEngineerId: selected,
    //   assignedBy: currentUser.userId,
    //   assignMethod: "MANUAL",
    // });
    alert("선택 배정 완료");
    onClose();
  };

  const handleAutoAssign = () => {
    // await axios.post("/api/agency/as-assignments/reassign", {
    //   assignmentId: item.assignmentId,
    //   assignedBy: currentUser.userId,
    //   assignMethod: "AUTO",
    // });
    alert("자동 배정 요청");
    onClose();
  };

  return (
    <div className="am-overlay" onClick={onClose}>
      <div className="am" onClick={(e) => e.stopPropagation()}>
        <div className="am__header">
          <h2 className="am__title">재배정</h2>
          <button className="am__close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="am__body">
          {/* 재배정 사유 */}
          <div className={`am__reason am__reason--${isRejected ? "rejected" : "overtime"}`}>
            <span className="am__reason-label">재배정 사유</span>
            <span className="am__reason-value">{reason}</span>
            {item?.engineerName && (
              <span className="am__reason-engineer">기존 담당: {item.engineerName}</span>
            )}
          </div>

          {/* 추천 기사 목록 */}
          <section className="am__section">
            <h3 className="am__section-title">추천 기사 목록</h3>
            <div className="am__reassign-table">
              <div className="am__reassign-table-header">
                <span></span>
                <span>기사</span>
                <span>거리</span>
                <span>평점</span>
                <span>가용 시간</span>
              </div>
              {REASSIGN_ENGINEERS.map((e) => (
                <div
                  key={e.id}
                  className={`am__reassign-row ${selected === e.id ? "am__reassign-row--selected" : ""} ${!e.isLmsCompleted ? "am__reassign-row--disabled" : ""}`}
                  onClick={() => e.isLmsCompleted && setSelected(e.id)}
                >
                  <span>
                    <input type="radio" readOnly checked={selected === e.id} disabled={!e.isLmsCompleted} />
                  </span>
                  <span className="am__engineer-name-col">
                    <Avatar name={e.name} profileImageUrl={e.profileImageUrl} size={28} />
                    <div>
                      <span className="am__reassign-name">{e.name}</span>
                      <span className="am__reassign-brand">{e.brand}</span>
                    </div>
                    {!e.isLmsCompleted && <span className="am__lms-fail">배차 불가</span>}
                  </span>
                  <span className="am__distance"><MapPin size={11} /> {e.distance}</span>
                  <span className="am__rating"><Star size={11} /> {e.rating}</span>
                  <span className="am__avail">{e.availableFrom}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="am__footer">
          <button className="am__btn am__btn--ghost" onClick={onClose}>취소</button>
          <div className="am__footer-right">
            <button className="am__btn am__btn--secondary" onClick={handleAutoAssign}>자동 배정</button>
            <button className="am__btn am__btn--primary" disabled={!selected} onClick={handleManualAssign}>
              선택 배정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}