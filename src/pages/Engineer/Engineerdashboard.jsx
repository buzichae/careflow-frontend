import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, CheckCircle, Star, Wallet,
  Car, MapPin, Wrench, ClipboardCheck, FileText,
  Phone, Mail, MapPin as MapPinIcon, ChevronDown,
  Shield,
} from "lucide-react";

import "../../styles/Engineer/Engineerdashboard.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/dashboard
// engineer_profiles + users + as_assignments + settlements + reviews JOIN
//
// DB 주요 필드:
//   users.name → 기사 이름
//   engineer_profiles.skill_level → BEGINNER/INTERMEDIATE/ADVANCED (LV.1~3)
//   engineer_profiles.avg_rating → 평균 평점 (역정규화)
//   engineer_profiles.total_reviews → 총 리뷰 수
//   engineer_profiles.is_lms_completed → 배차 가능 여부
//   as_assignments WHERE engineer_id = 로그인 기사, status=ACCEPTED → 오늘 예정 작업
//   as_status_logs.to_status → 현재 작업 상태 (WAITING/ENGINEER_DEPARTED/ENGINEER_ARRIVED/IN_PROGRESS/COMPLETED)
//   settlements.engineer_net_amount 합산 → 이번 달 수익
//
// as_status_logs.to_status ENUM:
//   WAITING / ENGINEER_DEPARTED / ENGINEER_ARRIVED / IN_PROGRESS / COMPLETED
// ──────────────────────────────────────────

const WORK_STATUS_STEPS = [
  { key: "ENGINEER_DEPARTED", label: "출발",   sub: "작업지로 출발" },
  { key: "ENGINEER_ARRIVED",  label: "도착",   sub: "현장 도착"   },
  { key: "IN_PROGRESS",       label: "수리 중", sub: "수리 및 점검" },
  { key: "COMPLETED",         label: "완료",   sub: "작업 완료"   },
];

const QUICK_ACTIONS = [
  { key: "ENGINEER_DEPARTED", label: "출발",      color: "blue",     icon: Car           },
  { key: "ENGINEER_ARRIVED",  label: "도착",      color: "purple",   icon: MapPin        },
  { key: "IN_PROGRESS",       label: "수리 시작",  color: "green",    icon: Wrench        },
  { key: "COMPLETED",         label: "작업 완료",  color: "orange",   icon: ClipboardCheck },
  { key: "REPORT",            label: "보고서 작성", color: "lavender", icon: FileText      },
];

const todaySchedule = [
  {
    assignmentId: 1,
    time: "10:00", status: "BOOKED",
    productName: "LG 디오스 냉장고", modelNo: "F873S11E",
    customerName: "김민지", customerPhone: "010-1234-5678",
    address: "서울 강남구 테헤란로 123",
    productImageUrl: null,
    symptom: "냉장실 냉각 약함, 냉동실 성에 발생",
    visitRequest: "빠른 방문 요청",
    lastRepair: { date: "2024.01.15", desc: "수리 완료 — 냉장실 온도 이상" },
  },
  {
    assignmentId: 2,
    time: "14:00", status: "BOOKED",
    productName: "삼성 그랑데 세탁기", modelNo: "WF21T6500KP",
    customerName: "이영희", customerPhone: "010-9876-5432",
    address: "경기 성남시 분당구 정자일로 45",
    productImageUrl: null,
    symptom: "세탁 중 소음 발생",
    visitRequest: null,
    lastRepair: null,
  },
  {
    assignmentId: 3,
    time: "16:30", status: "BOOKED",
    productName: "LG 휘센 에어컨", modelNo: "FQ18HDWHRN",
    customerName: "박준호", customerPhone: "010-5555-1111",
    address: "경기 용인시 수지구 죽전로 152",
    productImageUrl: null,
    symptom: "냉방 약함",
    visitRequest: null,
    lastRepair: null,
  },
];

const notices = [
  { id: 1, text: "6월 정산 일정 안내",       date: "2024.06.01" },
  { id: 2, text: "여름철 에어컨 점검 가이드", date: "2024.05.28" },
  { id: 3, text: "서비스 품질 향상 캠페인",   date: "2024.05.20" },
];

const engineer = {
  name: "김철수",
  skillLevel: "ADVANCED",
  isLmsCompleted: true,
  avgRating: 4.9,
  totalReviews: 128,
  profileImageUrl: null,
};

const currentWorkStatus = "ENGINEER_DEPARTED";

export default function EngineerDashboard() {
  const navigate = useNavigate();

  const [workStatus, setWorkStatus] = useState(currentWorkStatus);
  const currentStepIdx = WORK_STATUS_STEPS.findIndex(s => s.key === workStatus);

  const handleQuickAction = (key) => {
  if (key === "REPORT") {
    navigate("/engineer/report");
    return;
  }

  setWorkStatus(key);
};

  return (
    <div className="ed">
      <div className="ed-greeting">
        <h1 className="ed-greeting__title">안녕하세요, {engineer.name} 기사님! 👋</h1>
        <p className="ed-greeting__sub">오늘도 안전하고 정확한 서비스 부탁드립니다.</p>
      </div>

      {/* ── 수정 1: 통계 카드 → 고객 AS cas-kpi 스타일 (아이콘 워터마크) ── */}
      <div className="ed-stats">
        <div className="ed-stat-card">
          <div className="ed-stat-card__text">
            <p className="ed-stat-card__value">3<span>건</span></p>
            <p className="ed-stat-card__label">오늘 예정 작업</p>
            <button className="ed-stat-card__link">전체 일정 보기 ›</button>
          </div>
          <Calendar className="ed-stat-card__watermark" strokeWidth={1} />
        </div>
        <div className="ed-stat-card">
          <div className="ed-stat-card__text">
            <p className="ed-stat-card__value">1<span>건</span></p>
            <p className="ed-stat-card__label">완료한 작업</p>
            <p className="ed-stat-card__sub">오늘 완료</p>
          </div>
          <CheckCircle className="ed-stat-card__watermark" strokeWidth={1} />
        </div>
        <div className="ed-stat-card">
          <div className="ed-stat-card__text">
            <p className="ed-stat-card__value">{engineer.avgRating}<span className="ed-stat-card__star"> ★</span></p>
            <p className="ed-stat-card__label">평균 고객 평점</p>
            <p className="ed-stat-card__sub">최근 30일 기준</p>
          </div>
          <Star className="ed-stat-card__watermark" strokeWidth={1} />
        </div>
        <div className="ed-stat-card">
          <div className="ed-stat-card__text">
            <p className="ed-stat-card__value ed-stat-card__value--lg">620,000<span>원</span></p>
            <p className="ed-stat-card__label">이번 달 수익</p>
            <p className="ed-stat-card__sub">정산 예정 금액</p>
          </div>
          <Wallet className="ed-stat-card__watermark" strokeWidth={1} />
        </div>
      </div>

      <div className="ed-body">
        <div className="ed-left">
          <div className="ed-section">
            <h2 className="ed-section__title">현재 작업 상태</h2>
            <div className="ed-work-steps">
              {WORK_STATUS_STEPS.map((step, i) => {
                const isDone    = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                return (
                  <div key={step.key} className="ed-step">
                    <div className={`ed-step__dot ${isDone ? "ed-step__dot--done" : ""} ${isCurrent ? "ed-step__dot--current" : ""}`}>
                      {isDone ? <CheckCircle size={14} color="#fff" /> : null}
                    </div>
                    {i < WORK_STATUS_STEPS.length - 1 && (
                      <div className={`ed-step__line ${i < currentStepIdx ? "ed-step__line--done" : ""}`} />
                    )}
                    <p className={`ed-step__label ${isCurrent ? "ed-step__label--current" : ""}`}>{step.label}</p>
                    <p className="ed-step__sub">{step.sub}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ed-section">
            <h2 className="ed-section__title">빠른 액션</h2>
            <div className="ed-quick-actions">
  {QUICK_ACTIONS.map((a) => {

    // 보고서 버튼
    if (a.key === "REPORT") {
      return (
        <button
          key={a.key}
          className={`ed-quick-btn ${
            workStatus === "COMPLETED"
              ? "ed-quick-btn--active"
              : "ed-quick-btn--disabled"
          }`}
          disabled={workStatus !== "COMPLETED"}
          onClick={() => handleQuickAction(a.key)}
        >
          <a.icon size={16} />
          {a.label}
        </button>
      );
    }

    const stepIdx = WORK_STATUS_STEPS.findIndex(
      (step) => step.key === a.key
    );

    const isDone = stepIdx < currentStepIdx;
    const isCurrent = stepIdx === currentStepIdx;
    const isNext = stepIdx === currentStepIdx + 1;

    return (
      <button
        key={a.key}
        className={`ed-quick-btn ${
          isCurrent
            ? "ed-quick-btn--active"
            : isDone
            ? "ed-quick-btn--done"
            : "ed-quick-btn--disabled"
        }`}
        disabled={!(isCurrent || isNext)}
        onClick={() => handleQuickAction(a.key)}
      >
        <a.icon size={16} />
        {a.label}
      </button>
    );
  })}
</div>
          </div>

          <div className="ed-section">
            <h2 className="ed-section__title">오늘의 작업 일정</h2>
            <div className="ed-schedule-list">
              {todaySchedule.map((item) => (
                <div key={item.assignmentId} className="ed-schedule-item">
                  <div className="ed-schedule-item__time">
                    <span className="ed-schedule-item__hour">{item.time}</span>
                    <span className="ed-schedule-item__badge">예정</span>
                  </div>
                  <div className="ed-schedule-item__dot" />
                  <div className="ed-schedule-item__product-img">
                    {item.productImageUrl
                      ? <img src={item.productImageUrl} alt={item.productName} />
                      : <div className="ed-schedule-item__product-placeholder">📦</div>
                    }
                  </div>
                  <div className="ed-schedule-item__info">
                    <p className="ed-schedule-item__product">{item.productName}</p>
                    <p className="ed-schedule-item__customer">{item.customerName} 고객 | {item.customerPhone}</p>
                    <p className="ed-schedule-item__address"><MapPinIcon size={11} /> {item.address}</p>
                  </div>
                  <div className="ed-schedule-item__actions">
                    <button className="ed-schedule-detail-btn">상세 보기</button>
                    <button className="ed-schedule-call-btn"><Phone size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <button className="ed-more-btn">더 많은 일정 보기 <ChevronDown size={13} /></button>
          </div>

          <div className="ed-banner-row">
            <div className="ed-banner ed-banner--purple">
              <p className="ed-banner__title">고객 만족도가 다음 작업으로 이어집니다! 😊</p>
              <p className="ed-banner__sub">정확한 진단과 친절한 서비스로 고객에게 신뢰를 주세요.</p>
            </div>
            <div className="ed-banner ed-banner--blue">
              <Shield size={20} color="#2563eb" />
              <div>
                <p className="ed-banner__title">안전이 최우선입니다!</p>
                <p className="ed-banner__sub">작업 전 안전 점검을 잊지 마세요.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="ed-right">
          <div className="ed-panel">
            <div className="ed-panel__header">
              <h3 className="ed-panel__title">다음 방문 고객 정보</h3>
              <button 
                className="ed-panel__link"
                onClick={() => navigate("/engineer/customers")}
                >
                  고객 상세 정보 보기 ›
              </button>
            </div>
            <div className="ed-customer-card">
              <div className="ed-customer-card__product-img">📦</div>
              <div className="ed-customer-card__info">
                <p className="ed-customer-card__name">
                  {todaySchedule[0].customerName} 고객
                  <span className="ed-vip-badge">VIP</span>
                </p>
                <p className="ed-customer-card__phone"><Phone size={11} /> {todaySchedule[0].customerPhone}</p>
                <p className="ed-customer-card__email"><Mail size={11} /> minji.kim@email.com</p>
                <p className="ed-customer-card__address"><MapPinIcon size={11} /> 서울 강남구 테헤란로 123, 101동 1004호</p>
              </div>
            </div>
            <div className="ed-customer-detail">
              <div className="ed-customer-detail__row">
                <span className="ed-customer-detail__label">제품 정보</span>
                <span>{todaySchedule[0].productName}<br/><span className="ed-customer-detail__sub">모델명: {todaySchedule[0].modelNo}</span></span>
              </div>
              <div className="ed-customer-detail__row">
                <span className="ed-customer-detail__label">접수 내용(증상)</span>
                <span>{todaySchedule[0].symptom}</span>
              </div>
              <div className="ed-customer-detail__row">
                <span className="ed-customer-detail__label">요청 사항</span>
                <span>{todaySchedule[0].visitRequest ?? "-"}</span>
              </div>
              {todaySchedule[0].lastRepair && (
                <div className="ed-customer-detail__row">
                  <span className="ed-customer-detail__label">과거 수리 이력</span>
                  <span>{todaySchedule[0].lastRepair.date} {todaySchedule[0].lastRepair.desc}</span>
                </div>
              )}
            </div>
          </div>

          {/* 개인 실적 및 정산 */}
          <div className="ed-panel">
            <div className="ed-panel__header">
              <h3 className="ed-panel__title">개인 실적 및 정산</h3>
              <div className="ed-panel__period">2024.06.01 ~ 2024.06.30 <ChevronDown size={12} /></div>
            </div>
            <div className="ed-perf-grid">
              {/* ── 수정 2: 차트 제거 → 숫자 + 상태 태그 ── */}
              <div className="ed-perf-card">
                <p className="ed-perf-card__label">작업 건수</p>
                <p className="ed-perf-card__value-big">22<span>건</span></p>
                <div className="ed-perf-card__counts">
                  <span className="ed-perf-count ed-perf-count--done">완료 12</span>
                  <span className="ed-perf-count ed-perf-count--ing">진행 22</span>
                  <span className="ed-perf-count ed-perf-count--cancel">취소 8</span>
                </div>
              </div>

              <div className="ed-perf-card">
                <p className="ed-perf-card__label">정산 금액</p>
                <p className="ed-perf-card__amount">620,000원</p>
                <p className="ed-perf-card__sub2">이번 달 예정 금액</p>
                <p className="ed-perf-card__prev">지난 달 560,000원</p>
              </div>

              <div className="ed-perf-card">
                <p className="ed-perf-card__label">고객 평점</p>
                <p className="ed-perf-card__rating">{engineer.avgRating}</p>
                <div className="ed-perf-stars">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`ed-star ${s <= Math.floor(engineer.avgRating) ? "ed-star--full" : ""}`}>★</span>
                  ))}
                </div>
                <p className="ed-perf-card__sub2">({engineer.totalReviews}건)</p>
                <p className="ed-perf-card__prev">지난 달 4.8</p>
              </div>
            </div>
          </div>

          <div className="ed-panel">
            <div className="ed-panel__header">
              <h3 className="ed-panel__title">알림</h3>
              <button
                className="ed-panel__link"
                onClick={() => navigate("/engineer/notice")}
              >
                전체 보기 ›
              </button>
            </div>
            {notices.map((n) => (
              <div key={n.id} className="ed-notice-item">
                <div className="ed-notice-item__dot" />
                <span className="ed-notice-item__text">{n.text}</span>
                <span className="ed-notice-item__date">{n.date}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}