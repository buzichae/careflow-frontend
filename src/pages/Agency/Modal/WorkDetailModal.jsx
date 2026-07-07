import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Phone, History, ZoomIn } from "lucide-react";
import "../../../styles/Agency/Modal/WorkDetailModal.css";
import api from "../../../apis/axiosInstance";
import { getRecommendedEngineers } from "../../../apis/agencyEngineer";
import { getWorkRequestDetail, getAssignmentDetail, rejectWorkRequest } from "../../../apis/agency";
import { getAgencyStatusLogs } from "../../../apis/agencyAsStatusLog";
 
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
 
// AssignType enum 라벨 — 실제 enum 값(AUTO/MANUAL 등) 확인 후 필요시 수정하세요
const ASSIGN_TYPE_LABEL = {
  AUTO:   "자동배정",
  MANUAL: "수동배정",
};
 
// ISO 날짜시간("2025-09-01T19:00:00") → "2025.09.01 19:00"
function formatDateTime(isoStr) {
  if (!isoStr) return "-";
  const [datePart, timePart] = isoStr.split("T");
  if (!datePart) return isoStr;
  const dateFmt = datePart.replaceAll("-", ".");
  const timeFmt = timePart ? timePart.slice(0, 5) : "";
  return timeFmt ? `${dateFmt} ${timeFmt}` : dateFmt;
}
 
// ISO 날짜시간 → "YYYY.MM.DD HH:mm" (처리 이력 타임라인용)
function formatLogTime(isoStr) {
  if (!isoStr) return "-";
  const [datePart, timePart] = isoStr.split("T");
  if (!datePart) return isoStr;
  const dateFmt = datePart.replaceAll("-", ".");
  const hhmm = timePart ? timePart.slice(0, 5) : "";
  return `${dateFmt} ${hhmm}`;
}
 
// 기사 기술 등급 라벨 (AgencyEngineerPage의 SKILL_MAP과 동일 ENUM)
const SKILL_LEVEL_LABEL = {
  ADVANCED:     "고급",
  INTERMEDIATE: "중급",
  BEGINNER:     "초급",
};
 
// ──────────────────────────────────────────
// AgencyAsRequestDetailResponse → 모달 표시용 필드 매핑
// ──────────────────────────────────────────
function mapDetail(raw) {
  if (!raw) return null;
 
  const date = new Date(raw.createdAt);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const displayId = `AS-${yy}${mm}${dd}-${String(raw.requestId).padStart(4, "0")}`;
 
  // 무상보증 상태: warrantyEndDate와 오늘 날짜 비교해서 프론트에서 계산
  let warrantyStatus = "-";
  if (raw.warrantyEndDate) {
    const end = new Date(raw.warrantyEndDate);
    const today = new Date();
    warrantyStatus = end < today ? "만료" : "보증기간 중";
  }
 
  // imageUrls: 콤마로 구분된 단일 문자열로 옴 (배열 아님)
  const symptomImages = (raw.imageUrls ?? "")
    .split(",")
    .map(u => u.trim())
    .filter(Boolean)
    .map((url, i) => ({ id: i, url, label: `증상사진 ${i + 1}` }));
 
  return {
    requestId:        displayId,
    rawRequestId:      raw.requestId,
    createdAt:        raw.createdAt,
    status:           raw.status,
    type:             ASSIGN_TYPE_LABEL[raw.assignType] ?? raw.assignType ?? "-",
    visitDate:        raw.scheduledDate ? `${raw.scheduledDate} ${raw.scheduledTime ?? ""}`.trim() : "-",
    customerName:     raw.customerName,
    phone:            raw.customerPhone,
    address:          [raw.visitRegionName, raw.visitAddressDetail].filter(Boolean).join(" ") || "-",
    cancelReason:     raw.cancelReason,
 
    brand:            raw.brand ?? "-",
    modelName:        raw.modelName ?? "-",
    serialNumber:     raw.serialNumber ?? "-",
    purchaseDate:     raw.purchaseDate ?? "-",
    warrantyStatus,
 
    symptomName:      raw.symptomName ?? "-",
    symptomDesc:      raw.symptomDesc ?? "-",
    symptomImages,
  };
}
 
export default function WorkDetailModal({ onClose, detail: rowDetail, onSuccess }) {
  const navigate = useNavigate();
  const requestId = rowDetail?.requestId;
 
  // 접수 상세: GET /api/agency/work-requests/{requestId}/detail
  const [detail,        setDetail]        = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError,   setDetailError]   = useState(null);
 
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [zoomedImg,        setZoomedImg]        = useState(null);
  const [submitting,       setSubmitting]        = useState(false);
 
  // 추천 기사 목록: GET /api/agency/engineers/recommended?requestId={id}
  const [engineers,        setEngineers]        = useState([]);
  const [loadingEngineers, setLoadingEngineers] = useState(false);
 
  // 처리 이력: GET /api/as-status-logs/agency 전체 로그 중 requestId로 필터링 (배정 상세 조회 실패/불가 시 폴백)
  const [statusLogs,        setStatusLogs]        = useState([]);
  const [statusLogsLoading, setStatusLogsLoading] = useState(false);
 
  // 배정 상세: GET /api/agency/as-assignments/{assignmentId}/detail
  // assignmentId가 있을 때만 호출 — 예상수리비용/이전수리이력/기사프로필/처리이력을 보강
  const [assignmentDetail,        setAssignmentDetail]        = useState(null);
  const [assignmentDetailLoading, setAssignmentDetailLoading] = useState(false);
 
  useEffect(() => {
    if (!requestId) return;
 
    setDetailLoading(true);
    setDetailError(null);
    getWorkRequestDetail(requestId)
      .then((res) => setDetail(mapDetail(res.data)))
      .catch((e) => {
        console.error(e);
        setDetailError("접수 상세 정보를 불러오지 못했습니다.");
      })
      .finally(() => setDetailLoading(false));
 
    setLoadingEngineers(true);
    getRecommendedEngineers(requestId)
      .then((res) => setEngineers(res.data ?? []))
      .catch(() => setEngineers([]))
      .finally(() => setLoadingEngineers(false));
 
    // 배정 상세 (assignmentId가 있을 때만) — 예상수리비용/이전이력/기사프로필/처리이력 보강
    const assignmentId = rowDetail?.assignmentId;
    if (assignmentId) {
      setAssignmentDetailLoading(true);
      getAssignmentDetail(assignmentId)
        .then((res) => setAssignmentDetail(res.data))
        .catch((e) => {
          console.error("배정 상세 조회 실패:", e);
          setAssignmentDetail(null);
        })
        .finally(() => setAssignmentDetailLoading(false));
    } else {
      setAssignmentDetail(null);
    }
 
    // 처리 이력 폴백: 배정 상세(statusLogs)를 못 받을 경우에만 전체 로그에서 필터링
    setStatusLogsLoading(true);
    getAgencyStatusLogs()
      .then((res) => {
        const logs = (res.data?.logs ?? []).filter(l => l.requestId === requestId);
        setStatusLogs(logs);
      })
      .catch(() => setStatusLogs([]))
      .finally(() => setStatusLogsLoading(false));
  }, [requestId, rowDetail?.assignmentId]);
 
  // 수동 배정: POST /api/agency/as-assignments/change (assignMethod=MANUAL, 기존 배정이 없으면 새 배정 생성)
  const handleAssign = async () => {
    if (!selectedEngineer) return;
    setSubmitting(true);
    try {
      // 기존 WAITING 배정이 있으면 change, 없으면 신규 생성 엔드포인트가 구현될 때까지 임시 안내
      const existing = rowDetail?.assignmentId;
      if (existing) {
        await api.post("/api/agency/as-assignments/change", {
          assignmentId:  existing,
          newEngineerId: selectedEngineer,
        });
      } else {
        // 직접 배정 생성 엔드포인트 미구현 시 알림
        alert("배정 생성 기능은 현재 준비 중입니다.");
        return;
      }
      alert("기사 배정이 완료되었습니다.");
      onSuccess?.();
      onClose();
    } catch (e) {
      alert(e.response?.data?.message ?? "기사 배정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };
 
  // 자동 배정: 재배정 reassign 엔드포인트 활용 (기존 배정이 있는 경우)
  const handleAutoAssign = async () => {
    setSubmitting(true);
    try {
      const existing = rowDetail?.assignmentId;
      if (existing) {
        const res = await api.post(`/api/agency/as-assignments/${existing}/reassign`);
        alert(res.data?.message ?? "자동 배정이 요청되었습니다.");
      } else {
        alert("자동 배정 기능은 현재 준비 중입니다.");
        return;
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      alert(e.response?.data?.message ?? "자동 배정 요청에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 접수 반려: PATCH /api/agency/work-requests/{requestId}/reject
  // 반려 시 고객에게 재신청 안내 알림이 자동 발송됨(백엔드에서 자동/수동 배정 여부에 따라 문구 분기)
  const handleReject = async () => {
    if (!window.confirm("접수를 반려하시겠습니까? 고객에게 반려 안내 알림이 발송됩니다.")) return;
    setSubmitting(true);
    try {
      await rejectWorkRequest(rowDetail.requestId);
      alert("접수가 반려되었습니다.");
      onSuccess?.();
      onClose();
    } catch (e) {
      alert(e.response?.data?.message ?? "접수 반려에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 상세 로딩 중 / 실패 처리
  if (detailLoading || !detail) {
    return (
      <div className="wdm-overlay" onClick={onClose}>
        <div className="wdm" onClick={(e) => e.stopPropagation()}>
          <div className="wdm__header">
            <h2 className="wdm__title">접수 상세</h2>
            <button className="wdm__close" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="wdm__body">
            <p style={{ padding: "24px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
              {detailError ?? "불러오는 중..."}
            </p>
          </div>
        </div>
      </div>
    );
  }
 
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
              <div className="wdm__field"><span className="wdm__label">접수일시</span><span className="wdm__value">{formatDateTime(detail.createdAt)}</span></div>
              <div className="wdm__field">
                <span className="wdm__label">현재 상태</span>
                <span className={`wdm__status-badge wdm__status-badge--${detail.status?.toLowerCase()}`}>
                  {AS_STATUS_LABEL[detail.status] ?? detail.status}
                </span>
              </div>
              <div className="wdm__field"><span className="wdm__label">접수 유형</span><span className="wdm__value">{detail.type}</span></div>
              <div className="wdm__field wdm__field--full"><span className="wdm__label">희망 방문</span><span className="wdm__value">{detail.visitDate}</span></div>
              {detail.status === "CANCELLED" && detail.cancelReason && (
                <div className="wdm__field wdm__field--full">
                  <span className="wdm__label">취소 사유</span>
                  <span className="wdm__value wdm__value--note">{detail.cancelReason}</span>
                </div>
              )}
            </div>
          </section>
 
          {/* 2. 고객 정보 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">고객 정보</h3>
            <div className="wdm__grid">
              <div className="wdm__field"><span className="wdm__label">고객명</span><span className="wdm__value">{detail.customerName}</span></div>
              <div className="wdm__field"><span className="wdm__label">연락처</span><span className="wdm__value">{detail.phone}</span></div>
              <div className="wdm__field wdm__field--full"><span className="wdm__label">주소</span><span className="wdm__value">{detail.address}</span></div>
            </div>
            <div className="wdm__btn-row">
              <a className="wdm__btn wdm__btn--outline" href={detail.phone ? `tel:${detail.phone}` : undefined}>
                <Phone size={13} /> 고객 연락하기
              </a>
              <button className="wdm__btn wdm__btn--ghost" onClick={() => navigate("/agency/customers")}>
                <History size={13} /> 고객 이력보기
              </button>
            </div>
          </section>
 
          {/* 3. 제품 정보 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">제품 정보</h3>
            <div className="wdm__grid">
              <div className="wdm__field"><span className="wdm__label">브랜드</span><span className="wdm__value">{detail.brand}</span></div>
              <div className="wdm__field"><span className="wdm__label">모델명</span><span className="wdm__value">{detail.modelName}</span></div>
              <div className="wdm__field"><span className="wdm__label">시리얼번호</span><span className="wdm__value">{detail.serialNumber}</span></div>
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
              <div className="wdm__field wdm__field--full"><span className="wdm__label">증상</span><span className="wdm__value">{detail.symptomName}</span></div>
              <div className="wdm__field wdm__field--full">
                <span className="wdm__label">상세 설명</span>
                <span className="wdm__value wdm__value--desc">{detail.symptomDesc}</span>
              </div>
            </div>
            {detail.symptomImages?.length > 0 && (
              <div className="wdm__images">
                {detail.symptomImages.map((img) => (
                  <div key={img.id} className="wdm__image-thumb" onClick={() => setZoomedImg(img.url)}>
                    <img src={img.url} alt={img.label} />
                  </div>
                ))}
              </div>
            )}
          </section>
 
          {/* 5. 예상 수리 비용 — GET as-assignments/{id}/detail: avgRepairCost */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">예상 수리 비용</h3>
            <div className="wdm__cost-box">
              {!rowDetail?.assignmentId ? (
                <span className="wdm__cost-na">배정 전에는 확인할 수 없습니다</span>
              ) : assignmentDetailLoading ? (
                <span className="wdm__cost-na">불러오는 중...</span>
              ) : assignmentDetail?.avgRepairCost != null ? (
                <span className="wdm__cost-value">예상 평균 {assignmentDetail.avgRepairCost.toLocaleString()}원</span>
              ) : (
                <span className="wdm__cost-na">데이터 수집 중</span>
              )}
              <p className="wdm__cost-note">※ 실제 수리 결과에 따라 변동될 수 있습니다.</p>
            </div>
          </section>
 
          {/* 6. 이전 수리 이력 — GET as-assignments/{id}/detail: previousWorkReports (동일 가전 기준) */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">이전 수리 이력</h3>
            {!rowDetail?.assignmentId ? (
              <p className="wdm__empty">배정 전에는 확인할 수 없습니다.</p>
            ) : assignmentDetailLoading ? (
              <p style={{ fontSize: "13px", color: "#aaa" }}>불러오는 중...</p>
            ) : !assignmentDetail?.previousWorkReports?.length ? (
              <p className="wdm__empty">수리 이력이 없습니다.</p>
            ) : (
              <div className="wdm__table">
                <div className="wdm__table-header">
                  <span>날짜</span><span>진단 결과</span><span>소요시간</span><span>금액</span>
                </div>
                {assignmentDetail.previousWorkReports.map((r) => (
                  <div key={r.reportId} className="wdm__table-row">
                    <span>{r.submittedAt?.slice(0, 10)}</span>
                    <span>{r.diagnosisResult}</span>
                    <span>{r.workDurationMin != null ? `${r.workDurationMin}분` : "-"}</span>
                    <span>{r.finalAmount != null ? `${r.finalAmount.toLocaleString()}원` : "-"}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
 
          {/* 7. 기사 배정 - GET /api/agency/engineers/recommended?requestId={id} */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">기사 배정</h3>
            {loadingEngineers ? (
              <p style={{ fontSize: "13px", color: "#aaa" }}>추천 기사를 불러오는 중...</p>
            ) : engineers.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#aaa" }}>배정 가능한 기사가 없습니다.</p>
            ) : (
              <div className="wdm__engineer-list">
                {engineers.map((e) => (
                  <div
                    key={e.id}
                    className={`wdm__engineer-item
                      ${selectedEngineer === e.id ? "wdm__engineer-item--selected" : ""}
                      ${!e.isLmsCompleted ? "wdm__engineer-item--disabled" : ""}
                    `}
                    onClick={() => e.isLmsCompleted && setSelectedEngineer(e.id)}
                  >
                    <div className="wdm__engineer-avatar">{e.name?.charAt(0) ?? "?"}</div>
                    <div className="wdm__engineer-info">
                      <span className="wdm__engineer-name">{e.name}</span>
                      <span className="wdm__engineer-brand">{e.brand}</span>
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
            )}
          </section>
 
          {/* 7-1. 배정된 기사 프로필 — 이름은 목록(rowDetail)에서, 등급/평점 등은 engineerProfile에서 */}
          {rowDetail?.assignmentId && assignmentDetail?.engineerProfile && (
            <section className="wdm__section">
              <h3 className="wdm__section-title">배정된 기사 정보</h3>
              <div className="wdm__engineer-item wdm__engineer-item--selected" style={{ cursor: "default" }}>
                <div className="wdm__engineer-avatar">{rowDetail.engineerName?.charAt(0) ?? "?"}</div>
                <div className="wdm__engineer-info">
                  <span className="wdm__engineer-name">
                    {rowDetail.engineerName ?? "-"}
                    <span style={{ marginLeft: 6, fontWeight: 400, color: "#888" }}>
                      ({SKILL_LEVEL_LABEL[assignmentDetail.engineerProfile.skillLevel] ?? assignmentDetail.engineerProfile.skillLevel} 등급)
                    </span>
                  </span>
                  <span className="wdm__engineer-brand">{assignmentDetail.engineerProfile.introduction}</span>
                </div>
                <div className="wdm__engineer-meta">
                  <span className="wdm__engineer-rating">⭐ {assignmentDetail.engineerProfile.avgRating ?? "-"}</span>
                  <span className="wdm__engineer-avail">리뷰 {assignmentDetail.engineerProfile.totalReviews}건</span>
                </div>
              </div>
            </section>
          )}
 
          {/* 8. 처리 이력 — 배정 상세(assignmentDetail.statusLogs) 우선, 없으면(배정 전) 전체로그 필터링 폴백 */}
          <section className="wdm__section">
            <h3 className="wdm__section-title">처리 이력</h3>
            {(() => {
              // 배정상세 로그가 있으면 그걸 시간순으로, 없으면 폴백 로그 사용
              const logs = assignmentDetail?.statusLogs?.length
                ? [...assignmentDetail.statusLogs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                : statusLogs;
              const isLoading = rowDetail?.assignmentId ? assignmentDetailLoading : statusLogsLoading;
 
              if (isLoading) return <p style={{ fontSize: "13px", color: "#aaa" }}>이력을 불러오는 중...</p>;
              if (logs.length === 0) return <p className="wdm__empty">처리 이력이 없습니다.</p>;
 
              return (
                <div className="wdm__timeline">
                  {logs.map((log, i) => (
                    <div key={log.logId} className="wdm__timeline-item">
                      <div className="wdm__timeline-dot" />
                      {i < logs.length - 1 && <div className="wdm__timeline-line" />}
                      <span className="wdm__timeline-time">
                        {formatLogTime(log.createdAt ?? log.changedAt)}
                      </span>
                      <span className="wdm__timeline-label">
                        {STATUS_LOG_LABEL[log.toStatus] ?? log.toStatus}
                        {log.memo ? ` · ${log.memo}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        </div>
 
        {/* 9. 하단 액션 버튼 */}
        <div className="wdm__footer">
          <button
            className="wdm__action-btn wdm__action-btn--danger"
            onClick={handleReject}
            disabled={detail.status !== "AGENCY_RECEIVED" || submitting}
          >
            {submitting ? "처리 중..." : "접수 반려"}
          </button>
          <div className="wdm__footer-right">
            <button
              className="wdm__action-btn wdm__action-btn--secondary"
              onClick={handleAutoAssign}
              disabled={detail.status !== "AGENCY_RECEIVED" || submitting}
            >
              {submitting ? "처리 중..." : "자동 배정"}
            </button>
            <button
              className="wdm__action-btn wdm__action-btn--primary"
              disabled={!selectedEngineer || detail.status !== "AGENCY_RECEIVED" || submitting}
              onClick={handleAssign}
            >
              {submitting ? "처리 중..." : "기사 배정"}
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