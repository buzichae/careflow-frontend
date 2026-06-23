import {
  Bell, MessageSquare, ChevronDown, ChevronRight,
  Wrench, CalendarCheck, PlusCircle, ShoppingCart,
  Activity, MapPin, Star,
} from "lucide-react";
import "../../styles/Customer/CustomerHome.css";

/* ── 데이터 ── */
const mockAppliances = [
  { id: 1, name: "냉장고",  brand: "LG 디오스 냉장고",    model: "M870SN75",      score: 95, status: "양호", statusColor: "green"  },
  { id: 2, name: "세탁기",  brand: "삼성 그랑데 세탁기",  model: "WF21A9500KV",   score: 72, status: "주의", statusColor: "orange" },
  { id: 3, name: "에어컨",  brand: "LG 휘센 에어컨",      model: "FQ17H9DWA1",    score: 88, status: "양호", statusColor: "green"  },
  { id: 4, name: "TV",      brand: "삼성 QLED TV",         model: "KQ65QC67AFXKR", score: 90, status: "양호", statusColor: "green"  },
];

const mockSchedules = [
  { date: "18", month: "6월", day: "수", title: "세탁기 필터 교체",        sub: "예정일 2024.06.18", tag: "예정",  tagColor: "blue"   },
  { date: "25", month: "6월", day: "화", title: "냉장고 보증기간 만료 예정", sub: "예정일 2024.06.25", tag: "알림",  tagColor: "red"    },
  { date: "30", month: "6월", day: "일", title: "에어컨 정기 점검",         sub: "예정일 2024.06.30", tag: "예약",  tagColor: "purple" },
];

const mockHistory = [
  { icon: "🔧", title: "냉장고 냉각 이상 수리",  engineer: "김철수 기사", date: "2024.06.03", color: "orange" },
  { icon: "📅", title: "에어컨 정기 점검",        engineer: "박민수 기사", date: "2024.05.12", color: "green"  },
  { icon: "💧", title: "세탁기 배수 문제 수리",   engineer: "이명희 기사", date: "2024.04.28", color: "blue"   },
];

const mockNextVisit = {
  dDay: 3,
  title: "세탁기 정기 점검",
  engineer: "김민준 기사",
  rating: 4.9,
  date: "2024.06.21 (금)",
  time: "오전 10:00 ~ 12:00",
  status: "예약 확정",
};

const mockUnreadNotices = [
  { id: 1, icon: "🔑", iconBg: "#fff7e6", iconColor: "#f59e0b", title: "냉장고 필터 교체 주기가 도래했습니다.",  tag: "소모품 교체", tagColor: "#f59e0b", tagBg: "#fff7e6", time: "방금 전"  },
  { id: 2, icon: "🛡",  iconBg: "#f0edff", iconColor: "#734bcf", title: "무상 A/S 기간이 7일 후 종료됩니다.",      tag: "무상 A/S",   tagColor: "#734bcf", tagBg: "#f0edff", time: "1시간 전" },
  { id: 3, icon: "💬", iconBg: "#eff6ff", iconColor: "#3b82f6", title: "A/S 진행 단계가 변경되었습니다.",         tag: "A/S 단계",   tagColor: "#3b82f6", tagBg: "#eff6ff", time: "2시간 전" },
];

export default function CustomerHome() {
  return (
    <div className="ch-wrap">

      {/* ── 헤더 ── */}
      <header className="ch-header">
        <div className="ch-header__left">
          <h1>안녕하세요 혜민님!</h1>
          <p>오늘도 우리집 가전의 건강을 체크해보세요.</p>
        </div>
        <div className="ch-header__right">
          <button className="ch-icon-btn"><Bell size={20} /></button>
          <button className="ch-icon-btn"><MessageSquare size={20} /></button>
          <div className="ch-profile">
            <div className="ch-avatar">혜</div>
            <span>혜민님</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </header>

      {/* ── 바디: 좌측 메인 + 우측 사이드바 ── */}
      <div className="ch-body">

        {/* ══ 좌측 메인 ══ */}
        <div className="ch-main">

          {/* 건강지수 + 통계 4개 */}
          <section className="ch-summary">
            <div className="ch-health-card">
              <div className="ch-health-card__left">
                <p className="ch-health-card__label">우리집 가전 건강지수</p>
                <div className="ch-health-card__score">
                  <span className="ch-health-card__num">89</span>
                  <span className="ch-health-card__denom">/100</span>
                </div>
                <span className="ch-health-badge">😊 매우 양호</span>
              </div>
              <div className="ch-health-card__icon">
                <Activity size={56} strokeWidth={1.5} />
              </div>
            </div>
            <div className="ch-stat-cards">
              {[
                { icon: "📦", color: "gray",   num: "7 대", label: "보유 가전",    sub: "등록된 가전 수" },
                { icon: "📅", color: "green",  num: "2 건", label: "점검 예정",    sub: "이번 달 일정"   },
                { icon: "🔔", color: "red",    num: "3 건", label: "알림",         sub: "확인 필요"      },
                { icon: "🔨", color: "orange", num: "1 건", label: "A/S 진행 중",  sub: "진행 중인 A/S"  },
              ].map((s) => (
                <div key={s.label} className="ch-stat">
                  <div className={`ch-stat__icon ch-stat__icon--${s.color}`}>{s.icon}</div>
                  <p className="ch-stat__num">{s.num}</p>
                  <p className="ch-stat__label">{s.label}<br />{s.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 내 가전 관리 */}
          <section className="ch-section">
            <div className="ch-section__header">
              <h2>내 가전 관리</h2>
              <button className="ch-link-btn">전체 보기 <ChevronRight size={14} /></button>
            </div>
            <div className="ch-appliances">
              {mockAppliances.map((a) => (
                <div key={a.id} className="ch-appliance-card">
                  <div className="ch-appliance-card__top">
                    <div className="ch-appliance-card__img" />
                    <span className={`ch-status-badge ch-status-badge--${a.statusColor}`}>{a.status}</span>
                  </div>
                  <p className="ch-appliance-card__name">{a.name}</p>
                  <p className="ch-appliance-card__brand">{a.brand}</p>
                  <p className="ch-appliance-card__model">{a.model}</p>
                  <div className="ch-score-row">
                    <span>{a.score}점</span>
                    <div className="ch-score-bar">
                      <div className="ch-score-bar__fill" style={{ width: `${a.score}%`, background: a.statusColor === "orange" ? "#f59e0b" : "#734bcf" }} />
                    </div>
                  </div>
                  {a.statusColor === "orange"
                    ? <button className="ch-card-btn ch-card-btn--check"><CalendarCheck size={13} /> 점검 예약</button>
                    : <button className="ch-card-btn">상세 보기 &gt;</button>
                  }
                </div>
              ))}
            </div>
          </section>

          {/* 빠른 메뉴 + 이번 달 일정 */}
          <div className="ch-bottom">
            <div className="ch-quick">
              <h2>빠른 메뉴</h2>
              <div className="ch-quick__grid">
                <button className="ch-quick-btn ch-quick-btn--purple"><Wrench size={16} /> A/S 신청</button>
                <button className="ch-quick-btn ch-quick-btn--green"><CalendarCheck size={16} /> 점검 예약</button>
                <button className="ch-quick-btn ch-quick-btn--outline"><PlusCircle size={16} /> 가전 등록</button>
                <button className="ch-quick-btn ch-quick-btn--outline"><ShoppingCart size={16} /> 소모품 구매</button>
              </div>
            </div>

            <div className="ch-schedule">
              <div className="ch-section__header">
                <h2>이번 달 일정</h2>
                <button className="ch-link-btn">전체 보기 <ChevronRight size={14} /></button>
              </div>
              <div className="ch-schedule__list">
                {mockSchedules.map((s, i) => (
                  <div key={i} className="ch-schedule__item">
                    <div className="ch-schedule__date">
                      <span className="ch-schedule__month">{s.month}</span>
                      <span className="ch-schedule__day-num">{s.date}</span>
                      <span className="ch-schedule__day">{s.day}</span>
                    </div>
                    <div className="ch-schedule__info">
                      <p className="ch-schedule__title">{s.title}</p>
                      <p className="ch-schedule__sub">{s.sub}</p>
                    </div>
                    <span className={`ch-tag ch-tag--${s.tagColor}`}>{s.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 하단 배너 */}
          <div className="ch-banner">
            <div className="ch-banner__text">
              <p>새로운 가전을 등록하고</p>
              <p><strong>더 스마트한 관리를 시작해보세요!</strong></p>
            </div>
            <button className="ch-banner__btn">+ 가전 등록하기</button>
          </div>
        </div>

        {/* ══ 우측 사이드바 ══ */}
        <aside className="ch-sidebar">

          {/* 다음 방문 일정 */}
          <div className="ch-visit-card">
            <div className="ch-visit-card__top">
              <span className="ch-visit-dday">D-{mockNextVisit.dDay}</span>
              <span className="ch-visit-status">{mockNextVisit.status}</span>
            </div>
            <p className="ch-visit-title">{mockNextVisit.title}</p>
            <div className="ch-visit-detail">
              <MapPin size={12} />
              <span>{mockNextVisit.date}</span>
            </div>
            <div className="ch-visit-detail">
              <span style={{ width: 12 }} />
              <span>{mockNextVisit.time}</span>
            </div>
            <div className="ch-visit-engineer">
              <div className="ch-visit-engineer__avatar">김</div>
              <div>
                <p className="ch-visit-engineer__name">{mockNextVisit.engineer}</p>
                <p className="ch-visit-engineer__rating">
                  <Star size={11} fill="#f59e0b" color="#f59e0b" /> {mockNextVisit.rating} · 방문 확정
                </p>
              </div>
            </div>
            <div className="ch-visit-actions">
              <button className="ch-visit-btn ch-visit-btn--outline">일정 변경</button>
              <button className="ch-visit-btn ch-visit-btn--primary">상세 보기</button>
            </div>
          </div>

          {/* 읽지 않은 알림 */}
          <div className="ch-unread-card">
            <div className="ch-section__header">
              <h2>읽지 않은 알림 <span className="ch-unread-count">3</span></h2>
              <button className="ch-link-btn">전체 보기 <ChevronRight size={14} /></button>
            </div>
            <div className="ch-unread-list">
              {mockUnreadNotices.map((n) => (
                <div key={n.id} className="ch-unread-item">
                  <div className="ch-unread-item__icon" style={{ background: n.iconBg, color: n.iconColor }}>
                    {n.icon}
                  </div>
                  <div className="ch-unread-item__info">
                    <p className="ch-unread-item__title">{n.title}</p>
                    <div className="ch-unread-item__meta">
                      <span className="ch-unread-tag" style={{ background: n.tagBg, color: n.tagColor }}>{n.tag}</span>
                      <span className="ch-unread-time">{n.time}</span>
                    </div>
                  </div>
                  <div className="ch-unread-dot" />
                </div>
              ))}
            </div>
          </div>

          {/* 최근 이용 내역 */}
          <div className="ch-sidebar-history">
            <div className="ch-section__header">
              <h2>최근 이용 내역</h2>
              <button className="ch-link-btn">전체 보기 <ChevronRight size={14} /></button>
            </div>
            <div className="ch-history__list">
              {mockHistory.map((h, i) => (
                <div key={i} className="ch-history__item">
                  <div className={`ch-history__icon ch-history__icon--${h.color}`}>{h.icon}</div>
                  <div className="ch-history__info">
                    <p className="ch-history__title">{h.title}</p>
                    <p className="ch-history__sub">{h.engineer} · {h.date}</p>
                  </div>
                  <button className="ch-diag-btn">진단서</button>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
