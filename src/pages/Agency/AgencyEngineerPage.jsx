import { useState, useEffect, useCallback } from "react";
import {
  Users, Circle, BookCheck, ClipboardList, Star,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, MoreVertical, RefreshCw,
  Phone, Mail, Building2, X, UserPlus,
} from "lucide-react";
import "../../styles/Agency/agency/AgencyEngineerPage.css";

const BASE_URL = "http://localhost:8080";

async function apiFetch(path) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (res.status === 204) return [];
  if (!res.ok) throw new Error(`${res.status}`);
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

function Avatar({ name, profileImg, size = 36 }) {
  return (
    <div className="aep-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {profileImg ? <img src={profileImg} alt={name} /> : <span>{name?.charAt(0)}</span>}
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

export default function AgencyEngineerPage() {
  // ── 11번: 기사 목록 ──────────────────────────
  const [engineerList, setEngineerList] = useState([]);
  const [listLoading, setListLoading]   = useState(true);

  // ── 12번: 기사 상세 ──────────────────────────
  const [selectedItem, setSelectedItem]   = useState(null);
  const [detailData, setDetailData]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab]         = useState("기본 정보");

  // ── 필터 / 페이지 ────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 15;

  const fetchEngineers = useCallback(() => {
    setListLoading(true);
    apiFetch("/api/agency/engineers")
      .then(data => setEngineerList(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => { fetchEngineers(); }, [fetchEngineers]);

  const handleSelectEngineer = useCallback(async (engineer) => {
    setSelectedItem(engineer);
    setDetailTab("기본 정보");
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

  const filteredList = engineerList.filter(e =>
    !searchQuery ||
    e.name?.includes(searchQuery) ||
    String(e.engineerUserId).includes(searchQuery)
  );

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
              {listLoading ? "..." : engineerList.filter(e => e.isLmsCompleted).length}
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
            <p className="aep-stat-card__value">4.8<span>/5.0</span></p>
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
        <button className="aep-invite-btn"><UserPlus size={14} /> 가입 신청 관리</button>
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
              filteredList.map((item) => {
                const skill    = SKILL_MAP[item.skillLevel] ?? { label: item.skillLevel, type: "beginner", en: item.skillLevel };
                const schedule = SCHEDULE_STATUS_MAP[item.currentWorkStatus] ?? { label: "-", type: "off" };
                const isSelected = selectedItem?.engineerUserId === item.engineerUserId;
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
                      {item.isLmsCompleted
                        ? <span className="aep-lms-badge aep-lms-badge--done">이수 완료</span>
                        : <span className="aep-lms-badge aep-lms-badge--fail">미이수</span>
                      }
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
              {[1,2,3,4,5].map(p => (
                <button key={p} className={currentPage === p ? "aep-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <span className="aep-pagination__ellipsis">...</span>
              <button className={currentPage === totalPages ? "aep-pagination__active" : ""} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
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
              <button className="aep-detail__close" onClick={() => { setSelectedItem(null); setDetailData(null); }}>
                <X size={16} />
              </button>
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
                  onClick={() => setDetailTab(tab)}
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
                        {detailData.isLmsCompleted
                          ? <span className="aep-lms-badge aep-lms-badge--done">이수 완료</span>
                          : <span className="aep-lms-badge aep-lms-badge--fail">미이수</span>
                        }
                      </div>
                      {!detailData.isLmsCompleted && (
                        <p className="aep-detail__lms-warn">⚠ LMS 미이수 — 배차 불가 상태</p>
                      )}
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
    </div>
  );
}