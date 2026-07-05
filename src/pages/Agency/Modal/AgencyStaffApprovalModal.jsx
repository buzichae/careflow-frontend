import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { apiFetch } from "../Agencysettingpage";
import "../../../styles/Agency/Modal/AgencyStaffApprovalModal.css";

// ── 일반 관리자 가입 신청 관리 모달 ────────────────
// 사용 API (슈퍼 계정만 호출 가능 — 백엔드가 대표 담당자 여부를 검증함)
//   GET  /api/account-requests/agencylist                  일반 관리자 가입 승인 대기 목록
//   POST /api/account-requests/agency/approval?accountId=  일반 관리자 가입 승인
//   POST /api/account-requests/agency/rejection?accountId= 일반 관리자 가입 반려

function Avatar({ name, size = 36 }) {
  return (
    <div className="asam-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

export default function AgencyStaffApprovalModal({ onClose, onApproved }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch("/api/account-requests/agencylist")
      .then(data => setList(Array.isArray(data?.requests) ? data.requests : []))
      .catch(err => {
        console.error(err);
        setError("목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleDecision = async (accountRequestId, type) => {
    setProcessingId(accountRequestId);
    try {
      const path = type === "approve"
        ? `/api/account-requests/agency/approval?accountId=${accountRequestId}`
        : `/api/account-requests/agency/rejection?accountId=${accountRequestId}`;
      await apiFetch(path, {
        method: "POST",
        ...(type === "reject" && { body: JSON.stringify({ rejectReson: "" }) }),
      });
      setList(prev => prev.filter(r => r.accountRequestId !== accountRequestId));
      if (type === "approve") onApproved?.();
    } catch (err) {
      console.error(err);
      alert(type === "approve" ? "승인 처리에 실패했습니다." : "반려 처리에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="asam-overlay" onClick={onClose}>
      <div className="asam-modal" onClick={e => e.stopPropagation()}>
        <div className="asam-modal__header">
          <span className="asam-modal__title">일반 관리자 가입 신청 관리</span>
          <button className="asam-modal__close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="asam-modal__body">
          {loading ? (
            <p className="asam-modal__empty">로딩 중...</p>
          ) : error ? (
            <p className="asam-modal__empty">{error}</p>
          ) : list.length === 0 ? (
            <p className="asam-modal__empty">대기 중인 가입 신청이 없습니다.</p>
          ) : (
            list.map(req => (
              <div key={req.accountRequestId} className="asam-request-row">
                <Avatar name={req.name} size={36} />
                <div className="asam-request-row__info">
                  <span className="asam-request-row__name">{req.name}</span>
                  <span className="asam-request-row__meta">
                    {req.email}{req.phone ? ` · ${req.phone}` : ""}
                  </span>
                </div>
                <div className="asam-request-row__actions">
                  <button
                    className="asam-btn asam-btn--reject"
                    disabled={processingId === req.accountRequestId}
                    onClick={() => handleDecision(req.accountRequestId, "reject")}
                  >
                    반려
                  </button>
                  <button
                    className="asam-btn asam-btn--approve"
                    disabled={processingId === req.accountRequestId}
                    onClick={() => handleDecision(req.accountRequestId, "approve")}
                  >
                    {processingId === req.accountRequestId
                      ? <Loader2 size={14} className="asam-spin" />
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
