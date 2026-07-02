import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Calendar, Download,
  ChevronDown, MapPin, Flag, Coffee, ClipboardList,
} from "lucide-react";
import { getEngineerTaskSchedule, getDailyWorkSchedule } from "../../apis/engineers"; 
import "../../styles/Engineer/EngineerSchedulePage.css";

const VIEWS = ["일간", "주간", "월간"];

const STATUS_MAP = {
  WAITING:   { label: "방문 예정", color: "purple", bg: "#eeeaff" },
  ACCEPTED:  { label: "진행 중",   color: "green",  bg: "#eaf3de" },
  COMPLETED: { label: "완료",     color: "gray",   bg: "#f5f5f5" },
};

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

const TIMELINE_HOURS = Array.from({ length: 22 }, (_, i) => {
  const h = 8 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

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
const DAY_TOTAL = DAY_END - DAY_START;

function calcTop(time)   { return ((timeToMinutes(time) - DAY_START) / DAY_TOTAL) * 100; }
function calcHeight(s, e){ return ((timeToMinutes(e) - timeToMinutes(s)) / DAY_TOTAL) * 100; }

function toDateParam(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 근무표의 timeSlots 중 가장 이른 시작 ~ 가장 늦은 종료
function mergeWorkHours(timeSlots) {
  if (!timeSlots || timeSlots.length === 0) return null;
  let start = timeSlots[0].start;
  let end = timeSlots[0].end;
  timeSlots.forEach((slot) => {
    if (timeToMinutes(slot.start) < timeToMinutes(start)) start = slot.start;
    if (timeToMinutes(slot.end) > timeToMinutes(end)) end = slot.end;
  });
  return { start, end };
}

export default function EngineerSchedulePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentDate, setCurrentDate] = useState(
    location.state?.date ? new Date(location.state.date) : new Date()
  );
  const [view, setView] = useState("일간");
  const [calYear, setCalYear] = useState(currentDate.getFullYear());
  const [calMonth, setCalMonth] = useState(currentDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(currentDate.getDate());
  const [filterStatus, setFilterStatus] = useState({ 방문예정: true, 진행중: true, 완료: false, 취소: false });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [summary, setSummary] = useState({ tasks: 0, doneCount: 0 });

  // 근무표(가용 시간) 상태
  const [workHours, setWorkHours] = useState(null); // { start, end } | null
  const [isOff, setIsOff] = useState(false);

  const calDays = getCalendarDays(calYear, calMonth);
  const dateStr = `${currentDate.getFullYear()}.${String(currentDate.getMonth()+1).padStart(2,"0")}.${String(currentDate.getDate()).padStart(2,"0")} (${["일","월","화","수","목","금","토"][currentDate.getDay()]})`;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setWorkHours(null);
    setIsOff(false);

    const dateParam = toDateParam(currentDate);

    // 실제 배정된 작업 목록
    const taskPromise = getEngineerTaskSchedule(dateParam)
      .then((res) => {
        const list = res.data ?? [];
        const mapped = list.map((item, idx) => {
          const [h, m] = item.scheduledTime.split(":").map(Number);
          const endH = h + 1;
          const endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          return {
            assignmentId: item.requestId,
            startTime: item.scheduledTime,
            endTime,
            statusKey: item.assignmentStatus,
            productName: `${item.applianceBrand} ${item.applianceModelName}`,
            productImageUrl: null,
            customerName: item.customerName,
            customerPhone: item.customerPhone,
            address: `${item.visitRegionName} ${item.visitAddressDetail}`,
            symptom: item.symptomName,
            number: idx + 1,
          };
        });
        if (mounted) {
          setTodaySchedule(mapped);
          setSummary({
            tasks: mapped.length,
            doneCount: mapped.filter((m) => m.statusKey === "COMPLETED").length,
          });
        }
      });

    // 그 날의 근무표(가용 시간) — 없으면 400 에러 → 휴무/미등록으로 처리
    const workPromise = getDailyWorkSchedule(dateParam)
      .then((res) => {
        if (!mounted) return;
        const d = res.data;
        if (d.status === "OFF") {
          setIsOff(true);
          setWorkHours(null);
        } else {
          setIsOff(false);
          setWorkHours(mergeWorkHours(d.timeSlots));
        }
      })
      .catch(() => {
        // 근무표 자체가 없는 날 → 휴무로 취급
        if (mounted) {
          setIsOff(true);
          setWorkHours(null);
        }
      });

    Promise.all([taskPromise, workPromise])
      .catch((err) => {
        console.error("일정 조회 실패:", err);
        if (mounted) setError("일정을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [currentDate]);

  const goNext = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  const goPrev = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const goToday = () => setCurrentDate(new Date());

  const handleDetail = (item) => {
    navigate("/engineer/work", { state: { assignmentId: item.assignmentId } });
  };

  return (
    <div className="esp">
      <div className="esp-topbar">
        <h1 className="esp-title">작업 일정</h1>
        <div className="esp-controls">
          <div className="esp-view-tabs">
            {VIEWS.map(v => (
              <button key={v} className={`esp-view-tab ${view === v ? "esp-view-tab--active" : ""}`} onClick={() => setView(v)}>{v}</button>
            ))}
          </div>
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

      {loading && <p style={{ padding: "16px" }}>불러오는 중...</p>}
      {error && <p style={{ padding: "16px", color: "red" }}>{error}</p>}

      {!loading && !error && isOff && (
        <div style={{ padding: "48px 16px", textAlign: "center", color: "#888" }}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>😴 휴무일입니다</p>
          <p style={{ marginTop: 8, fontSize: 13 }}>이 날짜는 근무표에 등록되지 않았거나 휴무로 설정되어 있어요.</p>
        </div>
      )}

      {!loading && !error && !isOff && (
        <div className="esp-body">
          <div className="esp-timeline-wrap">
            <div className="esp-timeline">
              <div className="esp-time-labels">
                {TIMELINE_HOURS.map(t => (
                  <div key={t} className="esp-time-label">{t.endsWith(":00") ? t : ""}</div>
                ))}
              </div>

              <div className="esp-events">
                {TIMELINE_HOURS.map(t => (
                  <div key={t} className={`esp-grid-line ${t.endsWith(":00") ? "esp-grid-line--hour" : ""}`}
                    style={{ top: `${calcTop(t)}%` }} />
                ))}

                {/* 근무 시간 외 구간 회색 처리 */}
                {workHours && (
                  <>
                    {timeToMinutes(workHours.start) > DAY_START && (
                      <div
                        style={{
                          position: "absolute", left: 0, right: 0, top: 0,
                          height: `${calcTop(workHours.start)}%`,
                          background: "rgba(0,0,0,0.04)", pointerEvents: "none", zIndex: 1,
                        }}
                      />
                    )}
                    {timeToMinutes(workHours.end) < DAY_END && (
                      <div
                        style={{
                          position: "absolute", left: 0, right: 0,
                          top: `${calcTop(workHours.end)}%`, bottom: 0,
                          background: "rgba(0,0,0,0.04)", pointerEvents: "none", zIndex: 1,
                        }}
                      />
                    )}
                  </>
                )}

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

                {todaySchedule.map((item) => {
                  const s = STATUS_MAP[item.statusKey] ?? STATUS_MAP.WAITING;
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
                          : <span>📦</span>}
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
                        <button className="esp-task-detail-btn" onClick={() => handleDetail(item)}>
                          상세보기 <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="esp-drag-hint">ⓘ 작업 시간을 드래그하여 일정을 조절할 수 있습니다.</p>
          </div>

          <aside className="esp-aside">
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
                    className={`esp-cal-day ${!d.cur ? "esp-cal-day--other" : ""} ${d.cur && d.day === selectedDate && calMonth === currentDate.getMonth() ? "esp-cal-day--selected" : ""} ${d.cur && d.day === new Date().getDate() && calMonth === new Date().getMonth() ? "esp-cal-day--today" : ""}`}
                    onClick={() => {
                      if (d.cur) {
                        setSelectedDate(d.day);
                        setCurrentDate(new Date(calYear, calMonth, d.day));
                      }
                    }}
                  >
                    {d.day}
                  </button>
                ))}
              </div>
            </div>

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
                <div className="esp-summary-item esp-summary-item--green">
                  <ChevronRight size={16} color="#16a34a" />
                  <div>
                    <p className="esp-summary-item__label">완료</p>
                    <p className="esp-summary-item__value">{summary.doneCount}건</p>
                  </div>
                </div>
              </div>
              {workHours && (
                <p style={{ marginTop: 12, fontSize: 12, color: "#888" }}>
                  근무 시간 {workHours.start} - {workHours.end}
                </p>
              )}
            </div>

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
      )}
    </div>
  );
}