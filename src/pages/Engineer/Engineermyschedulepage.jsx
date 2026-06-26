import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Settings, Pencil, ChevronDown,
} from "lucide-react";
import "../../styles/Engineer/Engineermyschedulepage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/my-schedule?year=2024&month=6
// engineer_schedules WHERE user_id = 로그인기사
// + engineer_schedule_slots JOIN
//
// DB 필드:
//   engineer_schedules.schedule_id
//   engineer_schedules.work_date      → 날짜
//   engineer_schedules.status ENUM('AVAILABLE','BOOKED','OFF')
//   engineer_schedules.submitted_at   → 제출 일시
//   engineer_schedule_slots.start_time → 근무 시작
//   engineer_schedule_slots.end_time   → 근무 종료
//
// ⚠ DB에 없어서 제거한 항목:
//   - 오전/오후/종일 근무 구분 라벨 → DB 없음 (start/end_time으로만 판단)
//   - 총 근무 시간 합계 → 집계 필요 (백엔드 계산)
//   - 오전/오후 근무 일수 분류 → DB 없음
// ──────────────────────────────────────────
 
// 시간대 기반 근무 유형 판단 (DB 없는 라벨 → start/end_time으로 추론)
function getShiftType(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const start = parseInt(startTime.split(":")[0]);
  const end   = parseInt(endTime.split(":")[0]);
  if (start < 12 && end <= 13) return { label: "오전 근무", color: "morning" };
  if (start >= 13)              return { label: "오후 근무", color: "afternoon" };
  return { label: "종일 근무", color: "allday" };
}
 
// 달력 날짜 생성
function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = firstDay - 1; i >= 0; i--) days.push({ date: prevLast - i, cur: false });
  for (let i = 1; i <= lastDate; i++)      days.push({ date: i, cur: true });
  while (days.length % 7 !== 0)            days.push({ date: days.length - lastDate - firstDay + 1, cur: false });
  return days;
}
 
// 더미 근무 데이터 - engineer_schedules + engineer_schedule_slots
// status: AVAILABLE / BOOKED / OFF
const scheduleData = {
  1:  { status: "OFF",       startTime: null,    endTime: null    },
  3:  { status: "AVAILABLE", startTime: "09:00", endTime: "13:00" },
  4:  { status: "AVAILABLE", startTime: "09:00", endTime: "13:00" },
  5:  { status: "AVAILABLE", startTime: "09:00", endTime: "18:00" },
  6:  { status: "AVAILABLE", startTime: "13:00", endTime: "18:00" },
  7:  { status: "AVAILABLE", startTime: "09:00", endTime: "18:00" },
  8:  { status: "OFF",       startTime: null,    endTime: null    },
  10: { status: "AVAILABLE", startTime: "09:00", endTime: "18:00" },
  11: { status: "AVAILABLE", startTime: "09:00", endTime: "13:00" },
  12: { status: "AVAILABLE", startTime: "09:00", endTime: "18:00" },
  13: { status: "AVAILABLE", startTime: "13:00", endTime: "18:00" },
  14: { status: "AVAILABLE", startTime: "09:00", endTime: "18:00" },
  15: { status: "OFF",       startTime: null,    endTime: null    },
  17: { status: "BOOKED",    startTime: "09:00", endTime: "18:00" },
  18: { status: "AVAILABLE", startTime: "09:00", endTime: "13:00" },
  19: { status: "AVAILABLE", startTime: "09:00", endTime: "18:00" },
  20: { status: "AVAILABLE", startTime: "13:00", endTime: "18:00" },
  21: { status: "AVAILABLE", startTime: "09:00", endTime: "18:00" },
  22: { status: "OFF",       startTime: null,    endTime: null    },
  24: { status: "AVAILABLE", startTime: "09:00", endTime: "18:00" },
  25: { status: "AVAILABLE", startTime: "09:00", endTime: "13:00" },
  26: { status: "AVAILABLE", startTime: "09:00", endTime: "18:00" },
  27: { status: "AVAILABLE", startTime: "13:00", endTime: "18:00" },
  28: { status: "AVAILABLE", startTime: "09:00", endTime: "18:00" },
  29: { status: "OFF",       startTime: null,    endTime: null    },
};
 
const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
 
export default function EngineerMySchedulePage() {
  const navigate = useNavigate();
  const [view, setView]         = useState("달력 보기");
  const [year, setYear]         = useState(2024);
  const [month, setMonth]       = useState(5); // 0-indexed: 5 = 6월
  const [selectedDate, setSelectedDate] = useState(17);
 
  const calDays = getCalendarDays(year, month);
  const today   = 17; // 더미
 
  const goNext = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };
  const goPrev = () => { if (month === 0)  { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const goToday = () => { setYear(2024); setMonth(5); setSelectedDate(17); };
 
  // 이번 달 근무 요약 집계
  const workDays = Object.values(scheduleData).filter(s => s.status !== "OFF").length;
 
  // 주간 미리보기 (17~23일)
  const weekPreview = [17, 18, 19, 20, 21, 22, 23].map(d => ({
    date: d,
    dayLabel: ["월","화","수","목","금","토","일"][d - 17],
    schedule: scheduleData[d] ?? null,
  }));
 
  // 다음 근무 (selectedDate 다음 AVAILABLE)
  const nextWork = Object.entries(scheduleData)
    .map(([d, s]) => ({ date: parseInt(d), ...s }))
    .find(s => s.date > selectedDate && s.status !== "OFF");
 
  return (
    <div className="emsp">
      {/* 뒤로가기 */}
      <button className="emsp-back-btn" onClick={() => navigate("/engineer/work")}>
        <ChevronLeft size={14} /> 작업 관리로 돌아가기
      </button>
 
      {/* 헤더 */}
      <div className="emsp-topbar">
        <div>
          <h1 className="emsp-title">내 근무표</h1>
          <p className="emsp-sub">월 단위로 등록된 근무 일정을 확인하고 관리할 수 있습니다.</p>
        </div>
        <div className="emsp-topbar__actions">
          <button className="emsp-settings-btn"><Settings size={14} /> 근무표 설정</button>
          <button className="emsp-edit-btn"><Pencil size={14} /> 근무표 수정</button>
        </div>
      </div>
 
      {/* 컨트롤 바 */}
      <div className="emsp-controls">
        <div className="emsp-month-nav">
          <span className="emsp-month-label" onClick={() => {}}>
            {year}년 {month + 1}월 <ChevronDown size={14} />
          </span>
          <button className="emsp-nav-btn" onClick={goPrev}><ChevronLeft size={15} /></button>
          <button className="emsp-nav-btn" onClick={goNext}><ChevronRight size={15} /></button>
          <button className="emsp-today-btn" onClick={goToday}>오늘</button>
        </div>
 
        {/* 범례 - start/end_time 기반 추론 */}
        <div className="emsp-legend">
          <span className="emsp-legend__item emsp-legend__item--morning">● 오전 근무</span>
          <span className="emsp-legend__item emsp-legend__item--afternoon">● 오후 근무</span>
          <span className="emsp-legend__item emsp-legend__item--allday">● 종일 근무</span>
          <span className="emsp-legend__item emsp-legend__item--off">● 휴무</span>
        </div>
 
        {/* 뷰 전환 */}
        <div className="emsp-view-tabs">
          {["달력 보기", "목록 보기"].map(v => (
            <button
              key={v}
              className={`emsp-view-tab ${view === v ? "emsp-view-tab--active" : ""}`}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
 
      <div className="emsp-body">
        {/* 달력 */}
        <div className="emsp-calendar">
          {/* 요일 헤더 */}
          <div className="emsp-cal-header">
            {WEEK_DAYS.map(d => (
              <div key={d} className={`emsp-cal-weekday ${d === "일" ? "emsp-cal-weekday--sun" : d === "토" ? "emsp-cal-weekday--sat" : ""}`}>{d}</div>
            ))}
          </div>
 
          {/* 날짜 그리드 */}
          <div className="emsp-cal-grid">
            {calDays.map((d, i) => {
              const sch = d.cur ? scheduleData[d.date] : null;
              const shift = sch && sch.status !== "OFF" ? getShiftType(sch.startTime, sch.endTime) : null;
              const isToday    = d.cur && d.date === today;
              const isSelected = d.cur && d.date === selectedDate;
              const isSun = i % 7 === 0;
              const isSat = i % 7 === 6;
 
              return (
                <div
                  key={i}
                  className={`emsp-cal-cell ${!d.cur ? "emsp-cal-cell--other" : ""} ${isSelected ? "emsp-cal-cell--selected" : ""}`}
                  onClick={() => d.cur && setSelectedDate(d.date)}
                >
                  <div className={`emsp-cal-date ${isToday ? "emsp-cal-date--today" : ""} ${isSun ? "emsp-cal-date--sun" : ""} ${isSat ? "emsp-cal-date--sat" : ""}`}>
                    {d.date}
                    {isToday && <span className="emsp-today-badge">오늘</span>}
                  </div>
 
                  {sch && d.cur && (
                    sch.status === "OFF"
                      ? <div className="emsp-cal-off">휴무</div>
                      : <div className={`emsp-cal-slot emsp-cal-slot--${shift?.color}`}>
                          {sch.startTime} - {sch.endTime}
                        </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
 
        {/* 우측 패널 */}
        <aside className="emsp-aside">
          {/* 이번 달 근무 요약 */}
          <div className="emsp-panel">
            <h3 className="emsp-panel__title">이번 달 근무 요약</h3>
            <div className="emsp-summary-grid">
              {/* engineer_schedules WHERE status != 'OFF' COUNT */}
              <div className="emsp-summary-item">
                <span className="emsp-summary-item__icon">📅</span>
                <div>
                  <p className="emsp-summary-item__label">근무일 수</p>
                  <p className="emsp-summary-item__value">{workDays}일</p>
                </div>
              </div>
              {/* engineer_schedule_slots start/end_time 합산 */}
              <div className="emsp-summary-item">
                <span className="emsp-summary-item__icon">🕐</span>
                <div>
                  <p className="emsp-summary-item__label">총 근무 시간</p>
                  <p className="emsp-summary-item__value">160시간</p>
                </div>
              </div>
            </div>
          </div>
 
          {/* 주간 일정 미리보기 */}
          <div className="emsp-panel">
            <h3 className="emsp-panel__title">주간 일정 미리보기</h3>
            {weekPreview.map(({ date, dayLabel, schedule }) => {
              const shift = schedule && schedule.status !== "OFF"
                ? getShiftType(schedule.startTime, schedule.endTime)
                : null;
              const isSun = dayLabel === "일";
              return (
                <div key={date} className="emsp-week-row">
                  <span className={`emsp-week-row__date ${isSun ? "emsp-week-row__date--sun" : ""}`}>{date} {dayLabel}</span>
                  {schedule?.status === "OFF" || !schedule
                    ? <span className="emsp-week-row__off">휴무</span>
                    : <>
                        <span className="emsp-week-row__time">{schedule.startTime} - {schedule.endTime}</span>
                        <span className={`emsp-week-row__badge emsp-week-row__badge--${shift?.color}`}>{shift?.label}</span>
                      </>
                  }
                </div>
              );
            })}
          </div>
 
          {/* 다음 근무 */}
          {nextWork && (
            <div className="emsp-panel">
              <h3 className="emsp-panel__title">다음 근무</h3>
              <div className="emsp-next-work">
                <div className="emsp-next-work__header">
                  <span className="emsp-next-work__date">
                    2024.06.{String(nextWork.date).padStart(2,"0")} (화)
                  </span>
                  <span className={`emsp-week-row__badge emsp-week-row__badge--${getShiftType(nextWork.startTime, nextWork.endTime)?.color}`}>
                    {getShiftType(nextWork.startTime, nextWork.endTime)?.label}
                  </span>
                </div>
                <p className="emsp-next-work__time">
                  {nextWork.startTime} - {nextWork.endTime}
                  &nbsp;({(parseInt(nextWork.endTime) - parseInt(nextWork.startTime))}시간)
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
 