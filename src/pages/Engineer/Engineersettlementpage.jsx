import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Download,
  ClipboardCheck, Wallet, Star, XCircle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { getSettlementSummary, getSettlements, downloadSettlementReport, getRecentPerformance } from "../../apis/engineers"; // 실제 경로에 맞게 수정
import EngineerPerformanceAllModal from "./Modal/EngineerPerformanceAllModal.jsx";
import { DIAGNOSIS_MAP } from "../../utils/diagnosisMap.js";
import "../../styles/Engineer/Engineersettlementpage.css";

const TABS = ["실적 현황", "정산 내역"];

const CHART_PALETTE = [
  "#5B4FF5", 
  "#938cfd", 
  "#bab5ff", 
  "#e1dfff", 
  "rgb(172, 182, 196)", 
];

function getChartColor(i) {
  return CHART_PALETTE[i % CHART_PALETTE.length];
}

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
  const [settlementSummary, setSettlementSummary] = useState(null);

  // 최근 5개 실적 목록 — 날짜/브랜드/상태 필터와 무관하게 항상 "최근 5건"만 별도 API로 조회
  const [recentPerformance, setRecentPerformance] = useState([]);
  const [recentPerformanceLoading, setRecentPerformanceLoading] = useState(true);
  const [showAllPerformanceModal, setShowAllPerformanceModal] = useState(false);

  // 정산 내역 데이터
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState(null);
  const [settlementList, setSettlementList] = useState([]);
  const [settlementTotalPages, setSettlementTotalPages] = useState(1);

  // [버그 수정] 기존엔 "이번 달 1일~오늘"로 고정돼 있어서, 그 범위를 벗어난
  // 과거 완료 건들이 전부 제외되어 통계가 0으로 보였음.
  // → 기본값을 넓게(과거 포함) 잡고, 사용자가 직접 좁힐 수 있도록 변경.
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState("2020-01-01");
  const [dateTo, setDateTo] = useState(today);

  // [버그 수정] 아래 두 필터는 state가 없는 장식용 UI였음
  const [brandFilter, setBrandFilter] = useState("전체 브랜드");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [downloadingReport, setDownloadingReport] = useState(false);

  // [연동] 브랜드/상태 옵션 드롭다운용 — 필터링된 결과만으로 옵션을 뽑으면
  // 필터를 걸수록 선택 가능한 옵션이 점점 줄어드는 문제가 생기므로,
  // 지금까지 응답에서 본 적 있는 브랜드/상태를 누적해서 옵션 목록으로 유지.
  const [seenBrands, setSeenBrands] = useState([]);
  const [seenStatuses, setSeenStatuses] = useState([]);

  useEffect(() => {
    if (activeTab !== "실적 현황") return;
    let mounted = true;
    /* eslint-disable react-hooks/set-state-in-effect -- 비동기 조회 직전 로딩/에러 상태 초기화(의도된 동작) */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    // [연동] 백엔드가 brand/status 파라미터를 지원하도록 확장됨 확인 완료.
    // "전체 브랜드"/"전체 상태" 선택 시엔 필터링 없이 조회하도록 undefined로 전달.
    getSettlementSummary(
      dateFrom,
      dateTo,
      brandFilter !== "전체 브랜드" ? brandFilter : undefined,
      statusFilter !== "전체 상태" ? statusFilter : undefined
    )
      .then((res) => {
        if (!mounted) return;
        const d = res.data;

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
        setSettlementSummary(d.settlementSummary ?? null);

        // 옵션 목록 누적 (필터링 없이 봤던 값들도 계속 선택 가능하도록)
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

  // 최근 5개 실적 — 필터와 무관하게 항상 최신순 5건만 조회
  useEffect(() => {
    if (activeTab !== "실적 현황") return;
    let mounted = true;
    /* eslint-disable react-hooks/set-state-in-effect -- 비동기 조회 직전 로딩 상태 초기화(의도된 동작) */
    setRecentPerformanceLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    getRecentPerformance()
      .then((res) => {
        if (mounted) setRecentPerformance(res.data ?? []);
      })
      .catch((err) => {
        console.error("최근 실적 조회 실패:", err);
      })
      .finally(() => {
        if (mounted) setRecentPerformanceLoading(false);
      });

    return () => { mounted = false; };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "정산 내역") return;
    let mounted = true;
    /* eslint-disable react-hooks/set-state-in-effect -- 비동기 조회 직전 로딩/에러 상태 초기화(의도된 동작) */
    setSettlementLoading(true);
    setSettlementError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

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

  // [정리] 브랜드/상태 필터를 이제 서버가 처리하므로, 클라이언트 사이드
  // 필터링(useMemo)은 더 이상 필요 없어 제거. performanceList를 그대로 사용.
  const brandOptions = seenBrands;
  const statusOptions = seenStatuses;

  // 리포트 다운로드 — 현재 선택된 기간/브랜드/상태 필터를 그대로 백엔드에 전달(화면 수치와 동일한 CSV)
  const handleReportDownload = async () => {
    setDownloadingReport(true);
    try {
      const res = await downloadSettlementReport(
        dateFrom,
        dateTo,
        brandFilter !== "전체 브랜드" ? brandFilter : undefined,
        statusFilter !== "전체 상태" ? statusFilter : undefined
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `실적정산리포트_${dateFrom}_${dateTo}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("리포트 다운로드 실패:", err);
      alert("리포트 다운로드에 실패했습니다.");
    } finally {
      setDownloadingReport(false);
    }
  };

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
        <div className="estp-filter-date" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ border: "none", background: "none", font: "inherit", color: "inherit" }}
          />
          <span>~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ border: "none", background: "none", font: "inherit", color: "inherit" }}
          />
        </div>

        <select
          className="estp-filter-select"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          style={{ border: "none", background: "none", font: "inherit", color: "inherit", cursor: "pointer" }}
        >
          <option value="전체 브랜드">전체 브랜드</option>
          {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        <select
          className="estp-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ border: "none", background: "none", font: "inherit", color: "inherit", cursor: "pointer" }}
        >
          <option value="전체 상태">전체 상태</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{DIAGNOSIS_MAP[s]?.label ?? s}</option>
          ))}
        </select>

        <button className="estp-report-btn" onClick={handleReportDownload} disabled={downloadingReport}>
          <Download size={13} /> {downloadingReport ? "다운로드 중..." : "리포트 다운로드"}
        </button>
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
                          {brandDist.map((e, i) => <Cell key={i} fill={getChartColor(i)} />)}
                        </Pie>
                        <Tooltip formatter={v => `${v}건`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="estp-donut-legend">
                      {brandDist.map((b, i) => (
                        <div key={b.name} className="estp-donut-legend__item">
                          <span className="estp-donut-legend__dot" style={{ background: getChartColor(i) }} />
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
                          {statusDist.map((e, i) => <Cell key={i} fill={getChartColor(i)} />)}
                        </Pie>
                        <Tooltip formatter={v => `${v}건`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="estp-donut-legend">
                      {statusDist.map((s, i) => (
                        <div key={s.name} className="estp-donut-legend__item">
                          <span className="estp-donut-legend__dot" style={{ background: getChartColor(i) }} />
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
                    <h3 className="estp-list-title">최근 5개 실적 목록</h3>
                    <button className="estp-list-more" onClick={() => setShowAllPerformanceModal(true)}>전체 보기 ›</button>
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
                    {recentPerformanceLoading && (
                      <p style={{ padding: 20, textAlign: "center", color: "#aaa", fontSize: 13 }}>불러오는 중...</p>
                    )}
                    {!recentPerformanceLoading && recentPerformance.map((item, i) => {
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
                    {!recentPerformanceLoading && recentPerformance.length === 0 && (
                      <p style={{ padding: 20, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                        완료된 실적이 없습니다.
                      </p>
                    )}
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

      {showAllPerformanceModal && (
        <EngineerPerformanceAllModal onClose={() => setShowAllPerformanceModal(false)} />
      )}
    </div>
  );
}