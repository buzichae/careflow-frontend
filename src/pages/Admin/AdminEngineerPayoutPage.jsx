import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import "../../styles/Admin/Admin.css";
import { getAdminEngineerPayouts, updateAdminEngineerPayoutStatus } from "../../apis/adminEngineerPayout";

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
  PENDING:  { label: "지급 대기", badge: "orange" },
  PAID:     { label: "지급 완료", badge: "green" },
  DISPUTED: { label: "보류",     badge: "red" },
};

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "PENDING", label: "지급 대기" },
  { value: "PAID", label: "지급 완료" },
  { value: "DISPUTED", label: "보류" },
];

export default function AdminEngineerPayoutPage() {
  const monthOptions = useMemo(() => getRecentMonths(6), []);
  const [selected, setSelected] = useState(monthOptions[0]);
  const [statusFilter, setStatusFilter] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    getAdminEngineerPayouts(selected.year, selected.month, statusFilter)
      .then((res) => setItems(res.data?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, statusFilter]);

  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split("-").map(Number);
    setSelected({ year, month, label: e.target.options[e.target.selectedIndex].text });
  };

  const updateStatus = async (engineerPayoutId, status) => {
    setUpdatingId(engineerPayoutId);
    try {
      await updateAdminEngineerPayoutStatus(engineerPayoutId, status);
      fetchItems();
    } catch {
      alert("지급 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-page">

      {/* 월 선택 + 상태 필터 */}
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
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 지급 배치 목록 */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">대행사→기사 지급 배치 목록</h2>
          <span style={{ fontSize: 12, color: "#aaa" }}>{selected.label}</span>
        </div>
        <div className="admin-section__body" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>대행사</th>
                <th>기사</th>
                <th>건수</th>
                <th>지급액</th>
                <th>지급 상태</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="admin-empty">불러오는 중...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty">지급 배치가 없습니다.</td>
                </tr>
              ) : (
                items.map((it) => {
                  const sm = STATUS_META[it.status] ?? { label: it.status, badge: "gray" };
                  const isUpdating = updatingId === it.engineerPayoutId;
                  return (
                    <tr key={it.engineerPayoutId}>
                      <td style={{ fontWeight: 600 }}>{it.agencyName}</td>
                      <td>{it.engineerName}</td>
                      <td style={{ textAlign: "center" }}>{it.caseCount}건</td>
                      <td style={{ fontWeight: 700 }}>{fmt(it.netAmountSum)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className={`admin-badge admin-badge--${sm.badge}`}>{sm.label}</span>
                          {it.status === "DISPUTED" && (
                            <span title="기사가 지급 관련 이의를 제기하여 보류 중입니다" style={{ display: "inline-flex", color: "#dc2626" }}>
                              <AlertTriangle size={15} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {it.status === "PENDING" && (
                          <button
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            disabled={isUpdating}
                            onClick={() => updateStatus(it.engineerPayoutId, "DISPUTED")}
                          >
                            {isUpdating ? "처리 중..." : "보류"}
                          </button>
                        )}
                        {it.status === "DISPUTED" && (
                          <button
                            className="admin-btn admin-btn--outline admin-btn--sm"
                            disabled={isUpdating}
                            onClick={() => updateStatus(it.engineerPayoutId, "PENDING")}
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
      </div>

    </div>
  );
}
