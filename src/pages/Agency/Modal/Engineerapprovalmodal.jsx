import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { apiFetch } from "../../Agency/AgencyEngineerPage";
import "../../../styles/Agency/Modal/Engineerapprovalmodal.css";

// ── 기사 가입 신청 관리 모달 ──────────────────────
// 사용 API
//   GET  /api/account-requests/engineerlist        기사 가입 승인 대기 목록
//   POST /api/account-requests/engineer/approval    기사 가입 승인
//   POST /api/account-requests/engineer/rejection    기사 가입 반려
//
// ※ 승인/반려 요청 바디 필드명(requestId)은 스웨거 스펙 확인 후 필요시 수정하세요.

function Avatar({ name, size = 36 }) {
  return (
    <div className="eam-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

export default function EngineerApprovalModal({ onClose, onApproved }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch("/api/account-requests/engineerlist")
      .then(data => setList(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err);
        setError("목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleDecision = async (requestId, type) => {
    setProcessingId(requestId);
    try {
      const path = type === "approve"
        ? "/api/account-requests/engineer/approval"
        : "/api/account-requests/engineer/rejection";
      await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({ requestId }),
      });
      setList(prev => prev.filter(r => r.requestId !== requestId));
      if (type === "approve") onApproved?.();
    } catch (err) {
      console.error(err);
      alert(type === "approve" ? "승인 처리에 실패했습니다." : "반려 처리에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="eam-overlay" onClick={onClose}>
      <div className="eam-modal" onClick={e => e.stopPropagation()}>
        <div className="eam-modal__header">
          <span className="eam-modal__title">기사 가입 신청 관리</span>
          <button className="eam-modal__close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="eam-modal__body">
          {loading ? (
            <p className="eam-modal__empty">로딩 중...</p>
          ) : error ? (
            <p className="eam-modal__empty">{error}</p>
          ) : list.length === 0 ? (
            <p className="eam-modal__empty">대기 중인 가입 신청이 없습니다.</p>
          ) : (
            list.map(req => (
              <div key={req.requestId} className="eam-request-row">
                <Avatar name={req.name} size={36} />
                <div className="eam-request-row__info">
                  <span className="eam-request-row__name">{req.name}</span>
                  <span className="eam-request-row__meta">
                    {req.email}{req.phone ? ` · ${req.phone}` : ""}
                  </span>
                  {req.categoryName && (
                    <span className="eam-request-row__meta">{req.categoryName}</span>
                  )}
                </div>
                <div className="eam-request-row__actions">
                  <button
                    className="eam-btn eam-btn--reject"
                    disabled={processingId === req.requestId}
                    onClick={() => handleDecision(req.requestId, "reject")}
                  >
                    반려
                  </button>
                  <button
                    className="eam-btn eam-btn--approve"
                    disabled={processingId === req.requestId}
                    onClick={() => handleDecision(req.requestId, "approve")}
                  >
                    {processingId === req.requestId
                      ? <Loader2 size={14} className="eam-spin" />
                      : "승인"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}