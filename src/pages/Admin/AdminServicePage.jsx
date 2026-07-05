import { useState, useEffect, useCallback } from "react";
import { X, Shield, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import api from "../../apis/axiosInstance";
import "../../styles/Admin/Admin.css";
import { getPageNumbers, DOTS } from "../../utils/pagination";

/* ── 상태 한글 매핑 ── */
const STATUS_MAP = {
  PENDING:           { label: "접수",      color: "orange" },
  AGENCY_RECEIVED:   { label: "대행사 접수", color: "blue"   },
  ASSIGNED:          { label: "배정 완료",  color: "blue"   },
  ACCEPTED:          { label: "수락",      color: "purple" },
  ENGINEER_DEPARTED: { label: "출발",      color: "purple" },
  ENGINEER_ARRIVED:  { label: "도착",      color: "purple" },
  IN_PROGRESS:       { label: "작업 중",   color: "purple" },
  COMPLETED:         { label: "완료",      color: "green"  },
  PAID:              { label: "결제 완료",  color: "green"  },
  CANCELLED:         { label: "취소",      color: "gray"   },
};

function CostEditModal({ item, onClose, onSave }) {
  const [cost, setCost] = useState(item.avgCost);
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">수리 비용 가이드 수정</h2>
          <button className="admin-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
          <strong>{item.categoryName}</strong> · {item.symptom}
        </p>
        <div className="admin-modal__field">
          <label className="admin-modal__label">예상 평균 비용 (원)</label>
          <input
            className="admin-modal__input"
            type="number"
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </div>
        <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
          * 매일 자정 Quartz 배치로 지난 1년 동일 증상 완료 건 평균이 자동 갱신됩니다.
        </p>
        <div className="admin-modal__footer">
          <button className="admin-btn admin-btn--outline" onClick={onClose}>취소</button>
          <button className="admin-btn admin-btn--primary" onClick={() => onSave(cost)}>저장</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminServicePage() {
  const [tab, setTab] = useState("as");

  /* ── A/S 상태 ── */
  const [stats, setStats] = useState({});
  const [asItems, setAsItems] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [asLoading, setAsLoading] = useState(false);

  /* ── 수리 비용 상태 ── */
  const [repairCosts, setRepairCosts] = useState([]);
  const [editCost, setEditCost] = useState(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costPage, setCostPage] = useState(0);
  const COST_PAGE_SIZE = 10;

  /* ── 인증 뱃지 상태 ── */
  const [badge, setBadge] = useState({ minGrade: "B", minScore: 75 });
  const [badgeEdit, setBadgeEdit] = useState(false);
  const [badgeDraft, setBadgeDraft] = useState({ minGrade: "B", minScore: 75 });
  const [badgeLoading, setBadgeLoading] = useState(false);

  /* ── A/S 데이터 fetch ── */
  const fetchAs = useCallback(async () => {
    setAsLoading(true);
    try {
      const params = { page, size: 10 };
      if (statusFilter) params.status = statusFilter;
      if (regionFilter) params.region = regionFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await api.get("/api/admin/as-requests", { params });
      setStats(res.data.stats || {});
      setAsItems(res.data.content || []);
      setTotalElements(res.data.totalElements || 0);
      setTotalPages(res.data.totalPages || 0);
    } catch (e) {
      console.error("A/S 내역 조회 실패", e);
    } finally {
      setAsLoading(false);
    }
  }, [page, statusFilter, regionFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (tab === "as") fetchAs();
  }, [tab, fetchAs]);

  /* ── 수리 비용 fetch ── */
  useEffect(() => {
    if (tab !== "cost") return;
    setCostLoading(true);
    setCostPage(0);
    api.get("/api/admin/repair-costs")
      .then((res) => setRepairCosts(res.data))
      .catch((e) => console.error("수리 비용 조회 실패", e))
      .finally(() => setCostLoading(false));
  }, [tab]);

  /* ── 뱃지 기준 fetch ── */
  useEffect(() => {
    if (tab !== "badge") return;
    setBadgeLoading(true);
    api.get("/api/admin/badge-criteria")
      .then((res) => {
        setBadge(res.data);
        setBadgeDraft(res.data);
      })
      .catch((e) => console.error("뱃지 기준 조회 실패", e))
      .finally(() => setBadgeLoading(false));
  }, [tab]);

  /* ── 수리 비용 저장 ── */
  const handleSaveCost = async (newCost) => {
    try {
      const res = await api.patch(`/api/admin/repair-costs/${editCost.id}`, { avgCost: newCost });
      setRepairCosts((prev) => prev.map((c) => c.id === editCost.id ? res.data : c));
      setEditCost(null);
    } catch (e) {
      console.error("수리 비용 수정 실패", e);
      alert("수정에 실패했습니다.");
    }
  };

  /* ── 뱃지 기준 저장 ── */
  const handleSaveBadge = async () => {
    try {
      await api.put("/api/admin/badge-criteria", badgeDraft);
      setBadge(badgeDraft);
      setBadgeEdit(false);
    } catch (e) {
      console.error("뱃지 기준 저장 실패", e);
      alert("저장에 실패했습니다.");
    }
  };

  /* ── 필터 초기화 ── */
  const resetFilters = () => {
    setStatusFilter("");
    setRegionFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  /* ── 통계 카드용 배열 ── */
  const statCards = Object.entries(STATUS_MAP).map(([key, { label, color }]) => ({
    key, label, color, count: stats[key] ?? 0,
  }));

  /* ── 수리 비용 가이드 클라이언트 페이지네이션 (전체 조회 API라 프론트에서 자름) ── */
  const costTotalPages = Math.ceil(repairCosts.length / COST_PAGE_SIZE);
  const pagedRepairCosts = repairCosts.slice(
    costPage * COST_PAGE_SIZE,
    (costPage + 1) * COST_PAGE_SIZE,
  );

  return (
    <div className="admin-page">
      <div className="admin-section">
        <div className="admin-tabs">
          {[
            { key: "as",    label: "전체 A/S 처리 내역" },
            { key: "cost",  label: "수리 비용 가이드" },
            { key: "badge", label: "인증 뱃지 기준" },
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

        {/* ── A/S 처리 현황 ── */}
        {tab === "as" && (
          <div className="admin-section__body">
            {/* 통계 요약 */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {statCards.map((s) => (
                <div key={s.key} className="admin-stat-card" style={{ flex: "1 1 100px", minWidth: 0 }}>
                  <p className="admin-stat-card__num">
                    {s.count}
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#aaa" }}>건</span>
                  </p>
                  <p className="admin-stat-card__label">
                    <span className={`admin-badge admin-badge--${s.color}`}>{s.label}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* 필터 */}
            <div className="admin-filter-bar" style={{ flexWrap: "wrap", gap: 8 }}>
              <select
                className="admin-select"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <option value="">상태 전체</option>
                {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input
                className="admin-select"
                placeholder="지역 검색"
                value={regionFilter}
                onChange={(e) => { setRegionFilter(e.target.value); setPage(0); }}
                style={{ width: 120 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                <input
                  type="date"
                  className="admin-date-input"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                />
                <span style={{ fontSize: 12, color: "#aaa" }}>~</span>
                <input
                  type="date"
                  className="admin-date-input"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                />
                {(statusFilter || regionFilter || dateFrom || dateTo) && (
                  <button className="admin-btn admin-btn--outline admin-btn--sm" onClick={resetFilters}>
                    초기화
                  </button>
                )}
              </div>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>접수번호</th>
                  <th>고객</th>
                  <th>가전</th>
                  <th>증상</th>
                  <th>지역</th>
                  <th>상태</th>
                  <th>접수일</th>
                </tr>
              </thead>
              <tbody>
                {asLoading ? (
                  <tr><td colSpan={7} className="admin-empty">불러오는 중...</td></tr>
                ) : asItems.length === 0 ? (
                  <tr><td colSpan={7} className="admin-empty">해당 조건의 A/S 내역이 없습니다.</td></tr>
                ) : asItems.map((a) => {
                  const s = STATUS_MAP[a.status] ?? { label: a.status, color: "gray" };
                  return (
                    <tr key={a.requestId}>
                      <td style={{ fontSize: 11, color: "#aaa" }}>{a.requestCode}</td>
                      <td>{a.customerName}</td>
                      <td>{a.applianceName}</td>
                      <td style={{ color: "#555" }}>{a.symptom}</td>
                      <td>{a.region}</td>
                      <td><span className={`admin-badge admin-badge--${s.color}`}>{s.label}</span></td>
                      <td style={{ color: "#888", fontSize: 12 }}>{a.createdAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 페이지네이션 — 회원 관리 페이지와 동일한 1,2,3,4,5,...N 스타일 */}
            {totalPages > 1 && (
              <div className="aep-pagination" style={{ justifyContent: "center", gap: 12, position: "relative" }}>
                <div className="aep-pagination__left">
                  <button onClick={() => setPage(0)} disabled={page === 0}><ChevronsLeft size={14} /></button>
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft size={14} /></button>
                  {getPageNumbers(page, totalPages).map((p, idx) =>
                    p === DOTS ? (
                      <span key={`dots-${idx}`} className="aep-pagination__ellipsis">...</span>
                    ) : (
                      <button
                        key={p}
                        className={page === p ? "aep-pagination__active" : ""}
                        onClick={() => setPage(p)}
                      >
                        {p + 1}
                      </button>
                    ),
                  )}
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}><ChevronRight size={14} /></button>
                  <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}><ChevronsRight size={14} /></button>
                </div>
                <span style={{ fontSize: 13, color: "#888", position: "absolute", right: 0 }}>총 {totalElements}건</span>
              </div>
            )}
          </div>
        )}

        {/* ── 수리 비용 가이드 ── */}
        {tab === "cost" && (
          <div className="admin-section__body">
            <p style={{ fontSize: 12, color: "#aaa", marginBottom: 14 }}>
              가전 카테고리 × 증상별 예상 평균 수리 비용입니다. 항목을 클릭하여 수동으로 수정할 수 있습니다.
            </p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>증상</th>
                  <th>예상 평균 비용</th>
                  <th>수정</th>
                </tr>
              </thead>
              <tbody>
                {costLoading ? (
                  <tr><td colSpan={4} className="admin-empty">불러오는 중...</td></tr>
                ) : repairCosts.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty">데이터가 없습니다.</td></tr>
                ) : pagedRepairCosts.map((c) => (
                  <tr key={c.id}>
                    <td><span className="admin-badge admin-badge--purple">{c.categoryName}</span></td>
                    <td>{c.symptom}</td>
                    <td style={{ fontWeight: 600 }}>{(c.avgCost ?? 0).toLocaleString()}원</td>
                    <td>
                      <button className="admin-btn admin-btn--outline admin-btn--sm" onClick={() => setEditCost(c)}>
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {costTotalPages > 1 && (
              <div className="crh-pagination">
                <button
                  className="crh-page-btn"
                  onClick={() => setCostPage((p) => Math.max(0, p - 1))}
                  disabled={costPage === 0}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: costTotalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`crh-page-btn ${costPage === i ? "crh-page-btn--active" : ""}`}
                    onClick={() => setCostPage(i)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="crh-page-btn"
                  onClick={() => setCostPage((p) => Math.min(costTotalPages - 1, p + 1))}
                  disabled={costPage >= costTotalPages - 1}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 인증 뱃지 기준 ── */}
        {tab === "badge" && (
          <div className="admin-section__body">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <Shield size={20} color="#734bcf" />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>CareFlow 인증 뱃지 기준</h3>
                </div>

                {badgeLoading ? (
                  <p style={{ color: "#aaa", fontSize: 13 }}>불러오는 중...</p>
                ) : !badgeEdit ? (
                  <>
                    <div style={{ background: "#f8f8fc", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                      <p style={{ fontSize: 12, color: "#888", margin: "0 0 6px" }}>현재 인증 기준</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
                        {badge.minGrade}등급 이상 &amp; {badge.minScore}점 이상
                      </p>
                      <p style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>
                        A/S 완료 후 위 기준 충족 시 CareFlow 인증 뱃지가 자동 부여됩니다.
                      </p>
                    </div>
                    <button className="admin-btn admin-btn--primary" onClick={() => { setBadgeDraft(badge); setBadgeEdit(true); }}>
                      기준 수정
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                      <div className="admin-modal__field" style={{ flex: 1 }}>
                        <label className="admin-modal__label">최소 등급</label>
                        <select
                          className="admin-select"
                          style={{ width: "100%" }}
                          value={badgeDraft.minGrade}
                          onChange={(e) => setBadgeDraft((p) => ({ ...p, minGrade: e.target.value }))}
                        >
                          {["A", "B", "C", "D"].map((g) => <option key={g} value={g}>{g}등급</option>)}
                        </select>
                      </div>
                      <div className="admin-modal__field" style={{ flex: 1 }}>
                        <label className="admin-modal__label">최소 점수</label>
                        <input
                          className="admin-modal__input"
                          type="number"
                          min={0}
                          max={100}
                          value={badgeDraft.minScore}
                          onChange={(e) => setBadgeDraft((p) => ({ ...p, minScore: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="admin-btn admin-btn--outline" onClick={() => setBadgeEdit(false)}>취소</button>
                      <button className="admin-btn admin-btn--primary" onClick={handleSaveBadge}>저장</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {editCost && (
        <CostEditModal
          item={editCost}
          onClose={() => setEditCost(null)}
          onSave={handleSaveCost}
        />
      )}
    </div>
  );
}
