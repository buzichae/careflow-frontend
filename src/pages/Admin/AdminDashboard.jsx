import { Users, Wrench, Star, CreditCard, AlertCircle, ChevronRight, ArrowRight } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import "../../styles/Admin/Admin.css";
import "../../styles/Admin/AdminDashboard.css";

/* ── KPI ── */
const KPI = [
  { icon: <Users size={18} />,      color: "purple", num: "12명",  label: "오늘 신규 가입" },
  { icon: <Wrench size={18} />,     color: "blue",   num: "87건",  label: "이번 달 A/S 처리" },
  { icon: <Star size={18} />,       color: "orange", num: "4.7",   label: "플랫폼 평균 평점" },
  { icon: <CreditCard size={18} />, color: "green",  num: "5건",   label: "정산 대기" },
];

/* ── 실시간 A/S 현황 ── */
const AS_STAGES = [
  { key: "접수",     count: 128, color: "#6366f1" },
  { key: "배정 대기", count:  15, color: "#f59e0b" },
  { key: "방문 예정", count:  42, color: "#3b82f6" },
  { key: "수리 진행", count:  31, color: "#8b5cf6" },
  { key: "완료",    count:  40, color: "#16a34a" },
];
const AS_TOTAL = AS_STAGES.reduce((s, a) => s + a.count, 0);

/* ── 신규 가입자 추이 (최근 7일) ── */
const memberTrend = [
  { day: "6/19", count: 8  },
  { day: "6/20", count: 14 },
  { day: "6/21", count: 11 },
  { day: "6/22", count: 19 },
  { day: "6/23", count: 7  },
  { day: "6/24", count: 22 },
  { day: "6/25", count: 12 },
];

/* ── A/S 요청 건수 추이 (최근 7일) ── */
const asTrend = [
  { day: "6/19", count: 32 },
  { day: "6/20", count: 45 },
  { day: "6/21", count: 38 },
  { day: "6/22", count: 51 },
  { day: "6/23", count: 29 },
  { day: "6/24", count: 60 },
  { day: "6/25", count: 43 },
];

/* ── 대행사 미승인 ── */
const mockPendingAgencies = [
  { name: "한국서비스대행사", bizNo: "123-45-67890", region: "서울·경기", appliedAt: "2026.06.20" },
  { name: "프리미엄AS",    bizNo: "234-56-78901", region: "대전·충청", appliedAt: "2026.06.22" },
  { name: "케어플러스",    bizNo: "345-67-89012", region: "광주·전남", appliedAt: "2026.06.23" },
];

function TrendTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5ef", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <p style={{ margin: 0, color: "#888" }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#1a1a2e" }}>{payload[0].value}{unit}</p>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="admin-page">

      {/* 정산 지급 대기 배너 */}
      <div className="admin-banner">
        <div className="admin-banner__left">
          <span className="admin-banner__label">정산 지급 대기</span>
          <span className="admin-banner__count">5건</span>
          <span className="admin-banner__desc">미지급 승인 건이 있습니다. 정산 관리에서 확인하세요.</span>
        </div>
        <AlertCircle size={40} style={{ opacity: 0.6 }} />
      </div>

      {/* KPI 카드 */}
      <div className="admin-stat-grid">
        {KPI.map((k) => (
          <div key={k.label} className="admin-stat-card">
            <div className={`admin-stat-card__icon admin-stat-card__icon--${k.color}`}>{k.icon}</div>
            <p className="admin-stat-card__num">{k.num}</p>
            <p className="admin-stat-card__label">{k.label}</p>
          </div>
        ))}
      </div>

      {/* 실시간 A/S 현황 */}
      <div className="admin-section" style={{ marginBottom: 20 }}>
        <div className="admin-section__header">
          <h2 className="admin-section__title">실시간 A/S 현황 <span className="adash-live-dot" /></h2>
          <span style={{ fontSize: 12, color: "#aaa" }}>최근 일주일 기준</span>
        </div>
        <div className="admin-section__body">

          {/* 단계별 플로우 */}
          <div className="adash-as-flow">
            {AS_STAGES.map((s, i) => (
              <div key={s.key} className="adash-as-flow__item">
                <div className="adash-as-flow__card" style={{ borderColor: s.color }}>
                  <p className="adash-as-flow__count" style={{ color: s.color }}>{s.count}</p>
                  <p className="adash-as-flow__label">{s.key}</p>
                </div>
                {i < AS_STAGES.length - 1 && (
                  <ArrowRight size={16} className="adash-as-flow__arrow" />
                )}
              </div>
            ))}
          </div>

          {/* 비율 바 */}
          <div className="adash-as-bar">
            {AS_STAGES.map((s) => (
              <div
                key={s.key}
                className="adash-as-bar__seg"
                style={{ width: `${(s.count / AS_TOTAL) * 100}%`, background: s.color }}
                title={`${s.key}: ${s.count}건 (${((s.count / AS_TOTAL) * 100).toFixed(1)}%)`}
              />
            ))}
          </div>
          <div className="adash-as-bar-labels">
            {AS_STAGES.map((s) => (
              <span key={s.key} className="adash-as-bar-label">
                <span className="adash-as-bar-label__dot" style={{ background: s.color }} />
                {s.key} {((s.count / AS_TOTAL) * 100).toFixed(1)}%
              </span>
            ))}
          </div>

        </div>
      </div>

      {/* 추이 차트 2개 */}
      <div className="admin-two-col" style={{ marginBottom: 20 }}>

        {/* 신규 가입자 추이 */}
        <div className="admin-section">
          <div className="admin-section__header">
            <h2 className="admin-section__title">신규 가입자 추이</h2>
            <span style={{ fontSize: 12, color: "#aaa" }}>최근 7일</span>
          </div>
          <div className="admin-section__body">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={memberTrend} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <Tooltip content={(props) => <TrendTooltip {...props} unit="명" />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#734bcf"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#734bcf", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* A/S 요청 건수 추이 */}
        <div className="admin-section">
          <div className="admin-section__header">
            <h2 className="admin-section__title">A/S 요청 건수 추이</h2>
            <span style={{ fontSize: 12, color: "#aaa" }}>최근 7일</span>
          </div>
          <div className="admin-section__body">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={asTrend} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <Tooltip content={(props) => <TrendTooltip {...props} unit="건" />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 대행사 승인 대기 */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">대행사 승인 대기</h2>
          <button className="admin-btn admin-btn--outline admin-btn--sm" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            회원 관리 <ChevronRight size={13} />
          </button>
        </div>
        <div className="admin-section__body" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>대행사명</th>
                <th>사업자번호</th>
                <th>서비스 지역</th>
                <th>신청일</th>
              </tr>
            </thead>
            <tbody>
              {mockPendingAgencies.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td style={{ fontSize: 12, color: "#888" }}>{row.bizNo}</td>
                  <td>{row.region}</td>
                  <td style={{ fontSize: 12, color: "#888" }}>{row.appliedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
