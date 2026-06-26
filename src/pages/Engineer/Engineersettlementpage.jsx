import { useState } from "react";
import {
  ChevronDown, ChevronLeft, ChevronRight, Download,
  ClipboardCheck, Wallet, Star, XCircle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import "../../styles/Engineer/Engineersettlementpage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/settlements/summary?dateFrom=&dateTo=
//
// DB 필드:
//   settlements.gross_amount        → 총 매출액
//   settlements.platform_fee        → 플랫폼 수수료 (fee_rate 스냅샷)
//   settlements.agency_fee          → 대행사 수수료 (agency_fee_rate 스냅샷)
//   settlements.engineer_net_amount → 실 정산 예정 금액
//   settlements.status ENUM('PENDING','APPROVED','PAID','DISPUTED')
//   as_assignments COUNT(status='COMPLETED')   → 총 완료 건수
//   as_assignments COUNT(status='REJECTED')    → 취소/거절 건수 (E-17)
//   reviews.rating AVG → 평균 평점 (engineer_profiles.avg_rating 역정규화)
//   engineer_profiles.total_reviews → 총 리뷰 수
//
// ⚠ 고객 만족도(%) → reviews 집계 (별도 컬럼 없음, 별점 4~5점 비율 계산)
// ⚠ 부가세, 기타 공제 → DB에 없으므로 제거
// ──────────────────────────────────────────

const TABS = ["실적 현황", "정산 내역"];

// 기간별 완료 건수 (일별) - as_assignments + as_requests.scheduled_date 집계
const dailyTrend = [
  { date: "06.01", count: 8  },
  { date: "06.08", count: 14 },
  { date: "06.15", count: 24 },
  { date: "06.22", count: 20 },
  { date: "06.29", count: 28 },
];

// 브랜드별 완료 건수 - engineer_expert_brands + as_requests JOIN 집계
const brandDist = [
  { name: "LG",     value: 12, pct: "42.9%", color: "#5B4FF5" },
  { name: "삼성",   value: 9,  pct: "32.1%", color: "#818cf8" },
  { name: "위니아", value: 4,  pct: "14.3%", color: "#16a34a" },
  { name: "기타",   value: 3,  pct: "10.7%", color: "#ddd"    },
];

// 상태별 완료 건수 - work_reports.diagnosis_result ENUM 기준
// NORMAL/REPAIRED → 정상 완료 / UNREPAIRABLE → 제방문 / PART_REPLACED → 부분 해결
const statusDist = [
  { name: "정상 완료", value: 26, pct: "92.9%", color: "#16a34a" },
  { name: "제방문",   value: 1,  pct: "3.6%",  color: "#f59e0b" },
  { name: "부분 해결", value: 1,  pct: "3.6%",  color: "#60a5fa" },
];

// 실적 상세 목록 - as_assignments + as_requests + appliances + users + reviews JOIN
const performanceList = [
  { requestId: "AS-2024-0601-0001", workDate: "06.02 (일) 14:00", customerName: "홍길동",  productName: "LG 디오스 냉장고",    brand: "LG",   grossAmount: 180000, diagnosisResult: "REPAIRED",      rating: 5.0 },
  { requestId: "AS-2024-0603-0003", workDate: "06.03 (월) 10:30", customerName: "이영희",  productName: "삼성 그랑데 세탁기",   brand: "삼성", grossAmount: 120000, diagnosisResult: "REPAIRED",      rating: 4.0 },
  { requestId: "AS-2024-0618-0002", workDate: "06.18 (화) 09:00", customerName: "박준호",  productName: "LG 휘센 에어컨",      brand: "LG",   grossAmount: 150000, diagnosisResult: "UNREPAIRABLE",  rating: 5.0 },
  { requestId: "AS-2024-0605-0005", workDate: "06.05 (수) 11:00", customerName: "김수현",  productName: "삼성 비스포크 냉장고", brand: "삼성", grossAmount: 200000, diagnosisResult: "PART_REPLACED", rating: 5.0 },
  { requestId: "AS-2024-0607-0008", workDate: "06.07 (금) 16:00", customerName: "최서연",  productName: "위니아 김치냉장고",    brand: "위니아",grossAmount: 90000, diagnosisResult: "PART_REPLACED", rating: 3.0 },
];

// 정산 요약 - settlements 테이블 기준
const settlementSummary = {
  grossAmount:       2480000,  // settlements.gross_amount 합산
  platformFee:       248000,   // settlements.platform_fee 합산 (fee_rate=10%)
  agencyFee:         232000,   // settlements.agency_fee 합산
  engineerNetAmount: 2000000,  // settlements.engineer_net_amount 합산
  // ⚠ 부가세, 기타 공제 → DB 없으므로 제거
  paidAt: "2024.07.05 (금)",  // settlements.paid_at 예정
};

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
  const totalPages = 5;

  return (
    <div className="estp">
      {/* 헤더 */}
      <div className="estp-header">
        <h1 className="estp-header__title">실적 / 정산</h1>
        <p className="estp-header__sub">내 실적 현황과 정산 내역을 확인할 수 있습니다.</p>
      </div>

      {/* 탭 */}
      <div className="estp-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`estp-tab ${activeTab === tab ? "estp-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="estp-filters">
        <div className="estp-filter-date"><span>2024.06.01 ~ 2024.06.30</span></div>
        <div className="estp-filter-select"><span>전체 브랜드</span><ChevronDown size={13} /></div>
        <div className="estp-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
        <button className="estp-report-btn"><Download size={13} /> 리포트 다운로드</button>
      </div>

      {activeTab === "실적 현황" && (
        <>
          {/* 통계 카드 5개 */}
          <div className="estp-stats">
            {/* as_assignments COUNT(COMPLETED) */}
            <div className="estp-stat-card">
              <div className="estp-stat-card__icon estp-stat-card__icon--purple"><ClipboardCheck size={20} /></div>
              <div>
                <p className="estp-stat-card__label">총 완료 건수</p>
                <p className="estp-stat-card__value">28<span>건</span></p>
                <p className="estp-stat-card__sub estp-stat-card__sub--up">전월 대비 ▲ 12%</p>
              </div>
            </div>
            {/* settlements.gross_amount 합산 */}
            <div className="estp-stat-card">
              <div className="estp-stat-card__icon estp-stat-card__icon--green"><Wallet size={20} /></div>
              <div>
                <p className="estp-stat-card__label">총 매출액</p>
                <p className="estp-stat-card__value estp-stat-card__value--sm">2,480,000<span>원</span></p>
                <p className="estp-stat-card__sub estp-stat-card__sub--up">전월 대비 ▲ 8%</p>
              </div>
            </div>
            {/* engineer_profiles.avg_rating */}
            <div className="estp-stat-card">
              <div className="estp-stat-card__icon estp-stat-card__icon--amber"><Star size={20} /></div>
              <div>
                <p className="estp-stat-card__label">평균 평점</p>
                <p className="estp-stat-card__value">4.8<span>/ 5.0</span></p>
                <p className="estp-stat-card__sub estp-stat-card__sub--up">전월 대비 ▲ 0.2</p>
              </div>
            </div>
            {/* reviews 집계 - 4~5점 비율 */}
            <div className="estp-stat-card">
              <div className="estp-stat-card__icon estp-stat-card__icon--blue"><Star size={20} /></div>
              <div>
                <p className="estp-stat-card__label">고객 만족도</p>
                <p className="estp-stat-card__value">96<span>%</span></p>
                <p className="estp-stat-card__sub estp-stat-card__sub--up">전월 대비 ▲ 5%</p>
              </div>
            </div>
            {/* as_assignments COUNT(REJECTED) */}
            <div className="estp-stat-card">
              <div className="estp-stat-card__icon estp-stat-card__icon--red"><XCircle size={20} /></div>
              <div>
                <p className="estp-stat-card__label">취소/거절 건수</p>
                <p className="estp-stat-card__value">1<span>건</span></p>
                <p className="estp-stat-card__sub estp-stat-card__sub--down">전월 대비 ▼ 50%</p>
              </div>
            </div>
          </div>

          {/* 차트 3개 */}
          <div className="estp-charts">
            {/* 기간별 완료 건수 */}
            <div className="estp-chart-card estp-chart-card--wide">
              <div className="estp-chart-card__header">
                <h3 className="estp-chart-title">기간별 완료 건수</h3>
                <div className="estp-filter-select estp-filter-select--sm"><span>일별</span><ChevronDown size={12} /></div>
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

            {/* 브랜드별 완료 건수 */}
            <div className="estp-chart-card">
              <div className="estp-chart-card__header">
                <h3 className="estp-chart-title">브랜드별 완료 건수</h3>
                <div className="estp-filter-select estp-filter-select--sm"><span>전체</span><ChevronDown size={12} /></div>
              </div>
              <div className="estp-donut-wrap">
                <ResponsiveContainer width="55%" height={160}>
                  <PieChart>
                    <Pie data={brandDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      dataKey="value" startAngle={90} endAngle={-270}>
                      {brandDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => `${v}건`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="estp-donut-legend">
                  {brandDist.map(b => (
                    <div key={b.name} className="estp-donut-legend__item">
                      <span className="estp-donut-legend__dot" style={{ background: b.color }} />
                      <span>{b.name}</span>
                      <span className="estp-donut-legend__pct">{b.value}건 ({b.pct})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 상태별 완료 건수 - work_reports.diagnosis_result 기준 */}
            <div className="estp-chart-card">
              <div className="estp-chart-card__header">
                <h3 className="estp-chart-title">상태별 완료 건수</h3>
                <div className="estp-filter-select estp-filter-select--sm"><span>전체</span><ChevronDown size={12} /></div>
              </div>
              <div className="estp-donut-wrap">
                <ResponsiveContainer width="55%" height={160}>
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      dataKey="value" startAngle={90} endAngle={-270}>
                      {statusDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => `${v}건`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="estp-donut-legend">
                  {statusDist.map(s => (
                    <div key={s.name} className="estp-donut-legend__item">
                      <span className="estp-donut-legend__dot" style={{ background: s.color }} />
                      <span>{s.name}</span>
                      <span className="estp-donut-legend__pct">{s.value}건 ({s.pct})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 하단 2단 */}
          <div className="estp-bottom">
            {/* 실적 상세 목록 */}
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
                  const diag = DIAGNOSIS_MAP[item.diagnosisResult];
                  return (
                    <div key={i} className="estp-list-table__row">
                      <span className="estp-list-table__id">{item.requestId}</span>
                      <span className="estp-list-table__date">{item.workDate}</span>
                      <span>{item.customerName}</span>
                      <span className="estp-list-table__product">{item.productName}</span>
                      <span>{item.brand}</span>
                      <span className="estp-list-table__amount">{item.grossAmount.toLocaleString()}원</span>
                      <span>
                        <span className={`estp-diag-badge estp-diag-badge--${diag.type}`}>{diag.label}</span>
                      </span>
                      <span className="estp-list-table__rating">★ {item.rating.toFixed(1)}</span>
                      <span><ChevronRight size={14} color="#aaa" /></span>
                    </div>
                  );
                })}
              </div>
              {/* 페이지네이션 */}
              <div className="estp-pagination">
                <button disabled><ChevronLeft size={14} /></button>
                <button disabled><ChevronLeft size={13} /></button>
                {[1,2,3,4,5].map(p => (
                  <button key={p} className={currentPage === p ? "estp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}><ChevronRight size={13} /></button>
                <button onClick={() => setCurrentPage(totalPages)}><ChevronRight size={14} /></button>
              </div>
            </div>

            {/* 정산 요약 - settlements 테이블 기준 */}
            <div className="estp-settlement-summary">
              <div className="estp-settlement-summary__header">
                <h3 className="estp-settlement-summary__title">정산 요약 (2024년 6월)</h3>
                <button className="estp-settlement-summary__link">상세 내역 보기 ›</button>
              </div>
              {/* settlements.gross_amount */}
              <div className="estp-settle-row">
                <span>총 매출액</span>
                <span>{settlementSummary.grossAmount.toLocaleString()}원</span>
              </div>
              {/* settlements.platform_fee (fee_rate=10%) */}
              <div className="estp-settle-row estp-settle-row--deduct">
                <span>플랫폼 수수료 (10%)</span>
                <span>-{settlementSummary.platformFee.toLocaleString()}원</span>
              </div>
              {/* settlements.agency_fee */}
              <div className="estp-settle-row estp-settle-row--deduct">
                <span>대행사 수수료</span>
                <span>-{settlementSummary.agencyFee.toLocaleString()}원</span>
              </div>
              <div className="estp-settle-divider" />
              {/* settlements.engineer_net_amount */}
              <div className="estp-settle-row estp-settle-row--total">
                <span>실 정산 예정 금액</span>
                <span>{settlementSummary.engineerNetAmount.toLocaleString()}원</span>
              </div>
              <div className="estp-settle-notice">
                <span>🏦</span>
                <div>
                  <p>정산 예정일 : {settlementSummary.paidAt}</p>
                  <p>등록된 계좌로 입금될 예정입니다.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "정산 내역" && (
        <div className="estp-coming-soon">
          정산 내역 탭 — API 연동 후 구현 예정<br />
          <span>GET /api/engineer/settlements?page=0&size=10</span>
        </div>
      )}
    </div>
  );
}