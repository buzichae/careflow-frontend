import { useState } from "react";
import {
  Users, Circle, BookCheck, ClipboardList, Star,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, MoreVertical, RefreshCw,
  Phone, Mail, Building2, X, UserPlus,
} from "lucide-react";
import "../../styles/Agency/Agencyengineerpage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/agency/engineers?page=0&size=10
// users + engineer_profiles + engineer_service_regions(regions JOIN)
// + engineer_expert_brands + engineer_schedules(오늘 상태)
// + as_assignments COUNT(이번달 완료건) + engineer_profiles.avg_rating
//
// 응답 필드:
//   userId (users.user_id)
//   name, phone, email (users)
//   profileImageUrl (engineer_profiles.profile_image_url)
//   categoryId, categoryName (appliance_categories - 단일)  
//   skillLevel (engineer_profiles.skill_level ENUM)
//   isLmsCompleted (engineer_profiles.is_lms_completed)
//   careerStartedYear (engineer_profiles.career_started_year)
//   brands[] (engineer_expert_brands.brand_name)
//   regions[] (engineer_service_regions → regions.name)    ← 시(depth=1) 단위로 표시
//   scheduleStatus (engineer_schedules.status AVAILABLE/BOOKED/OFF) 
//   monthlyDone (as_assignments COUNT WHERE 이번달 COMPLETED) 
//   avgRating (engineer_profiles.avg_rating)
//   totalReviews (engineer_profiles.total_reviews)
//   joinedAt (users.created_at)                           
//   agencyName (agencies.name via users.agency_id)         
// ──────────────────────────────────────────

const SKILL_MAP = {
  ADVANCED:     { label: "고급", type: "advanced",     en: "ADVANCED"     },
  INTERMEDIATE: { label: "중급", type: "intermediate", en: "INTERMEDIATE" },
  BEGINNER:     { label: "초급", type: "beginner",     en: "BEGINNER"     },
};

const SCHEDULE_STATUS_MAP = {
  AVAILABLE: { label: "근무 중", type: "available" },
  BOOKED:    { label: "작업 중", type: "booked"    },
  OFF:       { label: "휴무",   type: "off"        },
};

const statCards = [
  { label: "전체 기사",         value: 142,    unit: "명",   icon: Users,         color: "purple" },
  { label: "활동 중",           value: 126,    unit: "명",   icon: Circle,        color: "green"  },
  { label: "교육 이수 완료",    value: 118,    unit: "명",   icon: BookCheck,     color: "blue"   },
  { label: "이번 달 완료 건수", value: "1,248",unit: "건",   icon: ClipboardList, color: "orange" },
  { label: "평균 평점",         value: "4.8",  unit: "/5.0", icon: Star,          color: "amber"  },
];

const engineerList = [
  { userId: 101, name: "김현수", phone: "010-1234-5678", email: "kimhs@email.com",  regions: ["서울", "경기"], specialty: "냉장고",   brands: ["LG"],       skillLevel: "ADVANCED",     isLmsCompleted: true,  monthlyDone: 28, avgRating: 4.9, totalReviews: 128, scheduleStatus: "BOOKED",    profileImg: null, careerStartedYear: 2014, agencyName: "퀵케어 서비스", joinedAt: "2023.03.15" },
  { userId: 102, name: "박민수", phone: "010-2345-6789", email: "pmins@email.com",  regions: ["인천", "경기"], specialty: "에어컨",   brands: ["삼성"],     skillLevel: "INTERMEDIATE", isLmsCompleted: true,  monthlyDone: 24, avgRating: 4.8, totalReviews: 96,  scheduleStatus: "AVAILABLE", profileImg: null, careerStartedYear: 2017, agencyName: "퀵케어 서비스", joinedAt: "2023.05.20" },
  { userId: 103, name: "이정호", phone: "010-3456-7890", email: "ljh@email.com",    regions: ["서울", "경기"], specialty: "TV",        brands: ["삼성", "LG"],skillLevel: "ADVANCED",     isLmsCompleted: true,  monthlyDone: 31, avgRating: 4.9, totalReviews: 124, scheduleStatus: "BOOKED",    profileImg: null, careerStartedYear: 2012, agencyName: "퀵케어 서비스", joinedAt: "2022.11.01" },
  { userId: 104, name: "최재민", phone: "010-4567-8901", email: "cjm@email.com",    regions: ["경기", "충청"], specialty: "냉장고",   brands: ["LG"],       skillLevel: "INTERMEDIATE", isLmsCompleted: true,  monthlyDone: 19, avgRating: 4.7, totalReviews: 76,  scheduleStatus: "AVAILABLE", profileImg: null, careerStartedYear: 2018, agencyName: "퀵케어 서비스", joinedAt: "2023.07.10" },
  { userId: 105, name: "정우진", phone: "010-5678-9012", email: "jwj@email.com",    regions: ["부산", "울산"], specialty: "세탁기",   brands: ["삼성"],     skillLevel: "BEGINNER",     isLmsCompleted: true,  monthlyDone: 15, avgRating: 4.6, totalReviews: 60,  scheduleStatus: "AVAILABLE", profileImg: null, careerStartedYear: 2021, agencyName: "퀵케어 서비스", joinedAt: "2024.01.05" },
  { userId: 106, name: "홍길동", phone: "010-6789-0123", email: "hgd@email.com",    regions: ["대구", "경북"], specialty: "에어컨",   brands: ["LG"],       skillLevel: "INTERMEDIATE", isLmsCompleted: false, monthlyDone: 12, avgRating: 4.5, totalReviews: 48,  scheduleStatus: "AVAILABLE", profileImg: null, careerStartedYear: 2019, agencyName: "퀵케어 서비스", joinedAt: "2023.09.22" },
  { userId: 107, name: "김수현", phone: "010-7890-1234", email: "ksh@email.com",    regions: ["광주", "전라"], specialty: "TV",        brands: ["삼성"],     skillLevel: "BEGINNER",     isLmsCompleted: false, monthlyDone: 8,  avgRating: 4.2, totalReviews: 32,  scheduleStatus: "AVAILABLE", profileImg: null, careerStartedYear: 2022, agencyName: "퀵케어 서비스", joinedAt: "2024.03.01" },
  { userId: 108, name: "이재훈", phone: "010-8901-2345", email: "ljh2@email.com",   regions: ["울산", "경남"], specialty: "세탁기",   brands: ["삼성", "LG"],skillLevel: "INTERMEDIATE", isLmsCompleted: true,  monthlyDone: 22, avgRating: 4.8, totalReviews: 88,  scheduleStatus: "BOOKED",    profileImg: null, careerStartedYear: 2017, agencyName: "퀵케어 서비스", joinedAt: "2023.04.15" },
  { userId: 109, name: "박성우", phone: "010-9012-3456", email: "psw@email.com",    regions: ["서울", "인천"], specialty: "에어컨",   brands: ["LG"],       skillLevel: "ADVANCED",     isLmsCompleted: true,  monthlyDone: 27, avgRating: 4.9, totalReviews: 108, scheduleStatus: "OFF",       profileImg: null, careerStartedYear: 2013, agencyName: "퀵케어 서비스", joinedAt: "2022.08.20" },
  { userId: 110, name: "배민수", phone: "010-0123-4567", email: "bms@email.com",    regions: ["경기", "강원"], specialty: "냉장고",   brands: ["위니아"],   skillLevel: "BEGINNER",     isLmsCompleted: false, monthlyDone: 6,  avgRating: 4.3, totalReviews: 24,  scheduleStatus: "AVAILABLE", profileImg: null, careerStartedYear: 2023, agencyName: "퀵케어 서비스", joinedAt: "2024.02.10" },
];

function formatEngineerId(userId) {
  return `ENG-${String(userId).padStart(5, "0")}`;
}

function getCareerYears(startYear) {
  return new Date().getFullYear() - startYear;
}

function Avatar({ name, profileImg, size = 36 }) {
  return (
    <div className="aep-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {profileImg ? <img src={profileImg} alt={name} /> : <span>{name?.charAt(0)}</span>}
    </div>
  );
}

const DETAIL_TABS = ["기본 정보", "근무표", "실적 및 정산", "LMS 교육", "리뷰"];

export default function AgencyEngineerPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailTab, setDetailTab] = useState("기본 정보");
  const totalPages = 15;

  return (
    <div className="aep">
      {/* 헤더 */}
      <div className="aep-header">
        <h1 className="aep-header__title">기사 관리</h1>
        <p className="aep-header__sub">소속 기사 정보를 관리하고 근무 현황과 실적을 확인할 수 있습니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="aep-stats">
        {statCards.map((s) => (
          <div key={s.label} className="aep-stat-card">
            <div className={`aep-stat-card__icon aep-stat-card__icon--${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="aep-stat-card__label">{s.label}</p>
              <p className="aep-stat-card__value">{s.value}<span>{s.unit}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="aep-filters">
        <div className="aep-search">
          <Search size={13} color="#aaa" />
          <input type="text" placeholder="이름, 연락처, 기사 ID 검색" />
        </div>
        <div className="aep-filter-select"><span>활동 지역</span><ChevronDown size={13} /></div>
        <div className="aep-filter-select"><span>전문 가전</span><ChevronDown size={13} /></div>
        <div className="aep-filter-select"><span>기술 등급</span><ChevronDown size={13} /></div>
        <div className="aep-filter-select"><span>교육 상태</span><ChevronDown size={13} /></div>
        <div className="aep-filter-select"><span>근무 상태</span><ChevronDown size={13} /></div>
        <button className="aep-reset-btn"><RefreshCw size={13} /> 필터 초기화</button>
        <button className="aep-invite-btn"><UserPlus size={14} /> 가입 신청 관리</button>
      </div>

      <div className="aep-body">
        <div className="aep-left">
          <div className="aep-table">
            <div className="aep-table__header">
              <span><input type="checkbox" /></span>
              <span>기사 정보</span>
              <span>연락처</span>
              <span>활동 지역</span>
              <span>전문 가전</span>
              <span>기술 등급</span>
              <span>LMS 교육 상태</span>
              <span>이번 달 완료</span>
              <span>평균 평점</span>      
              <span>근무 상태</span>
              <span>관리</span>
            </div>

            {engineerList.map((item) => {
              const skill = SKILL_MAP[item.skillLevel];
              const schedule = SCHEDULE_STATUS_MAP[item.scheduleStatus];
              const isSelected = selectedItem?.userId === item.userId;
              return (
                <div key={item.userId} className={`aep-table__row ${isSelected ? "aep-table__row--selected" : ""}`}>
                  <span><input type="checkbox" /></span>
                  <span className="aep-table__engineer-col">
                    <Avatar name={item.name} profileImg={item.profileImg} size={34} />
                    <div>
                      <span className="aep-table__name">{item.name} 기사</span>
                      <span className="aep-table__engineer-id">{formatEngineerId(item.userId)}</span>
                    </div>
                  </span>
                  <span className="aep-table__phone">{item.phone}</span>
                  <span className="aep-table__region">{item.regions.join(", ")}</span>
                  <span className="aep-table__specialty">{item.specialty}</span>
                  <span>
                    <div className={`aep-skill-badge aep-skill-badge--${skill.type}`}>
                      <span>{skill.label}</span>
                      <span className="aep-skill-badge__en">{skill.en}</span>
                    </div>
                  </span>
                  <span>
                    {item.isLmsCompleted
                      ? <span className="aep-lms-badge aep-lms-badge--done">이수 완료</span>
                      : <span className="aep-lms-badge aep-lms-badge--fail">미이수</span>
                    }
                  </span>
                  <span className="aep-table__monthly">{item.monthlyDone}건</span>
                  <span className="aep-table__rating">⭐ {item.avgRating}</span>
                  <span>
                    <span className={`aep-status-badge aep-status-badge--${schedule.type}`}>{schedule.label}</span>
                  </span>
                  <span className="aep-table__actions">
                    <button
                      className={`aep-detail-btn ${isSelected ? "aep-detail-btn--active" : ""}`}
                      onClick={() => { setSelectedItem(item); setDetailTab("기본 정보"); }}
                    >
                      상세
                    </button>
                    <button className="aep-more-btn"><MoreVertical size={14} /></button>
                  </span>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          <div className="aep-pagination">
            <div className="aep-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {[1,2,3,4,5].map(p => (
                <button key={p} className={currentPage === p ? "aep-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <span className="aep-pagination__ellipsis">...</span>
              <button className={currentPage === 15 ? "aep-pagination__active" : ""} onClick={() => setCurrentPage(15)}>15</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="aep-page-size">10개씩 보기 <ChevronDown size={13} /></div>
          </div>
        </div>

        {/* 우측 상세 패널 */}
        {selectedItem && (
          <aside className="aep-detail">
            <div className="aep-detail__header">
              <span className="aep-detail__title">기사 상세 정보</span>
              <button className="aep-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
            </div>

            {/* 프로필 */}
            <div className="aep-detail__profile">
              <Avatar name={selectedItem.name} profileImg={selectedItem.profileImg} size={52} />
              <div>
                <div className="aep-detail__profile-name">
                  {selectedItem.name} 기사
                  <span className={`aep-status-badge aep-status-badge--${SCHEDULE_STATUS_MAP[selectedItem.scheduleStatus].type}`}>
                    {SCHEDULE_STATUS_MAP[selectedItem.scheduleStatus].label}
                  </span>
                </div>
                <p className="aep-detail__profile-id">{formatEngineerId(selectedItem.userId)}</p>
                <div className="aep-detail__profile-rating">
                  ⭐ {selectedItem.avgRating} (리뷰 {selectedItem.totalReviews}건)
                </div>
              </div>
            </div>

            {/* 탭 */}
            <div className="aep-detail__tabs">
              {DETAIL_TABS.map((tab) => (
                <button
                  key={tab}
                  className={`aep-detail__tab ${detailTab === tab ? "aep-detail__tab--active" : ""}`}
                  onClick={() => setDetailTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="aep-detail__body">
              {detailTab === "기본 정보" && (
                <div className="aep-detail__info">
                  <div className="aep-detail__info-row"><span className="aep-detail__info-label">연락처</span><span className="aep-detail__info-value">{selectedItem.phone} <Phone size={11} /></span></div>
                  <div className="aep-detail__info-row"><span className="aep-detail__info-label">이메일</span><span className="aep-detail__info-value">{selectedItem.email} <Mail size={11} /></span></div>
                  <div className="aep-detail__info-row"><span className="aep-detail__info-label">활동 지역</span><span className="aep-detail__info-value">{selectedItem.regions.join(", ")}</span></div>
                  <div className="aep-detail__info-row"><span className="aep-detail__info-label">전문 가전</span><span className="aep-detail__info-value">{selectedItem.specialty}</span></div>
                  {/* 브랜드는 engineer_expert_brands (다중) */}
                  <div className="aep-detail__info-row"><span className="aep-detail__info-label">전문 브랜드</span><span className="aep-detail__info-value">{selectedItem.brands.join(", ")}</span></div>
                  <div className="aep-detail__info-row">
                    <span className="aep-detail__info-label">경력 시작</span>
                    <span className="aep-detail__info-value">
                      {selectedItem.careerStartedYear}년 (경력 {getCareerYears(selectedItem.careerStartedYear)}년)
                    </span>
                  </div>
                  <div className="aep-detail__info-row">
                    <span className="aep-detail__info-label">기술 등급</span>
                    <span className="aep-detail__info-value">
                      {SKILL_MAP[selectedItem.skillLevel].label} ({selectedItem.skillLevel})
                    </span>
                  </div>
                  <div className="aep-detail__info-row"><span className="aep-detail__info-label">소속 대행사</span><span className="aep-detail__info-value">{selectedItem.agencyName} <Building2 size={11} /></span></div>
                  <div className="aep-detail__info-row"><span className="aep-detail__info-label">가입일</span><span className="aep-detail__info-value">{selectedItem.joinedAt}</span></div>

                  {/* LMS 교육 상태 */}
                  <div className="aep-detail__lms-section">
                    <p className="aep-detail__section-label">LMS 교육 상태 (2024)</p>
                    <div className="aep-detail__lms-row">
                      {selectedItem.isLmsCompleted
                        ? <span className="aep-lms-badge aep-lms-badge--done">이수 완료</span>
                        : <span className="aep-lms-badge aep-lms-badge--fail">미이수</span>
                      }
                      <button className="aep-detail__lms-link">교육 내역 보기</button>
                    </div>
                    {!selectedItem.isLmsCompleted && (
                      <p className="aep-detail__lms-warn">⚠ LMS 미이수 — 배차 불가 상태</p>
                    )}
                  </div>

                  <div className="aep-detail__month-section">
                    <p className="aep-detail__section-label">이번 달 현황</p>
                    <div className="aep-detail__month-cards">
                      <div className="aep-detail__month-card">
                        <p className="aep-detail__month-label">완료 건수</p>
                        <p className="aep-detail__month-value">{selectedItem.monthlyDone}건</p>
                      </div>
                      <div className="aep-detail__month-card">
                        <p className="aep-detail__month-label">평균 평점</p>
                        <p className="aep-detail__month-value">{selectedItem.avgRating}</p>
                      </div>
                      <div className="aep-detail__month-card">
                        <p className="aep-detail__month-label">수익</p>
                        <p className="aep-detail__month-value">₩{(selectedItem.monthlyDone * 88000).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "근무표" && (
                <div className="aep-detail__coming-soon">
                  근무표 탭 — API 연동 후 구현<br />
                  <span>GET /api/agency/engineers/{"{userId}"}/schedules</span><br />
                  <span>engineer_schedules.status: AVAILABLE / BOOKED / OFF</span>
                </div>
              )}
              {detailTab === "실적 및 정산" && (
                <div className="aep-detail__coming-soon">
                  실적 및 정산 탭 — API 연동 후 구현<br />
                  <span>GET /api/agency/engineers/{"{userId}"}/settlements</span>
                </div>
              )}
              {detailTab === "LMS 교육" && (
                <div className="aep-detail__coming-soon">
                  LMS 교육 탭 — API 연동 후 구현<br />
                  <span>GET /api/agency/engineers/{"{userId}"}/lms</span><br />
                  <span>lms_confirmations + lms_contents JOIN</span>
                </div>
              )}
              {detailTab === "리뷰" && (
                <div className="aep-detail__coming-soon">
                  리뷰 탭 — API 연동 후 구현<br />
                  <span>GET /api/agency/engineers/{"{userId}"}/reviews</span>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}