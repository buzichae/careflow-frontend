import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import "../../styles/Admin/Admin.css";
import { getAgencyRequests, approveAgencyRequest, rejectAgencyRequest } from "../../apis/admin";

const ROLE_BADGE = { CUSTOMER: "blue", ENGINEER: "purple", AGENCY: "orange" };
const APPR_BADGE = { PENDING: "orange", APPROVED: "green", REJECTED: "red" };

function AgencyApproveModal({ agency, onClose, onDone }) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveAgencyRequest(agency.accountRequestId);
      onDone();
      onClose();
    } catch {
      alert("승인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">대행사 승인</h2>
          <button className="admin-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
          <strong>{agency.agencyName}</strong> 대행사를 승인하시겠습니까?
        </p>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
          신청자: {agency.name} ({agency.email})
        </p>
        <div className="admin-modal__footer">
          <button className="admin-btn admin-btn--outline" onClick={onClose}>취소</button>
          <button className="admin-btn admin-btn--primary" onClick={handleApprove} disabled={loading}>
            {loading ? "처리 중..." : "승인"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ agency, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true);
    try {
      await rejectAgencyRequest(agency.accountRequestId, reason);
      onDone();
      onClose();
    } catch {
      alert("반려 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">대행사 반려</h2>
          <button className="admin-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
          <strong>{agency.agencyName}</strong> 대행사 신청을 반려합니다.
        </p>
        <div className="admin-modal__field">
          <label className="admin-modal__label">반려 사유</label>
          <textarea
            className="admin-modal__textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="반려 사유를 입력하세요."
          />
        </div>
        <div className="admin-modal__footer">
          <button className="admin-btn admin-btn--outline" onClick={onClose}>취소</button>
          <button className="admin-btn admin-btn--danger" onClick={handleReject} disabled={loading}>
            {loading ? "처리 중..." : "반려"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminMembersPage() {
  const [tab, setTab] = useState("members");
  const [agencyRequests, setAgencyRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  const fetchAgencyRequests = () => {
    getAgencyRequests()
      .then((res) => setAgencyRequests(res.data.requests ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchAgencyRequests();
  }, []);

  const filtered = agencyRequests.filter((r) => {
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchSearch =
      !search ||
      r.agencyName?.includes(search) ||
      r.name?.includes(search) ||
      r.email?.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="admin-page">

      <div className="admin-section" style={{ marginBottom: 24 }}>
        <div className="admin-tabs">
          {[
            { key: "members",  label: "전체 회원 조회" },
            { key: "agencies", label: "대행사 승인 관리" },
          ].map((t) => (
            <button
              key={t.key}
              className={`admin-tab${tab === t.key ? " admin-tab--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "members" && (
          <div className="admin-section__body">
            <div className="admin-filter-bar">
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                <input
                  className="admin-search-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="이름 또는 이메일 검색"
                  disabled
                />
              </div>
              <select className="admin-select" disabled>
                <option>역할 전체</option>
              </select>
              <select className="admin-select" disabled>
                <option>상태 전체</option>
              </select>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th>가입일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="admin-empty">
                    전체 회원 조회 API가 준비되지 않았습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {tab === "agencies" && (
          <div className="admin-section__body">
            <div className="admin-filter-bar">
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                <input
                  className="admin-search-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="대행사명, 신청자명, 이메일 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">상태 전체</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>대행사명</th>
                  <th>신청자</th>
                  <th>이메일</th>
                  <th>연락처</th>
                  <th>신청일</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.accountRequestId}>
                    <td style={{ fontWeight: 600 }}>{r.agencyName ?? "—"}</td>
                    <td>{r.name}</td>
                    <td style={{ color: "#666" }}>{r.email}</td>
                    <td style={{ color: "#888", fontSize: 12 }}>{r.phone ?? "—"}</td>
                    <td style={{ color: "#888", fontSize: 12 }}>
                      {r.createdAt ? r.createdAt.slice(0, 10).replace(/-/g, ".") : "—"}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${APPR_BADGE[r.status] ?? "gray"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === "PENDING" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="admin-btn admin-btn--approve admin-btn--sm"
                            onClick={() => setApproveModal(r)}
                          >
                            승인
                          </button>
                          <button
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => setRejectModal(r)}
                          >
                            반려
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "#aaa" }}>처리 완료</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="admin-empty">신청 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {approveModal && (
        <AgencyApproveModal
          agency={approveModal}
          onClose={() => setApproveModal(null)}
          onDone={fetchAgencyRequests}
        />
      )}
      {rejectModal && (
        <RejectModal
          agency={rejectModal}
          onClose={() => setRejectModal(null)}
          onDone={fetchAgencyRequests}
        />
      )}
    </div>
  );
}
