import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Settings, Pencil, ChevronDown,
} from "lucide-react";
import { getMonthlyWorkSchedule } from "../../apis/engineers"; // 실제 경로에 맞게 수정
import "../../styles/Engineer/Engineermyschedulepage.css";

// 시간대 기반 근무 유형 판단 (DB에 라벨이 없어서 start/end_time으로 추론)
function getShiftType(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const start = parseInt(startTime.split(":")[0]);
  const end = parseInt(endTime.split(":")[0]);
  if (start < 12 && end <= 13) return { label: "오전 근무", color: "morning" };
  if (start >= 13) return { label: "오후 근무", color: "afternoon" };
  return { label: "종일 근무", color: "allday" };
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = firstDay - 1; i >= 0; i--) days.push({ date: prevLast - i, cur: false });
  for (let i = 1; i <= lastDate; i++) days.push({ date: i, cur: true });
  while (days.length % 7 !== 0) days.push({ date: days.length - lastDate - firstDay + 1, cur: false });
  return days;
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// 슬롯 여러 개를 하나의 표시용 시작~종료로 합침 (가장 이른 시작 ~ 가장 늦은 종료)
function mergeSlots(timeSlots) {
  if (!timeSlots || timeSlots.length === 0) return { startTime: null, endTime: null, totalMinutes: 0 };
  let start = timeSlots[0].start;
  let end = timeSlots[0].end;
  let totalMinutes = 0;
  timeSlots.forEach((slot) => {
    if (timeToMinutes(slot.start) < timeToMinutes(start)) start = slot.start;
    if (timeToMinutes(slot.end) > timeToMinutes(end)) end = slot.end;
    totalMinutes += timeToMinutes(slot.end) - timeToMinutes(slot.start);
  });
  return { startTime: start, endTime: end, totalMinutes };
}

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function EngineerMySchedulePage() {
  const navigate = useNavigate();
  const [view, setView] = useState("달력 보기");
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scheduleData, setScheduleData] = useState({}); // { [day]: { status, startTime, endTime, totalMinutes } }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    // API는 실제 월(1~12)을 기대하므로 month(0-indexed) + 1
    getMonthlyWorkSchedule(year, month + 1)
      .then((res) => {
        if (!mounted) return;
        const list = res.data ?? [];
        const map = {};
        list.forEach((item) => {
          const day = new Date(item.workDate).getDate();
          const { startTime, endTime, totalMinutes } = mergeSlots(item.timeSlots);
          map[day] = {
            scheduleId: item.scheduleId,
            status: item.status, // AVAILABLE / BOOKED / OFF
            startTime,
            endTime,
            totalMinutes,
          };
        });
        setScheduleData(map);
      })
      .catch((err) => {
        console.error("근무표 조회 실패:", err);
        if (mounted) setError("근무표를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [year, month]);

  const calDays = getCalendarDays(year, month);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const todayDate = isCurrentMonth ? today.getDate() : null;

  const goNext = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };
  const goPrev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(today.getDate()); };

  // 이번 달 근무 요약 집계 (클라이언트에서 계산 — API가 집계값을 안 줌)
  const { workDays, totalHours } = useMemo(() => {
    const entries = Object.values(scheduleData);
    const workDays = entries.filter((s) => s.status !== "OFF").length;
    const totalMinutes = entries.reduce((sum, s) => sum + (s.totalMinutes ?? 0), 0);
    return { workDays, totalHours: Math.round(totalMinutes / 60) };
  }, [scheduleData]);

  // 주간 미리보기 (선택한 날짜 기준 7일)
  const weekPreview = Array.from({ length: 7 }, (_, i) => {
    const d = selectedDate + i;
    const dateObj = new Date(year, month, d);
    return {
      date: d,
      dayLabel: WEEK_DAYS[dateObj.getDay()],
      schedule: scheduleData[d] ?? null,
    };
  });

  // 다음 근무 (selectedDate 다음 AVAILABLE/BOOKED)
  const nextWork = Object.entries(scheduleData)
    .map(([d, s]) => ({ date: parseInt(d), ...s }))
    .filter((s) => s.date > selectedDate && s.status !== "OFF")
    .sort((a, b) => a.date - b.date)[0];

  return (
    <div className="emsp">
      <button className="emsp-back-btn" onClick={() => navigate("/engineer/work")}>
        <ChevronLeft size={14} /> 작업 관리로 돌아가기
      </button>

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

      <div className="emsp-controls">
        <div className="emsp-month-nav">
          <span className="emsp-month-label">
            {year}년 {month + 1}월 <ChevronDown size={14} />
          </span>
          <button className="emsp-nav-btn" onClick={goPrev}><ChevronLeft size={15} /></button>
          <button className="emsp-nav-btn" onClick={goNext}><ChevronRight size={15} /></button>
          <button className="emsp-today-btn" onClick={goToday}>오늘</button>
        </div>

        <div className="emsp-legend">
          <span className="emsp-legend__item emsp-legend__item--morning">● 오전 근무</span>
          <span className="emsp-legend__item emsp-legend__item--afternoon">● 오후 근무</span>
          <span className="emsp-legend__item emsp-legend__item--allday">● 종일 근무</span>
          <span className="emsp-legend__item emsp-legend__item--off">● 휴무</span>
        </div>

        <div className="emsp-view-tabs">
          {["달력 보기", "목록 보기"].map((v) => (
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

      {loading && <p style={{ padding: "16px" }}>불러오는 중...</p>}
      {error && <p style={{ padding: "16px", color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div className="emsp-body">
          <div className="emsp-calendar">
            <div className="emsp-cal-header">
              {WEEK_DAYS.map((d) => (
                <div key={d} className={`emsp-cal-weekday ${d === "일" ? "emsp-cal-weekday--sun" : d === "토" ? "emsp-cal-weekday--sat" : ""}`}>{d}</div>
              ))}
            </div>

            <div className="emsp-cal-grid">
              {calDays.map((d, i) => {
                const sch = d.cur ? scheduleData[d.date] : null;
                const shift = sch && sch.status !== "OFF" ? getShiftType(sch.startTime, sch.endTime) : null;
                const isToday = d.cur && d.date === todayDate;
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

          <aside className="emsp-aside">
            <div className="emsp-panel">
              <h3 className="emsp-panel__title">이번 달 근무 요약</h3>
              <div className="emsp-summary-grid">
                <div className="emsp-summary-item">
                  <span className="emsp-summary-item__icon">📅</span>
                  <div>
                    <p className="emsp-summary-item__label">근무일 수</p>
                    <p className="emsp-summary-item__value">{workDays}일</p>
                  </div>
                </div>
                <div className="emsp-summary-item">
                  <span className="emsp-summary-item__icon">🕐</span>
                  <div>
                    <p className="emsp-summary-item__label">총 근무 시간</p>
                    <p className="emsp-summary-item__value">{totalHours}시간</p>
                  </div>
                </div>
              </div>
            </div>

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
                    {!schedule || schedule.status === "OFF"
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

            {nextWork && (
              <div className="emsp-panel">
                <h3 className="emsp-panel__title">다음 근무</h3>
                <div className="emsp-next-work">
                  <div className="emsp-next-work__header">
                    <span className="emsp-next-work__date">
                      {year}.{String(month + 1).padStart(2, "0")}.{String(nextWork.date).padStart(2, "0")}
                    </span>
                    <span className={`emsp-week-row__badge emsp-week-row__badge--${getShiftType(nextWork.startTime, nextWork.endTime)?.color}`}>
                      {getShiftType(nextWork.startTime, nextWork.endTime)?.label}
                    </span>
                  </div>
                  <p className="emsp-next-work__time">
                    {nextWork.startTime} - {nextWork.endTime}
                    &nbsp;({Math.round(nextWork.totalMinutes / 60)}시간)
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}