import { useState } from "react";
import { X, Clock, MapPin, Star, RefreshCw, XCircle, Phone, History, ZoomIn } from "lucide-react";
import "../../../styles/Agency/Modal/AssignModals.css";

// ──────────────────────────────────────────
// 공통 아바타
// ──────────────────────────────────────────
function Avatar({ name, profileImageUrl, size = 36 }) {
  return (
    <div className="am-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {profileImageUrl
        ? <img src={profileImageUrl} alt={name} />
        : <span>{name?.charAt(0) ?? "?"}</span>}
    </div>
  );
}

// ──────────────────────────────────────────
// WorkDetailModal 내용 매핑 함수
// ──────────────────────────────────────────
const STATUS_LOG_LABEL = {
  WAITING:           "방문 대기",
  ENGINEER_DEPARTED: "기사 출발",
  ENGINEER_ARRIVED:  "기사 도착",
  IN_PROGRESS:       "작업 중",
  COMPLETED:         "작업 완료",
};

const AS_STATUS_LABEL = {
  PENDING:         "접수",
  AGENCY_RECEIVED: "배정 대기",
  ASSIGNED:        "기사 수락 대기",
  ACCEPTED:        "배정 완료",
  IN_PROGRESS:     "진행 중",
  COMPLETED:       "완료 대기",
  PAID:            "정산 완료",
  CANCELLED:       "취소",
};

function mapDetail(raw) {
  const date = new Date(raw.createdAt);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const displayId = `AS-${yy}${mm}${dd}-${String(raw.requestId).padStart(4, "0")}`;

  return {
    requestId:     displayId,
    createdAt:     raw.createdAt,
    status:        raw.status,
    type:          raw.type,
    visitDate:     `${raw.visitDate} ${raw.startTime} ~ ${raw.endTime}`,
    customerName:  raw.customer,
    phone:         raw.phone,
    address:       raw.address       ?? "-",
    note:          raw.note          ?? "-",
    brand:         raw.brand         ?? raw.productName?.split(" ")[0] ?? "-",
    productName:   raw.productName,
    modelNo:       raw.modelNo,
    purchaseDate:  raw.purchaseDate  ?? "-",
    warrantyStatus:raw.warrantyStatus ?? "-",
    symptom:       raw.symptomDesc,
    symptomDesc:   raw.symptomDesc,
    symptomImages: raw.symptomImages ?? [],
    avgCost:       raw.avgCost       ?? null,
    repairHistory: raw.repairHistory ?? [],
    statusLogs:    raw.statusLogs    ?? [
      { to_status: null, memo: "고객 접수",   created_at: raw.createdAt },
      { to_status: null, memo: "대행사 접수", created_at: raw.createdAt },
    ],
    // 배정 관련
    engineerName:  raw.engineerName  ?? null,
    assignedAt:    raw.assignedAt    ?? null,
  };
}

// ══════════════════════════════════════════
// AssignDetailModal
// - ASSIGNED (기사 수락 대기): 접수 내용 표시 + 담당기사 표시 + 버튼 비활성
// - ACCEPTED (배정 완료):      접수 내용 표시 + 담당기사 표시 + 버튼 활성
// WorkDetailModal 내용을 여기에 통합
// ══════════════════════════════════════════
export function AssignDetailModal({ onClose, item }) {
  const detail = mapDetail(item);
  const [zoomedImg, setZoomedImg] = useState(null);

  // ACCEPTED만 버튼 활성
  const isAccepted = item.assignStatus === "ACCEPTED";

  const handleScheduleChange = () => {
    // TODO: PUT /api/agency/as-assignments/{assignmentId}/schedule
    alert("일정 변경 요청 (API 연동 필요)");
  };
  const handleCancelAssign = () => {
    // TODO: DELETE /api/agency/as-assignments/{assignmentId}
    alert("배정 취소 (API 연동 필요)");
    onClose();
  };
  const handleReassign = () => {
    // TODO: POST /api/agency/as-assignments/reassign
    alert("재배정 요청 (API 연동 필요)");
    onClose();
  };

  return (
    <div className="am-overlay" onClick={onClose}>
      <div className="am am--wide" onClick={(e) => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="am__header">
          <div>
            <h2 className="am__title">접수 상세</h2>
            <span className="am__subtitle">{detail.requestId}</span>
          </div>
          <button className="am__close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="am__body">

          {/* 1. 접수 기본 정보 */}
          <section className="am__section">
            <h3 className="am__section-title">접수 기본 정보</h3>
            <div className="am__grid">
              <div className="am__field"><span className="am__label">접수번호</span><span className="am__value am__value--id">{detail.requestId}</span></div>
              <div className="am__field"><span className="am__label">접수일시</span><span className="am__value">{detail.createdAt}</span></div>
              <div className="am__field">
                <span className="am__label">현재 상태</span>
                <span className={`am__status-badge am__status-badge--${item.status?.toLowerCase()}`}>
                  {AS_STATUS_LABEL[item.status] ?? item.status}
                </span>
              </div>
              <div className="am__field"><span className="am__label">접수 유형</span><span className="am__value">{detail.type}</span></div>
              <div className="am__field am__field--full"><span className="am__label">희망 방문</span><span className="am__value">{detail.visitDate}</span></div>
            </div>
          </section>

          {/* 2. 담당 기사 정보 - ASSIGNED/ACCEPTED 모두 표시 */}
          <section className="am__section">
            <h3 className="am__section-title">담당 기사 정보</h3>
            <div className="am__current-card">
              <Avatar name={detail.engineerName} profileImageUrl={null} size={40} />
              <div className="am__current-info">
                <p className="am__current-name">{detail.engineerName ?? "-"}</p>
                <div className="am__current-meta">
                  <span className="am__meta-item">
                    <Clock size={11} />
                    {isAccepted ? "수락 시간" : "배정 시간"}: {detail.assignedAt?.slice(5, 16).replace("-", ".") ?? "-"}
                  </span>
                </div>
              </div>
              <span className={`am__assign-badge am__assign-badge--${isAccepted ? "accepted" : "waiting"}`}>
                {isAccepted ? "수락 완료" : "수락 대기"}
              </span>
            </div>
            {isAccepted && (
              <div className="am__notice">
                ⚠ 기사가 이미 수락한 상태입니다. 변경 시 기사에게 알림이 발송됩니다.
              </div>
            )}
          </section>

          {/* 3. 고객 정보 */}
          <section className="am__section">
            <h3 className="am__section-title">고객 정보</h3>
            <div className="am__grid">
              <div className="am__field"><span className="am__label">고객명</span><span className="am__value">{detail.customerName}</span></div>
              <div className="am__field"><span className="am__label">연락처</span><span className="am__value">{detail.phone}</span></div>
              <div className="am__field am__field--full"><span className="am__label">주소</span><span className="am__value">{detail.address}</span></div>
              <div className="am__field am__field--full"><span className="am__label">특이사항</span><span className="am__value am__value--note">{detail.note}</span></div>
            </div>
            <div className="am__btn-row">
              <button className="am__btn am__btn--outline"><Phone size={13} /> 고객 연락하기</button>
              <button className="am__btn am__btn--ghost"><History size={13} /> 고객 이력보기</button>
            </div>
          </section>

          {/* 4. 제품 정보 */}
          <section className="am__section">
            <h3 className="am__section-title">제품 정보</h3>
            <div className="am__grid">
              <div className="am__field"><span className="am__label">브랜드</span><span className="am__value">{detail.brand}</span></div>
              <div className="am__field"><span className="am__label">제품명</span><span className="am__value">{detail.productName}</span></div>
              <div className="am__field"><span className="am__label">모델명</span><span className="am__value">{detail.modelNo}</span></div>
              <div className="am__field"><span className="am__label">구매일</span><span className="am__value">{detail.purchaseDate}</span></div>
              <div className="am__field">
                <span className="am__label">무상기간</span>
                <span className={`am__warranty ${detail.warrantyStatus === "만료" ? "am__warranty--expired" : "am__warranty--valid"}`}>
                  {detail.warrantyStatus}
                </span>
              </div>
            </div>
          </section>

          {/* 5. 신청 증상 */}
          <section className="am__section">
            <h3 className="am__section-title">신청 증상</h3>
            <div className="am__grid">
              <div className="am__field am__field--full"><span className="am__label">증상</span><span className="am__value">{detail.symptom}</span></div>
              <div className="am__field am__field--full"><span className="am__label">상세 설명</span><span className="am__value am__value--desc">{detail.symptomDesc}</span></div>
            </div>
            {detail.symptomImages?.length > 0 && (
              <div className="am__images">
                {detail.symptomImages.map((img) => (
                  <div key={img.id} className="am__image-thumb" onClick={() => img.url && setZoomedImg(img.url)}>
                    {img.url
                      ? <img src={img.url} alt={img.label} />
                      : <div className="am__image-placeholder"><ZoomIn size={16} color="#aaa" /><span>{img.label}</span></div>
                    }
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 6. 예상 수리 비용 */}
          <section className="am__section">
            <h3 className="am__section-title">예상 수리 비용</h3>
            <div className="am__cost-box">
              {detail.avgCost
                ? <span className="am__cost-value">예상 평균 {detail.avgCost.toLocaleString()}원</span>
                : <span className="am__cost-na">데이터 수집 중</span>
              }
              <p className="am__cost-note">※ 실제 수리 결과에 따라 변동될 수 있습니다.</p>
            </div>
          </section>

          {/* 7. 이전 수리 이력 */}
          <section className="am__section">
            <h3 className="am__section-title">이전 수리 이력</h3>
            {detail.repairHistory.length === 0
              ? <p className="am__empty">수리 이력이 없습니다.</p>
              : <div className="am__table">
                  <div className="am__table-header">
                    <span>날짜</span><span>증상</span><span>담당 기사</span><span>결과</span>
                  </div>
                  {detail.repairHistory.map((h, i) => (
                    <div key={i} className="am__table-row">
                      <span>{h.date}</span><span>{h.symptom}</span><span>{h.engineer}</span><span>{h.result}</span>
                    </div>
                  ))}
                </div>
            }
          </section>

          {/* 8. 처리 이력 */}
          <section className="am__section">
            <h3 className="am__section-title">처리 이력</h3>
            <div className="am__timeline">
              {detail.statusLogs.map((log, i) => (
                <div key={i} className="am__timeline-item">
                  <div className="am__timeline-dot" />
                  {i < detail.statusLogs.length - 1 && <div className="am__timeline-line" />}
                  <span className="am__timeline-time">
                    {log.created_at?.slice(5, 16).replace("-", ".")}
                  </span>
                  <span className="am__timeline-label">
                    {log.to_status ? (STATUS_LOG_LABEL[log.to_status] ?? log.to_status) : log.memo}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 푸터 - ACCEPTED만 버튼 활성 */}
        <div className="am__footer">
          <button className="am__btn am__btn--ghost" onClick={onClose}>닫기</button>
          <div className="am__footer-right">
            <button
              className="am__btn am__btn--outline"
              onClick={handleScheduleChange}
              disabled={!isAccepted}
            >
              일정 변경
            </button>
            <button
              className="am__btn am__btn--danger"
              onClick={handleCancelAssign}
              disabled={!isAccepted}
            >
              배정 취소
            </button>
            <button
              className="am__btn am__btn--secondary"
              onClick={handleReassign}
              disabled={!isAccepted}
            >
              재배정 요청
            </button>
          </div>
        </div>
      </div>

      {/* 이미지 확대 */}
      {zoomedImg && (
        <div className="am__zoom-overlay" onClick={() => setZoomedImg(null)}>
          <img src={zoomedImg} alt="확대" />
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════
// ReassignModal (기사 거절 or 30분 초과)
// ══════════════════════════════════════════
const REASSIGN_ENGINEERS = [
  { id: 1, name: "김철수", brand: "LG 전문",  distance: "2km", rating: 4.9, availableFrom: "13:00 이후", profileImageUrl: null, isLmsCompleted: true  },
  { id: 2, name: "박민수", brand: "삼성 전문", distance: "3km", rating: 4.2, availableFrom: "11:00 이후", profileImageUrl: null, isLmsCompleted: true  },
  { id: 3, name: "이영호", brand: "LG 전문",  distance: "4km", rating: 4.7, availableFrom: "09:00 가능", profileImageUrl: null, isLmsCompleted: false },
];

export function ReassignModal({ onClose, item }) {
  const [selected, setSelected] = useState(null);

  const reason     = item?.reassignReason ?? (item?.assignStatus === "REJECTED" ? "rejected" : "overtime");
  const isRejected = reason === "rejected";
  const reasonLabel    = isRejected ? "기사 취소 (거절)" : "30분 초과 미수락";
  const reasonType     = isRejected ? "rejected" : "overtime";
  const reasonIcon     = isRejected ? <XCircle size={15} /> : <Clock size={15} />;
  const reasonSubLabel = isRejected
    ? "기사가 배정을 거절했습니다."
    : `${item?.overtimeMin ?? 30}분이 경과하도록 수락하지 않았습니다.`;

  const handleManualAssign = () => {
    if (!selected) return;
    // TODO: POST /api/agency/as-assignments/reassign { assignMethod: "MANUAL" }
    alert("수동 배정 완료 (API 연동 필요)");
    onClose();
  };
  const handleAutoAssign = () => {
    // TODO: POST /api/agency/as-assignments/reassign { assignMethod: "AUTO" }
    alert("자동 배정 요청 (API 연동 필요)");
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
          <div className={`am__reason am__reason--${reasonType}`}>
            <div className="am__reason-icon">{reasonIcon}</div>
            <div className="am__reason-content">
              <span className="am__reason-label">{reasonLabel}</span>
              <span className="am__reason-desc">{reasonSubLabel}</span>
              {item?.engineerName && (
                <span className="am__reason-engineer">기존 담당: {item.engineerName}</span>
              )}
            </div>
          </div>

          {/* 고객 희망 일정 */}
          {item?.visitDate && (
            <section className="am__section">
              <h3 className="am__section-title">고객 희망 일정</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f5f3ff", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#1a1a2e", fontWeight: 600 }}>
                <Clock size={13} color="#5B4FF5" />
                <span>{item.visitDate} {item.startTime} ~ {item.endTime}</span>
              </div>
            </section>
          )}

          <section className="am__section">
            <h3 className="am__section-title">추천 기사 목록</h3>
            <p className="am__section-desc">LMS 이수 완료 기사만 배정 가능합니다.</p>
            <div className="am__reassign-table">
              <div className="am__reassign-table-header">
                <span></span><span>기사</span><span>거리</span><span>평점</span><span>가용 시간</span>
              </div>
              {REASSIGN_ENGINEERS.map((e) => (
                <div
                  key={e.id}
                  className={`am__reassign-row ${selected === e.id ? "am__reassign-row--selected" : ""} ${!e.isLmsCompleted ? "am__reassign-row--disabled" : ""}`}
                  onClick={() => e.isLmsCompleted && setSelected(e.id)}
                >
                  <span><input type="radio" readOnly checked={selected === e.id} disabled={!e.isLmsCompleted} /></span>
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
            <button className="am__btn am__btn--secondary" onClick={handleAutoAssign}>
              <RefreshCw size={13} /> 자동 배정
            </button>
            <button className="am__btn am__btn--primary" disabled={!selected} onClick={handleManualAssign}>
              수동 배정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}