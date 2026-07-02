import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, CheckCircle, Star, Wallet,
  Car, MapPin, Wrench, ClipboardCheck, FileText,
  Phone, Mail, MapPin as MapPinIcon, ChevronDown,
  Shield,
} from "lucide-react";

import { getEngineerDashboard, updateAssignmentStatus } from "../../apis/engineers";
import "../../styles/Engineer/Engineerdashboard.css";

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

export default function EngineerDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [engineer, setEngineer] = useState({
    name: "", skillLevel: "", isLmsCompleted: false,
    avgRating: 0, totalReviews: 0, profileImageUrl: null,
  });
  const [stats, setStats] = useState({
    todayCount: 0, completedTodayCount: 0, monthlyEarnings: 0,
  });
  const [workStatus, setWorkStatus] = useState(null);

  // ⚠ 응답에 currentAssignmentId/currentRequestId가 없습니다.
  // "빠른 액션" 버튼을 실제로 누를 수 있으려면 오늘 배정된 작업 중 진행 중인 건의 ID가 필요해요.
  // 백엔드에 이 필드 추가를 요청하거나, todaySchedules 배열의 첫 항목 ID를 쓰는 임시 방편이 필요합니다.
  const [currentRequestId, setCurrentRequestId] = useState(null);

  const [todaySchedule, setTodaySchedule] = useState([]);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    let mounted = true;

    getEngineerDashboard()
      .then((res) => {
        if (!mounted) return;
        const d = res.data;

        setEngineer({
          name: d.engineerName ?? "",
          skillLevel: d.skillLevel ?? "",
          isLmsCompleted: d.lmsCompleted ?? false,
          avgRating: d.avgRating ?? 0,
          totalReviews: d.totalReviews ?? 0,
          profileImageUrl: d.profileImageUrl ?? null,
        });
        setStats({
          todayCount: d.todayExpectedCount ?? 0,
          completedTodayCount: d.todayCompletedCount ?? 0,
          monthlyEarnings: d.thisMonthExpectedEarning ?? 0,
        });
        setWorkStatus(d.currentWorkStatus ?? null);

        const schedules = d.todaySchedules ?? [];
        setTodaySchedule(schedules);
        // 임시 방편: 오늘 일정 중 첫 번째 항목의 requestId를 현재 작업으로 사용
        setCurrentRequestId(schedules[0]?.requestId ?? null);

        setNotices(d.notices ?? []);
      })
      .catch((err) => {
        console.error("대시보드 조회 실패:", err);
        if (mounted) setError("대시보드 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const currentStepIdx = WORK_STATUS_STEPS.findIndex((s) => s.key === workStatus);

  const handleQuickAction = async (key) => {
    if (key === "REPORT") {
      navigate("/engineer/report/submit", { state: { requestId: currentRequestId } });
      return;
    }

    if (!currentRequestId) return;

    const prevStatus = workStatus;
    setWorkStatus(key);

    try {
      await updateAssignmentStatus(currentRequestId, key);
    } catch (err) {
      console.error("작업 상태 변경 실패:", err);
      setWorkStatus(prevStatus);
      alert("작업 상태 변경에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (loading) {
    return <div className="ed">불러오는 중...</div>;
  }

  if (error) {
    return <div className="ed">{error}</div>;
  }

  const nextCustomer = todaySchedule[0];

  return (
    <div className="ed">
      <div className="ed-greeting">
        <h1 className="ed-greeting__title">안녕하세요, {engineer.name} 기사님! 👋</h1>
        <p className="ed-greeting__sub">오늘도 안전하고 정확한 서비스 부탁드립니다.</p>
      </div>

      <div className="ed-stats">
        <div className="ed-stat-card">
          <div className="ed-stat-card__text">
            <p className="ed-stat-card__value">{stats.todayCount}<span>건</span></p>
            <p className="ed-stat-card__label">오늘 예정 작업</p>
            <button className="ed-stat-card__link">전체 일정 보기 ›</button>
          </div>
          <Calendar className="ed-stat-card__watermark" strokeWidth={1} />
        </div>
        <div className="ed-stat-card">
          <div className="ed-stat-card__text">
            <p className="ed-stat-card__value">{stats.completedTodayCount}<span>건</span></p>
            <p className="ed-stat-card__label">완료한 작업</p>
            <p className="ed-stat-card__sub">오늘 완료</p>
          </div>
          <CheckCircle className="ed-stat-card__watermark" strokeWidth={1} />
        </div>
        <div className="ed-stat-card">
          <div className="ed-stat-card__text">
            <p className="ed-stat-card__value">{engineer.avgRating}<span className="ed-stat-card__star"> ★</span></p>
            <p className="ed-stat-card__label">평균 고객 평점</p>
          </div>
          <Star className="ed-stat-card__watermark" strokeWidth={1} />
        </div>
        <div className="ed-stat-card">
          <div className="ed-stat-card__text">
            <p className="ed-stat-card__value ed-stat-card__value--lg">{stats.monthlyEarnings.toLocaleString()}<span>원</span></p>
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
                const isDone = i <= currentStepIdx;
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
                if (a.key === "REPORT") {
                  return (
                    <button
                      key={a.key}
                      className={`ed-quick-btn ${workStatus === "COMPLETED" ? "ed-quick-btn--active" : "ed-quick-btn--disabled"}`}
                      disabled={workStatus !== "COMPLETED"}
                      onClick={() => handleQuickAction(a.key)}
                    >
                      <a.icon size={16} />
                      {a.label}
                    </button>
                  );
                }

                const stepIdx = WORK_STATUS_STEPS.findIndex((step) => step.key === a.key);
                const isDone = stepIdx < currentStepIdx;
                const isCurrent = stepIdx === currentStepIdx;
                const isNext = stepIdx === currentStepIdx + 1;

                return (
                  <button
                    key={a.key}
                    className={`ed-quick-btn ${isCurrent ? "ed-quick-btn--active" : isDone ? "ed-quick-btn--done" : "ed-quick-btn--disabled"}`}
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
              {todaySchedule.length === 0 && (
                <p style={{ padding: "16px", color: "#aaa", fontSize: 13 }}>오늘 예정된 작업이 없습니다.</p>
              )}
              {todaySchedule.map((item) => (
                <div key={item.requestId ?? item.assignmentId} className="ed-schedule-item">
                  <div className="ed-schedule-item__time">
                    <span className="ed-schedule-item__hour">{item.time}</span>
                    <span className="ed-schedule-item__badge">예정</span>
                  </div>
                  <div className="ed-schedule-item__dot" />
                  <div className="ed-schedule-item__product-img">
                    {item.productImageUrl
                      ? <img src={item.productImageUrl} alt={item.productName} />
                      : <div className="ed-schedule-item__product-placeholder">📦</div>}
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
          {nextCustomer && (
            <div className="ed-panel">
              <div className="ed-panel__header">
                <h3 className="ed-panel__title">다음 방문 고객 정보</h3>
                <button className="ed-panel__link" onClick={() => navigate("/engineer/customers")}>
                  고객 상세 정보 보기 ›
                </button>
              </div>
              <div className="ed-customer-card">
                <div className="ed-customer-card__product-img">📦</div>
                <div className="ed-customer-card__info">
                  <p className="ed-customer-card__name">
                    {nextCustomer.customerName} 고객
                    {nextCustomer.isVip && <span className="ed-vip-badge">VIP</span>}
                  </p>
                  <p className="ed-customer-card__phone"><Phone size={11} /> {nextCustomer.customerPhone}</p>
                  {nextCustomer.customerEmail && (
                    <p className="ed-customer-card__email"><Mail size={11} /> {nextCustomer.customerEmail}</p>
                  )}
                  <p className="ed-customer-card__address"><MapPinIcon size={11} /> {nextCustomer.address}</p>
                </div>
              </div>
              <div className="ed-customer-detail">
                <div className="ed-customer-detail__row">
                  <span className="ed-customer-detail__label">제품 정보</span>
                  <span>{nextCustomer.productName}<br /><span className="ed-customer-detail__sub">모델명: {nextCustomer.modelNo}</span></span>
                </div>
                <div className="ed-customer-detail__row">
                  <span className="ed-customer-detail__label">접수 내용(증상)</span>
                  <span>{nextCustomer.symptom}</span>
                </div>
                <div className="ed-customer-detail__row">
                  <span className="ed-customer-detail__label">요청 사항</span>
                  <span>{nextCustomer.visitRequest ?? "-"}</span>
                </div>
                {nextCustomer.lastRepair && (
                  <div className="ed-customer-detail__row">
                    <span className="ed-customer-detail__label">과거 수리 이력</span>
                    <span>{nextCustomer.lastRepair.date} {nextCustomer.lastRepair.desc}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ⚠ performance(작업건수/정산금액/평점 상세)는 대시보드 응답에 없어서 패널 자체를 제거했습니다.
              필요하면 별도 API(예: 실적/정산 페이지의 getSettlementSummary)를 여기서도 호출하거나,
              백엔드에 대시보드 응답에 필드 추가를 요청해야 합니다. */}

          <div className="ed-panel">
            <div className="ed-panel__header">
              <h3 className="ed-panel__title">알림</h3>
              <button className="ed-panel__link" onClick={() => navigate("/engineer/notice")}>
                전체 보기 ›
              </button>
            </div>
            {notices.length === 0 && (
              <p style={{ color: "#aaa", fontSize: 13 }}>새로운 알림이 없습니다.</p>
            )}
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