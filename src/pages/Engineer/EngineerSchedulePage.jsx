import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Calendar, Download,
  ChevronDown, MapPin, Flag, Coffee, ClipboardList,
} from "lucide-react";
import "../../styles/Engineer/EngineerSchedulePage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/schedule?date=2024-06-01
//
// DB 연동 포인트:
//   engineer_schedules.work_date, status (AVAILABLE/BOOKED/OFF)
//   engineer_schedule_slots.start_time, end_time
//   as_assignments WHERE engineer_id=로그인기사 AND status='ACCEPTED'
//   + as_requests.scheduled_date, scheduled_time
//   + as_requests.symptom_id → symptoms.name
//   + appliances.name, model_no
//   + users.name(고객), users.phone
//   as_status_logs 최신 to_status → 작업 상태
//
// as_assignments.status ENUM: WAITING/ACCEPTED/REJECTED/COMPLETED
// as_status_logs.to_status ENUM: WAITING/ENGINEER_DEPARTED/ENGINEER_ARRIVED/IN_PROGRESS/COMPLETED
// ──────────────────────────────────────────

const VIEWS = ["일간", "주간", "월간"];

const STATUS_MAP = {
  WAITING:            { label: "방문 예정", color: "purple", bg: "#eeeaff" },
  ENGINEER_DEPARTED:  { label: "이동 중",   color: "blue",   bg: "#e6f1fb" },
  ENGINEER_ARRIVED:   { label: "도착",     color: "teal",   bg: "#d0f4f0" },
  IN_PROGRESS:        { label: "진행 중",   color: "green",  bg: "#eaf3de" },
  COMPLETED:          { label: "완료",     color: "gray",   bg: "#f5f5f5" },
};

// 오늘의 작업 일정 - as_assignments + as_requests + appliances + users JOIN
const todaySchedule = [
  {
    assignmentId: 1,
    requestId: "AS-20240601-0105",
    startTime: "10:00", endTime: "11:30",
    statusKey: "WAITING",
    productName: "LG 디오스 냉장고", modelNo: "F873S11E",
    productImageUrl: null,
    customerName: "김민지", customerPhone: "010-1234-5678",
    address: "서울 강남구 테헤란로 123",
    symptom: "냉각 불량",
    number: 1,
  },
  {
    assignmentId: 2,
    requestId: "AS-20240601-0106",
    startTime: "14:00", endTime: "15:30",
    statusKey: "WAITING",
    productName: "삼성 그랑데 세탁기", modelNo: "WF21T6500KP",
    productImageUrl: null,
    customerName: "이영희", customerPhone: "010-9876-5432",
    address: "경기 성남시 분당구 정자일로 45",
    symptom: "소음 발생",
    number: 2,
  },
  {
    assignmentId: 3,
    requestId: "AS-20240601-0107",
    startTime: "16:30", endTime: "18:00",
    statusKey: "WAITING",
    productName: "LG 휘센 에어컨", modelNo: "FQ18HDWHRN",
    productImageUrl: null,
    customerName: "박준호", customerPhone: "010-5555-1111",
    address: "경기 용인시 수지구 죽전로 152",
    symptom: "냉방 약함",
    number: 3,
  },
];

// 미니 달력 데이터
const CALENDAR_DAYS = ["일","월","화","수","목","금","토"];
function getCalendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const last  = new Date(year, month + 1, 0).getDate();
  const prev  = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = first - 1; i >= 0; i--) days.push({ day: prev - i, cur: false });
  for (let i = 1; i <= last; i++)      days.push({ day: i, cur: true });
  while (days.length % 7 !== 0)        days.push({ day: days.length - last - first + 1, cur: false });
  return days;
}

// 타임라인 시간대 (08:00 ~ 18:30)
const TIMELINE_HOURS = Array.from({ length: 22 }, (_, i) => {
  const h = 8 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

// 고정 블록 (일일 준비, 점심, 마무리)
const FIXED_BLOCKS = [
  { startTime: "08:00", endTime: "09:00", label: "일일 준비",  sub: "장비 점검 및 이동 준비", type: "prepare", icon: Flag   },
  { startTime: "12:00", endTime: "13:00", label: "점심 시간",  sub: null,                     type: "lunch",   icon: Coffee },
  { startTime: "18:00", endTime: "18:30", label: "일일 마무리", sub: "작업 보고서 작성 및 정리", type: "close",   icon: ClipboardList },
];

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const DAY_START = timeToMinutes("08:00");
const DAY_END   = timeToMinutes("18:30");
const DAY_TOTAL = DAY_END - DAY_START; // 630분

function calcTop(time)   { return ((timeToMinutes(time) - DAY_START) / DAY_TOTAL) * 100; }
function calcHeight(s, e){ return ((timeToMinutes(e) - timeToMinutes(s)) / DAY_TOTAL) * 100; }

export default function EngineerSchedulePage() {
  const [view, setView] = useState("일간");
  const [currentDate, setCurrentDate] = useState(new Date(2024, 5, 1)); // 2024.06.01
  const [calYear,  setCalYear]  = useState(2024);
  const [calMonth, setCalMonth] = useState(5); // 6월
  const [selectedDate, setSelectedDate] = useState(1);
  const [filterStatus, setFilterStatus] = useState({ 방문예정: true, 진행중: true, 완료: false, 취소: false });

  const calDays = getCalendarDays(calYear, calMonth);

  const dateStr = `${currentDate.getFullYear()}.${String(currentDate.getMonth()+1).padStart(2,"0")}.${String(currentDate.getDate()).padStart(2,"0")} (${["일","월","화","수","목","금","토"][currentDate.getDay()]})`;

  const goNext = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  const goPrev = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const goToday = () => setCurrentDate(new Date(2024, 5, 1));

  // 오늘 요약 통계
  const summary = { tasks: 3, distance: 42, estimatedTime: "6시간 30분", doneCount: 3 };

  return (
    <div className="esp">
      {/* 페이지 타이틀 + 컨트롤 */}
      <div className="esp-topbar">
        <h1 className="esp-title">작업 일정</h1>
        <div className="esp-controls">
          {/* 일간/주간/월간 */}
          <div className="esp-view-tabs">
            {VIEWS.map(v => (
              <button key={v} className={`esp-view-tab ${view === v ? "esp-view-tab--active" : ""}`} onClick={() => setView(v)}>{v}</button>
            ))}
          </div>
          {/* 날짜 네비 */}
          <div className="esp-date-nav">
            <button className="esp-nav-btn" onClick={goPrev}><ChevronLeft size={15} /></button>
            <span className="esp-date-label">{dateStr}</span>
            <button className="esp-nav-btn" onClick={goNext}><ChevronRight size={15} /></button>
          </div>
          <button className="esp-today-btn" onClick={goToday}><Calendar size={13} /> 오늘</button>
          <div className="esp-filter-select"><span>전체 작업</span><ChevronDown size={13} /></div>
          <div className="esp-filter-select"><MapPin size={12} color="#aaa" /><span>전체 지역</span><ChevronDown size={13} /></div>
          <button className="esp-export-btn"><Download size={13} /> 일정 내보내기</button>
        </div>
      </div>

      <div className="esp-body">
        {/* 타임라인 */}
        <div className="esp-timeline-wrap">
          <div className="esp-timeline">
            {/* 시간 레이블 */}
            <div className="esp-time-labels">
              {TIMELINE_HOURS.map(t => (
                <div key={t} className="esp-time-label">{t.endsWith(":00") ? t : ""}</div>
              ))}
            </div>

            {/* 이벤트 영역 */}
            <div className="esp-events">
              {/* 그리드 라인 */}
              {TIMELINE_HOURS.map(t => (
                <div key={t} className={`esp-grid-line ${t.endsWith(":00") ? "esp-grid-line--hour" : ""}`}
                  style={{ top: `${calcTop(t)}%` }} />
              ))}

              {/* 고정 블록 */}
              {FIXED_BLOCKS.map((b) => (
                <div
                  key={b.type}
                  className={`esp-block esp-block--${b.type}`}
                  style={{ top: `${calcTop(b.startTime)}%`, height: `${calcHeight(b.startTime, b.endTime)}%` }}
                >
                  <b.icon size={13} />
                  <span className="esp-block__label">{b.label}</span>
                  {b.sub && <span className="esp-block__sub">{b.sub}</span>}
                  <span className="esp-block__time">{b.startTime} - {b.endTime}</span>
                </div>
              ))}

              {/* 작업 카드 */}
              {todaySchedule.map((item) => {
                const s = STATUS_MAP[item.statusKey];
                return (
                  <div
                    key={item.assignmentId}
                    className="esp-task-card"
                    style={{ top: `${calcTop(item.startTime)}%`, height: `${calcHeight(item.startTime, item.endTime)}%` }}
                  >
                    <div className="esp-task-card__num">{item.number}</div>
                    <div className="esp-task-card__img">
                      {item.productImageUrl
                        ? <img src={item.productImageUrl} alt={item.productName} />
                        : <span>📦</span>
                      }
                    </div>
                    <div className="esp-task-card__info">
                      <span className={`esp-status-badge esp-status-badge--${s.color}`}>{s.label}</span>
                      <p className="esp-task-card__product">{item.productName}</p>
                      <p className="esp-task-card__customer">
                        {item.customerName} 고객 &nbsp;·&nbsp;
                        <MapPin size={10} /> {item.address}
                      </p>
                    </div>
                    <div className="esp-task-card__right">
                      <span className="esp-task-card__time">{item.startTime} - {item.endTime}</span>
                      <button className="esp-task-detail-btn">상세보기 <ChevronRight size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="esp-drag-hint">ⓘ 작업 시간을 드래그하여 일정을 조절할 수 있습니다.</p>
        </div>

        {/* 우측 패널 */}
        <aside className="esp-aside">
          {/* 미니 달력 */}
          <div className="esp-panel">
            <div className="esp-cal-header">
              <button className="esp-cal-nav" onClick={() => { if(calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1); } else setCalMonth(m=>m-1); }}><ChevronLeft size={14} /></button>
              <span className="esp-cal-title">{calYear}년 {calMonth+1}월</span>
              <button className="esp-cal-nav" onClick={() => { if(calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1); } else setCalMonth(m=>m+1); }}><ChevronRight size={14} /></button>
            </div>
            <div className="esp-cal-grid">
              {CALENDAR_DAYS.map(d => <div key={d} className="esp-cal-day-label">{d}</div>)}
              {calDays.map((d, i) => (
                <button
                  key={i}
                  className={`esp-cal-day ${!d.cur ? "esp-cal-day--other" : ""} ${d.cur && d.day === selectedDate && calMonth === 5 ? "esp-cal-day--selected" : ""} ${d.cur && d.day === 1 && calMonth === 5 ? "esp-cal-day--today" : ""}`}
                  onClick={() => { if(d.cur) setSelectedDate(d.day); }}
                >
                  {d.day}
                </button>
              ))}
            </div>
          </div>

          {/* 오늘 일정 요약 */}
          <div className="esp-panel">
            <h3 className="esp-panel__title">오늘 일정 요약</h3>
            <div className="esp-summary-grid">
              <div className="esp-summary-item esp-summary-item--purple">
                <Calendar size={16} color="#5B4FF5" />
                <div>
                  <p className="esp-summary-item__label">예정된 작업</p>
                  <p className="esp-summary-item__value">{summary.tasks}건</p>
                </div>
              </div>
              <div className="esp-summary-item esp-summary-item--blue">
                <ChevronRight size={16} color="#2563eb" />
                <div>
                  <p className="esp-summary-item__label">이동 거리</p>
                  <p className="esp-summary-item__value">{summary.distance}km</p>
                </div>
              </div>
              <div className="esp-summary-item esp-summary-item--orange">
                <ChevronDown size={16} color="#d97706" />
                <div>
                  <p className="esp-summary-item__label">예상 소요 시간</p>
                  <p className="esp-summary-item__value">{summary.estimatedTime}</p>
                </div>
              </div>
              <div className="esp-summary-item esp-summary-item--green">
                <ChevronRight size={16} color="#16a34a" />
                <div>
                  <p className="esp-summary-item__label">완료 예정</p>
                  <p className="esp-summary-item__value">{summary.doneCount}건</p>
                </div>
              </div>
            </div>
          </div>

          {/* 일정 필터 */}
          <div className="esp-panel">
            <h3 className="esp-panel__title">일정 필터</h3>
            <div className="esp-filter-list">
              {[
                { key: "전체",    color: "#5B4FF5" },
                { key: "방문예정", color: "#5B4FF5" },
                { key: "진행중",  color: "#16a34a" },
                { key: "완료",   color: "#aaa"    },
                { key: "취소",   color: "#ddd"    },
              ].map(f => (
                <label key={f.key} className="esp-filter-item">
                  <input
                    type="checkbox"
                    checked={f.key === "전체" ? Object.values(filterStatus).every(Boolean) : filterStatus[f.key] ?? false}
                    onChange={() => {
                      if (f.key === "전체") {
                        const all = Object.values(filterStatus).every(Boolean);
                        setFilterStatus(Object.fromEntries(Object.keys(filterStatus).map(k => [k, !all])));
                      } else {
                        setFilterStatus(p => ({ ...p, [f.key]: !p[f.key] }));
                      }
                    }}
                    style={{ accentColor: f.color }}
                  />
                  <span>{f.key}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}