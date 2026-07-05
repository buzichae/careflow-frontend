import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import "../../styles/Admin/Admin.css";
import { getPageNumbers, DOTS } from "../../utils/pagination";
import {
  getAgencyRequests,
  approveAgencyRequest,
  rejectAgencyRequest,
  getAdminUsers,
  updateAdminUserStatus,
} from "../../apis/admin";

const ROLE_BADGE = { CUSTOMER: "blue", ENGINEER: "purple", AGENCY: "orange" };
const APPR_BADGE = { PENDING: "orange", APPROVED: "green", REJECTED: "red" };
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED"];

function StatusSelect({ member, onChanged }) {
  const [value, setValue] = useState(member.status);
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const next = e.target.value;
    if (next === value) return;
    setLoading(true);
    try {
      await updateAdminUserStatus(member.userId ?? member.id, next);
      setValue(next);
      onChanged();
    } catch {
      alert("상태 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      className="admin-select"
      style={{ fontSize: 12, padding: "2px 6px", minWidth: 110 }}
      value={value}
      onChange={handleChange}
      disabled={loading}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

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
          <button className="admin-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
          <strong>{agency.agencyName}</strong> 대행사를 승인하시겠습니까?
        </p>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
          신청자: {agency.name} ({agency.email})
        </p>
        <div className="admin-modal__footer">
          <button className="admin-btn admin-btn--outline" onClick={onClose}>
            취소
          </button>
          <button
            className="admin-btn admin-btn--primary"
            onClick={handleApprove}
            disabled={loading}
          >
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
          <button className="admin-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
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
          <button className="admin-btn admin-btn--outline" onClick={onClose}>
            취소
          </button>
          <button
            className="admin-btn admin-btn--danger"
            onClick={handleReject}
            disabled={loading}
          >
            {loading ? "처리 중..." : "반려"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminMembersPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "agencies" ? "agencies" : "members");

  // 전체 회원 조회 상태
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 대행사 승인 관리 상태
  const [agencyRequests, setAgencyRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  const fetchMembers = (page = currentPage) => {
    setMembersLoading(true);
    getAdminUsers({
      role: roleFilter || undefined,
      status: memberStatusFilter || undefined,
      keyword: memberSearch || undefined,
      page,
    })
      .then((res) => {
        const data = res.data;
        setMembers(Array.isArray(data?.content) ? data.content : []);
        setTotalPages(data?.totalPages ?? 0);
        setTotalElements(data?.totalElements ?? 0);
        setCurrentPage(data?.currentPage ?? page);
      })
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  };

  const fetchAgencyRequests = () => {
    getAgencyRequests()
      .then((res) => setAgencyRequests(res.data.requests ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchAgencyRequests();
  }, []);

  useEffect(() => {
    if (tab === "members") fetchMembers(0);
    setCurrentPage(0);
  }, [tab, roleFilter, memberStatusFilter]);

  const handleMemberSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchMembers(0);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchMembers(page);
  };

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
            { key: "members", label: "전체 회원 조회" },
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
            <form className="admin-filter-bar" onSubmit={handleMemberSearch}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#aaa",
                  }}
                />
                <input
                  className="admin-search-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="이름 또는 이메일 검색"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
              <select
                className="admin-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">역할 전체</option>
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="ENGINEER">ENGINEER</option>
                <option value="AGENCY">AGENCY</option>
              </select>
              <select
                className="admin-select"
                value={memberStatusFilter}
                onChange={(e) => setMemberStatusFilter(e.target.value)}
              >
                <option value="">상태 전체</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <button
                type="submit"
                className="admin-btn admin-btn--primary admin-btn--sm"
              >
                검색
              </button>
            </form>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th>가입일</th>
                  <th>상태 변경</th>
                </tr>
              </thead>
              <tbody>
                {membersLoading ? (
                  <tr>
                    <td colSpan={7} className="admin-empty">
                      불러오는 중...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-empty">
                      회원 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  members.map((m, i) => (
                    <tr key={m.userId ?? m.id ?? i}>
                      <td style={{ color: "#aaa", fontSize: 12 }}>{i + 1}</td>
                      <td>{m.name}</td>
                      <td style={{ color: "#666" }}>{m.email}</td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${ROLE_BADGE[m.role] ?? "gray"}`}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${m.status === "ACTIVE" ? "green" : m.status === "SUSPENDED" ? "red" : "gray"}`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td style={{ color: "#888", fontSize: 12 }}>
                        {m.joinedAt
                          ? m.joinedAt.slice(0, 10).replace(/-/g, ".")
                          : "—"}
                      </td>
                      <td>
                        <StatusSelect member={m} onChanged={fetchMembers} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="aep-pagination" style={{ justifyContent: "center", gap: 12, position: "relative" }}>
                <div className="aep-pagination__left">
                  <button onClick={() => handlePageChange(0)} disabled={currentPage === 0}><ChevronsLeft size={14} /></button>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}><ChevronLeft size={14} /></button>
                  {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                    p === DOTS ? (
                      <span key={`dots-${idx}`} className="aep-pagination__ellipsis">...</span>
                    ) : (
                      <button
                        key={p}
                        className={currentPage === p ? "aep-pagination__active" : ""}
                        onClick={() => handlePageChange(p)}
                      >
                        {p + 1}
                      </button>
                    ),
                  )}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1}><ChevronRight size={14} /></button>
                  <button onClick={() => handlePageChange(totalPages - 1)} disabled={currentPage === totalPages - 1}><ChevronsRight size={14} /></button>
                </div>
                <span style={{ fontSize: 13, color: "#888", position: "absolute", right: 0 }}>총 {totalElements}명</span>
              </div>
            )}
          </div>
        )}

        {tab === "agencies" && (
          <div className="admin-section__body">
            <div className="admin-filter-bar">
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#aaa",
                  }}
                />
                <input
                  className="admin-search-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="대행사명, 신청자명, 이메일 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="admin-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
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
                    <td style={{ color: "#888", fontSize: 12 }}>
                      {r.phone ?? "—"}
                    </td>
                    <td style={{ color: "#888", fontSize: 12 }}>
                      {r.createdAt
                        ? r.createdAt.slice(0, 10).replace(/-/g, ".")
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`admin-badge admin-badge--${APPR_BADGE[r.status] ?? "gray"}`}
                      >
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
                        <span style={{ fontSize: 12, color: "#aaa" }}>
                          처리 완료
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="admin-empty">
                      신청 내역이 없습니다.
                    </td>
                  </tr>
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
