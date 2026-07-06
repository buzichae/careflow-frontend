import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Pencil, Home,
  Phone, MapPin, Calendar, Clock,
} from "lucide-react";
import { getWorkReportDetail, cancelApprovalRequest } from "../../apis/engineers"; // 실제 경로에 맞게 수정
import "../../styles/Engineer/Engineerreportdetailpage.css";

const SKILL_LABEL = {
  BEGINNER:     "LV.1",
  INTERMEDIATE: "LV.2",
  ADVANCED:     "LV.3",
};

const DIAGNOSIS_MAP = {
  NORMAL:        "정상 확인",
  REPAIRED:      "수리 완료",
  PART_REPLACED: "부품 교체",
  UNREPAIRABLE:  "수리 불가",
};

function formatDuration(min) {
  if (min == null) return "-";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}시간 ${m > 0 ? m + "분" : ""}` : `${m}분`;
}

function formatDateOnly(isoString) {
  if (!isoString) return "-";
  return isoString.split("T")[0]; // "2025-08-02T02:00:00" → "2025-08-02"
}

// [버그 수정] 도착 시간/작업 시간/진행 이력에 "2026-07-06T08:54:38"처럼
// ISO 원본 문자열의 "T"가 그대로 노출되던 문제. "YYYY-MM-DD HH:mm" 형태로 변환.
function formatDateTime(isoString) {
  if (!isoString) return "-";
  const [datePart, timePart] = isoString.split("T");
  if (!timePart) return datePart;
  return `${datePart} ${timePart.slice(0, 5)}`; // 초 단위는 생략하고 시:분까지만
}

export default function EngineerReportDetailPage() {
  const navigate = useNavigate();
  const { reportId } = useParams(); // 라우트가 /engineer/reports/:reportId 라고 가정

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [d, setD] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getWorkReportDetail(reportId)
      .then((res) => {
        if (mounted) setD(res.data);
      })
      .catch((err) => {
        console.error("보고서 상세 조회 실패:", err);
        if (mounted) setError("보고서를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [reportId]);

  const handleCancelApproval = async () => {
    if (!window.confirm("승인 요청을 취소하시겠습니까?")) return;
    try {
      await cancelApprovalRequest(reportId);
      alert("승인 요청이 취소되었습니다.");
    } catch (err) {
      console.error("승인 요청 취소 실패:", err);
      alert("취소 처리에 실패했습니다.");
    }
  };

  // [버그 수정] "보고서 수정" 버튼이 onClick도 없고 승인 여부 체크도 없이
  // 항상 노출되고 있었음 (승인 완료된 보고서도 눌리는 것처럼 보임).
  // → 승인된(customerApproved) 보고서는 버튼 자체를 아예 숨기고,
  //   미승인 상태에서만 수정 페이지로 이동하도록 연결.
  const handleEdit = () => {
    navigate("/engineer/report/submit", {
      state: { reportId: d.reportId ?? Number(reportId), requestId: d.asRequestId ?? d.requestId },
    });
  };

  if (loading) return <div className="erdp">불러오는 중...</div>;
  if (error || !d) return <div className="erdp">{error ?? "보고서를 찾을 수 없습니다."}</div>;

  const partsTotal = (d.parts ?? []).reduce((sum, p) => sum + p.quantity * p.appliedUnitPrice, 0);

  return (
    <div className="erdp">
      {/* 브레드크럼 + 헤더 버튼 */}
      <div className="erdp-topbar">
        <div className="erdp-breadcrumb">
          <Home size={13} color="#aaa" />
          <ChevronRight size={12} color="#ccc" />
          <span>작업 관리</span>
          <ChevronRight size={12} color="#ccc" />
          <span>작업 보고서</span>
          <ChevronRight size={12} color="#ccc" />
          <span className="erdp-breadcrumb__current">보고서 상세</span>
        </div>
        <div className="erdp-topbar__actions">
          {/* [버그 수정] navigate(-1)(브라우저 뒤로가기)를 쓰고 있었는데,
              "수정 페이지 → 상세 페이지"로 새로 이동한 직후엔 히스토리상
              "뒤로"가 목록이 아니라 수정 페이지로 돌아가버리는 문제가 있었음.
              → 항상 명시적으로 목록 경로로 이동하도록 변경. */}
          <button className="erdp-back-btn" onClick={() => navigate("/engineer/report")}>
            <ChevronLeft size={13} /> 목록으로
          </button>
          {/* [수정] 승인 완료된 보고서는 수정 버튼을 아예 노출하지 않음 */}
          {!d.customerApproved && (
            <button className="erdp-edit-btn" onClick={handleEdit}>
              <Pencil size={13} /> 보고서 수정
            </button>
          )}
        </div>
      </div>

      <div className="erdp-header">
        <h1 className="erdp-header__title">작업 보고서</h1>
        <p className="erdp-header__sub">A/S 작업이 완료된 후 작성한 보고서 상세 내용을 확인할 수 있습니다.</p>
      </div>

      <div className="erdp-id-row">
        {/* [연동 준비] 백엔드에 형식화된 접수번호(requestCode) 필드 추가 요청함.
            아직 응답에 없으면 지금처럼 숫자(requestId) 그대로 표시됨 — 필드가
            추가되는 즉시 자동으로 "AS-20260620-0040" 형식으로 바뀜. */}
        <span className="erdp-request-id">{d.requestCode ?? d.requestId}</span>
        <span className={`erdp-status-badge ${d.customerApproved ? "erdp-status-badge--approved" : "erdp-status-badge--pending"}`}>
          {d.customerApproved ? "승인 완료" : "고객 승인 대기"}
        </span>
      </div>

      <div className="erdp-body">
        <div className="erdp-left">
          <div className="erdp-summary-grid">
            <div className="erdp-summary-card">
              <div className="erdp-summary-card__img">
                <span>🧊</span>
              </div>
              <div>
                <p className="erdp-summary-card__row"><span>모델명</span><span>{d.modelNo}</span></p>
                <p className="erdp-summary-card__row"><span>시리얼</span><span>{d.serialNo}</span></p>
              </div>
            </div>

            <div className="erdp-summary-card">
              <p className="erdp-summary-card__section-label">고객 정보</p>
              <p className="erdp-summary-card__row-icon"><Phone size={11} /> {d.customerPhone}</p>
              <p className="erdp-summary-card__row-icon"><MapPin size={11} /> {d.customerAddress}</p>
            </div>

            <div className="erdp-summary-card">
              <p className="erdp-summary-card__section-label">작업 일정</p>
              <p className="erdp-summary-card__row-icon"><Clock size={11} /> 도착 시간 &nbsp; {formatDateTime(d.arrivedAt)}</p>
              <p className="erdp-summary-card__row-icon">
                <Clock size={11} /> 작업 시간 &nbsp; {formatDateTime(d.workStartAt)} ~ {formatDateTime(d.workEndAt)} (총 {formatDuration(d.workDurationMin)})
              </p>
            </div>
          </div>

          <div className="erdp-section">
            <h3 className="erdp-section__title">진단 결과</h3>
            <p className="erdp-diag-item">{DIAGNOSIS_MAP[d.diagnosisResult] ?? d.diagnosisResult}</p>
          </div>

          <div className="erdp-section">
            <h3 className="erdp-section__title">교체 부품</h3>
            <table className="erdp-parts-table">
              <thead>
                <tr>
                  <th>부품명</th>
                  <th>모델명 (part_code)</th>
                  <th>수량</th>
                  <th>단가</th>
                  <th>금액</th>
                </tr>
              </thead>
              <tbody>
                {(d.parts ?? []).map((p, i) => (
                  <tr key={i}>
                    <td>{p.partName}</td>
                    <td className="erdp-parts-table__code">{p.partCode}</td>
                    <td>{p.quantity}</td>
                    <td>{p.appliedUnitPrice.toLocaleString()}원</td>
                    <td>{(p.quantity * p.appliedUnitPrice).toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="erdp-parts-table__total-label">부품 합계</td>
                  <td className="erdp-parts-table__total">{partsTotal.toLocaleString()}원</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="erdp-section">
            <h3 className="erdp-section__title">작업 내용 / 기타 사항</h3>
            <p className="erdp-memo">{d.memo ?? "-"}</p>
          </div>

          <div className="erdp-section">
            <h3 className="erdp-section__title">첨부 사진</h3>
            <div className="erdp-images">
              {(Array.isArray(d.imageUrls) ? d.imageUrls : []).slice(0, 4).map((url, i) => (
                <div key={i} className="erdp-image-thumb">
                  {url ? <img src={url} alt={`작업 사진 ${i + 1}`} /> : <span>📷</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="erdp-right">
          <div className="erdp-panel">
            <h3 className="erdp-panel__title">작업 결과 요약</h3>
            <div className="erdp-result-row erdp-result-row--total">
              <span>최종 금액</span>
              <span>{d.finalAmount.toLocaleString()}원</span>
            </div>
            <div className="erdp-result-row">
              <span>부품 비용</span>
              <span>{partsTotal.toLocaleString()}원</span>
            </div>
            <div className="erdp-result-row">
              <span>기본 점검비 등</span>
              <span>{(d.finalAmount - partsTotal).toLocaleString()}원</span>
            </div>
          </div>

          <div className="erdp-panel">
            <h3 className="erdp-panel__title">작업 기사 정보</h3>
            <div className="erdp-engineer-card">
              <div className="erdp-engineer-avatar">{d.engineerName?.charAt(0)}</div>
              <div>
                <p className="erdp-engineer-name">{d.engineerName} 기사님</p>
              </div>
            </div>
          </div>

          <div className="erdp-panel">
            <h3 className="erdp-panel__title">진행 이력</h3>
            <div className="erdp-timeline">
              <div className="erdp-timeline-item">
                <span className="erdp-timeline-time">{formatDateTime(d.arrivedAt)}</span>
                <span className="erdp-timeline-label">도착</span>
              </div>
              <div className="erdp-timeline-item">
                <span className="erdp-timeline-time">{formatDateTime(d.workStartAt)}</span>
                <span className="erdp-timeline-label">작업 시작</span>
              </div>
              <div className="erdp-timeline-item">
                <span className="erdp-timeline-time">{formatDateTime(d.workEndAt)}</span>
                <span className="erdp-timeline-label">작업 완료</span>
              </div>
            </div>
          </div>

          <div className="erdp-panel">
            <h3 className="erdp-panel__title">승인 및 결제</h3>
            <div className="erdp-panel-row">
              <span>고객 승인 상태</span>
              <span className={`erdp-status-badge ${d.customerApproved ? "erdp-status-badge--approved" : "erdp-status-badge--pending"}`}>
                {d.customerApproved ? "승인 완료" : "승인 대기"}
              </span>
            </div>
            <div className="erdp-panel-row">
              <span>보고서 제출일</span>
             <span>{formatDateOnly(d.submittedAt)}</span>
            </div>
            {!d.customerApproved && (
              <button className="erdp-cancel-btn" onClick={handleCancelApproval}>승인 요청 취소</button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}