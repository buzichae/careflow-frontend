import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Wrench,
  Star,
  CreditCard,
  AlertCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../../styles/Admin/Admin.css";
import "../../styles/Admin/AdminDashboard.css";
import {
  getAdminUserKpi,
  getAdminMemberTrend,
  getAgencyRequests,
} from "../../apis/admin";

/* ── 실시간 A/S 현황 (mock — A/S 통계 API 미구현) ── */
const AS_STAGES = [
  { key: "접수", count: 128, color: "#6366f1" },
  { key: "배정 대기", count: 15, color: "#f59e0b" },
  { key: "방문 예정", count: 42, color: "#3b82f6" },
  { key: "수리 진행", count: 31, color: "#8b5cf6" },
  { key: "완료", count: 40, color: "#16a34a" },
];
const AS_TOTAL = AS_STAGES.reduce((s, a) => s + a.count, 0);

function TrendTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e5ef",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      <p style={{ margin: 0, color: "#888" }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontWeight: 700, color: "#1a1a2e" }}>
        {payload[0].value}
        {unit}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [kpi, setKpi] = useState(null);
  const [memberTrend, setMemberTrend] = useState([]);
  const [pendingAgencies, setPendingAgencies] = useState([]);

  useEffect(() => {
    // customer + agency + engineer 합산
    Promise.all([
      getAdminUserKpi("CUSTOMER").catch(() => ({ data: null })),
      getAdminUserKpi("AGENCY").catch(() => ({ data: null })),
      getAdminUserKpi("ENGINEER").catch(() => ({ data: null })),
    ]).then(([c, a, e]) => {
      const parts = [c.data, a.data, e.data].filter(Boolean);
      if (parts.length === 0) return;
      const sum = (key) => parts.reduce((acc, p) => acc + (p[key] ?? 0), 0);
      setKpi({
        totalCount: sum("totalCount"),
        activeCount: sum("activeCount"),
        inactiveCount: sum("inactiveCount"),
        suspendedCount: sum("suspendedCount"),
        todayNewCount: sum("todayNewCount"),
      });
    });

    // 추이는 role 없이(전체) 또는 합산 — 백엔드가 전체를 지원하면 그대로, 아니면 각각 호출해 합산
    Promise.all([
      getAdminMemberTrend("CUSTOMER").catch(() => ({ data: [] })),
      getAdminMemberTrend("AGENCY").catch(() => ({ data: [] })),
      getAdminMemberTrend("ENGINEER").catch(() => ({ data: [] })),
    ]).then(([c, a, e]) => {
      const merge = {};
      for (const part of [c.data ?? [], a.data ?? [], e.data ?? []]) {
        for (const d of part) {
          const day = d.date?.slice(5) ?? d.day;
          merge[day] = (merge[day] ?? 0) + (d.newCount ?? d.count ?? 0);
        }
      }
      setMemberTrend(
        Object.entries(merge)
          .sort()
          .map(([day, count]) => ({ day, count })),
      );
    });

    getAgencyRequests()
      .then((res) => {
        const list = res.data?.requests ?? res.data ?? [];
        setPendingAgencies(
          Array.isArray(list) ? list.filter((r) => r.status === "PENDING") : [],
        );
      })
      .catch(() => {});
  }, []);

  const KPI_CARDS = [
    {
      icon: <Users size={18} />,
      color: "purple",
      num: kpi ? `${kpi.totalCount.toLocaleString()}명` : "—",
      label: "전체 회원",
    },
    {
      icon: <Wrench size={18} />,
      color: "blue",
      num: kpi ? `${kpi.activeCount.toLocaleString()}명` : "—",
      label: "활성 회원",
    },
    {
      icon: <Star size={18} />,
      color: "orange",
      num: kpi ? `${kpi.todayNewCount.toLocaleString()}명` : "—",
      label: "오늘 신규 가입",
    },
    {
      icon: <CreditCard size={18} />,
      color: "green",
      num: kpi ? `${kpi.suspendedCount.toLocaleString()}명` : "—",
      label: "정지 회원",
    },
  ];

  return (
    <div className="admin-page">
      {/* 정산 지급 대기 배너 */}
      <div className="admin-banner">
        <div className="admin-banner__left">
          <span className="admin-banner__label">대행사 승인 대기</span>
          <span className="admin-banner__count">
            {pendingAgencies.length}건
          </span>
          <span className="admin-banner__desc">
            승인 대기 중인 대행사가 있습니다. 회원 관리에서 확인하세요.
          </span>
        </div>
        <AlertCircle size={40} style={{ opacity: 0.6 }} />
      </div>

      {/* KPI 카드 */}
      <div className="admin-stat-grid">
        {KPI_CARDS.map((k) => (
          <div key={k.label} className="admin-stat-card">
            <div
              className={`admin-stat-card__icon admin-stat-card__icon--${k.color}`}
            >
              {k.icon}
            </div>
            <p className="admin-stat-card__num">{k.num}</p>
            <p className="admin-stat-card__label">{k.label}</p>
          </div>
        ))}
      </div>

      {/* 실시간 A/S 현황 */}
      <div className="admin-section" style={{ marginBottom: 20 }}>
        <div className="admin-section__header">
          <h2 className="admin-section__title">
            실시간 A/S 현황 <span className="adash-live-dot" />
          </h2>
          <span style={{ fontSize: 12, color: "#aaa" }}>최근 일주일 기준</span>
        </div>
        <div className="admin-section__body">
          <div className="adash-as-flow">
            {AS_STAGES.map((s, i) => (
              <div key={s.key} className="adash-as-flow__item">
                <div
                  className="adash-as-flow__card"
                  style={{ borderColor: s.color }}
                >
                  <p
                    className="adash-as-flow__count"
                    style={{ color: s.color }}
                  >
                    {s.count}
                  </p>
                  <p className="adash-as-flow__label">{s.key}</p>
                </div>
                {i < AS_STAGES.length - 1 && (
                  <ArrowRight size={16} className="adash-as-flow__arrow" />
                )}
              </div>
            ))}
          </div>
          <div className="adash-as-bar">
            {AS_STAGES.map((s) => (
              <div
                key={s.key}
                className="adash-as-bar__seg"
                style={{
                  width: `${(s.count / AS_TOTAL) * 100}%`,
                  background: s.color,
                }}
                title={`${s.key}: ${s.count}건 (${((s.count / AS_TOTAL) * 100).toFixed(1)}%)`}
              />
            ))}
          </div>
          <div className="adash-as-bar-labels">
            {AS_STAGES.map((s) => (
              <span key={s.key} className="adash-as-bar-label">
                <span
                  className="adash-as-bar-label__dot"
                  style={{ background: s.color }}
                />
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
            {memberTrend.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#aaa",
                  padding: "40px 0",
                  fontSize: 13,
                }}
              >
                데이터를 불러오는 중...
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart
                  data={memberTrend}
                  margin={{ top: 4, right: 12, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#aaa" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#aaa" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={(props) => <TrendTooltip {...props} unit="명" />}
                  />
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
            )}
          </div>
        </div>

        {/* 비활성/정지 현황 */}
        <div className="admin-section">
          <div className="admin-section__header">
            <h2 className="admin-section__title">회원 상태 현황</h2>
            <span style={{ fontSize: 12, color: "#aaa" }}>전체 기준</span>
          </div>
          <div className="admin-section__body">
            {!kpi ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#aaa",
                  padding: "40px 0",
                  fontSize: 13,
                }}
              >
                데이터를 불러오는 중...
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  padding: "8px 0",
                }}
              >
                {[
                  {
                    label: "활성 (ACTIVE)",
                    count: kpi.activeCount,
                    color: "#16a34a",
                  },
                  {
                    label: "비활성 (INACTIVE)",
                    count: kpi.inactiveCount,
                    color: "#f59e0b",
                  },
                  {
                    label: "정지 (SUSPENDED)",
                    count: kpi.suspendedCount,
                    color: "#ef4444",
                  },
                ].map(({ label, count, color }) => {
                  const pct =
                    kpi.totalCount > 0 ? (count / kpi.totalCount) * 100 : 0;
                  return (
                    <div key={label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: "#555" }}>{label}</span>
                        <span style={{ fontWeight: 600, color }}>
                          {count.toLocaleString()}명 ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 4,
                          background: "#f0f0f8",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 4,
                            background: color,
                            width: `${pct}%`,
                            transition: "width 0.5s",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 대행사 승인 대기 */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">대행사 승인 대기</h2>
          <button
            className="admin-btn admin-btn--outline admin-btn--sm"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
            onClick={() => navigate("/admin/members?tab=agencies")}
          >
            전체 보기 <ChevronRight size={13} />
          </button>
        </div>
        <div className="admin-section__body" style={{ padding: 0 }}>
          {pendingAgencies.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#aaa",
                padding: "24px 0",
                fontSize: 13,
              }}
            >
              승인 대기 중인 대행사가 없습니다.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>대행사명</th>
                  <th>신청자</th>
                  <th>이메일</th>
                  <th>신청일</th>
                </tr>
              </thead>
              <tbody>
                {pendingAgencies.map((row) => (
                  <tr key={row.accountRequestId}>
                    <td style={{ fontWeight: 600 }}>{row.agencyName}</td>
                    <td>{row.name}</td>
                    <td style={{ fontSize: 12, color: "#888" }}>{row.email}</td>
                    <td style={{ fontSize: 12, color: "#888" }}>
                      {row.createdAt?.slice(0, 10)}
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
