import { useState, useEffect } from "react";
import {
  ClipboardList, Wrench, CheckCircle, Clock, Star, Wallet,
  ChevronDown, RefreshCw, Download, FileText, Users, Smile,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "../../styles/Agency/AgencyStatisticsPage.css";

const BASE_URL = "http://localhost:8080";

async function apiFetch(path) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const STAT_TABS = ["대시보드", "작업 통계", "기사 통계", "정산 통계", "고객 통계", "리포트"];

// TODO: API 없음 → 더미 유지
const statCards = [
  { label: "총 접수 건수",   value: "1,248건",      sub: "전월 대비 +15.2%",  subType: "up", icon: ClipboardList, color: "purple" },
  { label: "완료 건수",      value: "1,086건",      sub: "전월 대비 +12.6%",  subType: "up", icon: Wrench,        color: "green"  },
  { label: "완료율",         value: "87.0%",        sub: "전월 대비 +2.3%p",  subType: "up", icon: CheckCircle,   color: "teal"   },
  { label: "평균 처리 시간", value: "2.4 시간",     sub: "전월 대비 -0.3시간", subType: "up", icon: Clock,         color: "orange" },
  { label: "평균 평점",      value: "4.8 / 5.0",   sub: "전월 대비 +0.2",    subType: "up", icon: Star,          color: "amber"  },
  { label: "총 정산 금액",   value: "₩98,420,000", sub: "전월 대비 +12.5%",  subType: "up", icon: Wallet,        color: "blue"   },
];

// TODO: API 없음 → 더미 유지
const dailyTrend = [
  { date: "06.01", 접수: 38,  완료: 32  },
  { date: "06.03", 접수: 45,  완료: 38  },
  { date: "06.05", 접수: 52,  완료: 44  },
  { date: "06.07", 접수: 48,  완료: 40  },
  { date: "06.09", 접수: 60,  완료: 52  },
  { date: "06.11", 접수: 75,  완료: 65  },
  { date: "06.13", 접수: 140, 완료: 120 },
  { date: "06.15", 접수: 130, 완료: 112 },
  { date: "06.17", 접수: 95,  완료: 82  },
  { date: "06.18", 접수: 88,  완료: 76  },
];

// TODO: API 없음 → 더미 유지
const hourlyData = [
  { time: "00-03시", 건수: 5   },
  { time: "03-06시", 건수: 12  },
  { time: "06-09시", 건수: 65  },
  { time: "09-12시", 건수: 98  },
  { time: "12-15시", 건수: 110 },
  { time: "15-18시", 건수: 85  },
  { time: "18-21시", 건수: 45  },
  { time: "21-24시", 건수: 8   },
];

// TODO: API 없음 → 더미 유지
const categoryDist = [
  { name: "에어컨", value: 564, pct: "45.2%", color: "#5B4FF5" },
  { name: "세탁기", value: 235, pct: "18.8%", color: "#2563eb" },
  { name: "TV",    value: 158, pct: "12.7%", color: "#16a34a" },
  { name: "냉장고", value: 120, pct: "9.6%",  color: "#d97706" },
  { name: "기타",  value: 171, pct: "13.7%", color: "#aaa"    },
];

// TODO: API 없음 → 더미 유지
const summaryTable = [
  { period: "2024.06.01 ~ 2024.06.18", receipt: "1,248건", done: "1,086건", rate: "87.0%", avgTime: "2.4 시간", avgRating: "4.8", totalAmount: "₩98,420,000" },
  { period: "2024.05.01 ~ 2024.05.31", receipt: "1,083건", done: "963건",   rate: "89.0%", avgTime: "2.7 시간", avgRating: "4.6", totalAmount: "₩87,450,000" },
  { period: "2024.04.01 ~ 2024.04.30", receipt: "972건",   done: "842건",   rate: "86.6%", avgTime: "2.6 시간", avgRating: "4.7", totalAmount: "₩76,320,000" },
];

// TODO: API 없음 → 더미 유지
const monthlySummary = [
  { label: "최다 접수 요일",  value: "금요일 (212건)",    icon: ClipboardList },
  { label: "최다 접수 시간",  value: "10-11시 (186건)",   icon: Clock         },
  { label: "최고 평점 기사",  value: "김현수 기사 (4.9)", icon: Star          },
  { label: "최다 정산 대행사", value: "케어플로우 수리센터", icon: Wallet       },
  { label: "고객 만족도",     value: "매우 만족 (86.3%)",  icon: Smile         },
];

// TODO: API 없음 → 더미 유지
const reportItems = [
  { label: "작업 현황 리포트", desc: "접수/완료/미완료 등 작업 현황",  icon: FileText },
  { label: "정산 리포트",      desc: "대행사별 정산 내역",             icon: Wallet   },
  { label: "기사 성과 리포트", desc: "기사별 작업 및 평가 통계",       icon: Users    },
  { label: "고객 현황 리포트", desc: "고객 접수 및 만족도 통계",       icon: Smile    },
];

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

  // ── 10번: 작업 현황 상태별 통계 ─────────────────
  // 응답: { waitingCount, engineerDepartedCount, engineerArrivedCount, inProgressCount, completedCount }
  const [workStats,    setWorkStats]    = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── 15번: 수리 완료 실적 TOP3 기사 ───────────────
  // 응답: [{ rank, engineerUserId, name, completedCount }]
  const [top3,        setTop3]        = useState([]);
  const [top3Loading, setTop3Loading] = useState(true);

  useEffect(() => {
    // 10번
    apiFetch("/api/agency/work-requests/stats")
      .then(setWorkStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false));

    // 15번
    apiFetch("/api/agency/engineers/top3")
      .then(data => setTop3(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setTop3Loading(false));
  }, []);

  // 10번 API → 상태별 건수 데이터로 변환
  const statusData = workStats ? [
    { label: "배정 대기",  value: workStats.waitingCount,          color: "#5B4FF5" },
    { label: "기사 출발",  value: workStats.engineerDepartedCount, color: "#2563eb" },
    { label: "기사 도착",  value: workStats.engineerArrivedCount,  color: "#0ea5e9" },
    { label: "수리 진행 중", value: workStats.inProgressCount,     color: "#16a34a" },
    { label: "수리 완료",  value: workStats.completedCount,        color: "#d97706" },
  ] : [];

  const maxStatusVal = Math.max(...statusData.map(s => s.value), 1);

  return (
    <div className="asp2">
      {/* 헤더 */}
      <div className="asp2-header">
        <div>
          <h1 className="asp2-header__title">통계 및 리포트</h1>
          <p className="asp2-header__sub">기간별 서비스 운영 현황을 확인하고 리포트를 생성할 수 있습니다.</p>
        </div>
        <div className="asp2-header__right">
          <div className="asp2-filter-date"><span>2024.06.01 ~ 2024.06.18</span></div>
          <div className="asp2-filter-select"><span>비교 기간 선택</span><ChevronDown size={13} /></div>
          <button className="asp2-reset-btn"><RefreshCw size={13} /> 필터 초기화</button>
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

      {activeTab === "대시보드" && (
        <div className="asp2-dashboard">
          {/* 통계 카드 - 더미 유지 */}
          <div className="asp2-stats">
            {statCards.map((s) => (
              <div key={s.label} className="asp2-stat-card">
                <div className={`asp2-stat-card__icon asp2-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
                <div>
                  <p className="asp2-stat-card__label">{s.label}</p>
                  <p className="asp2-stat-card__value">{s.value}</p>
                  <p className={`asp2-stat-card__sub asp2-stat-card__sub--${s.subType}`}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="asp2-grid">
            {/* 좌측 */}
            <div className="asp2-col">
              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">
                  <h3 className="asp2-chart-title">접수 및 완료 추이</h3>
                  <div className="asp2-filter-select asp2-filter-select--sm"><span>일별</span><ChevronDown size={12} /></div>
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
                  <h3 className="asp2-chart-title">시간대별 접수 현황</h3>
                  <div className="asp2-filter-select asp2-filter-select--sm"><span>전체 기간</span><ChevronDown size={12} /></div>
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
                  {summaryTable.map((row, i) => (
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

            {/* 중앙 */}
            <div className="asp2-col">
              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">
                  <h3 className="asp2-chart-title">접수 유형 분포</h3>
                  <div className="asp2-filter-select asp2-filter-select--sm"><span>전체 기간</span><ChevronDown size={12} /></div>
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

              {/* 상태별 건수 - 10번 API */}
              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">
                  <h3 className="asp2-chart-title">작업 현황 상태별 건수</h3>
                </div>
                {statsLoading ? (
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

            {/* 우측 */}
            <div className="asp2-col">

              {/* 우수 기사 TOP3 - 15번 API */}
              <div className="asp2-chart-card">
                <div className="asp2-chart-card__header">
                  <h3 className="asp2-chart-title">수리 완료 실적 TOP 3</h3>
                </div>
                {top3Loading ? (
                  <p style={{ color: "#aaa", fontSize: "12px" }}>로딩 중...</p>
                ) : top3.length === 0 ? (
                  <p style={{ color: "#aaa", fontSize: "12px" }}>데이터가 없습니다.</p>
                ) : (
                  top3.map((e) => (
                    <div key={e.engineerUserId} className="asp2-top-row">
                      <span className="asp2-top-row__rank">
                        {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : "🥉"}
                      </span>
                      <span className="asp2-top-row__name">{e.name} 기사</span>
                      <span className="asp2-top-row__count">{e.completedCount}건</span>
                    </div>
                  ))
                )}
              </div>

              <div className="asp2-chart-card">
                <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>이달의 요약</h3>
                {monthlySummary.map((m) => (
                  <div key={m.label} className="asp2-monthly-row">
                    <m.icon size={13} color="#5B4FF5" />
                    <span className="asp2-monthly-row__label">{m.label}</span>
                    <span className="asp2-monthly-row__value">{m.value}</span>
                  </div>
                ))}
              </div>

              <div className="asp2-chart-card">
                <h3 className="asp2-chart-title" style={{ marginBottom: 12 }}>리포트 다운로드</h3>
                {reportItems.map((r) => (
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