import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, Wrench, CheckCircle, Clock, Star, Wallet, RefreshCw,
  Download, FileText, Users, Smile,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  getSummary, getDailyTrend, getHourly, getCategoryDist,
  getStatusCount, getEngineerTop5, getMonthlySummary, getRecentPeriods,
  getEngineerStats, getSettlementTrend, getCustomerStats,
  downloadWorkStatusReport, downloadSettlementReport,
  downloadEngineerPerformanceReport, downloadCustomerReport,
} from "../../apis/agencyStatistics";
import "../../styles/Agency/AgencyStatisticsPage.css";


const STAT_TABS = ["대시보드", "작업 통계", "기사 통계", "정산 통계", "고객 통계", "리포트"];

const STATUS_LABEL_MAP = {
  PENDING:           { label: "접수 대기",  color: "#5B4FF5" },
  AGENCY_RECEIVED:   { label: "대행사 접수", color: "#7c6bff" },
  ASSIGNED:          { label: "배차 완료",  color: "#2563eb" },
  ACCEPTED:          { label: "기사 수락",  color: "#0ea5e9" },
  ENGINEER_DEPARTED: { label: "기사 출발",  color: "#06b6d4" },
  ENGINEER_ARRIVED:  { label: "기사 도착",  color: "#14b8a6" },
  IN_PROGRESS:       { label: "작업 중",    color: "#16a34a" },
  COMPLETED:         { label: "작업 완료",  color: "#65a30d" },
  PAID:              { label: "결제 완료",  color: "#84cc16" },
  CANCELLED:         { label: "취소",       color: "#ddd"    },
};

const CATEGORY_COLORS = ["#5B4FF5", "#2563eb", "#16a34a", "#d97706", "#aaa", "#0ea5e9", "#f43f5e"];

// 리포트 다운로드 4종 — 표시용 메타(라벨/설명/아이콘)만 정적이고, 실제 데이터는 다운로드 시점에 API에서 CSV로 받아옴
const REPORT_ITEMS = [
  { key: "work-status",         label: "작업 현황 리포트",  desc: "접수/완료/미완료 등 작업 현황",   icon: FileText, download: downloadWorkStatusReport,          filenamePrefix: "work_status_report"          },
  { key: "settlement",          label: "정산 리포트",       desc: "이 대행사의 정산 내역",           icon: Wallet,   download: downloadSettlementReport,           filenamePrefix: "settlement_report"           },
  { key: "engineer-performance", label: "기사 성과 리포트",  desc: "기사별 작업 및 평가 통계",        icon: Users,    download: downloadEngineerPerformanceReport,  filenamePrefix: "engineer_performance_report"  },
  { key: "customer",            label: "고객 현황 리포트",  desc: "고객 접수 및 만족도 통계",        icon: Smile,    download: downloadCustomerReport,             filenamePrefix: "customer_status_report"      },
];

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 17);
  return { dateFrom: toDateStr(from), dateTo: toDateStr(to) };
}

function changeText(diff, unit = "%") {
  if (diff == null) return "-";
  const sign = diff > 0 ? "+" : "";
  return `전 기간 대비 ${sign}${diff}${unit}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="asp-chart-tooltip">
      <p className="asp-chart-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}건</p>
      ))}
    </div>
  );
};

export default function AgencyStatisticsPage() {
  const [activeTab, setActiveTab] = useState("대시보드");
  const [{ dateFrom, dateTo }, setDateRange] = useState(defaultDateRange);

  const [summary, setSummary] = useState(null);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [categoryDist, setCategoryDist] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const maxStatusVal = Math.max(...statusData.map(s => s.value), 1);
  const [engineerTop5, setEngineerTop5] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [recentPeriods, setRecentPeriods] = useState([]);
  const [engineerStats, setEngineerStats] = useState([]);
  const [settlementTrend, setSettlementTrend] = useState([]);
  const [customerStats, setCustomerStats] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(null); // 다운로드 중인 리포트 key

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryRes, dailyTrendRes, hourlyRes,
        categoryDistRes, statusCountRes, engineerTop5Res, monthlySummaryRes, recentPeriodsRes,
        engineerStatsRes, settlementTrendRes, customerStatsRes,
      ] = await Promise.all([
        getSummary(dateFrom, dateTo),
        getDailyTrend(dateFrom, dateTo),
        getHourly(dateFrom, dateTo),
        getCategoryDist(dateFrom, dateTo),
        getStatusCount(dateFrom, dateTo),
        getEngineerTop5(dateFrom, dateTo),
        getMonthlySummary(),
        getRecentPeriods(),
        getEngineerStats(dateFrom, dateTo),
        getSettlementTrend(dateFrom, dateTo),
        getCustomerStats(dateFrom, dateTo),
      ]);

      setSummary(summaryRes.data);

      setDailyTrend(
        dailyTrendRes.data.map((d) => ({ date: d.date, 접수: d.receiptCount, 완료: d.completedCount }))
      );

      setHourlyData(
        hourlyRes.data.map((h) => ({ time: h.timeRange, 건수: h.count }))
      );

      setCategoryDist(
        categoryDistRes.data.map((c, i) => ({
          name: c.categoryName,
          value: c.count,
          pct: `${c.percentage}%`,
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        }))
      );

      const statusTotal = statusCountRes.data.reduce((sum, s) => sum + s.count, 0);
      setStatusData(
        statusCountRes.data
          .filter((s) => s.count > 0 || statusTotal === 0)
          .map((s) => ({
            label: STATUS_LABEL_MAP[s.status]?.label ?? s.status,
            value: s.count,
            pct: s.percentage,
            color: STATUS_LABEL_MAP[s.status]?.color ?? "#aaa",
          }))
      );

      setEngineerTop5(
        engineerTop5Res.data.map((e) => ({
          rank: e.rank,
          name: e.engineerName,
          count: e.completedCount,
        }))
      );

      setMonthlySummary(monthlySummaryRes.data);
      setRecentPeriods(recentPeriodsRes.data);
      setEngineerStats(engineerStatsRes.data);
      setSettlementTrend(settlementTrendRes.data);
      setCustomerStats(customerStatsRes.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  // 리포트 다운로드 공통 핸들러 — 현재 선택된 날짜 범위 기준으로 CSV 다운로드
  const handleDownloadReport = async (item) => {
    setDownloadingReport(item.key);
    try {
      const res = await item.download(dateFrom, dateTo);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.filenamePrefix}_${dateFrom}_${dateTo}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("리포트 다운로드 실패:", err);
      alert("리포트 다운로드에 실패했습니다.");
    } finally {
      setDownloadingReport(null);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const statCards = summary ? [
    { label: "총 접수 건수",   value: `${summary.totalReceiptCount.toLocaleString()}건`, sub: changeText(summary.prevMonthReceiptDiff),   subType: summary.prevMonthReceiptDiff >= 0 ? "up" : "down",   icon: ClipboardList, color: "purple" },
    { label: "완료 건수",      value: `${summary.completedCount.toLocaleString()}건`,    sub: changeText(summary.prevMonthCompletedDiff), subType: summary.prevMonthCompletedDiff >= 0 ? "up" : "down", icon: Wrench,        color: "green"  },
    { label: "완료율",         value: `${summary.completionRate}%`,                      sub: "-",                                          subType: "neutral",                                            icon: CheckCircle,   color: "teal"   },
    { label: "평균 처리 시간", value: `${summary.avgProcessingHours} 시간`,              sub: "-",                                          subType: "neutral",                                            icon: Clock,         color: "orange" },
    { label: "평균 평점",      value: `${summary.avgRating} / 5.0`,                      sub: changeText(summary.prevMonthRatingDiff, "p"), subType: summary.prevMonthRatingDiff >= 0 ? "up" : "down",    icon: Star,          color: "amber"  },
    { label: "총 정산 금액",   value: `₩${summary.totalSettlementAmount.toLocaleString()}`, sub: changeText(summary.prevMonthAmountDiff),  subType: summary.prevMonthAmountDiff >= 0 ? "up" : "down",    icon: Wallet,        color: "blue"   },
  ] : [];

  const monthlySummaryRows = monthlySummary ? [
    { label: "최다 접수 요일", value: `${monthlySummary.topReceiptDayOfWeek} (${monthlySummary.topReceiptDayCount}건)`, icon: ClipboardList },
    { label: "최다 접수 시간", value: `${monthlySummary.topReceiptHour} (${monthlySummary.topReceiptHourCount}건)`,     icon: Clock         },
    { label: "최고 평점 기사", value: `${monthlySummary.topRatingEngineerName} (${monthlySummary.topRatingEngineerScore})`, icon: Star      },
    // 고객 만족도 — 상단 통계 카드와 동일한 summary.avgRating 재사용 (기간 필터 기준)
    { label: "고객 만족도",   value: summary ? `${summary.avgRating} / 5.0` : "-", icon: Smile },
  ] : [];

  // ── 기사 통계 탭 요약 카드 ──────────────────────
  const engineerTotalCompleted = engineerStats.reduce((sum, e) => sum + e.completedCount, 0);
  const engineerRatedList = engineerStats.filter((e) => e.avgRating != null);
  const engineerAvgRating = engineerRatedList.length
    ? (engineerRatedList.reduce((sum, e) => sum + e.avgRating, 0) / engineerRatedList.length).toFixed(1)
    : "-";
  const engineerStatCards = [
    { label: "전체 기사 수",   value: `${engineerStats.length}명`,               icon: Users,       color: "purple" },
    { label: "총 완료 건수",   value: `${engineerTotalCompleted.toLocaleString()}건`, icon: Wrench,     color: "green"  },
    { label: "평균 평점",      value: engineerAvgRating === "-" ? "-" : `${engineerAvgRating} / 5.0`, icon: Star, color: "amber" },
  ];

  // ── 정산 통계 탭 요약 카드 ──────────────────────
  const settlementTotals = settlementTrend.reduce((acc, d) => ({
    count: acc.count + d.count,
    gross: acc.gross + d.grossAmount,
    platformFee: acc.platformFee + d.platformFee,
    agencyFee: acc.agencyFee + d.agencyFee,
    engineerNet: acc.engineerNet + d.engineerNetAmount,
  }), { count: 0, gross: 0, platformFee: 0, agencyFee: 0, engineerNet: 0 });
  const settlementStatCards = [
    { label: "총 매출액",      value: `₩${settlementTotals.gross.toLocaleString()}`,       icon: Wallet,      color: "blue"   },
    { label: "플랫폼 수수료",  value: `₩${settlementTotals.platformFee.toLocaleString()}`,  icon: ClipboardList, color: "purple" },
    { label: "대행사 수수료",  value: `₩${settlementTotals.agencyFee.toLocaleString()}`,    icon: Wrench,      color: "teal"   },
    { label: "기사 지급액",    value: `₩${settlementTotals.engineerNet.toLocaleString()}`,  icon: CheckCircle, color: "green"  },
  ];

  // ── 고객 통계 탭 요약 카드 ──────────────────────
  const customerTotalRequests = customerStats.reduce((sum, c) => sum + c.requestCount, 0);
  const customerRatedList = customerStats.filter((c) => c.avgRating != null);
  const customerAvgRating = customerRatedList.length
    ? (customerRatedList.reduce((sum, c) => sum + c.avgRating, 0) / customerRatedList.length).toFixed(1)
    : "-";
  const customerStatCards = [
    { label: "전체 고객 수",   value: `${customerStats.length}명`,                    icon: Users,     color: "purple" },
    { label: "총 접수 건수",   value: `${customerTotalRequests.toLocaleString()}건`,  icon: ClipboardList, color: "blue" },
    { label: "평균 만족도",    value: customerAvgRating === "-" ? "-" : `${customerAvgRating} / 5.0`, icon: Smile, color: "amber" },
  ];

  return (
    <div className="asp2">
      {/* 헤더 */}
      <div className="asp2-header">
        <div>
          <h1 className="asp2-header__title">통계 및 리포트</h1>
          <p className="asp2-header__sub">기간별 서비스 운영 현황을 확인하고 리포트를 생성할 수 있습니다.</p>
        </div>
        <div className="asp2-header__right">

          <div className="asp2-filter-date">
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateRange((prev) => ({ ...prev, dateFrom: e.target.value }))}
            />
            <span>~</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateRange((prev) => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
          <button className="asp2-reset-btn" onClick={() => setDateRange(defaultDateRange())}>
            <RefreshCw size={13} /> 필터 초기화
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="asp2-tabs">
        {STAT_TABS.map((tab) => (
          <button
            key={tab}
            className={`asp2-tab ${activeTab === tab ? "asp2-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>


      {error && (
        <div className="asp2-coming-soon">통계 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>
      )}

      {activeTab === "대시보드" && !error && (
        <div className="asp2-dashboard">
          {/* 통계 카드 - GET /api/agency/statistics/summary */}
          <div className="asp2-stats">
            {(loading && !summary ? Array(6).fill(null) : statCards).map((s, i) => (
              <div key={s?.label ?? i} className="asp2-stat-card">
                {s ? (
                  <>
                    <div className={`asp2-stat-card__icon asp2-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
                    <div>
                      <p className="asp2-stat-card__label">{s.label}</p>
                      <p className="asp2-stat-card__value">{s.value}</p>
                      <p className={`asp2-stat-card__sub asp2-stat-card__sub--${s.subType}`}>{s.sub}</p>
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>

          <div className="asp2-grid">

            {/* 좌측: 라인차트 + 바차트 */}
            <div className="asp2-col">
              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">
                  <h3 className="asp2-chart-title">접수 및 완료 추이</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#aaa" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="접수" stroke="#5B4FF5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="완료" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">

                  <h3 className="asp2-chart-title">일별 시간대별 접수 현황</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#aaa" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                    <Tooltip />
                    <Bar dataKey="건수" fill="#5B4FF5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="asp2-chart-card">
                <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>최근 주요 지표 요약</h3>
                <div className="asp2-summary-table">
                  <div className="asp2-summary-table__header">
                    <span>기간</span><span>접수</span><span>완료</span><span>완료율</span>
                    <span>처리 시간</span><span>평점</span><span>정산 금액</span>
                  </div>
                  {recentPeriods.map((row, i) => (
                    <div key={i} className="asp2-summary-table__row">
                      <span>{row.periodLabel}</span>
                      <span>{row.receiptCount.toLocaleString()}건</span>
                      <span>{row.completedCount.toLocaleString()}건</span>
                      <span>{row.completionRate}%</span>
                      <span>{row.avgProcessingHours} 시간</span>
                      <span>{row.avgRating}</span>
                      <span className="asp2-summary-table__amount">₩{row.totalSettlementAmount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>


            {/* 중앙: 도넛차트 + 상태별 건수 */}
            <div className="asp2-col">
              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">
                  <h3 className="asp2-chart-title">접수 유형 분포</h3>
                </div>
                <div className="asp2-donut-wrap">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={categoryDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                        dataKey="value" startAngle={90} endAngle={-270}>
                        {categoryDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}건`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="asp2-donut-legend">
                  {categoryDist.map((c) => (
                    <div key={c.name} className="asp2-donut-legend__item">
                      <span className="asp2-donut-legend__dot" style={{ background: c.color }} />
                      <span className="asp2-donut-legend__name">{c.name}</span>
                      <span className="asp2-donut-legend__pct">{c.pct} ({c.value}건)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">
                  <h3 className="asp2-chart-title">상태별 건수</h3>
                </div>
                {loading ? (
                  <p style={{ color: "#aaa", fontSize: "12px" }}>로딩 중...</p>
                ) : statusData.map((s) => (
                  <div key={s.label} className="asp2-status-row">
                    <span className="asp2-status-row__label">{s.label}</span>
                    <div className="asp2-status-row__bar-wrap">
                      <div
                        className="asp2-status-row__bar"
                        style={{ width: `${(s.value / maxStatusVal) * 100}%`, background: s.color }}
                      />
                    </div>
                    <span className="asp2-status-row__val">{s.value.toLocaleString()}건</span>
                  </div>
                ))}
              </div>
            </div>


            {/* 우측: TOP5 + 이달의요약 */}

            <div className="asp2-col">

              {/* 우수 기사 TOP3 - 15번 API */}
              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">

                  <h3 className="asp2-chart-title">기사별 완료 건수 TOP 5</h3>
                </div>
                {engineerTop5.length === 0 && <p className="asp2-empty">데이터가 없습니다.</p>}
                {engineerTop5.map((e) => (
                  <div key={e.rank} className="asp2-top-row">
                    <span className="asp2-top-row__rank">
                      {e.rank <= 3 ? ["🥇","🥈","🥉"][e.rank-1] : e.rank}
                    </span>
                    <span className="asp2-top-row__name">{e.name}</span>
                    <span className="asp2-top-row__count">{e.count}건</span>
                  </div>
                ))}

              </div>

              <div className="asp2-chart-card">
                <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>이달의 요약</h3>
                {monthlySummaryRows.map((m) => (
                  <div key={m.label} className="asp2-monthly-row">
                    <m.icon size={13} color="#5B4FF5" />
                    <span className="asp2-monthly-row__label">{m.label}</span>
                    <span className="asp2-monthly-row__value">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "작업 통계" && !error && (
        <div className="asp2-dashboard">
          <div className="asp2-grid asp2-grid--2col">
            <div className="asp2-col">
              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">
                  <h3 className="asp2-chart-title">접수 및 완료 추이</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#aaa" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="접수" stroke="#5B4FF5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="완료" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">
                  <h3 className="asp2-chart-title">일별 시간대별 접수 현황</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#aaa" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                    <Tooltip />
                    <Bar dataKey="건수" fill="#5B4FF5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="asp2-col">
              <div className="asp2-chart-card">
                <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>가전 카테고리별 접수 분포</h3>
                <div className="asp2-detail-table asp2-detail-table--3col">
                  <div className="asp2-detail-table__header">
                    <span>카테고리</span><span>건수</span><span>비율</span>
                  </div>
                  {categoryDist.length === 0 && <p className="asp2-empty">데이터가 없습니다.</p>}
                  {categoryDist.map((c) => (
                    <div key={c.name} className="asp2-detail-table__row">
                      <span>{c.name}</span><span>{c.value.toLocaleString()}건</span><span>{c.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="asp2-chart-card">
                <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>상태별 건수</h3>
                <div className="asp2-detail-table asp2-detail-table--3col">
                  <div className="asp2-detail-table__header">
                    <span>상태</span><span>건수</span><span>비율</span>
                  </div>
                  {statusData.length === 0 && <p className="asp2-empty">데이터가 없습니다.</p>}
                  {statusData.map((s) => (
                    <div key={s.label} className="asp2-detail-table__row">
                      <span>{s.label}</span><span>{s.value.toLocaleString()}건</span><span>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "기사 통계" && !error && (
        <div className="asp2-dashboard">
          <div className="asp2-stats asp2-stats--3col">
            {engineerStatCards.map((s) => (
              <div key={s.label} className="asp2-stat-card">
                <div className={`asp2-stat-card__icon asp2-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
                <div>
                  <p className="asp2-stat-card__label">{s.label}</p>
                  <p className="asp2-stat-card__value">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="asp2-chart-card">
            <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>기사별 완료 건수 · 평균 평점</h3>
            <div className="asp2-detail-table asp2-detail-table--engineer">
              <div className="asp2-detail-table__header">
                <span>순위</span><span>기사명</span><span>완료 건수</span><span>평균 평점</span>
              </div>
              {engineerStats.length === 0 && <p className="asp2-empty">데이터가 없습니다.</p>}
              {engineerStats.map((e) => (
                <div key={e.engineerId} className="asp2-detail-table__row">
                  <span>{e.rank}</span>
                  <span>{e.engineerName}</span>
                  <span>{e.completedCount.toLocaleString()}건</span>
                  <span>{e.avgRating != null ? e.avgRating.toFixed(1) : "-"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "정산 통계" && !error && (
        <div className="asp2-dashboard">
          <div className="asp2-stats asp2-stats--4col">
            {settlementStatCards.map((s) => (
              <div key={s.label} className="asp2-stat-card">
                <div className={`asp2-stat-card__icon asp2-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
                <div>
                  <p className="asp2-stat-card__label">{s.label}</p>
                  <p className="asp2-stat-card__value">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="asp2-chart-card">
            <div className="asp2-chart-card__header">
              <h3 className="asp2-chart-title">일자별 정산 추이</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={settlementTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#aaa" }} />
                <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                <Tooltip formatter={(v) => `₩${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="grossAmount" name="총 매출액" stroke="#5B4FF5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="asp2-chart-card">
            <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>일자별 정산 내역</h3>
            <div className="asp2-detail-table asp2-detail-table--settlement">
              <div className="asp2-detail-table__header">
                <span>날짜</span><span>건수</span><span>총 매출액</span><span>플랫폼 수수료</span><span>대행사 수수료</span><span>기사 지급액</span>
              </div>
              {settlementTrend.length === 0 && <p className="asp2-empty">데이터가 없습니다.</p>}
              {settlementTrend.map((d) => (
                <div key={d.date} className="asp2-detail-table__row">
                  <span>{d.date}</span>
                  <span>{d.count.toLocaleString()}건</span>
                  <span className="asp2-detail-table__amount">₩{d.grossAmount.toLocaleString()}</span>
                  <span>₩{d.platformFee.toLocaleString()}</span>
                  <span>₩{d.agencyFee.toLocaleString()}</span>
                  <span>₩{d.engineerNetAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "고객 통계" && !error && (
        <div className="asp2-dashboard">
          <div className="asp2-stats asp2-stats--3col">
            {customerStatCards.map((s) => (
              <div key={s.label} className="asp2-stat-card">
                <div className={`asp2-stat-card__icon asp2-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
                <div>
                  <p className="asp2-stat-card__label">{s.label}</p>
                  <p className="asp2-stat-card__value">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="asp2-chart-card">
            <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>고객별 접수 현황</h3>
            <div className="asp2-detail-table asp2-detail-table--customer">
              <div className="asp2-detail-table__header">
                <span>고객ID</span><span>고객명</span><span>접수 건수</span><span>평균 만족도</span>
              </div>
              {customerStats.length === 0 && <p className="asp2-empty">데이터가 없습니다.</p>}
              {customerStats.map((c) => (
                <div key={c.customerId} className="asp2-detail-table__row">
                  <span>CUST-{String(c.customerId).padStart(6, "0")}</span>
                  <span>{c.customerName}</span>
                  <span>{c.requestCount.toLocaleString()}건</span>
                  <span>{c.avgRating != null ? c.avgRating.toFixed(1) : "-"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "리포트" && !error && (
        <div className="asp2-dashboard">
          <div className="asp2-chart-card asp2-report-card">
            <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>리포트 다운로드</h3>
            <p className="asp2-report-card__desc">
              상단에서 선택한 기간({dateFrom} ~ {dateTo}) 기준으로 리포트를 CSV 파일로 내려받을 수 있습니다.
            </p>
            {REPORT_ITEMS.map((r) => (
              <div key={r.key} className="asp2-report-row">
                <r.icon size={14} color="#5B4FF5" />
                <div className="asp2-report-row__info">
                  <p className="asp2-report-row__label">{r.label}</p>
                  <p className="asp2-report-row__desc">{r.desc}</p>
                </div>
                <button
                  className="asp2-download-btn"
                  disabled={downloadingReport === r.key}
                  onClick={() => handleDownloadReport(r)}
                >
                  <Download size={12} /> {downloadingReport === r.key ? "다운로드 중..." : "다운로드"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
