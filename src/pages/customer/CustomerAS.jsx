import { useState } from "react";
import { Bell, MessageSquare, ChevronDown, CreditCard, CalendarCheck, Star, ChevronRight, Clock, ArrowLeft, Check, Bot, Wrench, Plus } from "lucide-react";
import "../../styles/CustomerAS.css";

/* ─────────────────────────────────
   A/S 예약 플로우 컴포넌트
───────────────────────────────── */
const MY_APPLIANCES = [
  { id: 1, name: "LG 오브제 냉장고",   model: "M875GBB231",    purchased: "2025.01.20", warranty: "2028.01.20", icon: "❄️" },
  { id: 2, name: "삼성 그랑대 세탁기", model: "WF24T6500KV",   purchased: "2024.03.15", warranty: "2027.03.15", icon: "🫧" },
  { id: 3, name: "LG 휘센 에어컨",     model: "FQ18VCWWA2",    purchased: "2023.06.10", warranty: "2026.06.10", icon: "💨" },
  { id: 4, name: "LG 올레드 TV",       model: "OLED55C4KNA",   purchased: "2024.11.05", warranty: "2027.11.05", icon: "📺" },
];

const RECENT_HISTORY = [
  { appliance: "냉장고 냉각 불량",  date: "2026.06.12", type: "AI 상담",  color: "blue"   },
  { appliance: "에어컨 냄새",       date: "2026.05.28", type: "AI 상담",  color: "blue"   },
  { appliance: "세탁기 진동",       date: "2026.05.10", type: "A/S 완료", color: "green"  },
  { appliance: "TV 화면 이상",      date: "2026.04.30", type: "A/S 완료", color: "green"  },
];

const QUICK_PROBLEMS = [
  { icon: "❄️", label: "냉장고가 안 시원해요" },
  { icon: "🫧", label: "세탁기에서 소음이 나요" },
  { icon: "💨", label: "에어컨이 작동하지 않아요" },
  { icon: "📺", label: "TV 화면이 안 나와요" },
  { icon: "•••", label: "기타 문제 문의하기" },
];

function ASReserveFlow({ onClose }) {
  const [selectedAppliance, setSelectedAppliance] = useState(MY_APPLIANCES[0]);

  return (
    <div className="cas-flow-wrap">
      {/* 스텝 바 */}
      <div className="cas-stepper">
        {[
          { n: 1, label: "제품 선택" },
          { n: 2, label: "AI 진단 또는 A/S 신청" },
          { n: 3, label: "예약 완료" },
        ].map((s, i) => (
          <div key={s.n} className="cas-stepper__item">
            <div className={`cas-stepper__circle ${s.n === 1 ? "cas-stepper__circle--active" : ""}`}>
              {s.n}
            </div>
            <span className={`cas-stepper__label ${s.n === 1 ? "cas-stepper__label--active" : ""}`}>
              {s.label}
            </span>
            {i < 2 && <div className="cas-stepper__line">──────────→</div>}
          </div>
        ))}
      </div>

      {/* 바디 2열 */}
      <div className="cas-flow-body">

        {/* ══ 좌측 메인 ══ */}
        <div className="cas-flow-main">

          {/* 제품 선택 */}
          <div className="cas-flow-card">
            <h3 className="cas-flow-card__title">문제가 발생한 제품을 선택해주세요</h3>
            <div className="cas-product-grid">
              {MY_APPLIANCES.map((a) => (
                <button
                  key={a.id}
                  className={`cas-product-card ${selectedAppliance?.id === a.id ? "cas-product-card--selected" : ""}`}
                  onClick={() => setSelectedAppliance(a)}
                >
                  {selectedAppliance?.id === a.id && (
                    <span className="cas-product-card__check"><Check size={12} /></span>
                  )}
                  <div className="cas-product-card__img">{a.icon}</div>
                  <p className="cas-product-card__name">{a.name}</p>
                  <p className="cas-product-card__model">{a.model}</p>
                </button>
              ))}
              <button className="cas-product-card cas-product-card--add">
                <div className="cas-product-card__img"><Plus size={22} strokeWidth={1.5} /></div>
                <p className="cas-product-card__name">다른 제품<br />선택하기</p>
              </button>
            </div>
          </div>

          {/* AI 진단 배너 */}
          <div className="cas-ai-banner">
            <div className="cas-ai-banner__left">
              <div className="cas-ai-banner__bot">🤖</div>
              <div>
                <p className="cas-ai-banner__title">AI 진단으로 약 60%의 간단한 고장은 출장 없이 해결할 수 있어요!</p>
                <p className="cas-ai-banner__sub">빠르고 정확한 AI 진단을 먼저 경험해보세요.</p>
              </div>
            </div>
            <div className="cas-ai-banner__stats">
              <div className="cas-ai-banner__stat">
                <span className="cas-ai-banner__stat-icon">⏱</span>
                <p className="cas-ai-banner__stat-val">평균 3분 진단</p>
                <p className="cas-ai-banner__stat-sub">빠른 문제 파악</p>
              </div>
              <div className="cas-ai-banner__stat">
                <span className="cas-ai-banner__stat-icon">✅</span>
                <p className="cas-ai-banner__stat-val">해결률 62%</p>
                <p className="cas-ai-banner__stat-sub">출장 없이 해결</p>
              </div>
              <div className="cas-ai-banner__stat">
                <span className="cas-ai-banner__stat-icon">💬</span>
                <p className="cas-ai-banner__stat-val">24시간 상담</p>
                <p className="cas-ai-banner__stat-sub">언제든 AI 상담</p>
              </div>
            </div>
          </div>

          {/* 선택 카드: AI 자가진단 vs A/S 신청 */}
          <div className="cas-choice-row">
            <div className="cas-choice-card">
              <div className="cas-choice-card__icon cas-choice-card__icon--ai">🤖</div>
              <div className="cas-choice-card__body">
                <p className="cas-choice-card__title">AI 자가 진단</p>
                <p className="cas-choice-card__desc">증상을 입력하면 AI가 빠르게 원인과 방법을 안내해드립니다.</p>
                <div className="cas-choice-card__tags">
                  <span>평균 3분 소요</span>
                  <span>해결률 62%</span>
                </div>
              </div>
              <button className="cas-choice-btn cas-choice-btn--primary">AI 상담 시작 →</button>
            </div>
            <div className="cas-choice-card">
              <div className="cas-choice-card__icon cas-choice-card__icon--as">👷</div>
              <div className="cas-choice-card__body">
                <p className="cas-choice-card__title">A/S 신청</p>
                <p className="cas-choice-card__desc">기사 방문을 바로 예약하고 싶으신가요? 빠르게 접수해 드립니다.</p>
                <div className="cas-choice-card__tags">
                  <span>기사 방문</span>
                  <span>예약 접수</span>
                </div>
              </div>
              <button className="cas-choice-btn cas-choice-btn--outline">A/S 접수하기 →</button>
            </div>
          </div>

          {/* 자주 발생하는 문제 */}
          <div className="cas-flow-card">
            <h3 className="cas-flow-card__title">자주 발생하는 문제</h3>
            <div className="cas-quick-problems">
              {QUICK_PROBLEMS.map((p, i) => (
                <button key={i} className="cas-quick-problem">
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            <p className="cas-quick-hint">원하는 증상이 없나요? AI 상담으로 정확한 진단을 받아보세요. <span className="cas-quick-hint__link">AI 상담 시작 →</span></p>
          </div>
        </div>

        {/* ══ 우측 사이드바 ══ */}
        <aside className="cas-flow-sidebar">

          {/* 선택된 제품 */}
          {selectedAppliance && (
            <div className="cas-side-card">
              <p className="cas-side-card__head" style={{ marginBottom: 12, fontWeight: 700, fontSize: 13 }}>선택된 제품</p>
              <div className="cas-selected-product">
                <div className="cas-selected-product__img">{selectedAppliance.icon}</div>
                <div>
                  <p className="cas-selected-product__name">{selectedAppliance.name}</p>
                  <p className="cas-selected-product__model">{selectedAppliance.model}</p>
                </div>
              </div>
              <div className="cas-product-meta">
                <div className="cas-product-meta__row">
                  <span>구매일</span><span>{selectedAppliance.purchased}</span>
                </div>
                <div className="cas-product-meta__row">
                  <span>보증기간</span>
                  <span className="cas-product-meta__warranty">{selectedAppliance.warranty} 까지<br /><em>보증기간 내</em></span>
                </div>
              </div>
              <div className="cas-product-links">
                <button className="cas-product-link">제품 매뉴얼 보기 →</button>
                <button className="cas-product-link">제품 정보 확인 →</button>
              </div>
            </div>
          )}

          {/* 최근 상담 내역 */}
          <div className="cas-side-card">
            <div className="cas-side-card__head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>최근 상담 내역</span>
              <button className="cas-product-link">전체보기 →</button>
            </div>
            <div className="cas-recent-list">
              {RECENT_HISTORY.map((h, i) => (
                <div key={i} className="cas-recent-item">
                  <div className={`cas-recent-icon cas-recent-icon--${h.color}`}>
                    {h.color === "blue" ? <Bot size={13} /> : <Wrench size={13} />}
                  </div>
                  <div className="cas-recent-info">
                    <p className="cas-recent-title">{h.appliance}</p>
                    <p className="cas-recent-date">{h.date}</p>
                  </div>
                  <span className={`cas-recent-badge cas-recent-badge--${h.color}`}>{h.type}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}

const AS_LIST = [
  {
    id: 1,
    appliance: "LG 오브제 냉장고", model: "M83FD421E",
    desc: "냉장이 잘 안돼요. (냉실 온도가 설정보다 높게 유지됩니다)",
    datetime: "2026.06.21 (토) 10:00", engineerStatus: "전문 기사 배정 완료",
    engineer: "김민준 기사", rating: 4.9,
    status: "예약 확정",
    actions: ["상세보기", "예약 취소"],
  },
  {
    id: 2,
    appliance: "삼성 그랑데 세탁기", model: "WF21A9500KV",
    desc: "탈수 중 소음이 심하게 납니다. 진동도 많이 느껴져요.",
    datetime: "2026.06.16 (화) 14:00", engineerStatus: "전문 기사 배정 완료",
    engineer: "이재훈 기사", rating: 4.8,
    status: "수리 진행 중",
    actions: ["상세보기"],
  },
  {
    id: 3,
    appliance: "LG 오브제 냉장고", model: "M83FD421E",
    desc: "냉장이 잘 안돼요. (냉실 온도가 ...",
    datetime: "2026.06.10 (수) 10:00", engineerStatus: "수리 완료",
    engineer: "박현우 기사", rating: 4.7,
    status: "결제 대기",
    amount: "120,000원",
    actions: ["수리 보고서 보기", "결제하기"],
  },
  {
    id: 4,
    appliance: "LG 오브제 냉장고", model: "M83FD421E",
    desc: "냉장이 잘 안돼요. (냉실 온도가 ...",
    datetime: "2026.06.03 (월) 10:00", engineerStatus: "전문 기사 배정 완료",
    engineer: "최지훈 기사", rating: 4.9,
    status: "A/S 완료",
    actions: ["수리 보고서 보기", "기사님 리뷰 남기기"],
  },
  {
    id: 5,
    appliance: "LG 오브제 냉장고", model: "M83FD421E",
    desc: "냉장이 잘 안돼요. (냉실 온도가 ...",
    datetime: "2026.05.20 (목) 10:00", engineerStatus: "전문 기사 배정 완료",
    engineer: "김민수 기사", rating: 4.8,
    status: "A/S 완료",
    actions: ["수리 보고서 보기", "작성한 리뷰 보기"],
  },
];

const FILTER_TABS = ["전체", "접수 대기", "예약 확정", "수리 진행 중", "결제 대기", "A/S 완료", "취소"];

const STATUS_META = {
  "예약 확정":   { style: "purple", label: "예약 확정"   },
  "수리 진행 중": { style: "blue",   label: "수리 진행 중" },
  "결제 대기":   { style: "red",    label: "결제 대기"   },
  "A/S 완료":   { style: "green",  label: "A/S 완료"   },
  "접수 대기":   { style: "gray",   label: "접수 대기"   },
  "취소":        { style: "gray",   label: "취소"        },
};

const ACTION_STYLE = {
  "상세보기":          "outline",
  "예약 취소":         "outline",
  "수리 보고서 보기":  "outline",
  "기사님 리뷰 남기기": "primary",
  "작성한 리뷰 보기":  "outline",
  "결제하기":          "danger",
};

const UPCOMING_VISITS = [
  { appliance: "LG 오브제 냉장고", date: "2026.06.21 (토)", time: "10:00~12:00", engineer: "김민준 기사", dDay: 3 },
];

const PENDING_PAYMENTS = [
  { appliance: "LG 오브제 냉장고", model: "M83FD421E", amount: "120,000원", dueDate: "2026.06.25" },
];

export default function CustomerAS() {
  const [activeFilter, setActiveFilter] = useState("전체");
  const [showReserve, setShowReserve] = useState(false);

  const filtered = activeFilter === "전체"
    ? AS_LIST
    : AS_LIST.filter((item) => item.status === activeFilter);

  if (showReserve) {
    return (
      <div className="cas-wrap">
        <header className="cas-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="cas-back-btn" onClick={() => setShowReserve(false)}>
              <ArrowLeft size={18} /> 뒤로
            </button>
            <div>
              <h1>A/S 예약하기</h1>
              <p>문제가 발생한 제품을 선택하고 진단 방법을 결정하세요.</p>
            </div>
          </div>
          <div className="cas-header__right">
            <button className="cas-icon-btn"><Bell size={20} /></button>
            <button className="cas-icon-btn"><MessageSquare size={20} /></button>
            <div className="cas-profile">
              <div className="cas-avatar">혜</div>
              <span>혜민님</span>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>
        <ASReserveFlow onClose={() => setShowReserve(false)} />
      </div>
    );
  }

  return (
    <div className="cas-wrap">

      {/* 헤더 */}
      <header className="cas-header">
        <div>
          <h1>A/S 신청 · 예약</h1>
          <p>접수한 A/S 현황과 방문 일정을 확인하세요.</p>
        </div>
        <div className="cas-header__right">
          <button className="cas-icon-btn"><Bell size={20} /></button>
          <button className="cas-icon-btn"><MessageSquare size={20} /></button>
          <div className="cas-profile">
            <div className="cas-avatar">혜</div>
            <span>혜민님</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </header>

      {/* 통계 카드 4개 */}
      <div className="cas-stats">
        {[
          { label: "전체 신청",        num: "4", unit: "건", alert: false },
          { label: "진행 중",           num: "2", unit: "건", alert: false },
          { label: "결제 대기 중",      num: "1", unit: "건", alert: true  },
          { label: "이번 달 방문 예정", num: "1", unit: "건", alert: false },
        ].map((s) => (
          <div key={s.label} className={`cas-stat ${s.alert ? "cas-stat--alert" : ""}`}>
            <p className="cas-stat__label">{s.label}</p>
            <p className={`cas-stat__num ${s.alert ? "cas-stat__num--red" : ""}`}>
              {s.num} <span>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 바디: 좌측 메인 + 우측 사이드바 */}
      <div className="cas-body">

        {/* ══ 좌측 메인 ══ */}
        <div className="cas-main">

          {/* 목록 헤더 */}
          <div className="cas-list-header">
            <h2>내 신청 내역</h2>
            <button className="cas-reserve-btn" onClick={() => setShowReserve(true)}>A/S 예약하기</button>
          </div>

          {/* 필터 탭 */}
          <div className="cas-filters">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                className={`cas-filter ${activeFilter === tab ? "cas-filter--active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 신청 목록 */}
          <div className="cas-list">
            {filtered.length === 0 ? (
              <div className="cas-empty">해당 상태의 신청 내역이 없습니다.</div>
            ) : filtered.map((item) => {
              const st = STATUS_META[item.status];
              return (
                <div key={item.id} className={`cas-item ${item.status === "결제 대기" ? "cas-item--payment" : ""}`}>
                  <div className="cas-item__img" />
                  <div className="cas-item__info">
                    <div className="cas-item__title-row">
                      <span className="cas-item__name">{item.appliance}</span>
                      <span className="cas-item__model">{item.model}</span>
                    </div>
                    <p className="cas-item__desc">{item.desc}</p>
                    <div className="cas-item__meta">
                      <span className="cas-item__datetime">
                        <Clock size={11} /> {item.datetime}
                      </span>
                      <span className="cas-item__engineer">{item.engineerStatus}</span>
                    </div>
                    {item.amount && (
                      <p className="cas-item__amount">청구 금액: <strong>{item.amount}</strong></p>
                    )}
                  </div>
                  <div className="cas-item__center">
                    <span className={`cas-badge cas-badge--${st.style}`}>{st.label}</span>
                    <div className="cas-item__engineer-info">
                      <div className="cas-item__eng-avatar">{item.engineer[0]}</div>
                      <div>
                        <p className="cas-item__eng-name">{item.engineer}</p>
                        <p className="cas-item__eng-rating"><Star size={10} fill="#f59e0b" color="#f59e0b" /> {item.rating}</p>
                      </div>
                    </div>
                  </div>
                  <div className="cas-item__actions">
                    {item.actions.map((action) => (
                      <button
                        key={action}
                        className={`cas-action-btn cas-action-btn--${ACTION_STYLE[action]}`}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ 우측 사이드바 ══ */}
        <aside className="cas-sidebar">

          {/* 결제 대기 */}
          <div className="cas-side-card cas-side-card--alert">
            <div className="cas-side-card__head">
              <CreditCard size={15} />
              <span>결제 대기</span>
              <span className="cas-side-badge cas-side-badge--red">1건</span>
            </div>
            {PENDING_PAYMENTS.map((p, i) => (
              <div key={i} className="cas-payment-item">
                <div className="cas-payment-item__top">
                  <p className="cas-payment-item__name">{p.appliance}</p>
                  <p className="cas-payment-item__model">{p.model}</p>
                </div>
                <div className="cas-payment-item__bottom">
                  <span className="cas-payment-item__amount">{p.amount}</span>
                  <span className="cas-payment-item__due">~ {p.dueDate}까지</span>
                </div>
                <button className="cas-pay-btn">지금 결제하기</button>
              </div>
            ))}
          </div>

          {/* 방문 예정 일정 */}
          <div className="cas-side-card">
            <div className="cas-side-card__head">
              <CalendarCheck size={15} />
              <span>방문 예정 일정</span>
              <span className="cas-side-badge cas-side-badge--purple">1건</span>
            </div>
            {UPCOMING_VISITS.map((v, i) => (
              <div key={i} className="cas-visit-item">
                <div className="cas-visit-dday">D-{v.dDay}</div>
                <div className="cas-visit-info">
                  <p className="cas-visit-appliance">{v.appliance}</p>
                  <p className="cas-visit-date">{v.date}</p>
                  <p className="cas-visit-time">{v.time}</p>
                  <p className="cas-visit-engineer">{v.engineer}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 최근 담당 기사 */}
          {/* <div className="cas-side-card">
            <div className="cas-side-card__head">
              <span>최근 담당 기사</span>
            </div>
            {[
              { name: "김민준 기사", count: 2, rating: 4.9, tags: ["친절함", "신속"] },
              { name: "이재훈 기사", count: 1, rating: 4.8, tags: ["정확함"] },
            ].map((eng, i) => (
              <div key={i} className="cas-eng-row">
                <div className="cas-eng-avatar">{eng.name[0]}</div>
                <div className="cas-eng-info">
                  <div className="cas-eng-top">
                    <p className="cas-eng-name">{eng.name}</p>
                    <p className="cas-eng-rating"><Star size={10} fill="#f59e0b" color="#f59e0b" /> {eng.rating}</p>
                  </div>
                  <p className="cas-eng-count">방문 {eng.count}회</p>
                  <div className="cas-eng-tags">
                    {eng.tags.map((t) => <span key={t} className="cas-eng-tag">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div> */}

          {/* A/S 빠른 신청 */}
          <div className="cas-side-card cas-side-card--cta">
            <p className="cas-cta-title">새 A/S 신청</p>
            <p className="cas-cta-desc">가전 고장이나 점검이 필요하신가요?</p>
            <button className="cas-cta-btn" onClick={() => setShowReserve(true)}>A/S 예약하기 <ChevronRight size={13} /></button>
          </div>

        </aside>
      </div>
    </div>
  );
}
