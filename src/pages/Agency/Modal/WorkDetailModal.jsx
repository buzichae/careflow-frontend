import { useState } from "react";
import { X, Phone, History, ZoomIn } from "lucide-react";
import "../../../styles/Agency/Modal/WorkDetailModal.css";

// TODO: API - GET /api/agency/work-requests/:requestId/detail
// as_requests + appliances + users(고객) + engineer_profiles + as_status_logs JOIN

const STATUS_LOG_LABEL = {
  WAITING:            "방문 대기",
  ENGINEER_DEPARTED:  "기사 출발",
  ENGINEER_ARRIVED:   "기사 도착",
  IN_PROGRESS:        "작업 중",
  COMPLETED:          "작업 완료",
};
 
const AS_STATUS_LABEL = {
  PENDING:         "접수",
  AGENCY_RECEIVED: "배정 대기",
  ASSIGNED:        "배정 완료",
  ACCEPTED:        "수락 완료",
  IN_PROGRESS:     "진행 중",
  COMPLETED:       "완료 대기",
  PAID:            "정산 완료",
  CANCELLED:       "취소",
};
 
// ──────────────────────────────────────────
// receiptList 데이터 → 모달 필드 매핑
// API 연동 시 이 함수 제거하고 detail prop 직접 사용
// ──────────────────────────────────────────
function mapDetail(raw) {
  const date = new Date(raw.createdAt);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const displayId = `AS-${yy}${mm}${dd}-${String(raw.requestId).padStart(4, "0")}`;
 
  return {
    requestId:        displayId,
    createdAt:        raw.createdAt,
    status:           raw.status,
    type:             raw.type,
    visitDate:        `${raw.visitDate} ${raw.startTime} ~ ${raw.endTime}`,
    customerName:     raw.customer,
    phone:            raw.phone,
    address:          raw.address        ?? "-",
    note:             raw.note           ?? "-",
    brand:            raw.brand          ?? raw.productName?.split(" ")[0] ?? "-",
    productName:      raw.productName,
    modelNo:          raw.modelNo,
    purchaseDate:     raw.purchaseDate   ?? "-",
    warrantyStatus:   raw.warrantyStatus ?? "-",
    symptom:          raw.symptomDesc,
    symptomDesc:      raw.symptomDesc,
    symptomImages:    raw.symptomImages  ?? [],
 
    avgCost:          raw.avgCost        ?? null,
 
    repairHistory:    raw.repairHistory  ?? [],
 
    engineerCandidates: raw.engineerCandidates ?? [
      { id: 1, name: "김철수", brand: "LG",   rating: 4.9, availableFrom: "13:00 이후 가능", isLmsCompleted: true  },
      { id: 2, name: "박민수", brand: "LG",   rating: 4.8, availableFrom: "16:00 이후 가능", isLmsCompleted: true  },
    ],
 
    statusLogs: raw.statusLogs ?? [
      { to_status: null, memo: "고객 접수", created_at: raw.createdAt },
      { to_status: null, memo: "대행사 접수", created_at: raw.createdAt },
    ],
  };
}
 
export default function WorkDetailModal({ onClose, detail: rawDetail }) {
  const detail = mapDetail(rawDetail);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [zoomedImg, setZoomedImg] = useState(null);
 
  // ──────────────────────────────────────────
  // TODO: API - POST /api/agency/as-assignments
  // { requestId, engineerId, assignedBy, assignMethod: "MANUAL" }
  // ──────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedEngineer) return;
    // await axios.post("/api/agency/as-assignments", {
    //   requestId:    rawDetail.requestId,
    //   engineerId:   selectedEngineer,
    //   assignedBy:   currentUser.userId,   // 로그인 유저 ID
    //   assignMethod: "MANUAL",             // DB: assign_method ENUM('AUTO','MANUAL')
    // });
    alert(`기사 배정 완료`);
    onClose();
  };
 
  const handleAutoAssign = async () => {
    // await axios.post("/api/agency/as-assignments/auto", {
    //   requestId:    rawDetail.requestId,
    //   assignedBy:   currentUser.userId,
    //   assignMethod: "AUTO",
    // });
    alert("자동 배정 요청");
    onClose();
  };
 
  return (
    <div className="wdm-overlay" onClick={onClose}>
      <div className="wdm" onClick={(e) => e.stopPropagation()}>
 
        {/* 헤더 */}
        <div className="wdm__header">
          <div>
            <h2 className="wdm__title">접수 상세</h2>
            <span className="wdm__id">{detail.requestId}</span>
          </div>
          <button className="wdm__close" onClick={onClose}><X size={18} /></button>
        </div>
 
        <div className="wdm__body">
          {/* 1. 접수 기본 정보 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">접수 기본 정보</h3>
            <div className="wdm__grid">
              <div className="wdm__field"><span className="wdm__label">접수번호</span><span className="wdm__value wdm__value--id">{detail.requestId}</span></div>
              <div className="wdm__field"><span className="wdm__label">접수일시</span><span className="wdm__value">{detail.createdAt}</span></div>
              <div className="wdm__field">
                <span className="wdm__label">현재 상태</span>
                <span className={`wdm__status-badge wdm__status-badge--${detail.status?.toLowerCase()}`}>
                  {AS_STATUS_LABEL[detail.status] ?? detail.status}
                </span>
              </div>
              <div className="wdm__field"><span className="wdm__label">접수 유형</span><span className="wdm__value">{detail.type}</span></div>
              <div className="wdm__field wdm__field--full"><span className="wdm__label">희망 방문</span><span className="wdm__value">{detail.visitDate}</span></div>
            </div>
          </section>
 
          {/* 2. 고객 정보 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">고객 정보</h3>
            <div className="wdm__grid">
              <div className="wdm__field"><span className="wdm__label">고객명</span><span className="wdm__value">{detail.customerName}</span></div>
              <div className="wdm__field"><span className="wdm__label">연락처</span><span className="wdm__value">{detail.phone}</span></div>
              <div className="wdm__field wdm__field--full"><span className="wdm__label">주소</span><span className="wdm__value">{detail.address}</span></div>
              <div className="wdm__field wdm__field--full"><span className="wdm__label">특이사항</span><span className="wdm__value wdm__value--note">{detail.note}</span></div>
            </div>
            <div className="wdm__btn-row">
              <button className="wdm__btn wdm__btn--outline"><Phone size={13} /> 고객 연락하기</button>
              <button className="wdm__btn wdm__btn--ghost"><History size={13} /> 고객 이력보기</button>
            </div>
          </section>
 
          {/* 3. 제품 정보 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">제품 정보</h3>
            <div className="wdm__grid">
              <div className="wdm__field"><span className="wdm__label">브랜드</span><span className="wdm__value">{detail.brand}</span></div>
              <div className="wdm__field"><span className="wdm__label">제품명</span><span className="wdm__value">{detail.productName}</span></div>
              <div className="wdm__field"><span className="wdm__label">모델명</span><span className="wdm__value">{detail.modelNo}</span></div>
              <div className="wdm__field"><span className="wdm__label">구매일</span><span className="wdm__value">{detail.purchaseDate}</span></div>
              <div className="wdm__field">
                <span className="wdm__label">무상기간</span>
                <span className={`wdm__warranty ${detail.warrantyStatus === "만료" ? "wdm__warranty--expired" : "wdm__warranty--valid"}`}>
                  {detail.warrantyStatus}
                </span>
              </div>
            </div>
          </section>
 
          {/* 4. 신청 증상 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">신청 증상</h3>
            <div className="wdm__grid">
              <div className="wdm__field wdm__field--full"><span className="wdm__label">증상</span><span className="wdm__value">{detail.symptom}</span></div>
              <div className="wdm__field wdm__field--full">
                <span className="wdm__label">상세 설명</span>
                <span className="wdm__value wdm__value--desc">{detail.symptomDesc}</span>
              </div>
            </div>
            {detail.symptomImages?.length > 0 && (
              <div className="wdm__images">
                {detail.symptomImages.map((img) => (
                  <div key={img.id} className="wdm__image-thumb" onClick={() => img.url && setZoomedImg(img.url)}>
                    {img.url
                      ? <img src={img.url} alt={img.label} />
                      : <div className="wdm__image-placeholder"><ZoomIn size={16} color="#aaa" /><span>{img.label}</span></div>
                    }
                  </div>
                ))}
              </div>
            )}
          </section>
 
          {/* 5. 예상 수리 비용 - 수정 4: avg_cost 단일값으로 변경 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">예상 수리 비용</h3>
            <div className="wdm__cost-box">
              {detail.avgCost
                ? <span className="wdm__cost-value">예상 평균 {detail.avgCost.toLocaleString()}원</span>
                : <span className="wdm__cost-na">데이터 수집 중</span>
              }
              <p className="wdm__cost-note">※ 실제 수리 결과에 따라 변동될 수 있습니다.</p>
            </div>
          </section>
 
          {/* 6. 이전 수리 이력 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">이전 수리 이력</h3>
            {detail.repairHistory.length === 0
              ? <p className="wdm__empty">수리 이력이 없습니다.</p>
              : <div className="wdm__table">
                  <div className="wdm__table-header">
                    <span>날짜</span><span>증상</span><span>담당 기사</span><span>결과</span>
                  </div>
                  {detail.repairHistory.map((h, i) => (
                    <div key={i} className="wdm__table-row">
                      <span>{h.date}</span><span>{h.symptom}</span><span>{h.engineer}</span><span>{h.result}</span>
                    </div>
                  ))}
                </div>
            }
          </section>
 
          {/* 7. 기사 배정 - 수정 2,3: LMS 미이수 기사 배정 불가 표시 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">기사 배정</h3>
            <div className="wdm__engineer-list">
              {detail.engineerCandidates.map((e) => (
                <div
                  key={e.id}
                  className={`wdm__engineer-item
                    ${selectedEngineer === e.id ? "wdm__engineer-item--selected" : ""}
                    ${!e.isLmsCompleted ? "wdm__engineer-item--disabled" : ""}
                  `}
                  onClick={() => e.isLmsCompleted && setSelectedEngineer(e.id)}
                >
                  <div className="wdm__engineer-avatar">{e.name.charAt(0)}</div>
                  <div className="wdm__engineer-info">
                    <span className="wdm__engineer-name">{e.name}</span>
                    <span className="wdm__engineer-brand">{e.brand} 전문</span>
                  </div>
                  <div className="wdm__engineer-meta">
                    <span className="wdm__engineer-rating">⭐ {e.rating}</span>
                    <span className="wdm__engineer-avail">{e.availableFrom}</span>
                  </div>
                  {!e.isLmsCompleted
                    ? <span className="wdm__lms-fail">배차 불가</span>
                    : selectedEngineer === e.id && <div className="wdm__engineer-check">✓</div>
                  }
                </div>
              ))}
            </div>
          </section>
 
          {/* 8. 처리 이력 - 수정 1: DB ENUM 기준 한글 매핑 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">처리 이력</h3>
            <div className="wdm__timeline">
              {detail.statusLogs.map((log, i) => (
                <div key={i} className="wdm__timeline-item">
                  <div className="wdm__timeline-dot" />
                  {i < detail.statusLogs.length - 1 && <div className="wdm__timeline-line" />}
                  <span className="wdm__timeline-time">
                    {log.created_at?.slice(5, 16).replace("-", ".")}
                  </span>
                  <span className="wdm__timeline-label">
                    {log.to_status ? (STATUS_LOG_LABEL[log.to_status] ?? log.to_status) : log.memo}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
 
        {/* 9. 하단 액션 버튼 */}
        <div className="wdm__footer">
          <button className="wdm__action-btn wdm__action-btn--danger">접수 반려</button>
          <div className="wdm__footer-right">
            <button
              className="wdm__action-btn wdm__action-btn--secondary"
              onClick={handleAutoAssign}
              disabled={detail.status !== "AGENCY_RECEIVED"}
            >
              자동 배정
            </button>
            <button
              className="wdm__action-btn wdm__action-btn--primary"
              disabled={!selectedEngineer || detail.status !== "AGENCY_RECEIVED"}
              onClick={handleAssign}
            >
              기사 배정
            </button>
          </div>
        </div>
      </div>
 
      {/* 이미지 확대 */}
      {zoomedImg && (
        <div className="wdm__zoom-overlay" onClick={() => setZoomedImg(null)}>
          <img src={zoomedImg} alt="확대" />
        </div>
      )}
    </div>
  );
}