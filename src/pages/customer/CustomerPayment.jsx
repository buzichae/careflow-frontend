import { ChevronRight, FileText, CreditCard, User, Wallet, CalendarDays, AlertTriangle, Shield, Truck } from "lucide-react";
import "../../styles/Customer/CustomerPayment.css";

/* ── 데이터 ── */
const KPI = [
  { label: "총 지출",        value: "₩1,280,000", sub: "누적 합계",         Icon: Wallet,        highlight: false },
  { label: "이번 달 지출",   value: "₩128,000",   sub: "▲ 23% 지난달 대비", Icon: CalendarDays,  highlight: false },
  { label: "미결제 건수",    value: "1 건",        sub: "결제 대기 중",       Icon: AlertTriangle, highlight: true  },
  { label: "보증 수리 건수", value: "3 건",        sub: "무상 처리 완료",     Icon: Shield,        highlight: false },
  { label: "기사 방문 횟수", value: "12 회",       sub: "이번 달 기준",       Icon: Truck,         highlight: false },
];

const MONTHLY = [
  { month: "1월", amount: 50000  },
  { month: "2월", amount: 80000  },
  { month: "3월", amount: 150000 },
  { month: "4월", amount: 70000  },
  { month: "5월", amount: 180000 },
  { month: "6월", amount: 128000 },
];

const COST_BREAKDOWN = [
  { label: "출장비", pct: 20, color: "#734bcf" },
  { label: "부품비", pct: 55, color: "#3b82f6" },
  { label: "수리비", pct: 25, color: "#22c55e" },
];

const RECENT_REPAIRS = [
  { name: "LG 냉장고",   model: "M870SN75",      cost: "₩80,000",  date: "2024.06.03", status: "완료"   },
  { name: "삼성 세탁기", model: "WF21A9500KV",   cost: "₩45,000",  date: "2024.05.28", status: "완료"   },
  { name: "LG 에어컨",   model: "FQ17H9DWA1",    cost: "₩0",       date: "2024.05.12", status: "보증"   },
  { name: "삼성 TV",     model: "KQ65QC67AFXKR", cost: "₩120,000", date: "2024.04.30", status: "대기"   },
];

const PAYMENT_HISTORY = [
  { product: "LG 오브제 냉장고",  engineer: "김철수 기사", amount: "₩120,000", status: "대기",  date: "2024.06.18" },
  { product: "삼성 그랑데 세탁기",engineer: "이민준 기사", amount: "₩45,000",  status: "완료",  date: "2024.05.28" },
  { product: "LG 휘센 에어컨",    engineer: "박지훈 기사", amount: "₩0",       status: "환불",  date: "2024.05.12" },
  { product: "삼성 QLED TV",      engineer: "최성호 기사", amount: "₩88,000",  status: "완료",  date: "2024.04.30" },
  { product: "공기청정기",         engineer: "김민준 기사", amount: "₩32,000",  status: "완료",  date: "2024.04.15" },
];

const STATUS_META = {
  "완료": { label: "완료", bg: "#e8f9f0", color: "#22c55e" },
  "대기": { label: "대기", bg: "#fff7e6", color: "#f59e0b" },
  "환불": { label: "환불", bg: "#eff6ff", color: "#3b82f6" },
  "보증": { label: "보증", bg: "#f0edff", color: "#734bcf" },
};

/* ── 막대 그래프 ── */
function BarChart() {
  const max = Math.max(...MONTHLY.map((m) => m.amount));
  const H = 100;
  return (
    <div className="cp-bar-chart">
      {MONTHLY.map((m, i) => {
        const barH = (m.amount / max) * H;
        const isMax = m.amount === max;
        return (
          <div key={i} className="cp-bar-col">
            <span className="cp-bar-label-top">
              {(m.amount / 10000).toFixed(0)}만
            </span>
            <div className="cp-bar-track">
              <div
                className="cp-bar-fill"
                style={{
                  height: `${barH}px`,
                  background: isMax ? "#734bcf" : "#c4b5fd",
                }}
              />
            </div>
            <span className="cp-bar-month">{m.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── 도넛 차트 ── */
function DonutChart() {
  const r = 48, cx = 60, cy = 60, sw = 14;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = COST_BREAKDOWN.map((s) => {
    const dash = (s.pct / 100) * circ;
    const seg = { ...s, dash, offset };
    offset += dash;
    return seg;
  });
  return (
    <div className="cp-donut">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f8" strokeWidth={sw} />
        {segs.map((s) => (
          <circle
            key={s.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={sw}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset + circ * 0.25}
          />
        ))}
        <text x={cx} y={cy - 4}  textAnchor="middle" fontSize="10" fill="#888">비용</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="12" fontWeight="800" fill="#1a1a2e">분석</text>
      </svg>
      <div className="cp-donut__legend">
        {COST_BREAKDOWN.map((s) => (
          <div key={s.label} className="cp-legend-item">
            <span className="cp-legend-dot" style={{ background: s.color }} />
            <span className="cp-legend-label">{s.label}</span>
            <span className="cp-legend-pct">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 메인 ── */
export default function CustomerPayment() {
  return (
    <div className="cp-wrap">

      {/* 헤더 */}

      {/* Hero */}
      {/* <div className="cp-hero">
        <div className="cp-hero__main">
          <p className="cp-hero__sub">총 지출</p>
          <p className="cp-hero__amount">₩1,280,000</p>
          <span className="cp-hero__trend">▲ 이번 달 23% 증가</span>
        </div>
        <div className="cp-hero__divider" />
        <div className="cp-hero__saving">
          <p className="cp-hero__sub">CareFlow 절약 효과</p>
          <p className="cp-hero__save-amount">₩320,000</p>
          <span className="cp-hero__save-label">보증 수리 + 할인 혜택 합산</span>
        </div>
      </div> */}

      {/* KPI */}
      <div className="cp-kpi-grid">
        {KPI.map(({ label, value, sub, Icon, highlight }) => (
          <div key={label} className={`cp-kpi${highlight ? " cp-kpi--alert" : ""}`}>
            <div className="cp-kpi__text">
              <p className="cp-kpi__value">{value}</p>
              <p className="cp-kpi__label">{label}</p>
              <p className="cp-kpi__sub">{sub}</p>
            </div>
            <Icon className="cp-kpi__watermark" strokeWidth={1} />
          </div>
        ))}
      </div>

      {/* 결제 필요 Action Card */}
      <div className="cp-action-card">
        <div className="cp-action-card__left">
          <div className="cp-action-card__alert">
            <span>⚠</span> 결제가 필요한 수리가 있습니다
          </div>
          <p className="cp-action-card__product">LG 오브제 냉장고</p>
          <div className="cp-action-card__meta">
            <div><span>수리 완료</span><strong>2026.06.18</strong></div>
            <div><span>담당 기사</span><strong>김철수 기사</strong></div>
            <div><span>총 금액</span><strong className="cp-action-card__price">120,000원</strong></div>
          </div>
        </div>
        <div className="cp-action-card__btns">
          <button className="cp-btn cp-btn--outline"><FileText size={14} /> 수리 보고서 보기</button>
          <button className="cp-btn cp-btn--primary"><CreditCard size={14} /> 결제하기</button>
        </div>
      </div>

      {/* 월별 지출 + 비용 분석 */}
      <div className="cp-charts-row">
        <div className="cp-card cp-chart-card">
          <div className="cp-card__header">
            <h2>월별 지출</h2>
            <span className="cp-card__sub">최근 6개월</span>
          </div>
          <BarChart />
        </div>
        <div className="cp-card cp-donut-card">
          <div className="cp-card__header">
            <h2>비용 분석</h2>
            <span className="cp-card__sub">항목별 비율</span>
          </div>
          <DonutChart />
        </div>
      </div>

      {/* 이번 달 요약 */}
      <div className="cp-card">
        <div className="cp-card__header"><h2>이번 달 요약</h2></div>
        <div className="cp-summary-list">
          {[
            { label: "수리 건수",            value: "12 건" },
            { label: "평균 비용",             value: "₩106,000" },
            { label: "가장 많이 수리한 제품", value: "냉장고" },
          ].map((s, i) => (
            <div key={i} className="cp-summary-row">
              <span className="cp-summary-row__label">{s.label}</span>
              <span className="cp-summary-row__value">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 수리 가전 */}
      <div className="cp-card">
        <div className="cp-card__header">
          <h2>최근 수리 가전</h2>
          <button className="cp-link-btn">전체 보기 <ChevronRight size={13} /></button>
        </div>
        <div className="cp-repair-grid">
          {RECENT_REPAIRS.map((r, i) => (
            <div key={i} className="cp-repair-card">
              <div className="cp-repair-card__img" />
              <div className="cp-repair-card__info">
                <div className="cp-repair-card__top">
                  <p className="cp-repair-card__name">{r.name}</p>
                  <span className={`cp-badge cp-badge--${r.status === "완료" ? "green" : r.status === "보증" ? "purple" : "orange"}`}>
                    {r.status}
                  </span>
                </div>
                <p className="cp-repair-card__model">{r.model}</p>
                <p className="cp-repair-card__date">{r.date}</p>
                <p className="cp-repair-card__cost">{r.cost}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 결제 내역 테이블 */}
      <div className="cp-card">
        <div className="cp-card__header">
          <h2>결제 내역</h2>
          <button className="cp-link-btn">전체 보기 <ChevronRight size={13} /></button>
        </div>
        <div className="cp-table">
          <div className="cp-table__head">
            <span>제품</span>
            <span>기사</span>
            <span>금액</span>
            <span>날짜</span>
            <span>상태</span>
            <span>영수증</span>
          </div>
          {PAYMENT_HISTORY.map((p, i) => {
            const st = STATUS_META[p.status];
            return (
              <div key={i} className="cp-table__row">
                <span className="cp-table__product">{p.product}</span>
                <span className="cp-table__engineer">
                  <User size={12} /> {p.engineer}
                </span>
                <span className="cp-table__amount">{p.amount}</span>
                <span className="cp-table__date">{p.date}</span>
                <span>
                  <span className="cp-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                </span>
                <span>
                  <button className="cp-receipt-btn"><FileText size={13} /></button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
