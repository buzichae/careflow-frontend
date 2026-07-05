import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import "../../styles/Admin/Admin.css";
import {
  getAdminSettlements,
  getAdminSettlementDetails,
  approveAdminSettlement,
  approveAllAdminSettlements,
  updateAdminSettlementStatus,
  updateAdminBatchStatus,
} from "../../apis/adminSettlement";

/* 최근 N개월 선택 옵션 생성 (당월부터 과거순) */
function getRecentMonths(count = 6) {
  const now = new Date();
  const months = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`,
    });
  }
  return months;
}

function fmt(n) {
  if (!n) return "—";
  return n.toLocaleString() + "원";
}

const STATUS_META = {
  PENDING: { label: "미지급", badge: "orange" },
  PAID:    { label: "지급 완료", badge: "green" },
  NONE:    { label: "내역 없음", badge: "gray" },
};

// 건별 정산 상태(CareFlow→대행사) 배지 — PENDING/PAID/DISPUTED
const ITEM_STATUS_META = {
  PENDING:  { label: "지급 대기", badge: "orange" },
  PAID:     { label: "지급 완료", badge: "green" },
  DISPUTED: { label: "보류",     badge: "red" },
};

export default function AdminSettlementPage() {
  const monthOptions = useMemo(() => getRecentMonths(6), []);
  const [selected, setSelected] = useState(monthOptions[0]);

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const [expanded, setExpanded] = useState(null);
  const [details, setDetails] = useState({}); // agencyId -> rows
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);

  const [approvingId, setApprovingId] = useState(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [updatingBatchId, setUpdatingBatchId] = useState(null);

  const fetchSummary = () => {
    setLoading(true);
    getAdminSettlements(selected.year, selected.month)
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
    setExpanded(null);
    setDetails({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split("-").map(Number);
    setSelected({ year, month, label: e.target.options[e.target.selectedIndex].text });
  };

  const toggleExpand = (agencyId) => {
    if (expanded === agencyId) {
      setExpanded(null);
      return;
    }
    setExpanded(agencyId);
    if (!details[agencyId]) {
      setDetailsLoadingId(agencyId);
      getAdminSettlementDetails(agencyId, selected.year, selected.month)
        .then((res) => setDetails((prev) => ({ ...prev, [agencyId]: res.data ?? [] })))
        .catch(() => setDetails((prev) => ({ ...prev, [agencyId]: [] })))
        .finally(() => setDetailsLoadingId(null));
    }
  };

  const approveAgency = async (agencyId) => {
    setApprovingId(agencyId);
    try {
      await approveAdminSettlement(agencyId, selected.year, selected.month);
      fetchSummary();
    } catch {
      alert("지급 승인 처리 중 오류가 발생했습니다.");
    } finally {
      setApprovingId(null);
    }
  };

  const approveAll = async () => {
    setApprovingAll(true);
    try {
      await approveAllAdminSettlements(selected.year, selected.month);
      fetchSummary();
    } catch {
      alert("일괄 승인 처리 중 오류가 발생했습니다.");
    } finally {
      setApprovingAll(false);
    }
  };

  // 건별 정산 상태 변경(보류/재검토) — CareFlow→대행사 지급 상태는 ADMIN만 변경 가능
  const updateItemStatus = async (agencyId, settlementId, status) => {
    setUpdatingItemId(settlementId);
    try {
      await updateAdminSettlementStatus(settlementId, status);
      const res = await getAdminSettlementDetails(agencyId, selected.year, selected.month);
      setDetails((prev) => ({ ...prev, [agencyId]: res.data ?? [] }));
      fetchSummary(); // 대행사별 미지급 건수 등 요약 통계도 함께 갱신
    } catch {
      alert("정산 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // 배치 단위 정산 상태 변경(보류/재검토) — platform_settlements 배치 자체를 CareFlow 자체 판단으로 잠금/해제
  const updateBatchStatus = async (agencyId, status) => {
    setUpdatingBatchId(agencyId);
    try {
      await updateAdminBatchStatus(agencyId, selected.year, selected.month, status);
      fetchSummary();
    } catch {
      alert("배치 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdatingBatchId(null);
    }
  };

  const rows = summary?.agencies ?? [];
  const kpi = summary?.summary ?? {
    totalRevenue: 0,
    totalCareflowFee: 0,
    totalAgencyPay: 0,
    pendingCount: 0,
  };
  const pendingCount = kpi.pendingCount ?? 0;

  return (
    <div className="admin-page">

      {/* 월 선택 + 전체 승인 */}
      <div className="admin-filter-bar" style={{ marginBottom: 20 }}>
        <select
          className="admin-select"
          value={`${selected.year}-${selected.month}`}
          onChange={handleMonthChange}
        >
          {monthOptions.map((m) => (
            <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
              {m.label}
            </option>
          ))}
        </select>
        {pendingCount > 0 && (
          <button
            className="admin-btn admin-btn--primary"
            style={{ marginLeft: "auto" }}
            onClick={approveAll}
            disabled={approvingAll}
          >
            {approvingAll ? "처리 중..." : `미지급 전체 승인 (${pendingCount}개 대행사)`}
          </button>
        )}
      </div>

      {/* KPI 카드 */}
      <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <p className="admin-stat-card__num" style={{ fontSize: 18 }}>{fmt(kpi.totalRevenue)}</p>
          <p className="admin-stat-card__label">월 총 매출</p>
        </div>
        <div className="admin-stat-card" style={{ border: "1.5px solid #734bcf" }}>
          <p className="admin-stat-card__num" style={{ fontSize: 18, color: "#734bcf" }}>{fmt(kpi.totalCareflowFee)}</p>
          <p className="admin-stat-card__label">CareFlow 수수료 (순수익)</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-card__num" style={{ fontSize: 18 }}>{fmt(kpi.totalAgencyPay)}</p>
          <p className="admin-stat-card__label">대행사 지급 합계</p>
        </div>
        <div className="admin-stat-card" style={pendingCount > 0 ? { border: "1.5px solid #f59e0b", background: "#fffbf0" } : {}}>
          <p className="admin-stat-card__num" style={{ fontSize: 28, color: pendingCount > 0 ? "#f59e0b" : "#16a34a" }}>
            {pendingCount}
          </p>
          <p className="admin-stat-card__label">미지급 대행사 수</p>
        </div>
      </div>

      {/* 대행사별 정산 현황 */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">대행사별 정산 현황</h2>
          <span style={{ fontSize: 12, color: "#aaa" }}>{selected.label}</span>
        </div>
        <div className="admin-section__body" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>대행사</th>
                <th>A/S 건수</th>
                <th>총 매출</th>
                <th>CareFlow 수수료</th>
                <th>대행사 지급액</th>
                <th>지급 상태</th>
                <th>지급 계좌</th>
                <th>처리</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="admin-empty">불러오는 중...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="admin-empty">정산 데이터가 없습니다.</td>
                </tr>
              ) : (
                rows.map((r) => {
                  const sm = STATUS_META[r.status] ?? STATUS_META.NONE;
                  const isExpanded = expanded === r.agencyId;
                  const detailRows = details[r.agencyId] ?? [];
                  return (
                    <Fragment key={r.agencyId}>
                      <tr style={{ background: isExpanded ? "#faf9ff" : undefined }}>
                        <td style={{ fontWeight: 600 }}>{r.agencyName}</td>
                        <td style={{ textAlign: "center" }}>{r.asCount || "—"}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(r.totalRevenue)}</td>
                        <td style={{ color: "#734bcf", fontWeight: 600 }}>{fmt(r.careflowFee)}</td>
                        <td style={{ fontWeight: 700 }}>{fmt(r.agencyPay)}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className={`admin-badge admin-badge--${sm.badge}`}>{sm.label}</span>
                            {r.platformSettlementStatus === "DISPUTED" && (
                              <span title="CareFlow가 이 배치 자체를 보류 처리했습니다(집계 오류 등)" style={{ display: "inline-flex", color: "#dc2626" }}>
                                <AlertTriangle size={15} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: "#666" }}>{r.paidBankAccount ?? "—"}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                            {r.status === "PENDING" && (
                              <button
                                className="admin-btn admin-btn--approve admin-btn--sm"
                                onClick={() => approveAgency(r.agencyId)}
                                disabled={approvingId === r.agencyId}
                              >
                                {approvingId === r.agencyId ? "처리 중..." : "지급 승인"}
                              </button>
                            )}
                            {r.platformSettlementStatus === "PENDING" && (
                              <button
                                className="admin-btn admin-btn--danger admin-btn--sm"
                                disabled={updatingBatchId === r.agencyId}
                                onClick={() => updateBatchStatus(r.agencyId, "DISPUTED")}
                              >
                                {updatingBatchId === r.agencyId ? "처리 중..." : "배치 보류"}
                              </button>
                            )}
                            {r.platformSettlementStatus === "DISPUTED" && (
                              <button
                                className="admin-btn admin-btn--outline admin-btn--sm"
                                disabled={updatingBatchId === r.agencyId}
                                onClick={() => updateBatchStatus(r.agencyId, "PENDING")}
                              >
                                {updatingBatchId === r.agencyId ? "처리 중..." : "배치 재검토"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {r.asCount > 0 && (
                            <button
                              className="admin-btn admin-btn--outline admin-btn--sm"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                              onClick={() => toggleExpand(r.agencyId)}
                            >
                              건별 내역
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* 건별 내역 인라인 펼침 */}
                      {isExpanded && (
                        <tr key={`${r.agencyId}-detail`}>
                          <td colSpan={9} style={{ padding: 0, background: "#faf9ff", borderBottom: "1px solid #ebebf0" }}>
                            <div style={{ padding: "12px 20px 16px" }}>
                              <p style={{ fontSize: 12, color: "#734bcf", fontWeight: 700, marginBottom: 10 }}>
                                {r.agencyName} · {selected.label} · 건별 내역
                              </p>
                              <table className="admin-table" style={{ background: "#fff" }}>
                                <thead>
                                  <tr>
                                    <th>정산번호</th>
                                    <th>완료일</th>
                                    <th>가전</th>
                                    <th>고객</th>
                                    <th>총액</th>
                                    <th>CareFlow 수수료</th>
                                    <th>대행사 지급액</th>
                                    <th>정산 상태</th>
                                    <th>처리</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detailsLoadingId === r.agencyId ? (
                                    <tr>
                                      <td colSpan={9} className="admin-empty">불러오는 중...</td>
                                    </tr>
                                  ) : detailRows.length === 0 ? (
                                    <tr>
                                      <td colSpan={9} className="admin-empty">건별 내역이 없습니다.</td>
                                    </tr>
                                  ) : (
                                    detailRows.map((d) => {
                                      const ism = ITEM_STATUS_META[d.status] ?? { label: d.status, badge: "gray" };
                                      const isUpdating = updatingItemId === d.settlementId;
                                      return (
                                        <tr key={d.settlementId}>
                                          <td style={{ fontSize: 11, color: "#aaa" }}>{d.settlementCode}</td>
                                          <td style={{ fontSize: 12, color: "#888" }}>{d.completedAt}</td>
                                          <td>{d.applianceName}</td>
                                          <td>{d.customerName}</td>
                                          <td style={{ fontWeight: 600 }}>{fmt(d.totalAmount)}</td>
                                          <td style={{ color: "#734bcf" }}>{fmt(d.careflowFee)}</td>
                                          <td style={{ fontWeight: 700 }}>{fmt(d.agencyPay)}</td>
                                          <td>
                                            <span className={`admin-badge admin-badge--${ism.badge}`}>{ism.label}</span>
                                          </td>
                                          <td>
                                            {d.status === "PENDING" && (
                                              <button
                                                className="admin-btn admin-btn--danger admin-btn--sm"
                                                disabled={isUpdating}
                                                onClick={() => updateItemStatus(r.agencyId, d.settlementId, "DISPUTED")}
                                              >
                                                {isUpdating ? "처리 중..." : "보류"}
                                              </button>
                                            )}
                                            {d.status === "DISPUTED" && (
                                              <button
                                                className="admin-btn admin-btn--outline admin-btn--sm"
                                                disabled={isUpdating}
                                                onClick={() => updateItemStatus(r.agencyId, d.settlementId, "PENDING")}
                                              >
                                                {isUpdating ? "처리 중..." : "재검토"}
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
