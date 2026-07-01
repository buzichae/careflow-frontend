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
  getStatusCount, getEngineerTop5, getMonthlySummary,
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

// TODO(프론트): 아래 두 항목은 대응하는 백엔드 API가 아직 없어 임시 mock 데이터입니다. 프론트 담당자 확인 필요.
const MOCK_MONTHLY_EXTRA = [
  { label: "최다 정산 대행사", value: "케어플로우 수리센터", icon: Wallet },
  { label: "고객 만족도",      value: "매우 만족 (86.3%)",   icon: Smile  },
];

// TODO(프론트): "최근 주요 지표 요약" 테이블 — 기간별 비교 API 미구현으로 mock 데이터 사용 중. 프론트 담당자 확인 필요.
const MOCK_SUMMARY_TABLE = [
  { period: "2024.06.01 ~ 2024.06.18", receipt: "1,248건", done: "1,086건", rate: "87.0%", avgTime: "2.4 시간", avgRating: "4.8", totalAmount: "₩98,420,000" },
  { period: "2024.05.01 ~ 2024.05.31", receipt: "1,083건", done: "963건",   rate: "89.0%", avgTime: "2.7 시간", avgRating: "4.6", totalAmount: "₩87,450,000" },
  { period: "2024.04.01 ~ 2024.04.30", receipt: "972건",   done: "842건",   rate: "86.6%", avgTime: "2.6 시간", avgRating: "4.7", totalAmount: "₩76,320,000" },
];

// TODO(프론트): "리포트 다운로드" — 리포트 생성/다운로드 API 미구현으로 mock 데이터 사용 중. 프론트 담당자 확인 필요.
const MOCK_REPORT_ITEMS = [
  { label: "작업 현황 리포트",  desc: "접수/완료/미완료 등 작업 현황",   icon: FileText },
  { label: "정산 리포트",       desc: "대행사별 정산 내역",              icon: Wallet   },
  { label: "기사 성과 리포트",  desc: "기사별 작업 및 평가 통계",        icon: Users    },
  { label: "고객 현황 리포트",  desc: "고객 접수 및 만족도 통계",        icon: Smile    },
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryRes, dailyTrendRes, hourlyRes,
        categoryDistRes, statusCountRes, engineerTop5Res, monthlySummaryRes,
      ] = await Promise.all([
        getSummary(dateFrom, dateTo),
        getDailyTrend(dateFrom, dateTo),
        getHourly(dateFrom, dateTo),
        getCategoryDist(dateFrom, dateTo),
        getStatusCount(dateFrom, dateTo),
        getEngineerTop5(dateFrom, dateTo),
        getMonthlySummary(),
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
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

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
    ...MOCK_MONTHLY_EXTRA,
  ] : [];


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
          {/* 통계 카드 - 더미 유지 */}
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
                  {MOCK_SUMMARY_TABLE.map((row, i) => (
                    <div key={i} className="asp2-summary-table__row">
                      <span>{row.period}</span>
                      <span>{row.receipt}</span>
                      <span>{row.done}</span>
                      <span>{row.rate}</span>
                      <span>{row.avgTime}</span>
                      <span>{row.avgRating}</span>
                      <span className="asp2-summary-table__amount">{row.totalAmount}</span>
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

              <div className="asp2-chart-card">
                <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>리포트 다운로드</h3>
                {MOCK_REPORT_ITEMS.map((r) => (
                  <div key={r.label} className="asp2-report-row">
                    <r.icon size={14} color="#5B4FF5" />
                    <div className="asp2-report-row__info">
                      <p className="asp2-report-row__label">{r.label}</p>
                      <p className="asp2-report-row__desc">{r.desc}</p>
                    </div>
                    <button className="asp2-download-btn"><Download size={12} /> 다운로드</button>
                  </div>
                ))}
                <button className="asp2-custom-report-btn">📋 사용자 정의 리포트 생성</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== "대시보드" && (
        <div className="asp2-coming-soon">
          {activeTab} 탭 — API 연동 후 구현 예정
        </div>
      )}
    </div>
  );
}
