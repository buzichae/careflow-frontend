import { useState } from "react";
import { Search, X } from "lucide-react";
import "../../styles/Admin/Admin.css";

/* ── 목 데이터 ── */
const mockMembers = [
  { id: 1, name: "김철수", email: "kim@example.com",    role: "CUSTOMER",  status: "ACTIVE",    joinedAt: "2026.01.15" },
  { id: 2, name: "이영희", email: "lee@example.com",    role: "CUSTOMER",  status: "ACTIVE",    joinedAt: "2026.02.03" },
  { id: 3, name: "박기사", email: "park@example.com",   role: "ENGINEER",  status: "ACTIVE",    joinedAt: "2026.03.11" },
  { id: 4, name: "최담당", email: "choi@example.com",   role: "AGENCY",    status: "ACTIVE",    joinedAt: "2026.04.20" },
  { id: 5, name: "정탈퇴", email: "jung@example.com",   role: "CUSTOMER",  status: "INACTIVE",  joinedAt: "2023.12.01" },
  { id: 6, name: "강정지", email: "kang@example.com",   role: "ENGINEER",  status: "SUSPENDED", joinedAt: "2026.05.07" },
];

const mockAgencies = [
  { id: 1, name: "한국서비스대행사", bizNo: "123-45-67890", region: "서울·경기", status: "PENDING",  appliedAt: "2026.06.20" },
  { id: 2, name: "미래전자서비스",   bizNo: "234-56-78901", region: "부산·경남", status: "APPROVED", appliedAt: "2026.05.10" },
  { id: 3, name: "스마트케어",      bizNo: "345-67-89012", region: "대구·경북", status: "REJECTED", appliedAt: "2026.04.01" },
];

const mockRequests = [
  { id: 1, name: "홍길동", email: "hong@ex.com",  role: "ENGINEER", agency: "한국서비스대행사", status: "PENDING",  appliedAt: "2026.06.24" },
  { id: 2, name: "나가입", email: "na@ex.com",    role: "ENGINEER", agency: "미래전자서비스",   status: "APPROVED", appliedAt: "2026.06.20" },
  { id: 3, name: "류거절", email: "ryu@ex.com",   role: "ENGINEER", agency: "스마트케어",      status: "REJECTED", appliedAt: "2026.06.15" },
];

const ROLE_BADGE   = { CUSTOMER: "blue",   ENGINEER: "purple", AGENCY: "orange" };
const STATUS_BADGE = { ACTIVE: "green",    INACTIVE: "gray",   SUSPENDED: "red" };
const APPR_BADGE   = { PENDING: "orange",  APPROVED: "green",  REJECTED:  "red" };

function StatusModal({ member, onClose, onSave }) {
  const [status, setStatus] = useState(member.status);
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">계정 상태 변경</h2>
          <button className="admin-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
          <strong>{member.name}</strong> ({member.email}) 계정의 상태를 변경합니다.
        </p>
        <div className="admin-modal__field">
          <label className="admin-modal__label">상태 선택</label>
          <select className="admin-select" style={{ width: "100%" }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
        <div className="admin-modal__footer">
          <button className="admin-btn admin-btn--outline" onClick={onClose}>취소</button>
          <button className="admin-btn admin-btn--primary" onClick={() => onSave(status)}>저장</button>
        </div>
      </div>
    </div>
  );
}

function AgencyApproveModal({ agency, onClose }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">대행사 승인 · 슈퍼계정 생성</h2>
          <button className="admin-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
          <strong>{agency.name}</strong> 승인 후 슈퍼계정을 생성합니다.
        </p>
        <div className="admin-modal__field">
          <label className="admin-modal__label">슈퍼계정 이메일</label>
          <input className="admin-modal__input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 입력" />
        </div>
        <div className="admin-modal__field">
          <label className="admin-modal__label">임시 비밀번호</label>
          <input className="admin-modal__input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="임시 비밀번호 입력" />
        </div>
        <div className="admin-modal__footer">
          <button className="admin-btn admin-btn--outline" onClick={onClose}>취소</button>
          <button className="admin-btn admin-btn--primary" onClick={() => { alert("승인 처리되었습니다."); onClose(); }}>승인 처리</button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ title, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">{title}</h2>
          <button className="admin-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="admin-modal__field">
          <label className="admin-modal__label">반려 사유</label>
          <textarea className="admin-modal__textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="반려 사유를 입력하세요." />
        </div>
        <div className="admin-modal__footer">
          <button className="admin-btn admin-btn--outline" onClick={onClose}>취소</button>
          <button className="admin-btn admin-btn--danger" onClick={() => { alert("반려 처리되었습니다."); onClose(); }}>반려</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminMembersPage() {
  const [tab, setTab] = useState("members");
  const [members, setMembers] = useState(mockMembers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [statusModal, setStatusModal] = useState(null);
  const [agencyModal, setAgencyModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [reqStatusFilter, setReqStatusFilter] = useState("ALL");

  const filteredMembers = members.filter((m) => {
    const matchSearch = m.name.includes(search) || m.email.includes(search);
    const matchRole   = roleFilter === "ALL" || m.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const filteredRequests = mockRequests.filter((r) =>
    reqStatusFilter === "ALL" || r.status === reqStatusFilter
  );

  return (
    <div className="admin-page">

      {/* 탭 */}
      <div className="admin-section" style={{ marginBottom: 24 }}>
        <div className="admin-tabs">
          {[
            { key: "members",  label: "전체 회원 조회" },
            { key: "agencies", label: "대행사 승인 관리" },
            // { key: "requests", label: "가입 신청 현황" },
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

        {/* ── 전체 회원 조회 ── */}
        {tab === "members" && (
          <div className="admin-section__body">
            <div className="admin-filter-bar">
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                <input
                  className="admin-search-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="이름 또는 이메일 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="ALL">역할 전체</option>
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="AGENCY">AGENCY</option>
                <option value="ENGINEER">ENGINEER</option>
              </select>
              <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">상태 전체</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
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
                {filteredMembers.map((m) => (
                  <tr key={m.id}>
                    <td style={{ color: "#aaa", fontSize: 12 }}>{m.id}</td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td style={{ color: "#666" }}>{m.email}</td>
                    <td><span className={`admin-badge admin-badge--${ROLE_BADGE[m.role]}`}>{m.role}</span></td>
                    <td><span className={`admin-badge admin-badge--${STATUS_BADGE[m.status]}`}>{m.status}</span></td>
                    <td style={{ color: "#888", fontSize: 12 }}>{m.joinedAt}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn--outline admin-btn--sm"
                        onClick={() => setStatusModal(m)}
                      >
                        상태 변경
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMembers.length === 0 && (
                  <tr><td colSpan={7} className="admin-empty">검색 결과가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 대행사 승인 관리 ── */}
        {tab === "agencies" && (
          <div className="admin-section__body">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>대행사명</th>
                  <th>사업자번호</th>
                  <th>서비스 지역</th>
                  <th>신청일</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {mockAgencies.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td style={{ color: "#888", fontSize: 12 }}>{a.bizNo}</td>
                    <td>{a.region}</td>
                    <td style={{ color: "#888", fontSize: 12 }}>{a.appliedAt}</td>
                    <td><span className={`admin-badge admin-badge--${APPR_BADGE[a.status]}`}>{a.status}</span></td>
                    <td>
                      {a.status === "PENDING" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="admin-btn admin-btn--approve admin-btn--sm" onClick={() => setAgencyModal(a)}>승인</button>
                          <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => setRejectModal({ title: "대행사 반려" })}>반려</button>
                        </div>
                      )}
                      {a.status !== "PENDING" && <span style={{ fontSize: 12, color: "#aaa" }}>처리 완료</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 가입 신청 현황 ── */}
        {/* {tab === "requests" && (
          <div className="admin-section__body">
            <div className="admin-filter-bar">
              <select className="admin-select" value={reqStatusFilter} onChange={(e) => setReqStatusFilter(e.target.value)}>
                <option value="ALL">상태 전체</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>신청자</th>
                  <th>이메일</th>
                  <th>역할</th>
                  <th>소속 대행사</th>
                  <th>상태</th>
                  <th>신청일</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td style={{ color: "#666" }}>{r.email}</td>
                    <td><span className={`admin-badge admin-badge--${ROLE_BADGE[r.role]}`}>{r.role}</span></td>
                    <td>{r.agency}</td>
                    <td><span className={`admin-badge admin-badge--${APPR_BADGE[r.status]}`}>{r.status}</span></td>
                    <td style={{ color: "#888", fontSize: 12 }}>{r.appliedAt}</td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">해당 조건의 신청 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )} */}
      </div>

      {/* 모달 */}
      {statusModal && (
        <StatusModal
          member={statusModal}
          onClose={() => setStatusModal(null)}
          onSave={(newStatus) => {
            setMembers((prev) => prev.map((m) => m.id === statusModal.id ? { ...m, status: newStatus } : m));
            setStatusModal(null);
          }}
        />
      )}
      {agencyModal && <AgencyApproveModal agency={agencyModal} onClose={() => setAgencyModal(null)} />}
      {rejectModal  && <RejectModal title={rejectModal.title} onClose={() => setRejectModal(null)} />}
    </div>
  );
}
