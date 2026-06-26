import { useState } from "react";
import "../../styles/Admin/Admin.css";

/* ── 목 데이터 ── */
const AGENCIES = ["한국서비스대행사", "미래전자서비스", "스마트케어", "프리미엄AS", "케어플러스"];
const MONTHS   = ["2026년 6월", "2026년 5월", "2026년 4월", "2026년 3월"];

const mockSummary = {
  "한국서비스대행사": {
    "2026년 6월": { total: 5200000, careflowFee: 520000, agencyFee: 780000, engineerPay: 3900000, pending: 2, approved: 3 },
    "2026년 5월": { total: 4800000, careflowFee: 480000, agencyFee: 720000, engineerPay: 3600000, pending: 0, approved: 5 },
  },
  "미래전자서비스": {
    "2026년 6월": { total: 3100000, careflowFee: 310000, agencyFee: 465000, engineerPay: 2325000, pending: 1, approved: 2 },
    "2026년 5월": { total: 2900000, careflowFee: 290000, agencyFee: 435000, engineerPay: 2175000, pending: 0, approved: 3 },
  },
  "스마트케어": {
    "2026년 6월": { total: 1850000, careflowFee: 185000, agencyFee: 277500, engineerPay: 1387500, pending: 3, approved: 0 },
    "2026년 5월": { total: 2100000, careflowFee: 210000, agencyFee: 315000, engineerPay: 1575000, pending: 0, approved: 4 },
  },
};

const mockDetails = {
  "한국서비스대행사": {
    "2026년 6월": [
      { id: "SET-001", date: "2026.06.05", appliance: "냉장고", customer: "김철수", engineer: "박기사", total: 95000, careflowFee: 9500, agencyFee: 14250, engineerPay: 71250, status: "APPROVED" },
      { id: "SET-002", date: "2026.06.10", appliance: "세탁기", customer: "이영희", engineer: "박기사", total: 72000, careflowFee: 7200, agencyFee: 10800, engineerPay: 54000, status: "APPROVED" },
      { id: "SET-003", date: "2026.06.15", appliance: "에어컨", customer: "최수연", engineer: "김수리", total: 120000, careflowFee: 12000, agencyFee: 18000, engineerPay: 90000, status: "APPROVED" },
      { id: "SET-004", date: "2026.06.20", appliance: "TV",    customer: "정다은", engineer: "이엔지", total: 85000, careflowFee: 8500, agencyFee: 12750, engineerPay: 63750, status: "PENDING" },
      { id: "SET-005", date: "2026.06.23", appliance: "건조기", customer: "강민준", engineer: "박기사", total: 68000, careflowFee: 6800, agencyFee: 10200, engineerPay: 51000, status: "PENDING" },
    ],
  },
  "미래전자서비스": {
    "2026년 6월": [
      { id: "SET-011", date: "2026.06.07", appliance: "냉장고", customer: "오지수", engineer: "최기사", total: 110000, careflowFee: 11000, agencyFee: 16500, engineerPay: 82500, status: "APPROVED" },
      { id: "SET-012", date: "2026.06.18", appliance: "세탁기", customer: "한소희", engineer: "최기사", total: 55000, careflowFee: 5500, agencyFee: 8250, engineerPay: 41250, status: "APPROVED" },
      { id: "SET-013", date: "2026.06.22", appliance: "에어컨", customer: "남주혁", engineer: "정수리", total: 98000, careflowFee: 9800, agencyFee: 14700, engineerPay: 73500, status: "PENDING" },
    ],
  },
};

const STATUS_BADGE = { APPROVED: "green", PENDING: "orange" };
const STATUS_LABEL = { APPROVED: "지급 완료", PENDING: "대기" };

function fmt(n) {
  return n?.toLocaleString() + "원";
}

function SummaryCards({ summary }) {
  if (!summary) return null;
  const cards = [
    { label: "총 매출",         value: fmt(summary.total),        color: "purple" },
    { label: "CareFlow 수수료", value: fmt(summary.careflowFee),  color: "blue" },
    { label: "대행사 수수료",   value: fmt(summary.agencyFee),    color: "orange" },
    { label: "기사 지급 합계",  value: fmt(summary.engineerPay),  color: "green" },
  ];
  return (
    <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
      {cards.map((c) => (
        <div key={c.label} className="admin-stat-card">
          <p className="admin-stat-card__num" style={{ fontSize: 18 }}>{c.value}</p>
          <p className="admin-stat-card__label">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminSettlementPage() {
  const [agency, setAgency] = useState(AGENCIES[0]);
  const [month,  setMonth]  = useState(MONTHS[0]);
  const [details, setDetails] = useState(
    () => (mockDetails[AGENCIES[0]]?.[MONTHS[0]]) ?? []
  );

  function loadData(ag, mo) {
    setAgency(ag);
    setMonth(mo);
    setDetails((mockDetails[ag]?.[mo]) ?? []);
  }

  const summary = mockSummary[agency]?.[month];

  const pendingRows = details.filter((d) => d.status === "PENDING");

  function approveAll() {
    setDetails((prev) => prev.map((d) => ({ ...d, status: "APPROVED" })));
  }

  function approveOne(id) {
    setDetails((prev) => prev.map((d) => d.id === id ? { ...d, status: "APPROVED" } : d));
  }

  return (
    <div className="admin-page">

      {/* 필터 */}
      <div className="admin-filter-bar" style={{ marginBottom: 20 }}>
        <select className="admin-select" value={agency} onChange={(e) => loadData(e.target.value, month)}>
          {AGENCIES.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="admin-select" value={month} onChange={(e) => loadData(agency, e.target.value)}>
          {MONTHS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* 합산 요약 카드 */}
      {summary ? (
        <SummaryCards summary={summary} />
      ) : (
        <div className="admin-section" style={{ marginBottom: 20 }}>
          <div className="admin-section__body">
            <p className="admin-empty">선택한 기간의 정산 데이터가 없습니다.</p>
          </div>
        </div>
      )}

      {/* 지급 승인 대기 */}
      {pendingRows.length > 0 && (
        <div className="admin-section" style={{ marginBottom: 20 }}>
          <div className="admin-section__header">
            <h2 className="admin-section__title">
              지급 승인 대기
              <span className="admin-badge admin-badge--orange" style={{ marginLeft: 8, fontSize: 11 }}>
                {pendingRows.length}건
              </span>
            </h2>
            <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={approveAll}>
              전체 승인
            </button>
          </div>
          <div className="admin-section__body" style={{ padding: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>정산번호</th>
                  <th>완료일</th>
                  <th>가전</th>
                  <th>고객</th>
                  <th>기사</th>
                  <th>총액</th>
                  <th>기사 지급액</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {pendingRows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontSize: 11, color: "#aaa" }}>{row.id}</td>
                    <td style={{ fontSize: 12, color: "#888" }}>{row.date}</td>
                    <td>{row.appliance}</td>
                    <td>{row.customer}</td>
                    <td>{row.engineer}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(row.total)}</td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>{fmt(row.engineerPay)}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn--approve admin-btn--sm"
                        onClick={() => approveOne(row.id)}
                      >
                        지급 승인
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 건별 정산 상세 내역 */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">건별 정산 상세 내역</h2>
          <span style={{ fontSize: 12, color: "#aaa" }}>{agency} · {month}</span>
        </div>
        <div className="admin-section__body" style={{ padding: 0 }}>
          {details.length === 0 ? (
            <p className="admin-empty">정산 내역이 없습니다.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>정산번호</th>
                  <th>완료일</th>
                  <th>가전</th>
                  <th>고객</th>
                  <th>기사</th>
                  <th>총액</th>
                  <th>CF 수수료</th>
                  <th>대행사 수수료</th>
                  <th>기사 지급액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {details.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontSize: 11, color: "#aaa" }}>{row.id}</td>
                    <td style={{ fontSize: 12, color: "#888" }}>{row.date}</td>
                    <td>{row.appliance}</td>
                    <td>{row.customer}</td>
                    <td>{row.engineer}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(row.total)}</td>
                    <td style={{ color: "#888" }}>{fmt(row.careflowFee)}</td>
                    <td style={{ color: "#888" }}>{fmt(row.agencyFee)}</td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>{fmt(row.engineerPay)}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${STATUS_BADGE[row.status]}`}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
