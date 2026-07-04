import { FileText, X, Timer, Receipt, Wrench, Package } from "lucide-react";
import "../../styles/Customer/ReportModal.css";

/* ── 수리 보고서 모달 ── */
export default function ReportModal({ item, report, onApprove, onClose }) {
  if (!report) return null;

  function fmt(dt) {
    return dt ? dt.slice(0, 16).replace("T", " ") : "—";
  }

  function fmtDuration(min) {
    if (!min) return "—";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}시간 ${m > 0 ? m + "분" : ""}` : `${m}분`;
  }

  const imageList = report.imageUrls
    ? report.imageUrls
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="cas-report-overlay" onClick={onClose}>
      <div className="cas-report-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="cas-report-modal__header">
          <div className="cas-report-modal__header-left">
            <FileText size={17} color="#7c5cf7" />
            <div>
              <p className="cas-report-modal__sup">수리 보고서</p>
              <h3 className="cas-report-modal__title">
                {item.appliance ?? `가전 #${report.requestId}`}
              </h3>
            </div>
          </div>
          <button className="cas-report-modal__close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        {/* 기사 + 작업 시간 */}
        <div className="cas-report-modal__meta">
          <div className="cas-report-meta-item">
            <span className="cas-report-meta-item__label">담당 기사</span>
            <span className="cas-report-meta-item__value">
              {report.engineerName ?? "—"}
            </span>
          </div>
          <div className="cas-report-meta-item">
            <Timer size={13} color="#7c5cf7" />
            <span className="cas-report-meta-item__label">작업 시간</span>
            <span className="cas-report-meta-item__value">
              {fmtDuration(report.workDurationMin)}
            </span>
          </div>
          <div className="cas-report-meta-item">
            <span className="cas-report-meta-item__label">제출일</span>
            <span className="cas-report-meta-item__value">
              {fmt(report.submittedAt)}
            </span>
          </div>
        </div>

        <div className="cas-report-modal__body">
          {/* A/S 결과 */}
          <div className="cas-report-section">
            <div className="cas-report-section__head">
              <FileText size={14} color="#7c5cf7" />
              <h4>A/S 결과</h4>
            </div>
            <p className="cas-report-diagnosis">
              {report.diagnosisResult ?? "—"}
            </p>
          </div>

          {/* 청구 금액 */}
          <div className="cas-report-section">
            <div className="cas-report-section__head">
              <Receipt size={14} color="#7c5cf7" />
              <h4>청구 금액</h4>
            </div>
            <div className="cas-report-cost">
              <div className="cas-report-cost__row cas-report-cost__row--total">
                <span>최종 청구 금액</span>
                <span>
                  {report.finalAmount != null
                    ? report.finalAmount.toLocaleString() + "원"
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* 기사 메모 */}
          {report.memo && (
            <div className="cas-report-section">
              <div className="cas-report-section__head">
                <Wrench size={14} color="#7c5cf7" />
                <h4>기사 메모</h4>
              </div>
              <p className="cas-report-note">{report.memo}</p>
            </div>
          )}

          {/* 사진 */}
          {imageList.length > 0 && (
            <div className="cas-report-section">
              <div className="cas-report-section__head">
                <Package size={14} color="#7c5cf7" />
                <h4>첨부 사진</h4>
              </div>
              <div className="cas-report-images">
                {imageList.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`수리 사진 ${i + 1}`}
                    className="cas-report-image"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 승인 정보 (이미 승인된 경우) */}
          {report.customerApproved && report.approvedAt && (
            <div className="cas-report-section">
              <div className="cas-report-section__head">
                <FileText size={14} color="#10b981" />
                <h4 style={{ color: "#10b981" }}>승인 완료</h4>
              </div>
              <p className="cas-report-note">{fmt(report.approvedAt)} 승인됨</p>
            </div>
          )}
        </div>

        <div className="cas-report-modal__footer">
          <button
            className="cas-report-modal__btn cas-report-modal__btn--outline"
            onClick={onClose}
          >
            닫기
          </button>
          {onApprove && (
            <button
              className="cas-report-modal__btn cas-report-modal__btn--primary"
              onClick={onApprove}
            >
              보고서 승인 및 결제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
