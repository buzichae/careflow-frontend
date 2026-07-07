import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, CheckCircle, Star, Wallet,
  Car, MapPin, Wrench, ClipboardCheck, FileText,
  Phone, Mail, MapPin as MapPinIcon, ChevronDown,
  Shield,
} from "lucide-react";

import { getEngineerDashboard, updateAssignmentStatus, getSettlementSummary, getEngineerReviewStats, getEngineerAssignments } from "../../apis/engineers";
import "../../styles/Engineer/Engineerdashboard.css";

const WORK_STATUS_STEPS = [
  { key: "ENGINEER_DEPARTED", label: "출발",   sub: "작업지로 출발" },
  { key: "ENGINEER_ARRIVED",  label: "도착",   sub: "현장 도착"   },
  { key: "IN_PROGRESS",       label: "수리 중", sub: "수리 및 점검" },
  { key: "COMPLETED",         label: "완료",   sub: "작업 완료"   },
];

// [버그 수정] 백엔드의 상태 변경 API(updateEngineerTaskStatus)는 출발/도착/작업시작
// 3단계만 지원하고, "완료(COMPLETED)"는 이 API로 바꿀 수 없게 막혀있음
// ("해당 API로는 출발/도착/작업시작 상태만 변경 가능합니다." 403 에러).
// 완료 처리는 보고서 제출(submitWorkReport) 시 백엔드가 자동으로 처리함.
// → "작업 완료" 퀵액션 버튼을 없애고, "수리 시작" 다음엔 바로 "보고서 작성"으로 연결.
const QUICK_ACTIONS = [
  { key: "ENGINEER_DEPARTED", label: "출발",      color: "blue",     icon: Car           },
  { key: "ENGINEER_ARRIVED",  label: "도착",      color: "purple",   icon: MapPin        },
  { key: "IN_PROGRESS",       label: "수리 시작",  color: "green",    icon: Wrench        },
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

  // 상태 변경 API(/tasks/{requestId}/status)에 쓸 진짜 AsRequest PK
  const [currentRequestId, setCurrentRequestId] = useState(null);
  // 작업관리 페이지로 이동/식별할 때 쓸 AsAssignment PK
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null);

  const [todaySchedule, setTodaySchedule] = useState([]);

  // "개인 실적 및 정산" 패널 데이터 — /api/engineer/settlements/summary 재사용
  const [performance, setPerformance] = useState({
    workCount: { done: 0, cancel: 0 },
    settlement: { current: 0, previous: 0 },
    rating: { avg: 0, total: 0, previous: 0 },
    period: "",
  });

  const [notices, setNotices] = useState([]);

  // [수정] "빠른 액션"이 작동할 대상을 자동으로 첫 번째 일정으로만 고정하지 않고,
  // 오늘 일정이 여러 건일 때 사용자가 직접 클릭해서 고를 수 있도록
  // selectWorkItem()으로 currentRequestId/currentAssignmentId/workStatus를
  // 한 번에 전환하는 헬퍼를 분리.
  const selectWorkItem = useCallback((item) => {
    if (!item) {
      setCurrentRequestId(null);
      setCurrentAssignmentId(null);
      setWorkStatus(null);
      return;
    }
    setCurrentRequestId(item.asRequestId ?? null);
    setCurrentAssignmentId(item.assignmentId ?? null);
    setWorkStatus(item.logStatus ?? null);
  }, []);

  // 대시보드 스냅샷 (기사 정보 + 오늘 일정 + 현재 작업 상태 + 알림)
useEffect(() => {
  let mounted = true;

  getEngineerDashboard()
    .then((res) => {
      if (!mounted) return;
      const d = res.data;

      setEngineer((prev) => ({
        ...prev,
        name: d.engineerName ?? "",
        skillLevel: d.skillLevel ?? "",
        isLmsCompleted: d.lmsCompleted ?? false,
        totalReviews: d.totalReviews ?? 0,
        profileImageUrl: d.profileImageUrl ?? null,
      }));
      setStats({
        todayCount: d.todayExpectedCount ?? 0,
        completedTodayCount: d.todayCompletedCount ?? 0,
        monthlyEarnings: d.thisMonthExpectedEarning ?? 0,
      });
      // ⚠ workStatus / currentRequestId / todaySchedule은 더 이상 이 요약 API 값을
      // 쓰지 않음 — 작업관리(EngineerWorkPage)와 동일한 소스(getEngineerAssignments)에서
      // 가져오도록 아래 fetchCurrentWork()로 대체함. (요약 API가 "오늘" 기준으로만
      // 내려주거나 값을 제대로 못 내려주는 경우, 작업관리엔 있는데 대시보드엔 안 보이는
      // 불일치가 생겼었음)
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

  // 현재 작업 상태 / 빠른 액션 / 작업 일정 — 작업관리(EngineerWorkPage)와 동일하게
  // getEngineerAssignments("ACCEPTED")를 조회해서 두 화면의 데이터가 항상 일치하도록 함.
  const fetchCurrentWork = useCallback(() => {
    return getEngineerAssignments("ACCEPTED")
      .then((res) => {
        const d = res.data;
        const list = (d.content ?? d.list ?? []).map((item) => ({
          ...item,
          visitTime: `${item.scheduledDate ?? ""} ${item.scheduledTime ?? ""}`.trim(),
        }));

        // 예정 일시가 가장 빠른 작업을 목록 맨 위로 정렬 (기본 선택값으로도 사용)
        const sorted = [...list].sort((a, b) =>
          `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`)
        );

        setTodaySchedule(sorted);

        // [수정] 이전엔 sorted[0]을 무조건 "현재 작업"으로 고정해서, 오늘 일정이
        // 2건 이상이어도 사용자가 고를 방법이 없었음. 기본값으로만 첫 항목을
        // 선택해두고, 실제 선택은 selectWorkItem()을 통해 언제든 바꿀 수 있게 함.
        setCurrentAssignmentId((prevId) => {
          const stillExists = sorted.find((item) => item.assignmentId === prevId);
          if (stillExists) {
            // 상태만 최신화
            selectWorkItem(stillExists);
            return prevId;
          } else {
            // 없으면 첫 번째 항목 선택
            selectWorkItem(sorted[0] ?? null);
            return sorted[0]?.assignmentId ?? null;
          }
        });
      });
  }, [selectWorkItem]); // 의존성 배열 유지

  useEffect(() => {
    fetchCurrentWork();
  }, [fetchCurrentWork]);

  // 개인 실적 및 정산 — 별도 API로 이번 달 요약 조회 (engineer 정보 세팅 이후 실행)
  useEffect(() => {
    let mounted = true;

    const now = new Date();
    // [수정] "이번 달"로만 좁혀서 조회하면, 실적/정산 페이지에서 겪었던 것과
    // 같은 문제(이번 달 외 데이터가 전부 0건으로 보임)가 생길 수 있어 범위를 넓힘.
    const dateFrom = "2020-01-01";
    const dateTo = now.toISOString().slice(0, 10);

    getSettlementSummary(dateFrom, dateTo)
      .then((res) => {
        if (!mounted) return;
        const s = res.data;

        setPerformance({
          workCount: {
            // [수정] "진행 중" 건수는 실적 API의 과거 누적치(inProgressCount)가 아니라
            // 대시보드가 이미 갖고 있는 실시간 진행 목록(todaySchedule.length)을
            // 화면 렌더링 시 사용하도록 변경 — 여기서는 완료/취소 누적치만 저장.
            done: s.totalCompletedCount ?? 0,
            cancel: s.cancelledCount ?? 0,
          },
          settlement: {
            current: s.monthlyComparison?.thisMonthNetAmount ?? s.settlementSummary?.engineerNetAmount ?? 0,
            previous: s.monthlyComparison?.prevMonthNetAmount ?? 0,
          },
          rating: {
            avg: s.monthlyComparison?.thisMonthAvgRating ?? s.avgRating ?? 0,
            total: engineer.totalReviews, // 이 API엔 총 리뷰 건수가 없어 대시보드 API 값 재사용
            previous: s.monthlyComparison?.prevMonthAvgRating ?? 0,
          },
          period: "전체 기간",
        });
      })
      .catch((err) => {
        console.error("실적 요약 조회 실패:", err);
      });

    return () => { mounted = false; };
  }, [engineer.totalReviews]);

  useEffect(() => {
  let mounted = true;
  getEngineerReviewStats()
    .then((res) => {
      if (!mounted) return;
      setEngineer((prev) => ({ ...prev, avgRating: res.data.avgRating ?? 0 }));
    })
    .catch((err) => {
      console.error("평점 조회 실패:", err);
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
    setWorkStatus(key); // 낙관적 업데이트

    try {
      await updateAssignmentStatus(currentRequestId, key);
      // 상태 변경 후 목록을 다시 불러와 todaySchedule의 logStatus도 최신화
      fetchCurrentWork();
    } catch (err) {
      console.error("작업 상태 변경 실패:", err);
      setWorkStatus(prevStatus); // 실패 시 롤백
      alert("작업 상태 변경에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (loading) {
    return <div className="ed">불러오는 중...</div>;
  }

  if (error) {
    return <div className="ed">{error}</div>;
  }

  const nextCustomer = todaySchedule.find(
    (item) => item.assignmentId === currentAssignmentId
  ) ?? todaySchedule[0];

  return (
    <div className="ed">
      <div className="ed-greeting">
        <h1 className="ed-greeting__title">안녕하세요, {engineer.name} 기사님! 👋</h1>
        <p className="ed-greeting__sub">오늘도 안전하고 정확한 서비스 부탁드립니다.</p>
      </div>

      <div className="ed-stats">
        <div className="ed-stat-card">
          <div className="ed-stat-card__text">
            {/* [수정] 별도 요약 API(todayExpectedCount)가 "진짜 오늘 날짜"만 세다 보니
                아래 목록엔 작업이 있는데도 여기는 0건으로 보여 혼란을 줬음.
                → 아래 "진행 중인 전체 작업" 목록과 동일한 수치(todaySchedule.length)로
                통일해서 항상 같은 숫자를 보여주도록 변경. */}
            <p className="ed-stat-card__value">{todaySchedule.length}<span>건</span></p>
            <p className="ed-stat-card__label">예정 작업</p>
            <button
             className="ed-stat-card__link"
             onClick={() => navigate("/engineer/schedule")}
            >
              전체 일정 보기 ›
            </button>
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
            <p className="ed-stat-card__sub">전체 리뷰 기준</p>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="ed-section__title">현재 작업 상태</h2>
              <button
                className="ed-panel__link"
                onClick={() => navigate("/engineer/work", { state: { assignmentId: currentAssignmentId } })}
              >
                작업 관리에서 보기 ›
              </button>
            </div>
            {/* [안내] 아래 "빠른 액션"과 이 단계는 현재 선택된 작업(파란 테두리로
                표시된 항목) 기준으로 동작합니다. 다른 작업으로 바꾸려면
                아래 "진행 중인 전체 작업" 목록에서 해당 항목을 클릭하세요. */}
            {todaySchedule.length > 1 && (
              <p style={{ fontSize: 12, color: "#888", margin: "4px 0 8px" }}>
                ℹ 아래 "진행 중인 전체 작업" 목록에서 항목을 클릭해 빠른 액션 대상을 선택할 수 있어요.
              </p>
            )}
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
                      className={`ed-quick-btn ${workStatus === "IN_PROGRESS" ? "ed-quick-btn--active" : "ed-quick-btn--disabled"}`}
                      disabled={workStatus !== "IN_PROGRESS"}
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
                    disabled={!isNext || !currentRequestId}
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
            <h2 className="ed-section__title">
              진행 중인 전체 작업 <span style={{ color: "#5B4FF5", fontWeight: 700 }}>({todaySchedule.length}건)</span>
            </h2>
            {/* [수정] 상단 "오늘 예정 작업" 카드는 오늘 날짜 기준 건수만 세고,
                이 목록은 날짜와 무관하게 현재 ACCEPTED 상태인 작업 전체를 보여줌
                — 둘이 다른 개념이라 헷갈리지 않도록 라벨을 명확히 분리함. */}
            <div className="ed-schedule-list">
              {todaySchedule.length === 0 && (
                <p style={{ padding: "16px", color: "#aaa", fontSize: 13 }}>예정된 작업이 없습니다.</p>
              )}
              {todaySchedule.map((item) => {
                const isSelected = item.assignmentId === currentAssignmentId;
                return (
                  <div
                    key={item.requestId ?? item.assignmentId}
                    className="ed-schedule-item"
                    onClick={() => selectWorkItem(item)}
                    style={{
                      cursor: "pointer",
                      border: isSelected ? "2px solid #5B4FF5" : "2px solid transparent",
                      borderRadius: 10,
                      background: isSelected ? "#f8f7ff" : undefined,
                    }}
                  >
                    <div className="ed-schedule-item__time">
                      <span className="ed-schedule-item__date">{item.scheduledDate}</span>
                      <span className="ed-schedule-item__hour">{item.scheduledTime}</span>
                      <span className="ed-schedule-item__badge">
                        {isSelected ? "선택됨" : "예정"}
                      </span>
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
                      <button
                        className="ed-schedule-detail-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/engineer/work", { state: { assignmentId: item.assignmentId } });
                        }}
                      >
                        상세 보기
                      </button>
                      <button
                        className="ed-schedule-call-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
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
                  <span>{nextCustomer.symptomDesc ?? nextCustomer.symptom}</span>
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

          <div className="ed-panel">
            <div className="ed-panel__header">
              <h3 className="ed-panel__title">개인 실적 및 정산</h3>
              <div className="ed-panel__period">{performance.period} <ChevronDown size={12} /></div>
            </div>
            <div className="ed-perf-grid">
              <div
                className="ed-perf-card"
                onClick={() => navigate("/engineer/work")}
                style={{ cursor: "pointer" }}
                title="작업 관리에서 전체 내역 보기"
              >
                <p className="ed-perf-card__label">작업 건수</p>
                <p className="ed-perf-card__value-big">
                  {performance.workCount.done + todaySchedule.length + performance.workCount.cancel}<span>건</span>
                </p>
                <div className="ed-perf-card__counts">
                  <span className="ed-perf-count ed-perf-count--done">완료 {performance.workCount.done}</span>
                  <span className="ed-perf-count ed-perf-count--ing">진행 {todaySchedule.length}</span>
                  <span className="ed-perf-count ed-perf-count--cancel">취소 {performance.workCount.cancel}</span>
                </div>
              </div>

              <div className="ed-perf-card">
                <p className="ed-perf-card__label">정산 금액</p>
                <p className="ed-perf-card__amount">{performance.settlement.current.toLocaleString()}원</p>
                <p className="ed-perf-card__sub2">예정 금액</p>
                <p className="ed-perf-card__prev">지난 달 {performance.settlement.previous.toLocaleString()}원</p>
              </div>

              <div className="ed-perf-card">
                <p className="ed-perf-card__label">고객 평점</p>
                <p className="ed-perf-card__rating">{performance.rating.avg}</p>
                <div className="ed-perf-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`ed-star ${s <= Math.floor(performance.rating.avg) ? "ed-star--full" : ""}`}>★</span>
                  ))}
                </div>
                <p className="ed-perf-card__sub2">({performance.rating.total}건)</p>
                <p className="ed-perf-card__prev">지난 달 {performance.rating.previous}</p>
              </div>
            </div>
          </div>

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