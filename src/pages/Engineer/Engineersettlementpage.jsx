import { useState, useEffect } from "react";
import {
  ChevronDown, ChevronLeft, ChevronRight, Download,
  ClipboardCheck, Wallet, Star, XCircle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { getSettlementSummary, getSettlements } from "../../apis/engineers"; // 실제 경로에 맞게 수정
import "../../styles/Engineer/Engineersettlementpage.css";

const TABS = ["실적 현황", "정산 내역"];

const DIAGNOSIS_MAP = {
  NORMAL:        { label: "정상 완료", type: "done"    },
  REPAIRED:      { label: "정상 완료", type: "done"    },
  PART_REPLACED: { label: "부분 해결", type: "partial" },
  UNREPAIRABLE:  { label: "제방문",   type: "revisit" },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="esp-tooltip">
      <p className="esp-tooltip__label">{label}</p>
      <p style={{ color: "#5B4FF5" }}>완료 건수: {payload[0].value}건</p>
    </div>
  );
};

export default function EngineerSettlementPage() {
  const [activeTab, setActiveTab] = useState("실적 현황");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 실적 현황 데이터
  const [stats, setStats] = useState(null);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [brandDist, setBrandDist] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [performanceList, setPerformanceList] = useState([]);
  const [settlementSummary, setSettlementSummary] = useState(null);

  // 정산 내역 데이터
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState(null);
  const [settlementList, setSettlementList] = useState([]);
  const [settlementTotalPages, setSettlementTotalPages] = useState(1);

  // ⚠ 날짜 범위는 필터 UI가 아직 값을 안 들고 있어서, 우선 이번 달 1일~오늘로 고정.
  // 실제 필터(estp-filter-date)와 연결하려면 별도 상태 관리가 필요합니다.
  const now = new Date();
  const dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const dateTo = now.toISOString().slice(0, 10);

  useEffect(() => {
    if (activeTab !== "실적 현황") return;
    let mounted = true;
    setLoading(true);
    setError(null);

    getSettlementSummary(dateFrom, dateTo)
  .then((res) => {
    if (!mounted) return;
    const d = res.data;

    // 평평한 필드들을 stats 객체로 직접 구성
    setStats({
      completedCount: d.totalCompletedCount ?? 0,
      grossAmount: d.totalGrossAmount ?? 0,
      avgRating: d.avgRating ?? 0,
      satisfactionRate: d.customerSatisfaction ?? 0,
      rejectedCount: d.rejectedCount ?? 0,
    });

    setDailyTrend(d.dailyTrends ?? []);
    setBrandDist(d.brandDistributions ?? []);
    setStatusDist(d.statusDistributions ?? []);
    setPerformanceList(d.performanceList ?? []);
    setSettlementSummary(d.settlementSummary ?? null);
  })
  .catch((err) => {
    console.error("실적 현황 조회 실패:", err);
    if (mounted) setError("실적 정보를 불러오지 못했습니다.");
  })
  .finally(() => {
    if (mounted) setLoading(false);
  });

    return () => { mounted = false; };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "정산 내역") return;
    let mounted = true;
    setSettlementLoading(true);
    setSettlementError(null);

    getSettlements(currentPage - 1, 10) // ⚠ 0-index 가정. 어긋나면 -1 제거
      .then((res) => {
        if (!mounted) return;
        const d = res.data;
        setSettlementList(d.content ?? []);
        setSettlementTotalPages(d.totalPages ?? 1);
      })
      .catch((err) => {
        console.error("정산 내역 조회 실패:", err);
        if (mounted) setSettlementError("정산 내역을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setSettlementLoading(false);
      });

    return () => { mounted = false; };
  }, [activeTab, currentPage]);

  return (
    <div className="estp">
      <div className="estp-header">
        <h1 className="estp-header__title">실적 / 정산</h1>
        <p className="estp-header__sub">내 실적 현황과 정산 내역을 확인할 수 있습니다.</p>
      </div>

      <div className="estp-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`estp-tab ${activeTab === tab ? "estp-tab--active" : ""}`}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="estp-filters">
        <div className="estp-filter-date"><span>{dateFrom} ~ {dateTo}</span></div>
        <div className="estp-filter-select"><span>전체 브랜드</span><ChevronDown size={13} /></div>
        <div className="estp-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
        <button className="estp-report-btn"><Download size={13} /> 리포트 다운로드</button>
      </div>

      {activeTab === "실적 현황" && (
        <>
          {loading && <p style={{ padding: "16px" }}>불러오는 중...</p>}
          {error && <p style={{ padding: "16px", color: "red" }}>{error}</p>}

          {!loading && !error && stats && (
            <>
              <div className="estp-stats">
                <div className="estp-stat-card">
                  <div className="estp-stat-card__icon estp-stat-card__icon--purple"><ClipboardCheck size={20} /></div>
                  <div>
                    <p className="estp-stat-card__label">총 완료 건수</p>
                    <p className="estp-stat-card__value">{stats.completedCount ?? 0}<span>건</span></p>
                  </div>
                </div>
                <div className="estp-stat-card">
                  <div className="estp-stat-card__icon estp-stat-card__icon--green"><Wallet size={20} /></div>
                  <div>
                    <p className="estp-stat-card__label">총 매출액</p>
                    <p className="estp-stat-card__value estp-stat-card__value--sm">{(stats.grossAmount ?? 0).toLocaleString()}<span>원</span></p>
                  </div>
                </div>
                <div className="estp-stat-card">
                  <div className="estp-stat-card__icon estp-stat-card__icon--amber"><Star size={20} /></div>
                  <div>
                    <p className="estp-stat-card__label">평균 평점</p>
                    <p className="estp-stat-card__value">{stats.avgRating ?? 0}<span>/ 5.0</span></p>
                  </div>
                </div>
                <div className="estp-stat-card">
                  <div className="estp-stat-card__icon estp-stat-card__icon--blue"><Star size={20} /></div>
                  <div>
                    <p className="estp-stat-card__label">고객 만족도</p>
                    <p className="estp-stat-card__value">{stats.satisfactionRate ?? 0}<span>%</span></p>
                  </div>
                </div>
                <div className="estp-stat-card">
                  <div className="estp-stat-card__icon estp-stat-card__icon--red"><XCircle size={20} /></div>
                  <div>
                    <p className="estp-stat-card__label">취소/거절 건수</p>
                    <p className="estp-stat-card__value">{stats.rejectedCount ?? 0}<span>건</span></p>
                  </div>
                </div>
              </div>

              <div className="estp-charts">
                <div className="estp-chart-card estp-chart-card--wide">
                  <div className="estp-chart-card__header">
                    <h3 className="estp-chart-title">기간별 완료 건수</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={dailyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#aaa" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="count" stroke="#5B4FF5" strokeWidth={2} dot={{ r: 4, fill: "#5B4FF5" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="estp-chart-card">
                  <div className="estp-chart-card__header">
                    <h3 className="estp-chart-title">브랜드별 완료 건수</h3>
                  </div>
                  <div className="estp-donut-wrap">
                    <ResponsiveContainer width="55%" height={160}>
                      <PieChart>
                        <Pie data={brandDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                          dataKey="value" startAngle={90} endAngle={-270}>
                          {brandDist.map((e, i) => <Cell key={i} fill={e.color ?? "#5B4FF5"} />)}
                        </Pie>
                        <Tooltip formatter={v => `${v}건`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="estp-donut-legend">
                      {brandDist.map(b => (
                        <div key={b.name} className="estp-donut-legend__item">
                          <span className="estp-donut-legend__dot" style={{ background: b.color ?? "#5B4FF5" }} />
                          <span>{b.name}</span>
                          <span className="estp-donut-legend__pct">{b.value}건 ({b.pct})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="estp-chart-card">
                  <div className="estp-chart-card__header">
                    <h3 className="estp-chart-title">상태별 완료 건수</h3>
                  </div>
                  <div className="estp-donut-wrap">
                    <ResponsiveContainer width="55%" height={160}>
                      <PieChart>
                        <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                          dataKey="value" startAngle={90} endAngle={-270}>
                          {statusDist.map((e, i) => <Cell key={i} fill={e.color ?? "#16a34a"} />)}
                        </Pie>
                        <Tooltip formatter={v => `${v}건`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="estp-donut-legend">
                      {statusDist.map(s => (
                        <div key={s.name} className="estp-donut-legend__item">
                          <span className="estp-donut-legend__dot" style={{ background: s.color ?? "#16a34a" }} />
                          <span>{s.name}</span>
                          <span className="estp-donut-legend__pct">{s.value}건 ({s.pct})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="estp-bottom">
                <div className="estp-list-section">
                  <div className="estp-list-header">
                    <h3 className="estp-list-title">실적 상세 목록</h3>
                    <button className="estp-list-more">전체 보기 ›</button>
                  </div>
                  <div className="estp-list-table">
                    <div className="estp-list-table__header">
                      <span>접수번호</span>
                      <span>작업 일시</span>
                      <span>고객명</span>
                      <span>제품명</span>
                      <span>브랜드</span>
                      <span>작업 금액</span>
                      <span>상태</span>
                      <span>평점</span>
                      <span></span>
                    </div>
                    {performanceList.map((item, i) => {
                      const diag = DIAGNOSIS_MAP[item.diagnosisResult] ?? { label: item.diagnosisResult, type: "done" };
                      return (
                        <div key={i} className="estp-list-table__row">
                          <span className="estp-list-table__id">{item.requestId}</span>
                          <span className="estp-list-table__date">{item.workDate}</span>
                          <span>{item.customerName}</span>
                          <span className="estp-list-table__product">{item.productName}</span>
                          <span>{item.brand}</span>
                          <span className="estp-list-table__amount">{(item.grossAmount ?? 0).toLocaleString()}원</span>
                          <span>
                            <span className={`estp-diag-badge estp-diag-badge--${diag.type}`}>{diag.label}</span>
                          </span>
                          <span className="estp-list-table__rating">★ {item.rating != null ? item.rating.toFixed(1) : "-"}</span>
                          <span><ChevronRight size={14} color="#aaa" /></span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {settlementSummary && (
                  <div className="estp-settlement-summary">
                    <div className="estp-settlement-summary__header">
                      <h3 className="estp-settlement-summary__title">정산 요약</h3>
                    </div>
                    <div className="estp-settle-row">
                      <span>총 매출액</span>
                      <span>{(settlementSummary.grossAmount ?? 0).toLocaleString()}원</span>
                    </div>
                    <div className="estp-settle-row estp-settle-row--deduct">
                      <span>플랫폼 수수료</span>
                      <span>-{(settlementSummary.platformFee ?? 0).toLocaleString()}원</span>
                    </div>
                    <div className="estp-settle-row estp-settle-row--deduct">
                      <span>대행사 수수료</span>
                      <span>-{(settlementSummary.agencyFee ?? 0).toLocaleString()}원</span>
                    </div>
                    <div className="estp-settle-divider" />
                    <div className="estp-settle-row estp-settle-row--total">
                      <span>실 정산 예정 금액</span>
                      <span>{(settlementSummary.engineerNetAmount ?? 0).toLocaleString()}원</span>
                    </div>
                    <div className="estp-settle-notice">
                      <span>🏦</span>
                      <div>
                        <p>정산 예정일 : {settlementSummary.paidAt ?? "-"}</p>
                        <p>등록된 계좌로 입금될 예정입니다.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "정산 내역" && (
        <>
          {settlementLoading && <p style={{ padding: "16px" }}>불러오는 중...</p>}
          {settlementError && <p style={{ padding: "16px", color: "red" }}>{settlementError}</p>}

          {!settlementLoading && !settlementError && (
            <>
              <div className="estp-list-table">
                <div className="estp-list-table__header">
                  <span>접수번호</span>
                  <span>완료일</span>
                  <span>총 매출액</span>
                  <span>실 정산액</span>
                  <span>상태</span>
                </div>
                {settlementList.map((s, i) => (
                  <div key={i} className="estp-list-table__row">
                    <span className="estp-list-table__id">{s.requestId}</span>
                    <span>{s.completedAt}</span>
                    <span>{(s.grossAmount ?? 0).toLocaleString()}원</span>
                    <span>{(s.engineerNetAmount ?? 0).toLocaleString()}원</span>
                    <span>{s.status}</span>
                  </div>
                ))}
              </div>

              <div className="estp-pagination">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={13} /></button>
                {Array.from({ length: settlementTotalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={currentPage === p ? "estp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(settlementTotalPages, p + 1))} disabled={currentPage === settlementTotalPages}><ChevronRight size={13} /></button>
                <button onClick={() => setCurrentPage(settlementTotalPages)} disabled={currentPage === settlementTotalPages}><ChevronRight size={14} /></button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}