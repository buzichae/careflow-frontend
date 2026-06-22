import { useState } from "react";
import {
  Bell, MessageSquare, ChevronDown, ChevronLeft,
  ChevronRight, ArrowLeft, Info,
} from "lucide-react";
import "../../styles/CustomerRepairHistory.css";

/* ── 가전 목록 ── */
const APPLIANCES = [
  { id: 1, name: "냉장고",     brand: "LG 오브제 냉장고",     model: "M875GB8231",     score: 95, status: "정상",    certified: true,  repairCount: 5 },
  { id: 2, name: "세탁기",     brand: "삼성 그랑데 세탁기",   model: "WF21A9500KV",    score: 72, status: "주의",    certified: false, repairCount: 2 },
  { id: 3, name: "에어컨",     brand: "LG 휘센 에어컨",       model: "FQ17H9DWA1",     score: 88, status: "정상",    certified: true,  repairCount: 1 },
  { id: 4, name: "TV",         brand: "삼성 QLED TV",          model: "KQ65QC67AFXKR",  score: 90, status: "정상",    certified: true,  repairCount: 0 },
  { id: 5, name: "공기청정기", brand: "삼성 블루스카이",       model: "AX60R5580WBD",   score: 85, status: "정상",    certified: true,  repairCount: 1 },
  { id: 6, name: "로봇청소기", brand: "LG 코드제로 R9",       model: "R958GA",          score: 45, status: "점검 필요", certified: false, repairCount: 3 },
  { id: 7, name: "건조기",     brand: "삼성 그랑데 건조기",   model: "DV17T9720SV",    score: 78, status: "정상",    certified: true,  repairCount: 1 },
  { id: 8, name: "가습기",     brand: "사오미 스마트 가습기",  model: "MJJSQ05DY",      score: 92, status: "정상",    certified: true,  repairCount: 0 },
];

/* ── 상세 데이터 ── */
const DETAIL = {
  serial: "23KG89A00123", purchased: "2023.05.12",
  warranty: "~ 2026.05.11 (무상)", period: "1년 1개월", registered: "2023.05.15",
  scoreItems: [
    { label: "사용 패턴", score: 22, max: 25, color: "#22c55e" },
    { label: "부품 상태", score: 25, max: 25, color: "#22c55e" },
    { label: "고장 이력", score: 18, max: 25, color: "#f59e0b" },
    { label: "점검 결과", score: 20, max: 25, color: "#22c55e" },
    { label: "사용 환경", score: 10, max: 15, color: "#f59e0b" },
  ],
  summary: { total: 5, free: 3, paid: 2, totalCost: "315,000원", firstDate: "2024.06.17", nextDate: "2024.09.15" },
  parts: [
    { name: "컴프레서",  count: 0 },
    { name: "온도센서",  count: 1 },
    { name: "팬 모터",   count: 1 },
    { name: "도어 패킹", count: 1 },
    { name: "재생 히터", count: 0 },
  ],
  recommendations: [
    { title: "냉장고 내부 청소 권장", desc: "최근 점검일 합계가 청소 이력이 없어 권장됩니다." },
    { title: "도어 패킹 점검 권장",   desc: "도어 패킹을 교체한지 9개월이 지났습니다." },
  ],
  repairs: [
    { id: "AS-240617-0001", date: "2024.06.17 10:15", symptom: "냉장실 냉동이 약함", symptomTag: "냉방/냉동", diagnosis: "냉각 팬 모터 불량\n냉기 순환 문제 확인", treatment: "냉각 팬 모터 교체\n냉매 압력 점검", type: "유상", engineer: "정우성 기사", rating: 4.8, cost: "120,000원" },
    { id: "AS-240413-0002", date: "2024.04.13 14:20", symptom: "냉장실 물 고임",     symptomTag: "냉방/냉동", diagnosis: "배수구 막힘\n배수 호스 오염",           treatment: "배수구 청소\n배수 호스 교체",          type: "무상", engineer: "이재훈 기사", rating: 4.9, cost: "0원"       },
    { id: "AS-240201-0003", date: "2024.02.01 09:30", symptom: "소음 발생",           symptomTag: "기타",      diagnosis: "컴프레서 진동\n발생 확인",              treatment: "컴프레서 고정 보강\n진동 패드 부착",   type: "무상", engineer: "박현우 기사", rating: 4.7, cost: "0원"       },
    { id: "AS-231015-0004", date: "2023.10.15 11:45", symptom: "냉장실 온도 높음",   symptomTag: "냉방/냉동", diagnosis: "온도센서 불량\n센서 값 오류",            treatment: "온도센서 교체\n온도 보정",             type: "유상", engineer: "최지훈 기사", rating: 4.9, cost: "85,000원"  },
    { id: "AS-230602-0005", date: "2023.06.02 16:10", symptom: "문 닫힘 불량",       symptomTag: "기타",      diagnosis: "도어 패킹 손상\n밀폐력 저하",           treatment: "도어 패킹 교체\n도어 정렬 조정",       type: "무상", engineer: "김민수 기사", rating: 4.8, cost: "110,000원" },
  ],
};

const STATUS_COLOR = { "정상": "green", "주의": "orange", "점검 필요": "red" };
const SCORE_COLOR  = { "정상": "#734bcf", "주의": "#f59e0b", "점검 필요": "#ef4444" };

/* ── 원형 건강 점수 SVG ── */
function HealthCircle({ score }) {
  const r = 54, cx = 70, cy = 70, sw = 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f8" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#22c55e" strokeWidth={sw}
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <text x={cx} y={cy + 6}  textAnchor="middle" fontSize="28" fontWeight="900" fill="#1a1a2e">{score}</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize="11" fill="#888">100점</text>
    </svg>
  );
}

/* ── 루트 컴포넌트 ── */
export default function CustomerRepairHistory() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="crh-wrap">
      <header className="crh-header">
        <div className="crh-header__left">
          {selected && (
            <button className="crh-back-btn" onClick={() => setSelected(null)}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1>{selected ? "상세 정보 및 수리 이력" : "가전별 수리 이력"}</h1>
            {!selected && <p>가전을 선택하면 상세 수리 이력을 확인할 수 있습니다.</p>}
          </div>
        </div>
        <div className="crh-header__right">
          <button className="crh-icon-btn"><Bell size={20} /></button>
          <button className="crh-icon-btn"><MessageSquare size={20} /></button>
          <div className="crh-profile">
            <div className="crh-avatar">혜</div>
            <span>혜민님</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </header>

      {selected
        ? <DetailView appliance={selected} detail={DETAIL} />
        : <SelectView appliances={APPLIANCES} onSelect={setSelected} />
      }
    </div>
  );
}

/* ── 가전 선택 화면 ── */
function SelectView({ appliances, onSelect }) {
  return (
    <>
      <div className="crh-select-grid">
        {appliances.map((a) => (
          <button key={a.id} className="crh-select-card" onClick={() => onSelect(a)}>
            <div className="crh-select-card__top">
              <div className="crh-select-card__img" />
              <div className="crh-select-card__badges">
                {a.certified && <span className="crh-cert-badge">careflow<br />인증</span>}
                <span className={`crh-status-badge crh-status-badge--${STATUS_COLOR[a.status]}`}>{a.status}</span>
              </div>
            </div>
            <p className="crh-select-card__name">{a.name}</p>
            <p className="crh-select-card__brand">{a.brand}</p>
            <p className="crh-select-card__model">{a.model}</p>
            <div className="crh-score-row">
              <span>{a.score}점</span>
              <div className="crh-score-bar">
                <div className="crh-score-bar__fill" style={{ width: `${a.score}%`, background: SCORE_COLOR[a.status] }} />
              </div>
            </div>
            <div className="crh-select-card__footer">
              <span className="crh-repair-count">수리 이력 {a.repairCount}건</span>
              <span className="crh-arrow">이력 보기 <ChevronRight size={13} /></span>
            </div>
          </button>
        ))}
      </div>
      <div className="crh-hint">
        <Info size={15} />
        가전을 선택하면 모든 수리, 점검, 부품 교체 이력을 확인할 수 있습니다.
      </div>
    </>
  );
}

/* ── 상세 화면 ── */
function DetailView({ appliance, detail }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(detail.repairs.length / 5);

  return (
    <div className="crh-detail-body">

      {/* ══ 좌측 메인 ══ */}
      <div className="crh-detail-main">

        {/* 가전 정보 + 건강 점수 가로 배치 */}
        <div className="crh-top-panels">

          {/* 가전 기본 정보 */}
          <div className="crh-panel crh-panel--info">
            <div className="crh-appliance-header">
              <div className="crh-appliance-img" />
              <div>
                <p className="crh-appliance-name">{appliance.brand}</p>
                <p className="crh-appliance-model">{appliance.model}</p>
                {appliance.certified && <span className="crh-cert-pill">careflow 인증</span>}
              </div>
            </div>
            <div className="crh-info-rows">
              {[
                { label: "시리얼 번호", value: detail.serial },
                { label: "구매일",      value: detail.purchased },
                { label: "보증 기간",   value: detail.warranty, highlight: true },
                { label: "사용 기간",   value: detail.period },
                { label: "등록일",      value: detail.registered },
              ].map((r) => (
                <div key={r.label} className="crh-info-row">
                  <span className="crh-info-label">{r.label}</span>
                  <span className={`crh-info-value ${r.highlight ? "crh-info-value--highlight" : ""}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <button className="crh-edit-btn">가전 정보 수정</button>
          </div>

          {/* 종합 건강 점수 */}
          <div className="crh-panel crh-panel--health">
            <div className="crh-panel__title">
              종합 건강 점수
              <span className="crh-health-status">😊 정상</span>
            </div>
            <div className="crh-health-body">
              <HealthCircle score={appliance.score} />
              <div className="crh-health-right">
                <p className="crh-score-summary-label">점수 요약</p>
                <p className="crh-score-summary-desc">가전의 사용 환경, 고장 이력, 점검 결과 등을 종합하여 산출된 종합 점수입니다.</p>
                <div className="crh-score-items">
                  {detail.scoreItems.map((s) => (
                    <div key={s.label} className="crh-score-item">
                      <span className="crh-score-item__label">{s.label}</span>
                      <div className="crh-score-item__bar">
                        <div className="crh-score-item__fill" style={{ width: `${(s.score / s.max) * 100}%`, background: s.color }} />
                      </div>
                      <span className="crh-score-item__num">{s.score} / {s.max}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button className="crh-score-detail-btn">점수 상세 분석 보기</button>
          </div>
        </div>

        {/* 수리 이력 탭 */}
        <div className="crh-tab-bar">
          <span className="crh-tab crh-tab--active">수리 이력</span>
        </div>

        {/* 수리 이력 테이블 */}
        <div className="crh-table-wrap">
          <div className="crh-table__head">
            <span>접수 번호</span>
            <span>접수/수리일</span>
            <span>증상</span>
            <span>진단 내용</span>
            <span>처리 내용</span>
            <span>수리 구분</span>
            <span>수리 기사</span>
            <span>수리 비용</span>
            <span>상태</span>
          </div>
          {detail.repairs.map((r) => (
            <div key={r.id} className="crh-table__row">
              <span className="crh-cell-id">{r.id}</span>
              <span className="crh-cell-date">
                {r.date.split(" ")[0]}<br />
                <span className="crh-cell-time">{r.date.split(" ")[1]}</span>
                <span className={`crh-symptom-tag crh-symptom-tag--${r.symptomTag === "기타" ? "gray" : "purple"}`}>{r.symptomTag}</span>
              </span>
              <span className="crh-cell-symptom">{r.symptom}</span>
              <span className="crh-cell-text">{r.diagnosis}</span>
              <span className="crh-cell-text">{r.treatment}</span>
              <span>
                <span className={`crh-type-badge crh-type-badge--${r.type === "무상" ? "blue" : "orange"}`}>{r.type}</span>
              </span>
              <span className="crh-cell-engineer">
                {r.engineer}<br />
                <span className="crh-cell-rating">★ {r.rating}</span>
              </span>
              <span className="crh-cell-cost">{r.cost}</span>
              <span><button className="crh-detail-btn">상세 보기</button></span>
            </div>
          ))}
          <div className="crh-pagination">
            <button className="crh-page-btn" onClick={() => setPage(Math.max(1, page - 1))}><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1}
                className={`crh-page-btn ${page === i + 1 ? "crh-page-btn--active" : ""}`}
                onClick={() => setPage(i + 1)}
              >{i + 1}</button>
            ))}
            <button className="crh-page-btn" onClick={() => setPage(Math.min(totalPages, page + 1))}><ChevronRight size={14} /></button>
          </div>
        </div>

        <div className="crh-hint">
          <Info size={15} />
          가전을 선택하면 모든 수리, 점검, 부품 교체 이력을 확인할 수 있습니다.
        </div>
      </div>

      {/* ══ 우측 사이드바 ══ */}
      <aside className="crh-detail-sidebar">

        {/* 요약 정보 */}
        <div className="crh-panel">
          <p className="crh-panel__title">요약 정보</p>
          <div className="crh-summary-rows">
            {[
              { label: "총 수리 건수",       value: `${detail.summary.total}건` },
              { label: "무상 수리",           value: `${detail.summary.free}건` },
              { label: "유상 수리",           value: `${detail.summary.paid}건` },
              { label: "총 수리 비용",        value: detail.summary.totalCost, bold: true },
              { label: "최초 수리일",         value: detail.summary.firstDate },
              { label: "다음 점검/관리 예정", value: detail.summary.nextDate },
            ].map((r) => (
              <div key={r.label} className="crh-summary-row">
                <span className="crh-summary-label">{r.label}</span>
                <span className={`crh-summary-value ${r.bold ? "crh-summary-value--bold" : ""}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <button className="crh-edit-btn" style={{ marginTop: 10 }}>고객 상세 정보 보기</button>
        </div>

        {/* 주요 부품 교체 이력 */}
        <div className="crh-panel">
          <p className="crh-panel__title">주요 부품 교체 이력</p>
          <div className="crh-parts-list">
            {detail.parts.map((p) => (
              <div key={p.name} className="crh-part-row">
                <span className="crh-part-name">{p.name}</span>
                <span className={`crh-part-count ${p.count > 0 ? "crh-part-count--active" : ""}`}>{p.count}회</span>
              </div>
            ))}
          </div>
          <button className="crh-link-btn" style={{ marginTop: 10 }}>전체 부품 교체 이력 보기</button>
        </div>

        {/* 추천 관리 정보 */}
        <div className="crh-panel">
          <p className="crh-panel__title">추천 관리 정보</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {detail.recommendations.map((r, i) => (
              <div key={i} className="crh-rec-item">
                <span className="crh-rec-dot">ℹ</span>
                <div style={{ flex: 1 }}>
                  <div className="crh-rec-title-row">
                    <p className="crh-rec-title">{r.title}</p>
                    <button className="crh-rec-link">관리 방법 보기</button>
                  </div>
                  <p className="crh-rec-desc">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </aside>
    </div>
  );
}
