import { useState, useEffect } from "react";
import {
  ChevronDown, ChevronLeft, ChevronRight, Download,
  ClipboardCheck, Wallet, Star, XCircle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { getSettlementSummary, getSettlements } from "../../apis/engineers";
import { getEngineerReviewStats } from "../../apis/engineers"; // 리뷰 평균 평점 공유용
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

  const [stats, setStats] = useState(null);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [brandDist, setBrandDist] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [performanceList, setPerformanceList] = useState([]);
  const [settlementSummary, setSettlementSummary] = useState(null);

  // ── 리뷰에서 가져온 평균 평점 ──────────────────
  // 실적 API의 avgRating 대신 리뷰 API의 avgRating을 사용해
  // 리뷰 페이지와 동일한 값이 표시되도록 함
  const [reviewAvgRating, setReviewAvgRating] = useState(null);

  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState(null);
  const [settlementList, setSettlementList] = useState([]);
  const [settlementTotalPages, setSettlementTotalPages] = useState(1);

  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState("2020-01-01");
  const [dateTo, setDateTo] = useState(today);
  const [brandFilter, setBrandFilter] = useState("전체 브랜드");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [seenBrands, setSeenBrands] = useState([]);
  const [seenStatuses, setSeenStatuses] = useState([]);

  // ── 리뷰 평균 평점 조회 (마운트 시 1회) ────────
  useEffect(() => {
    getEngineerReviewStats()
      .then((res) => {
        const avg = res.data?.avgRating;
        if (avg != null) setReviewAvgRating(avg);
      })
      .catch((err) => {
        console.error("리뷰 평점 조회 실패:", err);
        // 실패해도 실적 API 값으로 fallback — setReviewAvgRating은 그대로 null 유지
      });
  }, []);

  // ── 실적 현황 조회 ──────────────────────────────
  useEffect(() => {
    if (activeTab !== "실적 현황") return;
    let mounted = true;
    setLoading(true);
    setError(null);

    getSettlementSummary(
      dateFrom, dateTo,
      brandFilter !== "전체 브랜드" ? brandFilter : undefined,
      statusFilter !== "전체 상태" ? statusFilter : undefined
    )
      .then((res) => {
        if (!mounted) return;
        const d = res.data;

        setStats({
          completedCount: d.totalCompletedCount ?? 0,
          grossAmount: d.totalGrossAmount ?? 0,
          // reviewAvgRating이 있으면 리뷰 API 값 우선, 없으면 실적 API 값 fallback
          avgRating: d.avgRating ?? 0,
          satisfactionRate: d.customerSatisfaction ?? 0,
          rejectedCount: d.rejectedCount ?? 0,
        });

        setDailyTrend(d.dailyTrends ?? []);
        setBrandDist(d.brandDistributions ?? []);
        setStatusDist(d.statusDistributions ?? []);
        setPerformanceList(d.performanceList ?? []);
        setSettlementSummary(d.settlementSummary ?? null);

        const brandsInRes = (d.performanceList ?? []).map((i) => i.brand).filter(Boolean);
        const statusesInRes = (d.performanceList ?? []).map((i) => i.diagnosisResult).filter(Boolean);
        if (brandsInRes.length) setSeenBrands((prev) => Array.from(new Set([...prev, ...brandsInRes])));
        if (statusesInRes.length) setSeenStatuses((prev) => Array.from(new Set([...prev, ...statusesInRes])));
      })
      .catch((err) => {
        console.error("실적 현황 조회 실패:", err);
        if (mounted) setError("실적 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [activeTab, dateFrom, dateTo, brandFilter, statusFilter]);

  // ── 정산 내역 조회 ──────────────────────────────
  useEffect(() => {
    if (activeTab !== "정산 내역") return;
    let mounted = true;
    setSettlementLoading(true);
    setSettlementError(null);

    getSettlements(currentPage - 1, 10)
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

  // 평균 평점: 리뷰 API 값 우선, 없으면 실적 API 값 사용
  const displayAvgRating = reviewAvgRating ?? stats?.avgRating ?? 0;

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
        <div className="estp-filter-date">
          <input className="estp-filter-date__input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="estp-filter-date__sep">~</span>
          <input className="estp-filter-date__input" type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="estp-filter-select">
          <select className="estp-filter-select__native" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="전체 브랜드">전체 브랜드</option>
            {seenBrands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <ChevronDown size={13} />
        </div>
        <div className="estp-filter-select">
          <select className="estp-filter-select__native" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="전체 상태">전체 상태</option>
            {seenStatuses.map((s) => <option key={s} value={s}>{DIAGNOSIS_MAP[s]?.label ?? s}</option>)}
          </select>
          <ChevronDown size={13} />
        </div>
        <button className="estp-report-btn"><Download size={13} /> 리포트 다운로드</button>
      </div>

      {activeTab === "실적 현황" && (
        <>
          {loading && <p style={{ padding: "16px" }}>불러오는 중...</p>}
          {error   && <p style={{ padding: "16px", color: "red" }}>{error}</p>}

          {!loading && !error && stats && (
            <>
              {/* 통계 카드 */}
              <div className="estp-stats">
                <div className="estp-stat-card">
                  <div className="estp-stat-card__text">
                    <p className="estp-stat-card__value">{stats.completedCount ?? 0}<span>건</span></p>
                    <p className="estp-stat-card__label">총 완료 건수</p>
                  </div>
                  <div className="estp-stat-card__icon estp-stat-card__icon--purple">
                    <ClipboardCheck size={40} strokeWidth={1} />
                  </div>
                </div>

                <div className="estp-stat-card">
                  <div className="estp-stat-card__text">
                    <p className="estp-stat-card__value estp-stat-card__value--sm">{(stats.grossAmount ?? 0).toLocaleString()}<span>원</span></p>
                    <p className="estp-stat-card__label">총 매출액</p>
                  </div>
                  <div className="estp-stat-card__icon estp-stat-card__icon--green">
                    <Wallet size={40} strokeWidth={1} />
                  </div>
                </div>

                <div className="estp-stat-card">
                  <div className="estp-stat-card__text">
                    {/* 리뷰 페이지와 동일한 평균 평점 표시 */}
                    <p className="estp-stat-card__value">{displayAvgRating.toFixed(1)}<span>/ 5.0</span></p>
                    <p className="estp-stat-card__label">평균 평점</p>
                  </div>
                  <div className="estp-stat-card__icon estp-stat-card__icon--amber">
                    <Star size={40} strokeWidth={1} />
                  </div>
                </div>

                <div className="estp-stat-card">
                  <div className="estp-stat-card__text">
                    <p className="estp-stat-card__value">{stats.satisfactionRate ?? 0}<span>%</span></p>
                    <p className="estp-stat-card__label">고객 만족도</p>
                  </div>
                  <div className="estp-stat-card__icon estp-stat-card__icon--blue">
                    <Star size={40} strokeWidth={1} />
                  </div>
                </div>

                <div className="estp-stat-card">
                  <div className="estp-stat-card__text">
                    <p className="estp-stat-card__value">{stats.rejectedCount ?? 0}<span>건</span></p>
                    <p className="estp-stat-card__label">취소/거절 건수</p>
                  </div>
                  <div className="estp-stat-card__icon estp-stat-card__icon--red">
                    <XCircle size={40} strokeWidth={1} />
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
                  <div className="estp-chart-card__header"><h3 className="estp-chart-title">브랜드별 완료 건수</h3></div>
                  <div className="estp-donut-wrap">
                    <ResponsiveContainer width="55%" height={160}>
                      <PieChart>
                        <Pie data={brandDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
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
                  <div className="estp-chart-card__header"><h3 className="estp-chart-title">상태별 완료 건수</h3></div>
                  <div className="estp-donut-wrap">
                    <ResponsiveContainer width="55%" height={160}>
                      <PieChart>
                        <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
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
                      <span>접수번호</span><span>작업 일시</span><span>고객명</span><span>제품명</span>
                      <span>브랜드</span><span>작업 금액</span><span>상태</span><span>평점</span><span></span>
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
                          <span><span className={`estp-diag-badge estp-diag-badge--${diag.type}`}>{diag.label}</span></span>
                          <span className="estp-list-table__rating">★ {item.rating != null ? item.rating.toFixed(1) : "-"}</span>
                          <span><ChevronRight size={14} color="#aaa" /></span>
                        </div>
                      );
                    })}
                    {performanceList.length === 0 && (
                      <p style={{ padding: 20, textAlign: "center", color: "#aaa", fontSize: 13 }}>조건에 맞는 실적이 없습니다.</p>
                    )}
                  </div>
                </div>

                {settlementSummary && (
                  <div className="estp-settlement-summary">
                    <div className="estp-settlement-summary__header">
                      <h3 className="estp-settlement-summary__title">정산 요약</h3>
                    </div>
                    <div className="estp-settle-row"><span>총 매출액</span><span>{(settlementSummary.grossAmount ?? 0).toLocaleString()}원</span></div>
                    <div className="estp-settle-row estp-settle-row--deduct"><span>플랫폼 수수료</span><span>-{(settlementSummary.platformFee ?? 0).toLocaleString()}원</span></div>
                    <div className="estp-settle-row estp-settle-row--deduct"><span>대행사 수수료</span><span>-{(settlementSummary.agencyFee ?? 0).toLocaleString()}원</span></div>
                    <div className="estp-settle-divider" />
                    <div className="estp-settle-row estp-settle-row--total"><span>실 정산 예정 금액</span><span>{(settlementSummary.engineerNetAmount ?? 0).toLocaleString()}원</span></div>
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
          {settlementError   && <p style={{ padding: "16px", color: "red" }}>{settlementError}</p>}

          {!settlementLoading && !settlementError && (
            <>
              <div className="estp-list-table">
                <div className="estp-list-table__header">
                  <span>접수번호</span><span>완료일</span><span>총 매출액</span><span>실 정산액</span><span>상태</span>
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