import { useState, useEffect, useCallback } from "react";
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
  REJECTED: { label: "취소",     color: "red",    bg: "#fdeaea" },
};

// 사이드바 필터 체크박스 라벨 ↔ 실제 작업 상태값(statusKey) 매핑
// [버그 수정] 기존엔 filterStatus state만 바뀌고 목록 렌더링에는 전혀 반영되지 않았음
const FILTER_KEY_TO_STATUS = {
  방문예정: "WAITING",
  진행중:  "ACCEPTED",
  완료:    "COMPLETED",
  취소:    "REJECTED",
};

const CALENDAR_DAYS = ["일","월","화","수","목","금","토"];
function getCalendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const last  = new Date(year, month + 1, 0).getDate();
  const prev  = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = first - 1; i >= 0; i--) days.push({ day: prev - i, cur: false });
  for (let i = 1; i <= last; i++)      days.push({ day: i, cur: true, date: new Date(year, month, i) });
  while (days.length % 7 !== 0)        days.push({ day: days.length - last - first + 1, cur: false });
  return days;
}

const FIXED_BLOCKS = [
  { startTime: "08:00", endTime: "09:00", label: "일일 준비",  sub: "장비 점검 및 이동 준비", type: "prepare", icon: Flag   },
  { startTime: "13:00", endTime: "14:00", label: "점심 시간",  sub: null,                     type: "lunch",   icon: Coffee },
  { startTime: "18:00", endTime: "18:30", label: "일일 마무리", sub: "작업 보고서 작성 및 정리", type: "close",   icon: ClipboardList },
];

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

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

// 작업 목록 API 응답 → 화면용 형태로 매핑 (일간/주간 공용)
function mapTasks(list) {
  return (list ?? []).map((item, idx) => {
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
      regionName: item.visitRegionName,
      symptom: item.symptomName,
      number: idx + 1,
    };
  });
}

function getWeekDates(date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // 그 주의 일요일
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
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

  // [버그 수정] 체크 상태만 있고 실제 필터링에 쓰이지 않던 state
  // → FILTER_KEY_TO_STATUS를 통해 실제 렌더링 목록에 적용됨
  const [filterStatus, setFilterStatus] = useState({ 방문예정: true, 진행중: true, 완료: false, 취소: false });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [summary, setSummary] = useState({ tasks: 0, doneCount: 0 });

  // 근무표(가용 시간) 상태
  const [workHours, setWorkHours] = useState(null); // { start, end } | null
  const [isOff, setIsOff] = useState(false);
  const [workScheduleError, setWorkScheduleError] = useState(false);

  // 주간 뷰 데이터: { "YYYY-MM-DD": task[] }
  const [weekTasks, setWeekTasks] = useState({});
  const [weekLoading, setWeekLoading] = useState(false);

  // 월간 뷰 데이터: { day(number): count }
  const [monthCounts, setMonthCounts] = useState({});
  const [monthLoading, setMonthLoading] = useState(false);

  // [버그 수정] 상단 "전체 작업"/"전체 지역"이 옵션 없는 장식 버튼이었음
  // → 전체 작업: 사이드바와 같은 filterStatus를 재사용하는 드롭다운으로 구현
  // → 전체 지역: 별도 지역 마스터 API가 없어, 지금까지 불러온 작업 데이터에서
  //   지역명을 추출해 옵션으로 제공 (임시 방편 — 지역 API가 생기면 교체 권장)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState(null); // null = 전체 지역
  const [knownRegions, setKnownRegions] = useState([]);

  const mergeKnownRegions = useCallback((tasks) => {
    const regions = tasks.map((t) => t.regionName).filter(Boolean);
    if (regions.length === 0) return;
    setKnownRegions((prev) => Array.from(new Set([...prev, ...regions])));
  }, []);

  const activeStatusCount = Object.values(filterStatus).filter(Boolean).length;
  const statusButtonLabel = activeStatusCount === Object.keys(filterStatus).length
    ? "전체 작업"
    : activeStatusCount === 0
      ? "선택 없음"
      : `${activeStatusCount}개 선택`;

  const calDays = getCalendarDays(calYear, calMonth);

  const dateStr = `${currentDate.getFullYear()}.${String(currentDate.getMonth()+1).padStart(2,"0")}.${String(currentDate.getDate()).padStart(2,"0")} (${["일","월","화","수","목","금","토"][currentDate.getDay()]})`;

  // 필터가 적용된 작업 목록 (전체 뷰 공통으로 사용)
  const applyFilter = useCallback((tasks) => {
    const activeStatuses = Object.entries(filterStatus)
      .filter(([, checked]) => checked)
      .map(([key]) => FILTER_KEY_TO_STATUS[key])
      .filter(Boolean);
    let result = tasks;
    if (activeStatuses.length > 0) {
      result = result.filter((t) => activeStatuses.includes(t.statusKey));
    }
    if (regionFilter) {
      result = result.filter((t) => t.regionName === regionFilter);
    }
    return result;
  }, [filterStatus, regionFilter]);

  const filteredSchedule = applyFilter(todaySchedule);

  // 필터 범위 기준 타임라인 시간대 (기본 08:00~18:30, 이 범위를 벗어나는 작업이 있으면 확장)
  // [버그 수정] 기존엔 08:00~18:30로 고정돼 있어서, 이 범위 밖 작업은 위치 계산이
  // 음수/100% 초과가 되어 화면에서 잘려 보이지 않았음
  const times = filteredSchedule.flatMap((t) => [timeToMinutes(t.startTime), timeToMinutes(t.endTime)]);
  const DAY_START = Math.min(timeToMinutes("08:00"), ...times.length ? times : [Infinity]);
  const DAY_END   = Math.max(timeToMinutes("18:30"), ...times.length ? times : [-Infinity]);
  const DAY_TOTAL = DAY_END - DAY_START;

  const TIMELINE_HOURS = [];
  for (let m = DAY_START; m <= DAY_END; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    TIMELINE_HOURS.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }

  function calcTop(time)   { return ((timeToMinutes(time) - DAY_START) / DAY_TOTAL) * 100; }
  function calcHeight(s, e){ return ((timeToMinutes(e) - timeToMinutes(s)) / DAY_TOTAL) * 100; }

  // ── 일간 데이터 조회 ──────────────────────────
  useEffect(() => {
    let mounted = true;
    /* eslint-disable react-hooks/set-state-in-effect -- 비동기 조회 직전 로딩/상태 초기화(의도된 동작) */
    setLoading(true);
    setError(null);
    setWorkHours(null);
    setIsOff(false);
    setWorkScheduleError(false);
    /* eslint-enable react-hooks/set-state-in-effect */

    const dateParam = toDateParam(currentDate);

    // 실제 배정된 작업 목록
    const taskPromise = getEngineerTaskSchedule(dateParam)
      .then((res) => {
        if (!mounted) return;
        const mapped = mapTasks(res.data);
        setTodaySchedule(mapped);
        mergeKnownRegions(mapped);
        setSummary({
          tasks: mapped.length,
          doneCount: mapped.filter((m) => m.statusKey === "COMPLETED").length,
        });
      });

    // 그 날의 근무표(가용 시간)
    // [버그 수정] 근무표 API가 실패하면 무조건 "휴무"로 간주해 화면 전체(작업 목록 포함)를
    // 덮어써 버렸음. 이제는 근무표 조회 실패를 "휴무"와 구분해서, 배정된 작업은
    // 근무표 상태와 무관하게 항상 표시하고, 진짜 휴무(status: "OFF")일 때만
    // 안내 문구를 추가로 보여준다.
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
        // 근무표 조회 자체가 실패한 경우 — "휴무"로 단정하지 않음.
        // 근무 시간 음영 표시만 생략하고, 작업 목록은 정상적으로 보여준다.
        if (mounted) {
          setIsOff(false);
          setWorkHours(null);
          setWorkScheduleError(true);
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

  // ── 주간 데이터 조회 ──────────────────────────
  useEffect(() => {
    if (view !== "주간") return;
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 비동기 조회 직전 로딩 상태 초기화(의도된 동작)
    setWeekLoading(true);

    const weekDates = getWeekDates(currentDate);
    Promise.all(
      weekDates.map((d) =>
        getEngineerTaskSchedule(toDateParam(d))
          .then((res) => ({ dateKey: toDateParam(d), tasks: mapTasks(res.data) }))
          .catch(() => ({ dateKey: toDateParam(d), tasks: [] }))
      )
    ).then((results) => {
      if (!mounted) return;
      const map = {};
      results.forEach((r) => { map[r.dateKey] = r.tasks; });
      setWeekTasks(map);
      mergeKnownRegions(results.flatMap((r) => r.tasks));
    }).finally(() => { if (mounted) setWeekLoading(false); });

    return () => { mounted = false; };
  }, [view, currentDate]);

  // ── 월간 데이터 조회 ──────────────────────────
  useEffect(() => {
    if (view !== "월간") return;
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 비동기 조회 직전 로딩 상태 초기화(의도된 동작)
    setMonthLoading(true);

    const lastDate = new Date(calYear, calMonth + 1, 0).getDate();
    const dates = Array.from({ length: lastDate }, (_, i) => new Date(calYear, calMonth, i + 1));

    // 참고: 백엔드에 월 단위 범위 조회 API가 없어 하루치씩 병렬 호출함.
    // 트래픽이 부담되면 /api/engineer/schedule?year=&month= 같은 범위 API 추가를 권장.
    Promise.all(
      dates.map((d) =>
        getEngineerTaskSchedule(toDateParam(d))
          .then((res) => ({ day: d.getDate(), count: (res.data ?? []).length }))
          .catch(() => ({ day: d.getDate(), count: 0 }))
      )
    ).then((results) => {
      if (!mounted) return;
      const map = {};
      results.forEach((r) => { map[r.day] = r.count; });
      setMonthCounts(map);
    }).finally(() => { if (mounted) setMonthLoading(false); });

    return () => { mounted = false; };
  }, [view, calYear, calMonth]);

  const goNext = () => {
    if (view === "주간") {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
    } else if (view === "월간") {
      if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1);
    } else {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
    }
  };
  const goPrev = () => {
    if (view === "주간") {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
    } else if (view === "월간") {
      if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1);
    } else {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
    }
  };
  const goToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    setSelectedDate(now.getDate());
  };

  // ── 일정 내보내기 (CSV, UTF-8 BOM) ──────────────
  // 현재 뷰(일간/주간/월간)의 범위를 새로 조회해 CSV로 내보냄(Excel에서 한글 깨짐 방지).
  // 종료 시각은 화면과 동일하게 시작 +1시간으로 산정.
  // (캘린더 앱으로 가져가는 .ics 내보내기는 추후 확장 기능으로 보류)
  const [exporting, setExporting] = useState(false);
  const escapeCsv = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // 전화번호처럼 숫자로만 이뤄진 값은 Excel이 숫자로 인식해 맨 앞 0을 떼므로,
  // ="..." 텍스트 강제 형식으로 내보내 leading zero(예: 010...)를 그대로 보존한다.
  const csvText = (raw) => {
    const s = String(raw ?? "").replace(/[^0-9]/g, "");
    return s ? `="${s}"` : "";
  };
  const handleExportSchedule = async () => {
    setExporting(true);
    try {
      const dates =
        view === "주간"
          ? getWeekDates(currentDate).map(toDateParam)
          : view === "월간"
            ? Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() },
                (_, i) => toDateParam(new Date(calYear, calMonth, i + 1)))
            : [toDateParam(currentDate)];

      const results = await Promise.all(dates.map((d) =>
        getEngineerTaskSchedule(d)
          .then((r) => ({ d, list: r.data ?? [] }))
          .catch(() => ({ d, list: [] }))
      ));

      const pad2 = (n) => String(n).padStart(2, "0");
      const header = ["날짜", "시작", "종료", "상태", "제품명", "고객명", "연락처", "방문지역", "주소", "증상"];
      const rows = results.flatMap(({ d, list }) => list.map((t) => {
        const [h, m] = t.scheduledTime.split(":").map(Number);
        const end = `${pad2(h + 1)}:${pad2(m)}`;
        const statusLabel = STATUS_MAP[t.assignmentStatus]?.label ?? t.assignmentStatus;
        return [
          d,
          t.scheduledTime,
          end,
          statusLabel,
          `${t.applianceBrand} ${t.applianceModelName}`,
          t.customerName,
          csvText(t.customerPhone),
          t.visitRegionName,
          t.visitAddressDetail,
          t.symptomName,
        ];
      }));

      if (rows.length === 0) {
        alert("내보낼 일정이 없습니다.");
        return;
      }

      const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `careflow_일정_${view}_${toDateParam(currentDate)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("일정 내보내기 실패:", err);
      alert("일정 내보내기에 실패했습니다.");
    } finally {
      setExporting(false);
    }
  };

  // [수정] assignmentId만 넘기면 EngineerWorkPage 탭이 항상 "전체"로 남아있어서,
  // 클릭한 작업의 상태(statusKey)에 맞는 탭으로 바로 이동하도록 initialTab도 함께 전달
  const handleDetail = (item) => {
    navigate("/engineer/work", { state: { assignmentId: item.assignmentId, initialTab: item.statusKey } });
  };

  // 월간 뷰에서 날짜 클릭 → 그 날짜의 일간 뷰로 전환
  const handleMonthDayClick = (d) => {
    if (!d.cur || !d.date) return;
    setCurrentDate(d.date);
    setSelectedDate(d.day);
    setView("일간");
  };

  const weekDates = getWeekDates(currentDate);

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
            <span className="esp-date-label">
              {view === "월간" ? `${calYear}년 ${calMonth + 1}월` : dateStr}
            </span>
            <button className="esp-nav-btn" onClick={goNext}><ChevronRight size={15} /></button>
          </div>
          <button className="esp-today-btn" onClick={goToday}><Calendar size={13} /> 오늘</button>
          {/* 전체 작업 상태 필터 드롭다운 (사이드바 filterStatus와 동일한 state 공유) */}
          <div className="esp-filter-select" style={{ position: "relative" }}>
            <button
              onClick={() => { setStatusDropdownOpen(o => !o); setRegionDropdownOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", font: "inherit", color: "inherit" }}
            >
              <span>{statusButtonLabel}</span><ChevronDown size={13} />
            </button>
            {statusDropdownOpen && (
              <div style={{
                position: "absolute", top: "130%", left: 0, zIndex: 20,
                background: "#fff", border: "1px solid #eee", borderRadius: 8,
                padding: 10, minWidth: 140, boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                {Object.keys(filterStatus).map((key) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={filterStatus[key]}
                      onChange={() => setFilterStatus(p => ({ ...p, [key]: !p[key] }))}
                    />
                    {key}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 전체 지역 필터 드롭다운 — 지역 마스터 API가 없어 로딩된 작업 데이터에서 지역명 추출 */}
          <div className="esp-filter-select" style={{ position: "relative" }}>
            <button
              onClick={() => { setRegionDropdownOpen(o => !o); setStatusDropdownOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", font: "inherit", color: "inherit" }}
            >
              <MapPin size={12} color="#aaa" /><span>{regionFilter ?? "전체 지역"}</span><ChevronDown size={13} />
            </button>
            {regionDropdownOpen && (
              <div style={{
                position: "absolute", top: "130%", left: 0, zIndex: 20,
                background: "#fff", border: "1px solid #eee", borderRadius: 8,
                padding: 10, minWidth: 140, maxHeight: 220, overflowY: "auto",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="regionFilter"
                    checked={!regionFilter}
                    onChange={() => { setRegionFilter(null); setRegionDropdownOpen(false); }}
                  />
                  전체 지역
                </label>
                {knownRegions.map((r) => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="regionFilter"
                      checked={regionFilter === r}
                      onChange={() => { setRegionFilter(r); setRegionDropdownOpen(false); }}
                    />
                    {r}
                  </label>
                ))}
                {knownRegions.length === 0 && (
                  <p style={{ fontSize: 11, color: "#aaa" }}>조회된 지역이 아직 없어요</p>
                )}
              </div>
            )}
          </div>
          <button className="esp-export-btn" onClick={handleExportSchedule} disabled={exporting}>
            <Download size={13} /> {exporting ? "내보내는 중..." : "일정 내보내기"}
          </button>
        </div>
      </div>

      {loading && view === "일간" && <p style={{ padding: "16px" }}>불러오는 중...</p>}
      {error && <p style={{ padding: "16px", color: "red" }}>{error}</p>}

      {/* ── 일간 뷰 ── */}
      {!error && view === "일간" && !loading && (
        <div className="esp-body">
          <div className="esp-timeline-wrap">
            {isOff && (
              <div style={{ padding: "12px 16px", color: "#888", background: "#f8f7ff", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                😴 이 날짜는 휴무로 등록되어 있어요. (배정된 작업이 있다면 아래에 표시됩니다)
              </div>
            )}
            {workScheduleError && !isOff && (
              <div style={{ padding: "12px 16px", color: "#b8860b", background: "#fff7e6", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                ⚠ 근무표 정보를 불러오지 못했어요. 근무 시간 음영 표시 없이 작업 목록만 보여드려요.
              </div>
            )}

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

                {filteredSchedule.map((item) => {
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

                {filteredSchedule.length === 0 && (
                  <p style={{ position: "absolute", top: "40%", left: 0, right: 0, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                    표시할 작업이 없습니다. (필터 설정을 확인해보세요)
                  </p>
                )}
              </div>
            </div>
            <p className="esp-drag-hint">ⓘ 작업 시간을 드래그하여 일정을 조절할 수 있습니다.</p>
          </div>

          <aside className="esp-aside">
            {renderSidePanels()}
          </aside>
        </div>
      )}

      {/* ── 주간 뷰 ── */}
      {!error && view === "주간" && (
        <div className="esp-body">
          <div className="esp-timeline-wrap">
            {weekLoading ? (
              <p style={{ padding: 16, color: "#aaa" }}>불러오는 중...</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                {weekDates.map((d) => {
                  const key = toDateParam(d);
                  const tasks = applyFilter(weekTasks[key] ?? []);
                  const isToday = toDateParam(d) === toDateParam(new Date());
                  return (
                    <div key={key} style={{ minHeight: 200 }}>
                      <div
                        style={{
                          textAlign: "center", padding: "6px 0", borderRadius: 6, marginBottom: 6,
                          background: isToday ? "#eeeaff" : "transparent",
                          fontWeight: 700, fontSize: 12,
                          color: d.getDay() === 0 ? "#e04848" : d.getDay() === 6 ? "#3b6fd6" : "#1a1a2e",
                        }}
                      >
                        {CALENDAR_DAYS[d.getDay()]} · {d.getDate()}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {tasks.map((t) => {
                          const s = STATUS_MAP[t.statusKey] ?? STATUS_MAP.WAITING;
                          return (
                            <button
                              key={t.assignmentId}
                              onClick={() => handleDetail(t)}
                              style={{
                                textAlign: "left", border: "none", borderRadius: 8, padding: "8px",
                                background: s.bg, cursor: "pointer",
                              }}
                            >
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#1a1a2e" }}>{t.startTime}</div>
                              <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{t.productName}</div>
                              <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{t.customerName} 고객</div>
                            </button>
                          );
                        })}
                        {tasks.length === 0 && (
                          <p style={{ fontSize: 11, color: "#ccc", textAlign: "center", marginTop: 8 }}>-</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <aside className="esp-aside">
            {renderSidePanels()}
          </aside>
        </div>
      )}

      {/* ── 월간 뷰 ── */}
      {!error && view === "월간" && (
        <div className="esp-body">
          <div className="esp-timeline-wrap">
            {monthLoading ? (
              <p style={{ padding: 16, color: "#aaa" }}>불러오는 중...</p>
            ) : (
              <div className="esp-cal-grid" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {CALENDAR_DAYS.map(d => <div key={d} className="esp-cal-day-label">{d}</div>)}
                {calDays.map((d, i) => {
                  const count = d.cur ? (monthCounts[d.day] ?? 0) : 0;
                  return (
                    <button
                      key={i}
                      onClick={() => handleMonthDayClick(d)}
                      disabled={!d.cur}
                      style={{
                        aspectRatio: "1", border: "1px solid #f0f0f5", borderRadius: 8,
                        background: !d.cur ? "#fafafa" : "#fff",
                        color: !d.cur ? "#ccc" : "#1a1a2e",
                        cursor: d.cur ? "pointer" : "default",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{d.day}</span>
                      {d.cur && count > 0 && (
                        <span style={{ fontSize: 10, color: "#5B4FF5", fontWeight: 700 }}>{count}건</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <aside className="esp-aside">
            {renderSidePanels()}
          </aside>
        </div>
      )}
    </div>
  );

  // 세 뷰에서 공통으로 쓰는 우측 사이드 패널(미니 달력 + 요약 + 필터)
  function renderSidePanels() {
    return (
      <>
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
                    setView("일간");
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
              { key: "취소",   color: "#e04848" },
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
      </>
    );
  }
}