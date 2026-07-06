import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Settings, Pencil, ChevronDown, X,
} from "lucide-react";
import {
  getMonthlyWorkSchedule,
  createEngineerWorkSchedule,
  updateEngineerWorkSchedule,
  deleteEngineerWorkSchedule,
} from "../../apis/engineers";
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

// 근무표 설정/수정 모달 공통 인라인 스타일 (App.jsx SessionExpiredModal과 동일한 방식)
const overlayStyle = { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" };
const modalStyle = { background: "#fff", borderRadius: 14, padding: 24, width: 340, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" };
const modalHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 };
const iconBtn = { background: "none", border: "none", cursor: "pointer", color: "#888" };
const fieldLabel = { display: "block", fontSize: 12, color: "#666", marginBottom: 6, fontWeight: 600 };
const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, font: "inherit", boxSizing: "border-box" };
const primaryBtn = { padding: "11px", borderRadius: 10, border: "none", background: "#5B4FF5", color: "#fff", fontWeight: 700, cursor: "pointer", width: "100%" };
const secondaryBtn = { padding: "11px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#555", fontWeight: 600, cursor: "pointer" };

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

  // 근무표 설정(패턴 일괄등록) 모달 상태
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [patternWeekdays, setPatternWeekdays] = useState([1, 2, 3, 4, 5]); // 월~금
  const [patternStart, setPatternStart] = useState("09:00");
  const [patternEnd, setPatternEnd] = useState("18:00");

  // 근무표 수정(편집 모드 + 날짜 편집 모달) 상태
  const [editMode, setEditMode] = useState(false);
  const [editDayNum, setEditDayNum] = useState(null);
  const [editStart, setEditStart] = useState("09:00");
  const [editEnd, setEditEnd] = useState("18:00");
  const [saving, setSaving] = useState(false);

  // 월간 근무표 조회 — 변경(등록/수정/삭제) 후 재조회에도 재사용
  const fetchSchedules = useCallback(() => {
    setLoading(true);
    setError(null);
    // API는 실제 월(1~12)을 기대하므로 month(0-indexed) + 1
    return getMonthlyWorkSchedule(year, month + 1)
      .then((res) => {
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
        setError("근무표를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchSchedules 내부에서 조회 전 로딩 상태 초기화(의도된 동작)
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

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

  // ── 근무표 설정/수정 공통 헬퍼 ──────────────────
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (day) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const todayYmd = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const toggleWeekday = (wd) =>
    setPatternWeekdays((prev) => (prev.includes(wd) ? prev.filter((x) => x !== wd) : [...prev, wd]));

  // 근무표 설정 — 선택 요일 패턴을 이번 달에 일괄 등록 (오늘 이후 & 미등록 날짜만)
  const handleApplyPattern = async () => {
    if (patternStart >= patternEnd) { alert("시작 시간은 종료 시간보다 빨라야 합니다."); return; }
    if (patternWeekdays.length === 0) { alert("요일을 최소 1개 선택해주세요."); return; }
    const last = new Date(year, month + 1, 0).getDate();
    const targets = [];
    for (let d = 1; d <= last; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = ymd(d);
      if (!patternWeekdays.includes(dateObj.getDay())) continue; // 요일 필터
      if (dateStr < todayYmd) continue;                          // 과거 제외(@FutureOrPresent)
      if (scheduleData[d]) continue;                             // 이미 존재 → 중복 등록(400) 방지
      targets.push(dateStr);
    }
    if (targets.length === 0) { alert("등록할 새 근무일이 없습니다. (이미 등록됐거나 지난 날짜)"); return; }
    setSaving(true);
    try {
      const res = await Promise.allSettled(
        targets.map((ds) => createEngineerWorkSchedule(ds, [{ start: patternStart, end: patternEnd }]))
      );
      const ok = res.filter((r) => r.status === "fulfilled").length;
      alert(`${ok}건 등록 완료${targets.length - ok > 0 ? ` (${targets.length - ok}건 실패)` : ""}`);
      setSettingsOpen(false);
      await fetchSchedules();
    } finally { setSaving(false); }
  };

  // 근무표 수정 — 날짜 편집 모달 열기 (BOOKED/과거 방어)
  const openDayEditor = (day) => {
    const s = scheduleData[day];
    if (s?.status === "BOOKED") { alert("이미 A/S가 배정된 날짜는 수정할 수 없습니다."); return; }
    if (ymd(day) < todayYmd) { alert("지난 날짜는 수정할 수 없습니다."); return; }
    setEditStart(s?.startTime ?? "09:00");
    setEditEnd(s?.endTime ?? "18:00");
    setEditDayNum(day);
  };

  // 저장 — PUT upsert (슬롯 교체/생성, 원자적)
  const handleSaveDay = async () => {
    if (editStart >= editEnd) { alert("시작 시간은 종료 시간보다 빨라야 합니다."); return; }
    setSaving(true);
    try {
      await updateEngineerWorkSchedule(ymd(editDayNum), [{ start: editStart, end: editEnd }]);
      setEditDayNum(null);
      await fetchSchedules();
    } catch (e) {
      alert(e.response?.data?.message ?? "저장에 실패했습니다.");
    } finally { setSaving(false); }
  };

  // 휴무로 변경 — 기존 스케줄 삭제(스케줄 없음 = OFF)
  const handleSetOff = async () => {
    const s = scheduleData[editDayNum];
    if (!s?.scheduleId) { setEditDayNum(null); return; } // 이미 휴무
    setSaving(true);
    try {
      await deleteEngineerWorkSchedule(s.scheduleId);
      setEditDayNum(null);
      await fetchSchedules();
    } catch (e) {
      alert(e.response?.data?.message ?? "휴무 처리에 실패했습니다.");
    } finally { setSaving(false); }
  };

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
          <button className="emsp-settings-btn" onClick={() => setSettingsOpen(true)}>
            <Settings size={14} /> 근무표 설정
          </button>
          <button
            className="emsp-edit-btn"
            onClick={() => setEditMode((v) => !v)}
            style={editMode ? { background: "#5B4FF5", color: "#fff" } : undefined}
          >
            <Pencil size={14} /> {editMode ? "수정 완료" : "근무표 수정"}
          </button>
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
          {view === "목록 보기" ? (
            <div className="emsp-calendar">
              {Object.entries(scheduleData)
                .map(([day, s]) => ({ day: Number(day), ...s }))
                .sort((a, b) => a.day - b.day)
                .map((s) => {
                  const shift = s.status !== "OFF" ? getShiftType(s.startTime, s.endTime) : null;
                  const dObj = new Date(year, month, s.day);
                  const editable = editMode && s.status !== "BOOKED" && ymd(s.day) >= todayYmd;
                  return (
                    <div
                      key={s.day}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderBottom: "1px solid #f0f0f5", cursor: editable ? "pointer" : "default" }}
                      onClick={() => editable && openDayEditor(s.day)}
                    >
                      <span style={{ width: 100, fontWeight: 600 }}>{month + 1}.{pad(s.day)} ({WEEK_DAYS[dObj.getDay()]})</span>
                      {s.status === "OFF" ? (
                        <span className="emsp-week-row__off">휴무</span>
                      ) : (
                        <>
                          <span style={{ width: 120 }}>{s.startTime} - {s.endTime}</span>
                          <span className={`emsp-week-row__badge emsp-week-row__badge--${shift?.color}`}>{shift?.label}</span>
                          <span style={{ color: "#888", fontSize: 12 }}>{Math.round(s.totalMinutes / 60)}시간</span>
                          {s.status === "BOOKED" && <span style={{ color: "#5B4FF5", fontSize: 11 }}>· 배정됨</span>}
                        </>
                      )}
                    </div>
                  );
                })}
              {Object.keys(scheduleData).length === 0 && (
                <p style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 13 }}>등록된 근무 일정이 없습니다.</p>
              )}
            </div>
          ) : (
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
                    onClick={() => {
                      if (!d.cur) return;
                      setSelectedDate(d.date);
                      if (editMode) openDayEditor(d.date);
                    }}
                    style={editMode && d.cur ? { cursor: "pointer", outline: "1px dashed #cdbff8", outlineOffset: -2 } : undefined}
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
          )}

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

      {/* 근무표 설정 — 주간 패턴 일괄 등록 모달 */}
      {settingsOpen && (
        <div style={overlayStyle} onClick={() => !saving && setSettingsOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <span style={{ fontWeight: 700 }}>근무표 설정 · {year}년 {month + 1}월</span>
              <button style={iconBtn} onClick={() => setSettingsOpen(false)}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>
              선택한 요일에 이번 달 근무 시간을 일괄 등록합니다. (지난 날짜·이미 등록된 날짜는 자동 제외)
            </p>
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>근무 요일</label>
              <div style={{ display: "flex", gap: 6 }}>
                {WEEK_DAYS.map((w, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    style={{
                      width: 34, height: 34, borderRadius: "50%", border: "1px solid #ddd", cursor: "pointer",
                      background: patternWeekdays.includes(idx) ? "#5B4FF5" : "#fff",
                      color: patternWeekdays.includes(idx) ? "#fff" : idx === 0 ? "#e04848" : idx === 6 ? "#3b6fd6" : "#333",
                      fontWeight: 600,
                    }}
                  >{w}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>시작</label>
                <input type="time" value={patternStart} onChange={(e) => setPatternStart(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>종료</label>
                <input type="time" value={patternEnd} onChange={(e) => setPatternEnd(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <button style={primaryBtn} disabled={saving} onClick={handleApplyPattern}>
              {saving ? "등록 중..." : "일괄 등록"}
            </button>
          </div>
        </div>
      )}

      {/* 근무표 수정 — 날짜별 편집 모달 (PUT upsert 저장 / DELETE 휴무) */}
      {editDayNum != null && (
        <div style={overlayStyle} onClick={() => !saving && setEditDayNum(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <span style={{ fontWeight: 700 }}>{year}.{pad(month + 1)}.{pad(editDayNum)} 근무 수정</span>
              <button style={iconBtn} onClick={() => setEditDayNum(null)}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>시작</label>
                <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>종료</label>
                <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...primaryBtn, flex: 1 }} disabled={saving} onClick={handleSaveDay}>
                {saving ? "저장 중..." : "저장"}
              </button>
              {scheduleData[editDayNum]?.scheduleId && (
                <button style={{ ...secondaryBtn, flex: 1 }} disabled={saving} onClick={handleSetOff}>휴무로 변경</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}