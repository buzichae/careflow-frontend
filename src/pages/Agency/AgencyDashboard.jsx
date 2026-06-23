import engineerImg from "../../assets/기사.png";
import {
  ClipboardList, CheckCircle, Users, HandCoins, Star,
  UserPlus, Megaphone, ChartNoAxesCombined,
} from "lucide-react";
import "../../styles/Agency/AgencyDashboard.css";

// A/S 상태값 매핑 (DB ENUM → 한글 표시)
const STATUS_MAP = {
  RECEIVED:        { label: "접수",     type: "received" },
  ASSIGNED:        { label: "배정 완료", type: "assigned" },
  VISITING:        { label: "방문 중",   type: "visiting" },
  WORKING:         { label: "작업 중",   type: "working"  },
  PENDING_CONFIRM: { label: "완료 대기", type: "waiting"  },
  COMPLETED:       { label: "완료",     type: "completed"},
};
 
const SKILL_MAP = {
  BEGINNER:     "초급",
  INTERMEDIATE: "중급",
  ADVANCED:     "고급",
};
 
// ──────────────────────────────────────────
// TODO: API 연동 
// GET /api/agency/work-requests?status=IN_PROGRESS
// as_requests + as_assignments + engineer_profiles JOIN
// ──────────────────────────────────────────
const workData = [
  { id: 1, product: "LG 디오스 냉장고",   issue: "냉장고 냉각 이상", emoji: "🧊", customer: "김민지", phone: "010-1234-5678", engineer: "김철수 기사", date: "06.01 (토) 10:00", status: "VISITING"  },
  { id: 2, product: "삼성 그랑데 세탁기", issue: "세탁기 소음 발생", emoji: "🫧", customer: "이영희", phone: "010-2345-6789", engineer: "박민수 기사", date: "06.01 (토) 14:00", status: "ASSIGNED"  },
  { id: 3, product: "LG 휘센 에어컨",     issue: "에어컨 냉방 약함", emoji: "❄️", customer: "박준호", phone: "010-3456-7890", engineer: "이영호 기사", date: "06.01 (토) 16:30", status: "VISITING"  },
  { id: 4, product: "삼성 QLED TV",       issue: "화면 안 나옴",    emoji: "📺", customer: "최지연", phone: "010-4567-8901", engineer: "김현우 기사", date: "06.02 (월) 11:00", status: "RECEIVED"  },
];
 
// ──────────────────────────────────────────
// TODO: API 연동 
// GET /api/agency/engineers/top3
// engineer_profiles + reviews JOIN, avg_rating DESC LIMIT 3
// profileImageUrl → engineer_profiles.profile_image_url
// name → users.name (성 첫 글자 fallback용)
// ──────────────────────────────────────────
const topEngineers = [
  { rank: 1, name: "김철수", rating: 4.9, completed: 32, satisfaction: 98, skillLevel: "ADVANCED",     specialty: "냉장고", isLmsCompleted: true,  profileImageUrl: null },
  { rank: 2, name: "박민수", rating: 4.8, completed: 28, satisfaction: 96, skillLevel: "INTERMEDIATE", specialty: "세탁기", isLmsCompleted: true,  profileImageUrl: null },
  { rank: 3, name: "이영호", rating: 4.7, completed: 26, satisfaction: 94, skillLevel: "INTERMEDIATE", specialty: "에어컨", isLmsCompleted: false, profileImageUrl: null },
];
 
const noticeData = [
  { id: 1, text: "6월 정산 일정 안내",        date: "2024.06.01" },
  { id: 2, text: "여름철 에어컨 점검 가이드",  date: "2024.05.28" },
  { id: 3, text: "서비스 품질 향상 캠페인",    date: "2024.05.20" },
];
 
// 기사 아바타: 사진 있으면 img, 없으면 성(첫 글자)
function EngineerAvatar({ name, profileImageUrl }) {
  const lastName = name ? name.charAt(0) : "?";
  return (
    <div className="engineer-avatar">
      {profileImageUrl
        ? <img src={profileImageUrl} alt={name} />
        : <span>{lastName}</span>
      }
    </div>
  );
}
 
export default function AgencyDashboard() {
 
 
 
  // ──────────────────────────────────────────
  // TODO: API 연동 
  // GET /api/agency/stats/summary
  // ──────────────────────────────────────────
  const stats = {
    inProgress:  { value: 18, sub: "전체 42건" },
    todayDone:   { value: 12, sub: "전체 18건" },
    engineers:   { value: 24, sub: "활동 중 22명" },
    settlement:  { value: "11,200,000", sub: "지난달 대비 ▼ 3.1%", up: false },
    satisfaction:{ value: "4.7", sub: "지난달 대비 ▲ 0.2", up: true },
  };
 
  // ──────────────────────────────────────────
  // TODO: API 연동 
  // GET /api/agency/settlements/summary
  // ──────────────────────────────────────────
  const settlement = {
    totalAmount:     12450000,
    careflowFee:       622500,
    agencyFee:        1245000,
    confirmedAmount: 11200000,
    pendingAmount:    1250000,
  };
 
  return (
    <div className="agency-dashboard">
 
      {/* 통계 카드 */}
      <div className="agency-stats">
        <div className="agency-stat-card">
          <div className="agency-stat-card__icon agency-stat-card__icon--blue">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="agency-stat-card__label">진행 중 작업</p>
            <p className="agency-stat-card__value">{stats.inProgress.value}<span>건</span></p>
            <p className="agency-stat-card__sub">{stats.inProgress.sub}</p>
          </div>
        </div>
        <div className="agency-stat-card">
          <div className="agency-stat-card__icon agency-stat-card__icon--green">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="agency-stat-card__label">오늘 완료</p>
            <p className="agency-stat-card__value">{stats.todayDone.value}<span>건</span></p>
            <p className="agency-stat-card__sub">{stats.todayDone.sub}</p>
          </div>
        </div>
        <div className="agency-stat-card">
          <div className="agency-stat-card__icon agency-stat-card__icon--purple">
            <Users size={20} />
          </div>
          <div>
            <p className="agency-stat-card__label">소속 기사</p>
            <p className="agency-stat-card__value">{stats.engineers.value}<span>명</span></p>
            <p className="agency-stat-card__sub">{stats.engineers.sub}</p>
          </div>
        </div>
        <div className="agency-stat-card">
          <div className="agency-stat-card__icon agency-stat-card__icon--blue2">
            <HandCoins size={20} />
          </div>
          <div>
            <p className="agency-stat-card__label">이번 달 정산 예정</p>
            <p className="agency-stat-card__value agency-stat-card__value--lg">{stats.settlement.value}<span>원</span></p>
            <p className={`agency-stat-card__sub ${stats.settlement.up ? 'agency-stat-card__sub--up' : 'agency-stat-card__sub--down'}`}>
              {stats.settlement.sub}
            </p>
          </div>
        </div>
        <div className="agency-stat-card">
          <div className="agency-stat-card__icon agency-stat-card__icon--amber">
            <Star size={20} />
          </div>
          <div>
            <p className="agency-stat-card__label">평균 고객 만족도</p>
            <p className="agency-stat-card__value">{stats.satisfaction.value}<span>/5.0</span></p>
            <p className={`agency-stat-card__sub ${stats.satisfaction.up ? 'agency-stat-card__sub--up' : 'agency-stat-card__sub--down'}`}>
             {stats.satisfaction.sub}
            </p>
          </div>
        </div>
      </div>
 
      <div className="agency-dashboard__content">
        <div className="agency-dashboard__left">
          <section className="work-section">
            <h2 className="section-title">진행 중 작업 현황</h2>
            <div className="work-funnel">
              <div className="work-funnel__step work-funnel__step--purple"><span className="work-funnel__label">접수</span><span className="work-funnel__count">8건</span></div>
              <div className="work-funnel__arrow">›</div>
              <div className="work-funnel__step work-funnel__step--blue"><span className="work-funnel__label">배정</span><span className="work-funnel__count">6건</span></div>
              <div className="work-funnel__arrow">›</div>
              <div className="work-funnel__step work-funnel__step--green"><span className="work-funnel__label">방문 중</span><span className="work-funnel__count">7건</span></div>
              <div className="work-funnel__arrow">›</div>
              <div className="work-funnel__step work-funnel__step--amber"><span className="work-funnel__label">완료 대기</span><span className="work-funnel__count">5건</span></div>
            </div>
            <div className="work-table">
              <div className="work-table__header">
                <span>작업 정보</span><span>고객</span><span>담당 기사</span><span>예약 시간</span><span>상태</span>
              </div>
              {workData.map((item) => {
                const s = STATUS_MAP[item.status] || { label: item.status, type: "received" };
                return (
                  <div key={item.id} className="work-table__row">
                    <div className="work-table__product">
                      <div className="work-table__emoji">{item.emoji}</div>
                      <div>
                        <p className="work-table__product-name">{item.product}</p>
                        <p className="work-table__product-issue">{item.issue}</p>
                      </div>
                    </div>
                    <div className="work-table__customer">
                      <p>{item.customer}</p>
                      <p className="work-table__phone">{item.phone}</p>
                    </div>
                    <div className="work-table__engineer">{item.engineer}</div>
                    <div className="work-table__date">{item.date}</div>
                    <div><span className={`work-badge work-badge--${s.type}`}>{s.label}</span></div>
                  </div>
                );
              })}
              <button className="work-table__more">작업 목록 전체 보기 ›</button>
            </div>
          </section>
 
          <div className="agency-bottom">
            <div className="quick-menu">
              <h2 className="section-title">빠른 메뉴</h2>
              <div className="quick-menu__grid">
                <button className="quick-menu__item">
                  <UserPlus size={24} className="quick-menu__icon" /><span>기사 초대</span>
                </button>
                <button className="quick-menu__item">
                  <Megaphone size={24} className="quick-menu__icon" /><span>공지 등록</span>
                </button>
                <button className="quick-menu__item">
                  <HandCoins size={24} className="quick-menu__icon" /><span>정산 내역</span>
                </button>
                <button className="quick-menu__item">
                  <ChartNoAxesCombined size={24} className="quick-menu__icon" /><span>리포트 보기</span>
                </button>
              </div>
            </div>
            <div className="notice-section">
              <div className="notice-section__header">
                <h2 className="section-title" style={{ marginBottom: 0 }}>공지사항</h2>
                <button className="more-link">더보기 ›</button>
              </div>
              {noticeData.map((n) => (
                <div key={n.id} className="notice-item">
                  <div className="notice-item__dot" />
                  <span className="notice-item__text">{n.text}</span>
                  <span className="notice-item__date">{n.date}</span>
                </div>
              ))}
            </div>
          </div>
 
          <div className="cta-banner">
            <div className="cta-banner__text">
              <p className="cta-banner__title">더 많은 고객에게 신뢰받는 서비스를 함께 만들어가요!</p>
              <p className="cta-banner__sub">정확한 배정과 신속한 작업으로 고객 만족도를 높여주세요.</p>
            </div>
            <img src={engineerImg} alt="기사" className="cta-banner__img" />
            <button className="cta-banner__btn">작업 배정 요청하기 ›</button>
          </div>
        </div>
 
        <aside className="agency-dashboard__right">
          <div className="perf-card">
            <div className="perf-card__header">
              <h2 className="section-title" style={{ marginBottom: 0 }}>이번 달 실적 요약</h2>
              <button className="more-link">더보기 ›</button>
            </div>
            <div className="perf-card__body">
              <div className="donut">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#eeeaff" strokeWidth="10" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#5B4FF5" strokeWidth="10"
                    strokeDasharray={`${0.85 * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                    strokeDashoffset={2 * Math.PI * 38 * 0.25}
                    strokeLinecap="round" transform="rotate(-90 50 50)" />
                </svg>
                <div className="donut__label">
                  <span className="donut__pct">85%</span>
                  <span className="donut__sub">목표 달성률</span>
                </div>
              </div>
              <div className="perf-list">
                <div className="perf-list__item"><span className="perf-list__dot perf-list__dot--gray" /><span className="perf-list__label">총 배정 작업</span><span className="perf-list__val">150건</span></div>
                <div className="perf-list__item"><span className="perf-list__dot perf-list__dot--purple" /><span className="perf-list__label">완료 작업</span><span className="perf-list__val">128건</span></div>
                <div className="perf-list__item"><span className="perf-list__dot perf-list__dot--amber" /><span className="perf-list__label">취소 / 미완료</span><span className="perf-list__val">22건</span></div>
                <div className="perf-list__divider" />
                <div className="perf-list__item"><span className="perf-list__label">목표 작업 수</span><span className="perf-list__val">150건</span></div>
              </div>
            </div>
          </div>
 
          {/* 우수 기사 TOP 3 - profile_image_url 있으면 사진, 없으면 성 한 글자 */}
          <div className="top-engineers">
            <div className="top-engineers__header">
              <h2 className="section-title" style={{ marginBottom: 0 }}>우수 기사 TOP 3</h2>
              <button className="more-link">더보기 ›</button>
            </div>
            {topEngineers.map((e) => (
              <div key={e.rank} className="engineer-item">
                <span className={`engineer-item__rank engineer-item__rank--${e.rank}`}>{e.rank}</span>
                <EngineerAvatar name={e.name} profileImageUrl={e.profileImageUrl} />
                <div className="engineer-item__info">
                  <p className="engineer-item__name">{e.name} 기사</p>
                  <div className="engineer-item__tags">
                    <span className="engineer-tag engineer-tag--specialty">{e.specialty} 전문</span>
                    <span className="engineer-tag engineer-tag--skill">{SKILL_MAP[e.skillLevel]}</span>
                    {e.isLmsCompleted
                      ? <span className="engineer-tag engineer-tag--lms-ok">LMS 이수</span>
                      : <span className="engineer-tag engineer-tag--lms-fail">배차 불가</span>
                    }
                  </div>
                </div>
                <div className="engineer-item__stats">
                  <span className="engineer-item__rating">⭐ {e.rating}</span>
                  <span className="engineer-item__completed">완료 {e.completed}건</span>
                  <span className="engineer-item__satisfaction">만족도 {e.satisfaction}%</span>
                </div>
              </div>
            ))}
          </div>
 
          <div className="settlement-card">
            <div className="settlement-card__header">
              <h2 className="section-title" style={{ marginBottom: 0 }}>정산 요약</h2>
              <button className="more-link">더보기 ›</button>
            </div>
            <p className="settlement-card__sub">이번 달 정산 예정 금액</p>
            <p className="settlement-card__amount">{settlement.totalAmount.toLocaleString()}<span>원</span></p>
            <div className="settlement-card__rows">
              <div className="settlement-card__row"><span>CareFlow 수수료</span><span className="settlement-card__fee">- {settlement.careflowFee.toLocaleString()} 원</span></div>
              <div className="settlement-card__row"><span>대행사 수수료</span><span className="settlement-card__fee">- {settlement.agencyFee.toLocaleString()} 원</span></div>
              <div className="settlement-card__divider" />
              <div className="settlement-card__row"><span>확정 금액</span><span>{settlement.confirmedAmount.toLocaleString()} 원</span></div>
              <div className="settlement-card__row"><span>보류 금액</span><span>{settlement.pendingAmount.toLocaleString()} 원</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}