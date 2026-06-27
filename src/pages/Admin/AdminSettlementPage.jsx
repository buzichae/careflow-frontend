import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import "../../styles/Admin/Admin.css";

/* ── 상수 ── */
const MONTHS = ["2026년 6월", "2026년 5월", "2026년 4월", "2026년 3월"];

/* ── 목 데이터: 대행사별 월별 정산 ── */
const mockAgencies = [
  {
    id: 1, name: "한국서비스대행사",
    monthly: {
      "2026년 6월": { asCount: 5, totalRevenue: 5200000, careflowFee: 520000, agencyPay: 4680000, status: "PENDING" },
      "2026년 5월": { asCount: 5, totalRevenue: 4800000, careflowFee: 480000, agencyPay: 4320000, status: "PAID"    },
      "2026년 4월": { asCount: 4, totalRevenue: 3900000, careflowFee: 390000, agencyPay: 3510000, status: "PAID"    },
    },
    details: {
      "2026년 6월": [
        { id: "SET-001", date: "2026.06.05", appliance: "냉장고", customer: "김철수", total: 95000,  careflowFee: 9500,  agencyPay: 85500  },
        { id: "SET-002", date: "2026.06.10", appliance: "세탁기", customer: "이영희", total: 72000,  careflowFee: 7200,  agencyPay: 64800  },
        { id: "SET-003", date: "2026.06.15", appliance: "에어컨", customer: "최수연", total: 120000, careflowFee: 12000, agencyPay: 108000 },
        { id: "SET-004", date: "2026.06.20", appliance: "TV",    customer: "정다은", total: 85000,  careflowFee: 8500,  agencyPay: 76500  },
        { id: "SET-005", date: "2026.06.23", appliance: "건조기", customer: "강민준", total: 68000,  careflowFee: 6800,  agencyPay: 61200  },
      ],
      "2026년 5월": [
        { id: "SET-021", date: "2026.05.08", appliance: "냉장고", customer: "박소연", total: 95000,  careflowFee: 9500,  agencyPay: 85500  },
        { id: "SET-022", date: "2026.05.14", appliance: "세탁기", customer: "윤지호", total: 110000, careflowFee: 11000, agencyPay: 99000  },
        { id: "SET-023", date: "2026.05.20", appliance: "TV",    customer: "임재원", total: 78000,  careflowFee: 7800,  agencyPay: 70200  },
        { id: "SET-024", date: "2026.05.25", appliance: "에어컨", customer: "홍지수", total: 130000, careflowFee: 13000, agencyPay: 117000 },
        { id: "SET-025", date: "2026.05.28", appliance: "건조기", customer: "신민아", total: 67000,  careflowFee: 6700,  agencyPay: 60300  },
      ],
    },
  },
  {
    id: 2, name: "미래전자서비스",
    monthly: {
      "2026년 6월": { asCount: 3, totalRevenue: 3100000, careflowFee: 310000, agencyPay: 2790000, status: "PENDING" },
      "2026년 5월": { asCount: 3, totalRevenue: 2900000, careflowFee: 290000, agencyPay: 2610000, status: "PAID"    },
    },
    details: {
      "2026년 6월": [
        { id: "SET-011", date: "2026.06.07", appliance: "냉장고", customer: "오지수", total: 110000, careflowFee: 11000, agencyPay: 99000 },
        { id: "SET-012", date: "2026.06.18", appliance: "세탁기", customer: "한소희", total: 55000,  careflowFee: 5500,  agencyPay: 49500 },
        { id: "SET-013", date: "2026.06.22", appliance: "에어컨", customer: "남주혁", total: 98000,  careflowFee: 9800,  agencyPay: 88200 },
      ],
    },
  },
  {
    id: 3, name: "스마트케어",
    monthly: {
      "2026년 6월": { asCount: 3, totalRevenue: 1850000, careflowFee: 185000, agencyPay: 1665000, status: "PENDING" },
      "2026년 5월": { asCount: 4, totalRevenue: 2100000, careflowFee: 210000, agencyPay: 1890000, status: "PAID"    },
    },
    details: {
      "2026년 6월": [
        { id: "SET-031", date: "2026.06.03", appliance: "TV",    customer: "권나라", total: 88000,  careflowFee: 8800,  agencyPay: 79200 },
        { id: "SET-032", date: "2026.06.11", appliance: "냉장고", customer: "배수지", total: 72000,  careflowFee: 7200,  agencyPay: 64800 },
        { id: "SET-033", date: "2026.06.19", appliance: "세탁기", customer: "송중기", total: 65000,  careflowFee: 6500,  agencyPay: 58500 },
      ],
    },
  },
  {
    id: 4, name: "프리미엄AS",
    monthly: {
      "2026년 6월": { asCount: 2, totalRevenue: 980000,  careflowFee: 98000,  agencyPay: 882000,  status: "PAID"    },
      "2026년 5월": { asCount: 3, totalRevenue: 1450000, careflowFee: 145000, agencyPay: 1305000, status: "PAID"    },
    },
    details: {
      "2026년 6월": [
        { id: "SET-041", date: "2026.06.09", appliance: "에어컨", customer: "이준기", total: 118000, careflowFee: 11800, agencyPay: 106200 },
        { id: "SET-042", date: "2026.06.21", appliance: "건조기", customer: "김태희", total: 92000,  careflowFee: 9200,  agencyPay: 82800  },
      ],
    },
  },
  {
    id: 5, name: "케어플러스",
    monthly: {
      "2026년 6월": { asCount: 0, totalRevenue: 0,       careflowFee: 0,      agencyPay: 0,       status: "NONE"    },
      "2026년 5월": { asCount: 2, totalRevenue: 870000,  careflowFee: 87000,  agencyPay: 783000,  status: "PAID"    },
    },
    details: {},
  },
];

function fmt(n) {
  if (!n) return "—";
  return n.toLocaleString() + "원";
}

const STATUS_META = {
  PENDING: { label: "미지급", badge: "orange" },
  PAID:    { label: "지급 완료", badge: "green" },
  NONE:    { label: "내역 없음", badge: "gray" },
};

export default function AdminSettlementPage() {
  const [month, setMonth]   = useState(MONTHS[0]);
  const [agencies, setAgencies] = useState(mockAgencies);
  const [expanded, setExpanded] = useState(null);

  const rows = agencies.map((ag) => ({
    ...ag,
    data: ag.monthly[month] ?? { asCount: 0, totalRevenue: 0, careflowFee: 0, agencyPay: 0, status: "NONE" },
    rows: ag.details[month] ?? [],
  }));

  /* 전체 KPI */
  const totalRevenue   = rows.reduce((s, r) => s + r.data.totalRevenue, 0);
  const totalCFfee     = rows.reduce((s, r) => s + r.data.careflowFee, 0);
  const totalAgencyPay = rows.reduce((s, r) => s + r.data.agencyPay, 0);
  const pendingCount   = rows.filter((r) => r.data.status === "PENDING").length;

  function approveAgency(id) {
    setAgencies((prev) =>
      prev.map((ag) => {
        if (ag.id !== id) return ag;
        const mo = ag.monthly[month];
        if (!mo || mo.status !== "PENDING") return ag;
        return { ...ag, monthly: { ...ag.monthly, [month]: { ...mo, status: "PAID" } } };
      })
    );
  }

  function approveAll() {
    setAgencies((prev) =>
      prev.map((ag) => {
        const mo = ag.monthly[month];
        if (!mo || mo.status !== "PENDING") return ag;
        return { ...ag, monthly: { ...ag.monthly, [month]: { ...mo, status: "PAID" } } };
      })
    );
  }

  return (
    <div className="admin-page">

      {/* 월 선택 + 전체 승인 */}
      <div className="admin-filter-bar" style={{ marginBottom: 20 }}>
        <select className="admin-select" value={month} onChange={(e) => { setMonth(e.target.value); setExpanded(null); }}>
          {MONTHS.map((m) => <option key={m}>{m}</option>)}
        </select>
        {pendingCount > 0 && (
          <button className="admin-btn admin-btn--primary" style={{ marginLeft: "auto" }} onClick={approveAll}>
            미지급 전체 승인 ({pendingCount}개 대행사)
          </button>
        )}
      </div>

      {/* KPI 카드 */}
      <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <p className="admin-stat-card__num" style={{ fontSize: 18 }}>{fmt(totalRevenue)}</p>
          <p className="admin-stat-card__label">월 총 매출</p>
        </div>
        <div className="admin-stat-card" style={{ border: "1.5px solid #734bcf" }}>
          <p className="admin-stat-card__num" style={{ fontSize: 18, color: "#734bcf" }}>{fmt(totalCFfee)}</p>
          <p className="admin-stat-card__label">CareFlow 수수료 (순수익)</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-card__num" style={{ fontSize: 18 }}>{fmt(totalAgencyPay)}</p>
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
          <span style={{ fontSize: 12, color: "#aaa" }}>{month}</span>
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
                <th>처리</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const sm = STATUS_META[r.data.status];
                const isExpanded = expanded === r.id;
                return (
                  <>
                    <tr key={r.id} style={{ background: isExpanded ? "#faf9ff" : undefined }}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td style={{ textAlign: "center" }}>{r.data.asCount || "—"}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(r.data.totalRevenue)}</td>
                      <td style={{ color: "#734bcf", fontWeight: 600 }}>{fmt(r.data.careflowFee)}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(r.data.agencyPay)}</td>
                      <td>
                        <span className={`admin-badge admin-badge--${sm.badge}`}>{sm.label}</span>
                      </td>
                      <td>
                        {r.data.status === "PENDING" && (
                          <button
                            className="admin-btn admin-btn--approve admin-btn--sm"
                            onClick={() => approveAgency(r.id)}
                          >
                            지급 승인
                          </button>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {r.rows.length > 0 && (
                          <button
                            className="admin-btn admin-btn--outline admin-btn--sm"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                            onClick={() => setExpanded(isExpanded ? null : r.id)}
                          >
                            건별 내역
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* 건별 내역 인라인 펼침 */}
                    {isExpanded && (
                      <tr key={`${r.id}-detail`}>
                        <td colSpan={8} style={{ padding: 0, background: "#faf9ff", borderBottom: "1px solid #ebebf0" }}>
                          <div style={{ padding: "12px 20px 16px" }}>
                            <p style={{ fontSize: 12, color: "#734bcf", fontWeight: 700, marginBottom: 10 }}>
                              {r.name} · {month} · 건별 내역
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
                                </tr>
                              </thead>
                              <tbody>
                                {r.rows.map((d) => (
                                  <tr key={d.id}>
                                    <td style={{ fontSize: 11, color: "#aaa" }}>{d.id}</td>
                                    <td style={{ fontSize: 12, color: "#888" }}>{d.date}</td>
                                    <td>{d.appliance}</td>
                                    <td>{d.customer}</td>
                                    <td style={{ fontWeight: 600 }}>{fmt(d.total)}</td>
                                    <td style={{ color: "#734bcf" }}>{fmt(d.careflowFee)}</td>
                                    <td style={{ fontWeight: 700 }}>{fmt(d.agencyPay)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
