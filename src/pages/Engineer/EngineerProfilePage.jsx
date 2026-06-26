import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil, Phone, Mail, LogOut,
} from "lucide-react";
import "../../styles/Engineer/EngineerProfilePage.css";

/// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/profile
// users + engineer_profiles + agencies
// + engineer_service_regions (활동 지역)
// + engineer_expert_brands (전문 브랜드)
// + engineer_schedules + engineer_schedule_slots (근무표)
// + lms_confirmations (LMS 이수 현황)
//
// DB 필드:
//   users.name, phone, email, address_detail, created_at, updated_at, last_login_at
//   users.region_id → regions.name (거주 지역)
//   users.agency_id → agencies.name (소속)
//   engineer_profiles.career_started_year
//   engineer_profiles.skill_level ENUM('BEGINNER','INTERMEDIATE','ADVANCED')
//   engineer_profiles.is_lms_completed
//   engineer_profiles.category_id → appliance_categories.name (단일 카테고리)
//   engineer_profiles.profile_image_url
//   engineer_profiles.avg_rating, total_reviews
//   engineer_expert_brands.brand_name (다중)
//   engineer_service_regions → regions.name (활동 지역, 다중)
//   engineer_schedules.work_date, status + engineer_schedule_slots.start_time, end_time
//   lms_confirmations → 이수 진행률, 이수 완료일
//
// skill_level 자동 산정 (career_started_year 기반)
function getSkillLevel(startYear) {
  const years = new Date().getFullYear() - startYear;
  if (years >= 11) return "ADVANCED";
  if (years >= 6)  return "INTERMEDIATE";
  return "BEGINNER";
}
 
const SKILL_MAP = {
  ADVANCED:     { label: "고급 (ADVANCED)",     lv: "LV.3", color: "purple" },
  INTERMEDIATE: { label: "중급 (INTERMEDIATE)", lv: "LV.2", color: "blue"   },
  BEGINNER:     { label: "초급 (BEGINNER)",     lv: "LV.1", color: "green"  },
};
 
// 이번 달 근무표 더미 - engineer_schedules + engineer_schedule_slots
const scheduleWeek = [
  { day: "월", date: 17, status: "AVAILABLE" },
  { day: "화", date: 18, status: "AVAILABLE" },
  { day: "수", date: 19, status: "AVAILABLE" },
  { day: "목", date: 20, status: "BOOKED"    },
  { day: "금", date: 21, status: "AVAILABLE" },
  { day: "토", date: 22, status: "AVAILABLE" },
  { day: "일", date: 23, status: "OFF"       },
];
 
const profile = {
  // users
  name: "김철수",
  phone: "010-1234-5678",
  email: "kim@example.com",
  regionName: "서울 강남구",      // users.region_id → regions.name
  addressDetail: "서울 강남구 테헤란로 123, 456동 789호", // users.address_detail
  createdAt: "2024.04.15",       // users.created_at
  updatedAt: "2024.06.18",       // users.updated_at
  lastLoginAt: "2024.06.18 14:30",
  agencyName: "케어플로우 수리센터", // agencies.name
 
  // engineer_profiles
  profileImageUrl: null,
  careerStartedYear: 2013,
  isLmsCompleted: true,
  categoryName: "냉장고",          // appliance_categories.name (단일)
  avgRating: 4.9,
  totalReviews: 128,
 
  // engineer_expert_brands (다중)
  brands: ["LG"],
 
  // engineer_service_regions → regions.name
  serviceRegions: ["서울 강남구"],
 
  // engineer_schedule_slots.start_time ~ end_time
  workTimeStart: "09:00",
  workTimeEnd:   "18:00",
  scheduleSubmitted: true,          // engineer_schedules.submitted_at IS NOT NULL
 
  // lms_confirmations
  lmsProgress: 100,
  lmsCompletedAt: "2024.03.25",
};
 
export default function EngineerProfilePage() {
  const skillLevel  = getSkillLevel(profile.careerStartedYear);
  const skill       = SKILL_MAP[skillLevel];
  const careerYears = new Date().getFullYear() - profile.careerStartedYear;
  const navigate = useNavigate();

  return (
    <div className="epp">
      {/* 헤더 */}
      <div className="epp-topbar">
        <div>
          <h1 className="epp-title">기사 프로필 관리</h1>
          <p className="epp-sub">기사 기본 정보와 근무 정보를 확인 및 수정할 수 있습니다.</p>
        </div>
        <button className="epp-edit-btn"><Pencil size={13} /> 프로필 수정</button>
      </div>
 
      {/* 상단: 프로필 카드 + 기본 정보 */}
      <div className="epp-top">
        {/* 좌측 프로필 */}
        <div className="epp-profile-card">
          <div className="epp-avatar-wrap">
            <div className="epp-avatar">
              {profile.profileImageUrl
                ? <img src={profile.profileImageUrl} alt="프로필" />
                : <span>{profile.name.charAt(0)}</span>
              }
            </div>
          </div>
          <p className="epp-profile-name">{profile.name} 기사</p>
          <span className={`epp-skill-badge epp-skill-badge--${skill.color}`}>{skill.label}</span>
          <p className="epp-profile-agency-label">소속</p>
          <p className="epp-profile-agency">{profile.agencyName}</p>
          <div className="epp-profile-contact">
            <p><Phone size={12} /> {profile.phone}</p>
            <p><Mail size={12} /> {profile.email}</p>
          </div>
        </div>
 
        {/* 우측 기본 정보 */}
        <div className="epp-info-card">
          <div className="epp-info-card__header">
            <h3 className="epp-info-card__title">기본 정보</h3>
            <button className="epp-icon-btn"><Pencil size={13} /> 편집</button>
          </div>
          <div className="epp-info-grid">
            {/* users.name */}
            <div className="epp-info-row"><span className="epp-info-label">이름</span><span>{profile.name}</span></div>
            {/* users.phone */}
            <div className="epp-info-row"><span className="epp-info-label">연락처</span><span>{profile.phone}</span></div>
            {/* engineer_profiles.career_started_year */}
            <div className="epp-info-row"><span className="epp-info-label">경력 시작 연도</span><span>{profile.careerStartedYear}년</span></div>
            {/* engineer_service_regions */}
            <div className="epp-info-row"><span className="epp-info-label">활동 지역</span><span>{profile.serviceRegions.join(", ")}</span></div>
            {/* engineer_profiles.skill_level (자동 산정) */}
            <div className="epp-info-row">
              <span className="epp-info-label">기술 등급</span>
              <span>{skill.label} <span className="epp-info-hint">ⓘ</span></span>
            </div>
            {/* users.region_id → regions.name */}
            <div className="epp-info-row"><span className="epp-info-label">거주 지역</span><span>{profile.regionName}</span></div>
            {/* engineer_profiles.category_id → appliance_categories.name (단일) */}
            <div className="epp-info-row">
              <span className="epp-info-label">전문 가전 카테고리</span>
              <span>{profile.categoryName} <span className="epp-single-badge">단일 카테고리</span></span>
            </div>
            {/* users.address_detail */}
            <div className="epp-info-row"><span className="epp-info-label">상세 주소</span><span>{profile.addressDetail}</span></div>
            {/* engineer_expert_brands.brand_name (다중) */}
            <div className="epp-info-row"><span className="epp-info-label">전문 브랜드</span><span>{profile.brands.join(", ")}</span></div>
            {/* users.created_at */}
            <div className="epp-info-row"><span className="epp-info-label">가입일</span><span>{profile.createdAt}</span></div>
            {/* users.email */}
            <div className="epp-info-row"><span className="epp-info-label">이메일</span><span>{profile.email}</span></div>
            {/* users.updated_at */}
            <div className="epp-info-row"><span className="epp-info-label">최종 정보 수정일</span><span>{profile.updatedAt}</span></div>
          </div>
        </div>
      </div>
 
      {/* 중단: 전문 정보 + 이번 달 근무표 + LMS */}
      <div className="epp-mid">
        {/* 전문 정보 */}
        <div className="epp-mid-card">
          <div className="epp-mid-card__header">
            <span className="epp-mid-card__icon">🔧</span>
            <h3 className="epp-mid-card__title">전문 정보</h3>
          </div>
          <div className="epp-spec-list">
            {/* engineer_profiles.category_id */}
            <div className="epp-spec-row">
              <span className="epp-spec-label">주요 수리 분야</span>
              <span>{profile.categoryName} 수리 및 정비</span>
            </div>
            {/* engineer_expert_brands */}
            <div className="epp-spec-row">
              <span className="epp-spec-label">전문 브랜드</span>
              <span>{profile.brands.join(", ")}</span>
            </div>
            {/* engineer_profiles.career_started_year */}
            <div className="epp-spec-row">
              <span className="epp-spec-label">활동 경력</span>
              <span>{careerYears}년 ({profile.careerStartedYear}년 ~ 현재)</span>
            </div>
          </div>
          <button className="epp-mid-card__btn">
            <Pencil size={13} /> 전문 정보 수정
          </button>
        </div>
 
        {/* 이번 달 근무표 - engineer_schedules + engineer_schedule_slots */}
        <div className="epp-mid-card">
          <div className="epp-mid-card__header">
            <span className="epp-mid-card__icon">📅</span>
            <h3 className="epp-mid-card__title">이번 달 근무표</h3>
            {profile.scheduleSubmitted && (
              <span className="epp-submitted-badge">제출 완료</span>
            )}
          </div>
          <p className="epp-schedule-month">2024년 6월 근무표</p>
          <div className="epp-schedule-week">
            {scheduleWeek.map((s) => (
              <div key={s.date} className="epp-schedule-day">
                <span className="epp-schedule-day__label">{s.day}</span>
                <span className="epp-schedule-day__date">{s.date}</span>
                <span className={`epp-schedule-day__dot epp-schedule-day__dot--${s.status.toLowerCase()}`} />
              </div>
            ))}
          </div>
          {/* engineer_schedule_slots.start_time ~ end_time */}
          <div className="epp-schedule-info">
            <div className="epp-schedule-info__row">
              <span>근무 가능 시간</span>
              <span>{profile.workTimeStart} ~ {profile.workTimeEnd}</span>
            </div>
            <div className="epp-schedule-info__row">
              <span>휴무일</span>
              <span>매주 일요일</span>
            </div>
          </div>
          <button className="epp-mid-card__btn" onClick={() => navigate("/engineer/schedule")}>
           📋 근무표 보기
          </button>
        </div>
 
        {/* LMS 교육 상태 - lms_confirmations + engineer_profiles.is_lms_completed */}
        <div className="epp-mid-card">
          <div className="epp-mid-card__header">
            <span className="epp-mid-card__icon">🎓</span>
            <h3 className="epp-mid-card__title">LMS 교육 상태</h3>
            <span className={`epp-lms-badge ${profile.isLmsCompleted ? "epp-lms-badge--done" : "epp-lms-badge--fail"}`}>
              {profile.isLmsCompleted ? "✓ 이수 완료" : "미이수"}
            </span>
          </div>
          <div className="epp-lms-info">
            {/* engineer_profiles.skill_level */}
            <div className="epp-lms-row"><span>기술 등급</span><span>{skill.label}</span></div>
            {/* engineer_profiles.category_id */}
            <div className="epp-lms-row"><span>전문 카테고리</span><span>{profile.categoryName}</span></div>
            <div className="epp-lms-row"><span>연도</span><span>2024 필수 교육</span></div>
          </div>
          {/* lms_confirmations 이수 진행률 */}
          <div className="epp-lms-progress-section">
            <p className="epp-lms-progress-label">이수 진행률</p>
            <div className="epp-lms-progress-bar">
              <div className="epp-lms-progress-fill" style={{ width: `${profile.lmsProgress}%` }} />
            </div>
            <span className="epp-lms-progress-pct">{profile.lmsProgress}%</span>
          </div>
          <div className="epp-lms-row"><span>이수 완료일</span><span>{profile.lmsCompletedAt}</span></div>
          <button className="epp-mid-card__btn">
            📖 교육 내역 보기
          </button>
        </div>
      </div>
 
      {/* 하단: 계정 및 보안 */}
      <div className="epp-security">
        <div className="epp-security__header">
          <span>🛡</span>
          <h3 className="epp-security__title">계정 및 보안</h3>
        </div>
        <div className="epp-security__grid">
          {/* users.password_hash → 비밀번호 변경 */}
          <div className="epp-security__item">
            <div>
              <p className="epp-security__item-label">비밀번호</p>
              <p className="epp-security__item-value">**********</p>
            </div>
            <button className="epp-security__btn">변경</button>
          </div>
          {/* users.last_login_at */}
          <div className="epp-security__item">
            <div>
              <p className="epp-security__item-label">현재 로그인 정보</p>
              <p className="epp-security__item-value">{profile.lastLoginAt}</p>
            </div>
            <button className="epp-security__btn epp-security__btn--logout">
              <LogOut size={13} /> 로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}