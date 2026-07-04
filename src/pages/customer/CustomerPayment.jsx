import { useState, useEffect } from "react";
import {
  CreditCard,
  Wallet,
  AlertTriangle,
  CheckCircle,
  ClipboardList,
} from "lucide-react";
import "../../styles/Customer/CustomerPayment.css";
import {
  getMyAS,
  getReport,
  processPayment,
  getPaymentSummary,
} from "../../apis/as";

function fmt(dateStr) {
  return dateStr ? String(dateStr).slice(0, 10).replace(/-/g, ".") : "—";
}
function fmtWon(amount) {
  if (amount == null) return "—";
  return `₩${Number(amount).toLocaleString()}`;
}
function productName(r) {
  return [r.brand, r.modelName].filter(Boolean).join(" ") || "—";
}

/* 결제 대기 카드 */
function PaymentActionCard({ req, report, onPaid }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const amount = report?.finalAmount;
    const label = amount != null ? `금액: ${fmtWon(amount)}\n` : "";
    if (
      !window.confirm(
        `결제를 진행하시겠습니까?\n${label}제품: ${productName(req)}`,
      )
    )
      return;
    setLoading(true);
    try {
      await processPayment(req.requestId);
      onPaid();
    } catch (e) {
      alert(e?.response?.data?.message ?? "결제 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-action-card">
      <div className="cp-action-card__left">
        <div className="cp-action-card__alert">
          <span>⚠</span> 결제가 필요한 수리가 있습니다
        </div>
        <p className="cp-action-card__product">{productName(req)}</p>
        <div className="cp-action-card__meta">
          <div>
            <span>방문 예정일</span>
            <strong>{fmt(req.scheduledDate)}</strong>
          </div>
          <div>
            <span>담당 기사</span>
            <strong>{report?.engineerName ?? "—"}</strong>
          </div>
          <div>
            <span>총 금액</span>
            <strong className="cp-action-card__price">
              {report?.finalAmount != null
                ? `${Number(report.finalAmount).toLocaleString()}원`
                : "—"}
            </strong>
          </div>
        </div>
      </div>
      <div className="cp-action-card__btns">
        <button
          className="cp-btn cp-btn--primary"
          onClick={handlePay}
          disabled={loading}
        >
          <CreditCard size={14} /> {loading ? "처리 중..." : "결제하기"}
        </button>
      </div>
    </div>
  );
}

export default function CustomerPayment() {
  const [asList, setAsList] = useState([]);
  const [reports, setReports] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [asRes, summaryRes] = await Promise.all([
        getMyAS(),
        getPaymentSummary().catch(() => ({ data: null })),
      ]);

      const list = asRes.data?.content ?? asRes.data ?? [];
      const arr = Array.isArray(list) ? list : [];
      setAsList(arr);
      setSummary(summaryRes.data);

      // reportId 있는 건 병렬 fetch (결제 내역 테이블용 기사명/금액)
      const withReport = arr.filter((r) => r.reportId);
      const fetched = await Promise.all(
        withReport.map((r) =>
          getReport(r.reportId)
            .then((res) => ({ id: r.reportId, data: res.data }))
            .catch(() => ({ id: r.reportId, data: null })),
        ),
      );
      const map = {};
      fetched.forEach(({ id, data }) => {
        if (data) map[id] = data;
      });
      setReports(map);
    } catch {
      setAsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const pending = asList.filter((r) => r.status === "COMPLETED" && r.reportId);

  const KPI = [
    {
      label: "총 지출",
      value: fmtWon(summary?.totalAmount),
      sub: "결제 완료 누적",
      Icon: Wallet,
      highlight: false,
    },
    {
      label: "이번 달 지출",
      value: fmtWon(summary?.thisMonthAmount),
      sub: "이번 달 결제 합계",
      Icon: CheckCircle,
      highlight: false,
    },
    {
      label: "미결제 건수",
      value: summary != null ? `${summary.unpaidCount} 건` : "—",
      sub: "결제 대기 중",
      Icon: AlertTriangle,
      highlight: (summary?.unpaidCount ?? 0) > 0,
    },
  ];

  const STATUS_META = {
    PAID: { label: "완료", bg: "#e8f9f0", color: "#22c55e" },
    COMPLETED: { label: "대기", bg: "#fff7e6", color: "#f59e0b" },
    CANCELLED: { label: "취소", bg: "#f5f5f5", color: "#aaa" },
  };

  const historyList = asList.filter((r) =>
    ["COMPLETED", "PAID", "CANCELLED"].includes(r.status),
  );

  const availableYears = Array.from(
    new Set(
      historyList
        .map((r) => r.scheduledDate)
        .filter(Boolean)
        .map((d) => d.slice(0, 4)),
    ),
  ).sort((a, b) => b - a);

  const filteredHistory = historyList.filter((r) => {
    if (yearFilter === "all" && monthFilter === "all") return true;
    if (!r.scheduledDate) return false;
    const [y, m] = r.scheduledDate.split("-");
    if (yearFilter !== "all" && y !== yearFilter) return false;
    if (monthFilter !== "all" && Number(m) !== Number(monthFilter)) return false;
    return true;
  });

  return (
    <div className="cp-wrap">
      {/* KPI */}
      <div className="cp-kpi-grid">
        {KPI.map(({ label, value, sub, Icon, highlight }) => (
          <div
            key={label}
            className={`cp-kpi${highlight ? " cp-kpi--alert" : ""}`}
          >
            <div className="cp-kpi__text">
              <p className="cp-kpi__value">{value}</p>
              <p className="cp-kpi__label">{label}</p>
              <p className="cp-kpi__sub">{sub}</p>
            </div>
            <Icon className="cp-kpi__watermark" strokeWidth={1} />
          </div>
        ))}
      </div>

      {/* 결제 대기 Action Cards */}
      {!loading &&
        pending.map((req) => (
          <PaymentActionCard
            key={req.requestId}
            req={req}
            report={reports[req.reportId] ?? null}
            onPaid={fetchAll}
          />
        ))}

      {/* 결제 내역 테이블 */}
      <div className="cp-card">
        <div className="cp-card__header">
          <h2>결제 내역</h2>
          <div className="cp-filter-row">
            <select
              className="cp-filter-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">전체 연도</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <select
              className="cp-filter-select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="all">전체 월</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <p
            style={{
              textAlign: "center",
              color: "#aaa",
              padding: "32px 0",
              fontSize: 13,
            }}
          >
            불러오는 중...
          </p>
        ) : historyList.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#aaa",
              padding: "32px 0",
              fontSize: 13,
            }}
          >
            결제 내역이 없습니다.
          </p>
        ) : filteredHistory.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#aaa",
              padding: "32px 0",
              fontSize: 13,
            }}
          >
            선택한 기간에 해당하는 내역이 없습니다.
          </p>
        ) : (
          <div className="cp-table">
            <div className="cp-table__head">
              <span>제품</span>
              <span>기사</span>
              <span>금액</span>
              <span>날짜</span>
              <span>상태</span>
            </div>
            {filteredHistory.map((r, i) => {
              const rpt = reports[r.reportId] ?? null;
              const st = STATUS_META[r.status] ?? {
                label: r.status,
                bg: "#f5f5f5",
                color: "#aaa",
              };
              return (
                <div key={r.requestId ?? i} className="cp-table__row">
                  <span className="cp-table__product">{productName(r)}</span>
                  <span className="cp-table__engineer">
                    {rpt?.engineerName ?? "—"}
                  </span>
                  <span className="cp-table__amount">
                    {rpt?.finalAmount != null ? fmtWon(rpt.finalAmount) : "—"}
                  </span>
                  <span className="cp-table__date">{fmt(r.scheduledDate)}</span>
                  <span>
                    <span
                      className="cp-badge"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
