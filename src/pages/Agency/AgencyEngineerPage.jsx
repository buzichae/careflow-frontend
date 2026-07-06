import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Users, Circle, BookCheck, ClipboardList, Star,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, MoreVertical, RefreshCw,
  Phone, Mail, Building2, X, UserPlus, Pencil, Plus, Save, Loader2,
  CheckCircle,
} from "lucide-react";
import "../../styles/Agency/agency/AgencyEngineerPage.css";
import "../../styles/Agency/agency/Agencyengineerpage.edit form.css"
import EngineerApprovalModal from "../../pages/Agency/Modal/Engineerapprovalmodal";
import { getAgencyEngineersLmsStatus } from "../../apis/lms";

export const BASE_URL = "http://localhost:8080";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
  });
  if (res.status === 204) return [];
  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {
      /* 응답 본문이 JSON이 아닌 경우 무시 */
    }
    throw new Error(message);
  }
  return res.json();
}

// ── 상수 매핑 ──────────────────────────────
const SKILL_MAP = {
  EXPERT:       { label: "고급", type: "advanced",     en: "EXPERT"        },
  INTERMEDIATE: { label: "중급", type: "intermediate", en: "INTERMEDIATE"  },
  BEGINNER:     { label: "초급", type: "beginner",     en: "BEGINNER"      },
};

const SCHEDULE_STATUS_MAP = {
  AVAILABLE: { label: "근무 중", type: "available" },
  BOOKED:    { label: "작업 중", type: "booked"    },
  OFF:       { label: "휴무",   type: "off"        },
};

const DETAIL_TABS = ["기본 정보", "근무표"];

function formatEngineerId(userId) {
  return `ENG-${String(userId).padStart(5, "0")}`;
}

function getCareerYears(startYear) {
  if (!startYear) return "-";
  return `${new Date().getFullYear() - startYear}년`;
}

// 서버의 등급 자동 산정 규칙(1~5년=초급, 6~10년=중급, 11년↑=고급)을 그대로 반영한
// 프론트 미리보기용 계산. 실제 저장 값은 서버가 재계산하며, 이 값은 참고용 표시일 뿐입니다.
function previewSkillLevel(startYear) {
  const year = Number(startYear);
  if (!year || Number.isNaN(year)) return "BEGINNER";
  const years = new Date().getFullYear() - year;
  if (years >= 11) return "EXPERT";
  if (years >= 6) return "INTERMEDIATE";
  return "BEGINNER";
}

/**
 * LMS 이수 상태 배지
 *
 * [v10 설계] 콘텐츠를 전부 이수해도 OX퀴즈 합격 전까지 lmsCompleted=false 유지.
 * 이 페이지의 기존 기사 목록 API(/api/agency/engineers)는 lmsCompleted만 내려줘서
 * "콘텐츠는 다 읽었는데 퀴즈만 안 봄" 상태를 구분할 수 없었음.
 * → getAgencyEngineersLmsStatus()를 별도로 호출해 completedCount/totalCount를 병합,
 *   AgencyLmsPage와 동일한 3단계 배지 로직을 적용.
 * lmsDetail이 아직 없거나(로딩 전) 매칭 실패 시엔 기존처럼 lmsCompleted만으로 표시(폴백).
 *
 * [버그 수정] 이 페이지는 원래 item.isLmsCompleted를 참조했지만, 백엔드 응답의
 * 실제 필드명은 lmsCompleted다 (Java boolean getter isLmsCompleted()가
 * Jackson 직렬화 시 "is" 접두사가 제거되어 lmsCompleted로 나감).
 * 존재하지 않는 필드를 읽어 항상 undefined(=falsy)가 되면서, 실제로는 이수 완료한
 * 기사도 "미이수"로 잘못 표시되던 버그였음.
 */
function LmsStatusBadge({ isCompleted, lmsDetail }) {
  if (isCompleted) {
    return <span className="aep-lms-badge aep-lms-badge--done">이수 완료</span>;
  }

  const contentDone =
    lmsDetail &&
    lmsDetail.totalCount > 0 &&
    lmsDetail.completedCount === lmsDetail.totalCount;

  if (contentDone) {
    return <span className="aep-lms-badge aep-lms-badge--quiz-pending">콘텐츠 완료 · 퀴즈 대기</span>;
  }

  return <span className="aep-lms-badge aep-lms-badge--fail">미이수</span>;
}

function Avatar({ name, profileImg, size = 36 }) {
  return (
    <div className="aep-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {profileImg ? <img src={profileImg} alt={name} /> : <span>{name?.charAt(0)}</span>}
    </div>
  );
}

// ── 태그(칩) 입력 컴포넌트: 전문 브랜드 / 활동 지역 ID 편집용 ──────────
function TagInput({ label, values, onChange, placeholder, parseValue }) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const raw = draft.trim();
    if (!raw) return;
    const parsed = parseValue ? parseValue(raw) : raw;
    if (parsed === null || parsed === undefined || parsed === "") {
      setDraft("");
      return;
    }
    if (values.some(v => String(v) === String(parsed))) {
      setDraft("");
      return;
    }
    onChange([...values, parsed]);
    setDraft("");
  };

  const removeTag = (idx) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="aep-edit-field">
      <span className="aep-detail__info-label">{label}</span>
      <div className="aep-tag-input">
        <div className="aep-tag-input__tags">
          {values.length === 0 && (
            <span className="aep-tag-input__empty">등록된 항목이 없습니다</span>
          )}
          {values.map((v, idx) => (
            <span key={`${v}-${idx}`} className="aep-tag-chip">
              {v}
              <button type="button" onClick={() => removeTag(idx)} aria-label={`${v} 삭제`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="aep-tag-input__add">
          <input
            type="text"
            value={draft}
            placeholder={placeholder}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" onClick={addTag}><Plus size={13} /> 추가</button>
        </div>
      </div>
    </div>
  );
}

// ── 근무표 캘린더 컴포넌트 (14번 API) ────────────
function ScheduleCalendar({ engineerUserId }) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/agency/engineers/${engineerUserId}/schedules?year=${year}&month=${month}`)
      .then(setSchedules)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [engineerUserId, year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const scheduleMap = {};
  schedules.forEach(s => { scheduleMap[s.workDate] = s; });

  const firstDay = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(d);

  const STATUS_COLOR = {
    AVAILABLE: "#eaf3de",
    BOOKED:    "#eeeaff",
    OFF:       "#f5f5f5",
  };
  const STATUS_TEXT_COLOR = {
    AVAILABLE: "#16a34a",
    BOOKED:    "#5B4FF5",
    OFF:       "#888",
  };

  return (
    <div style={{ fontSize: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "#5B4FF5" }}>‹</button>
        <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{year}년 {month}월</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "#5B4FF5" }}>›</button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#aaa", padding: "20px" }}>로딩 중...</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
            {["일", "월", "화", "수", "목", "금", "토"].map(d => (
              <div key={d} style={{ textAlign: "center", color: "#aaa", fontSize: "11px", padding: "4px 0" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const sch = scheduleMap[dateStr];
              return (
                <div
                  key={dateStr}
                  style={{
                    textAlign: "center", padding: "6px 2px", borderRadius: "6px",
                    background: sch ? STATUS_COLOR[sch.status] : "transparent",
                    color: sch ? STATUS_TEXT_COLOR[sch.status] : "#444",
                    fontSize: "11px", fontWeight: sch ? 700 : 400,
                  }}
                  title={sch ? `${sch.status}\n${sch.timeSlots?.join(", ")}` : ""}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
            {[
              { status: "AVAILABLE", label: "근무 가능" },
              { status: "BOOKED",    label: "예약됨"   },
              { status: "OFF",       label: "휴무"     },
            ].map(({ status, label }) => (
              <div key={status} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_COLOR[status] }} />
                <span style={{ color: STATUS_TEXT_COLOR[status] }}>{label}</span>
              </div>
            ))}
          </div>

          {schedules.length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{ fontSize: "11px", color: "#aaa", fontWeight: 600 }}>근무 일정 상세</p>
              {schedules.map(s => (
                <div key={s.scheduleId} style={{
                  background: "#f8f7ff", borderRadius: "8px", padding: "8px 10px",
                  fontSize: "11px", color: "#444",
                }}>
                  <span style={{ fontWeight: 700, color: "#5B4FF5" }}>{s.workDate}</span>
                  <span style={{ marginLeft: "8px", color: STATUS_TEXT_COLOR[s.status] }}>
                    {SCHEDULE_STATUS_MAP[s.status]?.label ?? s.status}
                  </span>
                  {s.timeSlots?.length > 0 && (
                    <p style={{ marginTop: "3px", color: "#888" }}>{s.timeSlots.join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {schedules.length === 0 && (
            <p style={{ textAlign: "center", color: "#aaa", fontSize: "12px", marginTop: "12px" }}>
              등록된 근무표가 없습니다.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── 기본 정보 편집 폼 ────────────────────────────
function ProfileEditForm({ initialData, onCancel, onSaved }) {
  const [form, setForm] = useState({
    phone: initialData.phone ?? "",
    email: initialData.email ?? "",
    expertBrands: Array.isArray(initialData.expertBrands) ? [...initialData.expertBrands] : [],
    serviceRegionIds: Array.isArray(initialData.serviceRegionIds) ? [...initialData.serviceRegionIds] : [],
    careerStartedYear: initialData.careerStartedYear ?? "",
    introduction: initialData.introduction ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // 참고(백엔드 확인 완료):
      // - expertBrands/serviceRegionIds: []는 "전체 삭제", 필드 자체를 보내지 않으면(undefined) "변경 안 함"으로 처리됩니다.
      //   여기서는 항상 배열(빈 배열 포함)로 명시해서 보내므로 "전체 삭제" 의도가 정상 반영됩니다.
      // - skillLevel: 서버가 careerStartedYear 기준으로 자동 재산정하며, 요청 필드 자체가 없습니다.
      //   프론트에서 편집 불가능한 값이라 payload에서 완전히 제외합니다.
      const payload = {
        phone: form.phone,
        email: form.email,
        expertBrands: form.expertBrands,
        serviceRegionIds: form.serviceRegionIds,
        careerStartedYear: form.careerStartedYear ? Number(form.careerStartedYear) : null,
        introduction: form.introduction,
      };

      const updated = await apiFetch(
        `/api/agency/engineers/${initialData.engineerUserId}/profile`,
        { method: "PUT", body: JSON.stringify(payload) }
      );

      onSaved(updated ?? { ...initialData, ...payload });
    } catch (err) {
      console.error(err);
      setError(err.message === "404" || err.message === "403"
        ? "수정 권한이 없거나 대상을 찾을 수 없습니다."
        : "저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="aep-edit-form" onSubmit={handleSubmit}>
      <div className="aep-edit-field">
        <span className="aep-detail__info-label">연락처</span>
        <input
          className="aep-edit-input"
          type="tel"
          value={form.phone}
          onChange={e => updateField("phone", e.target.value)}
          placeholder="010-0000-0000"
        />
      </div>

      <div className="aep-edit-field">
        <span className="aep-detail__info-label">이메일</span>
        <input
          className="aep-edit-input"
          type="email"
          value={form.email}
          onChange={e => updateField("email", e.target.value)}
          placeholder="engineer@example.com"
        />
      </div>

      <TagInput
        label="전문 브랜드"
        values={form.expertBrands}
        onChange={v => updateField("expertBrands", v)}
        placeholder="브랜드명 입력 후 Enter"
      />

      <TagInput
        label="활동 지역 ID"
        values={form.serviceRegionIds}
        onChange={v => updateField("serviceRegionIds", v)}
        placeholder="지역 ID 입력 후 Enter"
        parseValue={(raw) => {
          const n = Number(raw);
          return Number.isFinite(n) ? n : null;
        }}
      />

      <div className="aep-edit-field">
        <span className="aep-detail__info-label">경력 시작 연도</span>
        <input
          className="aep-edit-input"
          type="number"
          min="1980"
          max={new Date().getFullYear()}
          value={form.careerStartedYear}
          onChange={e => updateField("careerStartedYear", e.target.value)}
          placeholder="예: 2015"
        />
      </div>

      <div className="aep-edit-field">
        <span className="aep-detail__info-label">기술 등급</span>
        <div className="aep-edit-readonly">
          <span className={`aep-skill-badge aep-skill-badge--${(SKILL_MAP[previewSkillLevel(form.careerStartedYear)] ?? SKILL_MAP.BEGINNER).type}`}>
            <span>{(SKILL_MAP[previewSkillLevel(form.careerStartedYear)] ?? SKILL_MAP.BEGINNER).label}</span>
          </span>
          <span className="aep-edit-readonly__hint">경력 시작 연도 기준으로 저장 시 서버에서 자동 산정됩니다 (직접 지정 불가)</span>
        </div>
      </div>

      <div className="aep-edit-field">
        <span className="aep-detail__info-label">자기 소개</span>
        <textarea
          className="aep-edit-input aep-edit-textarea"
          rows={4}
          value={form.introduction}
          onChange={e => updateField("introduction", e.target.value)}
          placeholder="기사 소개를 입력하세요"
        />
      </div>

      {error && <p className="aep-edit-error">{error}</p>}

      <div className="aep-edit-actions">
        <button type="button" className="aep-edit-btn aep-edit-btn--cancel" onClick={onCancel} disabled={saving}>
          취소
        </button>
        <button type="submit" className="aep-edit-btn aep-edit-btn--save" disabled={saving}>
          {saving ? <Loader2 size={14} className="aep-spin" /> : <Save size={14} />}
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}

export default function AgencyEngineerPage() {
  // ── 11번: 기사 목록 ──────────────────────────
  const [engineerList, setEngineerList] = useState([]);
  const [listLoading, setListLoading]   = useState(true);

  // ── LMS 상세 현황(콘텐츠 완료/퀴즈 대기 구분용) ──────────
  // key: userId(=engineerUserId), value: { completedCount, totalCount, isCompleted }
  const [lmsDetailMap, setLmsDetailMap] = useState({});

  // ── 12번: 기사 상세 ──────────────────────────
  const [selectedItem, setSelectedItem]   = useState(null);
  const [detailData, setDetailData]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab]         = useState("기본 정보");

  // ── 13번: 기사 프로필 수정 ─────────────────────
  const [isEditMode, setIsEditMode] = useState(false);

  // ── 가입 신청 관리 모달 ─────────────────────────
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // ── 필터 / 페이지 ────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const token    = localStorage.getItem("token");
  const decoded  = token ? jwtDecode(token) : null;
  const agencyId = decoded?.agencyId ?? null;
  // 슈퍼 계정(대표 담당자)만 기사 가입 신청을 승인/반려할 수 있으므로 버튼도 슈퍼 계정에게만 노출
  const isRepresentative = decoded?.isRepresentative ?? false;

  const fetchEngineers = useCallback(() => {
    setListLoading(true);
    apiFetch("/api/agency/engineers")
      .then(data => setEngineerList(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setListLoading(false));
  }, []);

  // LMS 콘텐츠/퀴즈 상세 현황을 별도로 받아와 userId 기준으로 매핑
  // (이 값이 없으면 LmsStatusBadge는 lmsCompleted만으로 기존처럼 표시됨)
  const fetchLmsDetail = useCallback(() => {
    if (!agencyId) return;
    getAgencyEngineersLmsStatus(agencyId)
      .then((res) => {
        const map = {};
        (res.data ?? []).forEach((e) => { map[e.userId] = e; });
        setLmsDetailMap(map);
      })
      .catch(console.error);
  }, [agencyId]);

  useEffect(() => { fetchEngineers(); }, [fetchEngineers]);
  // 검색어가 바뀌면 필터링된 목록 기준으로 1페이지부터 다시 보여줌
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);
  useEffect(() => { fetchLmsDetail(); }, [fetchLmsDetail]);

  const handleSelectEngineer = useCallback(async (engineer) => {
    setSelectedItem(engineer);
    setDetailTab("기본 정보");
    setIsEditMode(false);
    setDetailLoading(true);
    try {
      const data = await apiFetch(`/api/agency/engineers/${engineer.engineerUserId}/profile`);
      setDetailData(data);
    } catch (e) {
      console.error(e);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleProfileSaved = useCallback((updated) => {
    setDetailData(prev => ({ ...prev, ...updated }));
    setIsEditMode(false);
    // 목록의 요약 정보(전문 가전 등)도 최신 상태를 반영하도록 새로고침
    fetchEngineers();
    fetchLmsDetail();
  }, [fetchEngineers, fetchLmsDetail]);

  const filteredList = engineerList.filter(e =>
    !searchQuery ||
    e.name?.includes(searchQuery) ||
    String(e.engineerUserId).includes(searchQuery)
  );

  // 소속 기사 평균 평점 — avgRating이 없거나(NULL) 0인 기사(리뷰 없음)는 제외하고 평균 계산
  const ratedEngineers = engineerList.filter(e => e.avgRating != null && Number(e.avgRating) > 0);
  const avgRatingDisplay = ratedEngineers.length === 0
    ? "-"
    : (ratedEngineers.reduce((sum, e) => sum + Number(e.avgRating), 0) / ratedEngineers.length).toFixed(1);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const pagedList = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="aep">
      <div className="aep-header">
        <h1 className="aep-header__title">기사 관리</h1>
        <p className="aep-header__sub">소속 기사 정보를 관리하고 근무 현황과 실적을 확인할 수 있습니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="aep-stats">
        <div className="aep-stat-card">
          <div className="aep-stat-card__text">
            <p className="aep-stat-card__value">{listLoading ? "..." : engineerList.length}<span>명</span></p>
            <p className="aep-stat-card__label">전체 기사</p>
          </div>
          <div className="aep-stat-card__icon aep-stat-card__icon--purple">
            <Users size={40} strokeWidth={1} />
          </div>
        </div>

        <div className="aep-stat-card">
          <div className="aep-stat-card__text">
            <p className="aep-stat-card__value">
              {listLoading ? "..." : engineerList.filter(e => e.currentWorkStatus === "AVAILABLE" || e.currentWorkStatus === "BOOKED").length}
              <span>명</span>
            </p>
            <p className="aep-stat-card__label">활동 중</p>
          </div>
          <div className="aep-stat-card__icon aep-stat-card__icon--green">
            <Circle size={40} strokeWidth={1} />
          </div>
        </div>

        <div className="aep-stat-card">
          <div className="aep-stat-card__text">
            <p className="aep-stat-card__value">
              {listLoading ? "..." : engineerList.filter(e => e.lmsCompleted).length}
              <span>명</span>
            </p>
            <p className="aep-stat-card__label">교육 이수 완료</p>
          </div>
          <div className="aep-stat-card__icon aep-stat-card__icon--blue">
            <BookCheck size={40} strokeWidth={1} />
          </div>
        </div>

        <div className="aep-stat-card">
          <div className="aep-stat-card__text">
            <p className="aep-stat-card__value">{listLoading ? "..." : avgRatingDisplay}<span>/5.0</span></p>
            <p className="aep-stat-card__label">평균 평점</p>
          </div>
          <div className="aep-stat-card__icon aep-stat-card__icon--amber">
            <Star size={40} strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="aep-filters">
        <div className="aep-search">
          <Search size={13} color="#aaa" />
          <input
            type="text"
            placeholder="이름, 기사 ID 검색"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="aep-filter-select"><span>기술 등급</span><ChevronDown size={13} /></div>
        <div className="aep-filter-select"><span>교육 상태</span><ChevronDown size={13} /></div>
        <div className="aep-filter-select"><span>근무 상태</span><ChevronDown size={13} /></div>
        <button className="aep-reset-btn" onClick={() => setSearchQuery("")}>
          <RefreshCw size={13} /> 필터 초기화
        </button>
        {isRepresentative && (
          <button className="aep-invite-btn" onClick={() => setIsApprovalModalOpen(true)}>
            <UserPlus size={14} /> 가입 신청 관리
          </button>
        )}
      </div>

      <div className="aep-body">
        <div className="aep-left">
          <div className="aep-table">
            <div className="aep-table__header">
              <span><input type="checkbox" /></span>
              <span>기사 정보</span>
              <span>전문 가전</span>
              <span>기술 등급</span>
              <span>LMS 교육 상태</span>
              <span>근무 상태</span>
              <span>관리</span>
            </div>

            {listLoading ? (
              <p style={{ padding: "16px", color: "#aaa", fontSize: "13px" }}>로딩 중...</p>
            ) : filteredList.length === 0 ? (
              <p style={{ padding: "16px", color: "#aaa", fontSize: "13px" }}>소속 기사가 없습니다.</p>
            ) : (
              pagedList.map((item) => {
                const skill    = SKILL_MAP[item.skillLevel] ?? { label: item.skillLevel, type: "beginner", en: item.skillLevel };
                const schedule = SCHEDULE_STATUS_MAP[item.currentWorkStatus] ?? { label: "-", type: "off" };
                const isSelected = selectedItem?.engineerUserId === item.engineerUserId;
                const lmsDetail = lmsDetailMap[item.engineerUserId];
                return (
                  <div key={item.engineerUserId} className={`aep-table__row ${isSelected ? "aep-table__row--selected" : ""}`}>
                    <span><input type="checkbox" /></span>
                    <span className="aep-table__engineer-col">
                      <Avatar name={item.name} profileImg={null} size={34} />
                      <div>
                        <span className="aep-table__name">{item.name} 기사</span>
                        <span className="aep-table__engineer-id">{formatEngineerId(item.engineerUserId)}</span>
                      </div>
                    </span>
                    <span className="aep-table__specialty">{item.categoryName ?? "-"}</span>
                    <span>
                      <div className={`aep-skill-badge aep-skill-badge--${skill.type}`}>
                        <span>{skill.label}</span>
                        <span className="aep-skill-badge__en">{skill.en}</span>
                      </div>
                    </span>
                    <span>
                      <LmsStatusBadge isCompleted={item.lmsCompleted} lmsDetail={lmsDetail} />
                    </span>
                    <span>
                      <span className={`aep-status-badge aep-status-badge--${schedule.type}`}>{schedule.label}</span>
                    </span>
                    <span className="aep-table__actions">
                      <button
                        className={`aep-detail-btn ${isSelected ? "aep-detail-btn--active" : ""}`}
                        onClick={() => handleSelectEngineer(item)}
                      >
                        상세
                      </button>
                      <button className="aep-more-btn"><MoreVertical size={14} /></button>
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* 페이지네이션 */}
          <div className="aep-pagination">
            <div className="aep-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={currentPage === p ? "aep-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="aep-page-size">10개씩 보기 <ChevronDown size={13} /></div>
          </div>
        </div>

        {/* 우측 상세 패널 */}
        {selectedItem && (
          <aside className="aep-detail">
            <div className="aep-detail__header">
              <span className="aep-detail__title">기사 상세 정보</span>
              <div className="aep-detail__header-actions">
                {detailTab === "기본 정보" && detailData && !isEditMode && (
                  <button className="aep-edit-toggle-btn" onClick={() => setIsEditMode(true)}>
                    <Pencil size={13} /> 수정
                  </button>
                )}
                <button
                  className="aep-detail__close"
                  onClick={() => { setSelectedItem(null); setDetailData(null); setIsEditMode(false); }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="aep-detail__profile">
              <Avatar
                name={detailData?.name ?? selectedItem.name}
                profileImg={detailData?.profileImageUrl ?? null}
                size={52}
              />
              <div>
                <div className="aep-detail__profile-name">
                  {detailData?.name ?? selectedItem.name} 기사
                  <span className={`aep-status-badge aep-status-badge--${SCHEDULE_STATUS_MAP[selectedItem.currentWorkStatus]?.type ?? "off"}`}>
                    {SCHEDULE_STATUS_MAP[selectedItem.currentWorkStatus]?.label ?? "-"}
                  </span>
                </div>
                <p className="aep-detail__profile-id">{formatEngineerId(selectedItem.engineerUserId)}</p>
                {detailData && (
                  <div className="aep-detail__profile-rating">
                    ⭐ {detailData.avgRating ?? "-"} (리뷰 {detailData.totalReviews ?? 0}건)
                  </div>
                )}
              </div>
            </div>

            <div className="aep-detail__tabs">
              {DETAIL_TABS.map((tab) => (
                <button
                  key={tab}
                  className={`aep-detail__tab ${detailTab === tab ? "aep-detail__tab--active" : ""}`}
                  onClick={() => { setDetailTab(tab); setIsEditMode(false); }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="aep-detail__body">
              {detailTab === "기본 정보" && (
                detailLoading ? (
                  <p style={{ color: "#aaa", fontSize: "13px", padding: "12px" }}>로딩 중...</p>
                ) : detailData ? (
                  isEditMode ? (
                    <ProfileEditForm
                      initialData={detailData}
                      onCancel={() => setIsEditMode(false)}
                      onSaved={handleProfileSaved}
                    />
                  ) : (
                    <div className="aep-detail__info">
                      <div className="aep-detail__info-row">
                        <span className="aep-detail__info-label">연락처</span>
                        <span className="aep-detail__info-value">{detailData.phone} <Phone size={11} /></span>
                      </div>
                      <div className="aep-detail__info-row">
                        <span className="aep-detail__info-label">이메일</span>
                        <span className="aep-detail__info-value">{detailData.email} <Mail size={11} /></span>
                      </div>
                      <div className="aep-detail__info-row">
                        <span className="aep-detail__info-label">전문 가전</span>
                        <span className="aep-detail__info-value">{detailData.categoryName ?? "-"}</span>
                      </div>
                      <div className="aep-detail__info-row">
                        <span className="aep-detail__info-label">전문 브랜드</span>
                        <span className="aep-detail__info-value">{detailData.expertBrands?.join(", ") ?? "-"}</span>
                      </div>
                      <div className="aep-detail__info-row">
                        <span className="aep-detail__info-label">활동 지역 ID</span>
                        <span className="aep-detail__info-value">{detailData.serviceRegionIds?.join(", ") ?? "-"}</span>
                      </div>
                      <div className="aep-detail__info-row">
                        <span className="aep-detail__info-label">경력 시작</span>
                        <span className="aep-detail__info-value">
                          {detailData.careerStartedYear}년 (경력 {getCareerYears(detailData.careerStartedYear)})
                        </span>
                      </div>
                      <div className="aep-detail__info-row">
                        <span className="aep-detail__info-label">기술 등급</span>
                        <span className="aep-detail__info-value">
                          {SKILL_MAP[detailData.skillLevel]?.label ?? detailData.skillLevel}
                        </span>
                      </div>
                      {detailData.introduction && (
                        <div className="aep-detail__info-row">
                          <span className="aep-detail__info-label">자기 소개</span>
                          <span className="aep-detail__info-value">{detailData.introduction}</span>
                        </div>
                      )}
                      <div className="aep-detail__info-row">
                        <span className="aep-detail__info-label">가입일</span>
                        <span className="aep-detail__info-value">{detailData.createdAt?.slice(0, 10)}</span>
                      </div>

                      <div className="aep-detail__lms-section">
                        <p className="aep-detail__section-label">LMS 교육 상태</p>
                        <div className="aep-detail__lms-row">
                          <LmsStatusBadge
                            isCompleted={detailData.lmsCompleted}
                            lmsDetail={lmsDetailMap[selectedItem.engineerUserId]}
                          />
                        </div>
                        {(() => {
                          const lmsDetail = lmsDetailMap[selectedItem.engineerUserId];
                          const contentDone =
                            lmsDetail &&
                            lmsDetail.totalCount > 0 &&
                            lmsDetail.completedCount === lmsDetail.totalCount;

                          if (detailData.lmsCompleted) return null;

                          return contentDone ? (
                            <p className="aep-detail__lms-warn aep-detail__lms-warn--info">
                              콘텐츠는 모두 이수했지만 OX퀴즈 합격 전까지 배차가 제한됩니다.
                            </p>
                          ) : (
                            <p className="aep-detail__lms-warn">⚠ LMS 미이수 — 배차 불가 상태</p>
                          );
                        })()}
                      </div>

                      <div className="aep-detail__month-section">
                        <p className="aep-detail__section-label">평점 현황</p>
                        <div className="aep-detail__month-cards">
                          <div className="aep-detail__month-card">
                            <p className="aep-detail__month-label">평균 평점</p>
                            <p className="aep-detail__month-value">{detailData.avgRating ?? "-"}</p>
                          </div>
                          <div className="aep-detail__month-card">
                            <p className="aep-detail__month-label">누적 리뷰</p>
                            <p className="aep-detail__month-value">{detailData.totalReviews ?? 0}건</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <p style={{ color: "#aaa", fontSize: "13px", padding: "12px" }}>상세 정보를 불러올 수 없습니다.</p>
                )
              )}

              {detailTab === "근무표" && (
                <ScheduleCalendar engineerUserId={selectedItem.engineerUserId} />
              )}
            </div>
          </aside>
        )}
      </div>

      {isApprovalModalOpen && (
        <EngineerApprovalModal
          onClose={() => setIsApprovalModalOpen(false)}
          onApproved={fetchEngineers}
        />
      )}
    </div>
  );
}