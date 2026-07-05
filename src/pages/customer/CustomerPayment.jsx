import { useState, useEffect } from "react";
import { CreditCard, Wallet, AlertTriangle, CheckCircle, ClipboardList } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import "../../styles/Customer/CustomerPayment.css";
import {
  getMyAS,
  getReport,
  processPayment,
  getPaymentSummary,
  getMonthlyPayments,
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
function fmtMonthLabel(yearMonth) {
  // "2026-07" -> "7월"
  const m = Number(String(yearMonth).slice(5, 7));
  return `${m}월`;
}

/* 결제 대기 카드 */
function PaymentActionCard({ req, report, onPaid }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const amount = report?.finalAmount;
    const label  = amount != null ? `금액: ${fmtWon(amount)}\n` : "";
    if (!window.confirm(`결제를 진행하시겠습니까?\n${label}제품: ${productName(req)}`)) return;
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
          <div><span>방문 예정일</span><strong>{fmt(req.scheduledDate)}</strong></div>
          <div>
            <span>담당 기사</span>
            <strong>{report?.engineerName ?? "—"}</strong>
          </div>
          <div>
            <span>총 금액</span>
            <strong className="cp-action-card__price">
              {report?.finalAmount != null ? `${Number(report.finalAmount).toLocaleString()}원` : "—"}
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
  const [asList,   setAsList]   = useState([]);
  const [reports,  setReports]  = useState({});
  const [summary,  setSummary]  = useState(null);
  const [monthly,  setMonthly]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [asRes, summaryRes, monthlyRes] = await Promise.all([
        getMyAS(),
        getPaymentSummary().catch(() => ({ data: null })),
        getMonthlyPayments().catch(() => ({ data: [] })),
      ]);

      const list = asRes.data?.content ?? asRes.data ?? [];
      const arr  = Array.isArray(list) ? list : [];
      setAsList(arr);
      setSummary(summaryRes.data);
      setMonthly(Array.isArray(monthlyRes.data) ? monthlyRes.data : []);

      // reportId 있는 건 병렬 fetch (결제 내역 테이블용 기사명/금액)
      const withReport = arr.filter((r) => r.reportId);
      const fetched = await Promise.all(
        withReport.map((r) =>
          getReport(r.reportId)
            .then((res) => ({ id: r.reportId, data: res.data }))
            .catch(() => ({ id: r.reportId, data: null }))
        )
      );
      const map = {};
      fetched.forEach(({ id, data }) => { if (data) map[id] = data; });
      setReports(map);
    } catch {
      setAsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const pending = asList.filter((r) => r.status === "COMPLETED" && r.reportId);

  const KPI = [
    { label: "총 지출",        value: fmtWon(summary?.totalAmount),      sub: "결제 완료 누적",    Icon: Wallet,        highlight: false },
    { label: "이번 달 지출",   value: fmtWon(summary?.thisMonthAmount),  sub: "이번 달 결제 합계", Icon: CheckCircle,   highlight: false },
    { label: "미결제 건수",    value: summary != null ? `${summary.unpaidCount} 건` : "—", sub: "결제 대기 중", Icon: AlertTriangle, highlight: (summary?.unpaidCount ?? 0) > 0 },
    { label: "부품비",         value: fmtWon(summary?.partsAmount),      sub: `기타 ${fmtWon(summary?.otherAmount)}`, Icon: ClipboardList, highlight: false },
  ];

  const STATUS_META = {
    PAID:      { label: "완료",   bg: "#e8f9f0", color: "#22c55e" },
    COMPLETED: { label: "대기",   bg: "#fff7e6", color: "#f59e0b" },
    CANCELLED: { label: "취소",   bg: "#f5f5f5", color: "#aaa"    },
  };

  const historyList = asList.filter((r) => ["COMPLETED", "PAID", "CANCELLED"].includes(r.status));

  return (
    <div className="cp-wrap">

      {/* KPI */}
      <div className="cp-kpi-grid">
        {KPI.map(({ label, value, sub, Icon, highlight }) => (
          <div key={label} className={`cp-kpi${highlight ? " cp-kpi--alert" : ""}`}>
            <div className="cp-kpi__text">
              <p className="cp-kpi__value">{value}</p>
              <p className="cp-kpi__label">{label}</p>
              <p className="cp-kpi__sub">{sub}</p>
            </div>
            <Icon className="cp-kpi__watermark" strokeWidth={1} />
          </div>
        ))}
      </div>

      {/* 월별 결제액 추이 */}
      {!loading && monthly.length > 0 && (
        <div className="cp-card">
          <div className="cp-card__header">
            <h2>월별 결제 추이</h2>
            <span className="cp-card__sub">최근 6개월</span>
          </div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={monthly} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="yearMonth" tickFormatter={fmtMonthLabel} fontSize={12} />
                <YAxis
                  tickFormatter={(v) => `${Math.round(v / 10000)}만`}
                  fontSize={12}
                  width={48}
                />
                <Tooltip
                  formatter={(value) => [fmtWon(value), "결제액"]}
                  labelFormatter={fmtMonthLabel}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 결제 대기 Action Cards */}
      {!loading && pending.map((req) => (
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
        </div>
        {loading ? (
          <p style={{ textAlign: "center", color: "#aaa", padding: "32px 0", fontSize: 13 }}>
            불러오는 중...
          </p>
        ) : historyList.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa", padding: "32px 0", fontSize: 13 }}>
            결제 내역이 없습니다.
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
            {historyList.map((r, i) => {
              const rpt = reports[r.reportId] ?? null;
              const st  = STATUS_META[r.status] ?? { label: r.status, bg: "#f5f5f5", color: "#aaa" };
              return (
                <div key={r.requestId ?? i} className="cp-table__row">
                  <span className="cp-table__product">{productName(r)}</span>
                  <span className="cp-table__engineer">{rpt?.engineerName ?? "—"}</span>
                  <span className="cp-table__amount">
                    {rpt?.finalAmount != null ? fmtWon(rpt.finalAmount) : "—"}
                  </span>
                  <span className="cp-table__date">{fmt(r.scheduledDate)}</span>
                  <span>
                    <span className="cp-badge" style={{ background: st.bg, color: st.color }}>
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
