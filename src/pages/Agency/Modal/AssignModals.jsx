import { useState, useEffect } from "react";
import { X, Clock, MapPin, Star, RefreshCw, XCircle, Phone, History, ZoomIn } from "lucide-react";
import "../../../styles/Agency/Modal/AssignModals.css";
import api from "../../../apis/axiosInstance";
import { getRecommendedEngineers } from "../../../apis/agencyEngineer";
import { getAssignmentDetail, rejectWorkRequest } from "../../../apis/agency";

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

// ISO 날짜시간("2026-06-22T19:30:00") → "2026.06.22 19:30" (T 제거 + 연도 유지)
function formatDateTime(isoStr) {
  if (!isoStr) return "-";
  const [datePart, timePart] = isoStr.split("T");
  if (!datePart) return isoStr;
  const dateFmt = datePart.replaceAll("-", ".");
  const timeFmt = timePart ? timePart.slice(0, 5) : "";
  return timeFmt ? `${dateFmt} ${timeFmt}` : dateFmt;
}

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
    customerName:  raw.customer ?? raw.customerName,
    phone:         raw.phone ?? raw.customerPhone,
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
    // 배정 관련
    engineerName:  raw.engineerName  ?? null,
    assignedAt:    raw.assignedAt    ?? null,
  };
}

// ══════════════════════════════════════════
// AssignDetailModal
// - ASSIGNED (기사 수락 대기): 접수 내용 표시 + 담당기사 표시 + 버튼 비활성
// - ACCEPTED (배정 완료):      접수 내용 표시 + 담당기사 표시 + 버튼 활성
// ══════════════════════════════════════════
export function AssignDetailModal({ onClose, item, onSuccess }) {
  const detail = mapDetail(item);
  const [zoomedImg, setZoomedImg] = useState(null);

  // assignmentId가 item에 없는 경우(접수 목록 탭 등) 배정 목록에서 조회
  const [resolvedAssignmentId,  setResolvedAssignmentId]  = useState(item.assignmentId ?? null);
  const [resolvedAssignStatus,  setResolvedAssignStatus]  = useState(item.assignStatus ?? null);
  const [resolvedEngineerName,  setResolvedEngineerName]  = useState(item.engineerName ?? null);
  const [assignLoading, setAssignLoading] = useState(false);

  // 배정 상세 — 처리 이력(배정 완료/수락 완료 시각 + 방문대기 이후 진행 로그)을 여기서 가져옴
  const [assignmentDetail,        setAssignmentDetail]        = useState(null);
  const [assignmentDetailLoading, setAssignmentDetailLoading] = useState(false);

  // 일정 변경 폼 상태
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDate,     setScheduleDate]     = useState("");
  const [scheduleTime,     setScheduleTime]     = useState("");
  const [submitting,       setSubmitting]        = useState(false);

  // item에 assignmentId가 없으면 배정 목록을 조회해서 requestId로 찾아냄
  useEffect(() => {
    if (resolvedAssignmentId || !item.requestId) return;
    setAssignLoading(true);
    api.get("/api/agency/as-assignments")
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        // requestId 일치 + 활성 상태(WAITING 또는 ACCEPTED) 배정 검색
        const active = list.find(
          a => a.requestId === item.requestId &&
               (a.status === "WAITING" || a.status === "ACCEPTED")
        );
        if (active) {
          setResolvedAssignmentId(active.assignmentId);
          setResolvedAssignStatus(active.status);
          setResolvedEngineerName(prev => prev ?? active.engineerName);
        }
      })
      .catch(() => {})
      .finally(() => setAssignLoading(false));
  }, []);

  // 배정 상세 조회 (assignmentId가 확정되면) — assignedAt/acceptedAt/statusLogs 확보
  useEffect(() => {
    if (!resolvedAssignmentId) return;
    setAssignmentDetailLoading(true);
    getAssignmentDetail(resolvedAssignmentId)
      .then((res) => setAssignmentDetail(res.data))
      .catch((e) => {
        console.error("배정 상세 조회 실패:", e);
        setAssignmentDetail(null);
      })
      .finally(() => setAssignmentDetailLoading(false));
  }, [resolvedAssignmentId]);

  // ACCEPTED 여부 판단 (item 직접 prop 또는 조회 결과 기준)
  const isAccepted = resolvedAssignStatus === "ACCEPTED" || item.assignStatus === "ACCEPTED";
  const displayEngineerName = resolvedEngineerName ?? detail.engineerName;

  // 담당 기사 카드에 보여줄 시간 (수락 전엔 배정 시각, 수락 후엔 수락 시각)
  const assignedAtDisplay = formatDateTime(assignmentDetail?.assignedAt ?? detail.assignedAt);
  const acceptedAtDisplay = formatDateTime(assignmentDetail?.acceptedAt);

  // 처리 이력 — 고객 접수 → 대행사 배정 완료 → 기사 수락 완료 → (as_status_log) 방문대기~완료 순으로 병합
  const historyItems = (() => {
    const items = [];
    if (detail.createdAt) {
      items.push({ time: detail.createdAt, label: "고객 접수" });
    }
    if (assignmentDetail?.assignedAt) {
      items.push({ time: assignmentDetail.assignedAt, label: "기사 배정 완료" });
    }
    if (assignmentDetail?.acceptedAt) {
      items.push({ time: assignmentDetail.acceptedAt, label: "기사 수락 완료" });
    }
    (assignmentDetail?.statusLogs ?? []).forEach((log) => {
      const time = log.createdAt ?? log.changedAt;
      if (!time) return;
      items.push({ time, label: STATUS_LOG_LABEL[log.toStatus] ?? log.toStatus });
    });
    return items
      .filter((i) => i.time)
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  })();

  // ── 일정 변경 ───────────────────────────
  const handleScheduleChange = () => {
    setShowScheduleForm(true);
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleDate || !scheduleTime) return;
    if (!resolvedAssignmentId) {
      alert("배정 ID를 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/api/agency/as-assignments/${resolvedAssignmentId}/schedule`, {
        scheduledDate: scheduleDate,
        scheduledTime: scheduleTime,
      });
      alert("일정이 변경되었습니다.");
      setShowScheduleForm(false);
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.message ?? "일정 변경에 실패했습니다.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 배정 취소 ───────────────────────────
  const handleCancelAssign = async () => {
    if (!resolvedAssignmentId) {
      alert("배정 ID를 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (!window.confirm("배정을 취소하시겠습니까? A/S 요청이 배정 대기 상태로 변경됩니다.")) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/agency/as-assignments/${resolvedAssignmentId}`);
      alert("배정이 취소되었습니다.");
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.message ?? "배정 취소에 실패했습니다.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 재배정 요청 ─────────────────────────
  const handleReassign = async () => {
    if (!resolvedAssignmentId) {
      alert("배정 ID를 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (!window.confirm("재배정을 요청하시겠습니까?")) return;
    setSubmitting(true);
    try {
      const res  = await api.post(`/api/agency/as-assignments/${resolvedAssignmentId}/reassign`);
      const data = res.data;
      alert(data.message ?? "재배정이 완료되었습니다.");
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.message ?? "재배정 요청에 실패했습니다.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
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
              <div className="am__field"><span className="am__label">접수일시</span><span className="am__value">{formatDateTime(detail.createdAt)}</span></div>
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

          {/* 2. 담당 기사 정보 */}
          <section className="am__section">
            <h3 className="am__section-title">담당 기사 정보</h3>
            {assignLoading ? (
              <p style={{ fontSize: "13px", color: "#aaa" }}>기사 정보 조회 중...</p>
            ) : (
              <div className="am__current-card">
                <Avatar name={displayEngineerName} profileImageUrl={null} size={40} />
                <div className="am__current-info">
                  <p className="am__current-name">{displayEngineerName ?? "-"}</p>
                  <div className="am__current-meta">
                    <span className="am__meta-item">
                      <Clock size={11} />
                      {isAccepted ? "수락 시간" : "배정 시간"}: {isAccepted ? acceptedAtDisplay : assignedAtDisplay}
                    </span>
                  </div>
                </div>
                <span className={`am__assign-badge am__assign-badge--${isAccepted ? "accepted" : "waiting"}`}>
                  {isAccepted ? "수락 완료" : "수락 대기"}
                </span>
              </div>
            )}
            {isAccepted && (
              <div className="am__notice">
                ⚠ 기사가 이미 수락한 상태입니다. 변경 시 기사에게 알림이 발송됩니다.
              </div>
            )}
          </section>

          {/* 일정 변경 인라인 폼 */}
          {showScheduleForm && (
            <section className="am__section">
              <h3 className="am__section-title">새 방문 일정 입력</h3>
              <div className="am__grid">
                <div className="am__field">
                  <span className="am__label">날짜</span>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "6px 10px", fontSize: "13px" }}
                  />
                </div>
                <div className="am__field">
                  <span className="am__label">시간 (HH:mm)</span>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "6px 10px", fontSize: "13px" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button
                  className="am__btn am__btn--primary"
                  onClick={handleScheduleSubmit}
                  disabled={!scheduleDate || !scheduleTime || submitting}
                >
                  {submitting ? "변경 중..." : "일정 확정"}
                </button>
                <button className="am__btn am__btn--ghost" onClick={() => setShowScheduleForm(false)}>취소</button>
              </div>
            </section>
          )}

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
              {assignmentDetail?.avgRepairCost != null
                ? <span className="am__cost-value">예상 평균 {assignmentDetail.avgRepairCost.toLocaleString()}원</span>
                : detail.avgCost
                  ? <span className="am__cost-value">예상 평균 {detail.avgCost.toLocaleString()}원</span>
                  : <span className="am__cost-na">데이터 수집 중</span>
              }
              <p className="am__cost-note">※ 실제 수리 결과에 따라 변동될 수 있습니다.</p>
            </div>
          </section>

          {/* 7. 이전 수리 이력 */}
          <section className="am__section">
            <h3 className="am__section-title">이전 수리 이력</h3>
            {assignmentDetail?.previousWorkReports?.length ? (
              <div className="am__table">
                <div className="am__table-header">
                  <span>날짜</span><span>진단 결과</span><span>소요시간</span><span>금액</span>
                </div>
                {assignmentDetail.previousWorkReports.map((r) => (
                  <div key={r.reportId} className="am__table-row">
                    <span>{r.submittedAt?.slice(0, 10)}</span>
                    <span>{r.diagnosisResult}</span>
                    <span>{r.workDurationMin != null ? `${r.workDurationMin}분` : "-"}</span>
                    <span>{r.finalAmount != null ? `${r.finalAmount.toLocaleString()}원` : "-"}</span>
                  </div>
                ))}
              </div>
            ) : detail.repairHistory.length === 0 ? (
              <p className="am__empty">수리 이력이 없습니다.</p>
            ) : (
              <div className="am__table">
                <div className="am__table-header">
                  <span>날짜</span><span>증상</span><span>담당 기사</span><span>결과</span>
                </div>
                {detail.repairHistory.map((h, i) => (
                  <div key={i} className="am__table-row">
                    <span>{h.date}</span><span>{h.symptom}</span><span>{h.engineer}</span><span>{h.result}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 8. 처리 이력 — 고객 접수 → 배정 완료 → 수락 완료 → (실제 진행 로그) 순서로 실데이터 표시 */}
          <section className="am__section">
            <h3 className="am__section-title">처리 이력</h3>
            {assignmentDetailLoading ? (
              <p style={{ fontSize: "13px", color: "#aaa" }}>이력을 불러오는 중...</p>
            ) : historyItems.length === 0 ? (
              <p className="am__empty">처리 이력이 없습니다.</p>
            ) : (
              <div className="am__timeline">
                {historyItems.map((h, i) => (
                  <div key={i} className="am__timeline-item">
                    <div className="am__timeline-dot" />
                    {i < historyItems.length - 1 && <div className="am__timeline-line" />}
                    <span className="am__timeline-time">{formatDateTime(h.time)}</span>
                    <span className="am__timeline-label">{h.label}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 푸터 - ACCEPTED 상태만 버튼 활성 */}
        <div className="am__footer">
          <button className="am__btn am__btn--ghost" onClick={onClose}>닫기</button>
          <div className="am__footer-right">
            <button
              className="am__btn am__btn--outline"
              onClick={handleScheduleChange}
              disabled={!isAccepted || submitting || showScheduleForm}
            >
              일정 변경
            </button>
            <button
              className="am__btn am__btn--danger"
              onClick={handleCancelAssign}
              disabled={!isAccepted || submitting}
            >
              {submitting ? "처리 중..." : "배정 취소"}
            </button>
            <button
              className="am__btn am__btn--secondary"
              onClick={handleReassign}
              disabled={!isAccepted || submitting}
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
export function ReassignModal({ onClose, item, onSuccess }) {
  const [selected,   setSelected]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 추천 기사 목록: GET /api/agency/engineers/recommended?requestId={id}
  const [recommendedEngineers, setRecommendedEngineers] = useState([]);
  const [loadingEngineers, setLoadingEngineers] = useState(false);

  useEffect(() => {
    if (!item?.requestId) return;
    setLoadingEngineers(true);
    getRecommendedEngineers(item.requestId)
      .then((res) => setRecommendedEngineers(res.data ?? []))
      .catch(() => setRecommendedEngineers([]))
      .finally(() => setLoadingEngineers(false));
  }, [item?.requestId]);

  const reason     = item?.reassignReason ?? (item?.assignStatus === "REJECTED" ? "rejected" : "overtime");
  const isRejected = reason === "rejected";
  const reasonLabel    = isRejected ? "기사 취소 (거절)" : "30분 초과 미수락";
  const reasonType     = isRejected ? "rejected" : "overtime";
  const reasonIcon     = isRejected ? <XCircle size={15} /> : <Clock size={15} />;
  const reasonSubLabel = isRejected
    ? "기사가 배정을 거절했습니다."
    : `${item?.overtimeMin ?? 30}분이 경과하도록 수락하지 않았습니다.`;

  const assignmentId = item?.assignmentId ?? null;

  // ── 수동 배정 ── 선택한 기사로 POST change (newEngineerId를 명시적으로 전달)
  // /reassign은 파라미터를 받지 않는 자동 배정 전용 API라 선택한 기사를 반영할 수 없음 — /change를 사용해야 함
  const handleManualAssign = async () => {
    if (!selected) return;
    if (!assignmentId) {
      alert("배정 ID가 없습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/agency/as-assignments/change", {
        assignmentId,
        newEngineerId: selected,
      });
      alert("재배정이 완료되었습니다.");
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.message ?? "재배정에 실패했습니다.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 자동 배정 ──
  const handleAutoAssign = async () => {
    if (!assignmentId) {
      alert("배정 ID가 없습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res  = await api.post(`/api/agency/as-assignments/${assignmentId}/reassign`);
      const data = res.data;
      alert(data.message ?? "자동 재배정이 완료되었습니다.");
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.message ?? "자동 재배정에 실패했습니다.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 접수 반려 ── PATCH /api/agency/work-requests/{requestId}/reject
  // 반려 시 고객에게 재신청 안내 알림이 자동 발송됨(백엔드에서 자동/수동 배정 여부에 따라 문구 분기)
  const handleReject = async () => {
    if (!item?.requestId) {
      alert("접수 정보를 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }
    if (!window.confirm("접수를 반려하시겠습니까? 고객에게 반려 안내 알림이 발송됩니다.")) return;
    setSubmitting(true);
    try {
      await rejectWorkRequest(item.requestId);
      alert("접수가 반려되었습니다.");
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.message ?? "접수 반려에 실패했습니다.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
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
              {loadingEngineers ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                  추천 기사 목록을 불러오는 중입니다...
                </div>
              ) : recommendedEngineers.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                  추천 가능한 기사가 없습니다.
                </div>
              ) : recommendedEngineers.map((e) => (
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
            <button
              className="am__btn am__btn--danger"
              onClick={handleReject}
              disabled={submitting}
            >
              {submitting ? "처리 중..." : "접수 반려"}
            </button>
            <button
              className="am__btn am__btn--secondary"
              onClick={handleAutoAssign}
              disabled={submitting}
            >
              <RefreshCw size={13} /> {submitting ? "처리 중..." : "자동 배정"}
            </button>
            <button
              className="am__btn am__btn--primary"
              disabled={!selected || submitting}
              onClick={handleManualAssign}
            >
              {submitting ? "처리 중..." : "수동 배정"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}