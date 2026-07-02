import { useState, useEffect } from "react";
import { Plus, X, Search, Play } from "lucide-react";
import "../../styles/Admin/Admin.css";
import {
  getAdminLmsContents,
  createLmsContent,
  updateLmsContent,
  deactivateLmsContent,
  activateLmsContent,
  getEngineerConfirmations,
} from "../../apis/lms";

/* ── 상수 ── */
const CATEGORIES = [
  { id: 11, name: "냉장고" },
  { id: 12, name: "전기밥솥" },
  { id: 13, name: "인덕션" },
  { id: 14, name: "오븐" },
  { id: 15, name: "식기세척기" },
  { id: 21, name: "세탁기" },
  { id: 22, name: "건조기" },
  { id: 23, name: "에어컨" },
  { id: 24, name: "공기청정기" },
  { id: 25, name: "선풍기" },
  { id: 26, name: "청소기" },
  { id: 31, name: "TV" },
  { id: 32, name: "빔프로젝터" },
  { id: 41, name: "사운드바" },
  { id: 42, name: "홈시어터" },
  { id: 43, name: "스피커" },
];

const REQUIRED_LEVELS = [
  { key: "ALL",          label: "공통" },
  { key: "BEGINNER",     label: "1~5년" },
  { key: "INTERMEDIATE", label: "6~10년" },
  { key: "ADVANCED",     label: "11년 이상" },
];

/* ── 콘텐츠 등록/수정 모달 ── */
function ContentModal({ item, onClose, onSave }) {
  const isNew = !item.contentId;
  const [form, setForm] = useState(
      isNew
          ? {
            categoryId:    item.categoryId || CATEGORIES[0].id,
            title:         "",
            body:          "",
            videoUrl:      "",
            contentType:   "TEXT",
            requiredLevel: item.requiredLevel || "BEGINNER",
            version:       "1.0",
          }
          : {
            contentId:     item.contentId,
            categoryId:    item.categoryId,
            title:         item.title,
            body:          item.body   || "",
            videoUrl:      item.videoUrl || "",
            contentType:   item.contentType,
            requiredLevel: item.requiredLevel,
            version:       item.version,
          }
  );

  return (
      <div className="admin-modal-overlay" onClick={onClose}>
        <div className="admin-modal" style={{ width: 540 }} onClick={(e) => e.stopPropagation()}>
          <div className="admin-modal__header">
            <h2 className="admin-modal__title">{isNew ? "콘텐츠 등록" : "콘텐츠 수정"}</h2>
            <button className="admin-modal__close" onClick={onClose}><X size={18} /></button>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div className="admin-modal__field" style={{ flex: 1 }}>
              <label className="admin-modal__label">가전 카테고리</label>
              <select
                  className="admin-select"
                  style={{ width: "100%" }}
                  value={form.categoryId}
                  onChange={(e) => setForm((p) => ({ ...p, categoryId: Number(e.target.value) }))}
              >
                {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="admin-modal__field" style={{ flex: 1 }}>
              <label className="admin-modal__label">대상 등급</label>
              <select
                  className="admin-select"
                  style={{ width: "100%" }}
                  value={form.requiredLevel}
                  onChange={(e) => setForm((p) => ({ ...p, requiredLevel: e.target.value }))}
              >
                {REQUIRED_LEVELS.map((cl) => (
                    <option key={cl.key} value={cl.key}>{cl.label}</option>
                ))}
              </select>
            </div>
            <div className="admin-modal__field" style={{ flex: 1 }}>
              <label className="admin-modal__label">콘텐츠 유형</label>
              <select
                  className="admin-select"
                  style={{ width: "100%" }}
                  value={form.contentType}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    contentType: e.target.value,
                    body:     "",
                    videoUrl: "",
                  }))}
              >
                <option value="TEXT">TEXT</option>
                <option value="VIDEO">VIDEO</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div className="admin-modal__field" style={{ flex: 2 }}>
              <label className="admin-modal__label">제목</label>
              <input
                  className="admin-modal__input"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="콘텐츠 제목"
              />
            </div>
            <div className="admin-modal__field" style={{ flex: 1 }}>
              <label className="admin-modal__label">버전</label>
              <input
                  className="admin-modal__input"
                  value={form.version}
                  onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
                  placeholder="예: 1.0"
              />
            </div>
          </div>

          {/* 콘텐츠 유형별 입력 분기 */}
          <div className="admin-modal__field">
            <label className="admin-modal__label">
              {form.contentType === "TEXT" ? "본문" : "YouTube URL"}
            </label>
            {form.contentType === "TEXT" ? (
                <textarea
                    className="admin-modal__textarea"
                    style={{ minHeight: 120 }}
                    value={form.body}
                    onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                    placeholder="교육 내용을 입력하세요."
                />
            ) : (
                <>
                  <input
                      className="admin-modal__input"
                      value={form.videoUrl}
                      onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {/* URL 미리보기 */}
                  {form.videoUrl && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
                        <Play size={12} color="#734bcf" />
                        <span>입력된 URL: {form.videoUrl}</span>
                      </div>
                  )}
                </>
            )}
          </div>

          {!isNew && (
              <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
                * 수정 시 버전 업이 필수입니다.
              </p>
          )}
          <div className="admin-modal__footer">
            <button className="admin-btn admin-btn--outline" onClick={onClose}>취소</button>
            <button className="admin-btn admin-btn--primary" onClick={() => onSave(form)}>
              {isNew ? "등록" : "수정 저장"}
            </button>
          </div>
        </div>
      </div>
  );
}

/* ── 매트릭스 칸 안의 콘텐츠 카드 ── */
function CourseCard({ course, onEdit, onToggle }) {
  return (
      <div className={`lms-course-card${!course.isActive ? " lms-course-card--inactive" : ""}`}>
        <div className="lms-course__title">{course.title}</div>
        <div className="lms-course__meta">
          <span className="lms-course__version">v{course.version}</span>
          {/* 콘텐츠 타입 배지 추가 */}
          <span className={`admin-badge ${course.contentType === "VIDEO" ? "admin-badge--blue" : "admin-badge--gray"}`}>
          {course.contentType}
        </span>
          {course.isActive
              ? <span className="admin-badge admin-badge--green">활성</span>
              : <span className="admin-badge admin-badge--gray">비활성</span>}
        </div>
        <div className="lms-course__actions">
          <button className="admin-btn admin-btn--outline admin-btn--sm" onClick={() => onEdit(course)}>
            수정
          </button>
          <button
              className={`admin-btn admin-btn--sm ${course.isActive ? "admin-btn--danger" : "admin-btn--approve"}`}
              onClick={() => onToggle(course)}
          >
            {course.isActive ? "비활성화" : "활성화"}
          </button>
        </div>
      </div>
  );
}

/* ── 메인 ── */
export default function AdminLMSPage() {
  const [tab, setTab]             = useState("matrix");
  const [courses, setCourses]     = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [modal, setModal]         = useState(null);
  const [engSearch, setEngSearch] = useState("");
  const [engFilter, setEngFilter] = useState("ALL");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => { fetchCourses(); }, []);

  async function fetchCourses() {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminLmsContents({});
      setCourses(res.data);
    } catch (e) {
      setError("콘텐츠 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function getCourses(categoryId, requiredLevel) {
    return courses.filter(
        (c) => c.categoryId === categoryId && c.requiredLevel === requiredLevel
    );
  }

  async function handleSave(form) {
    try {
      if (form.contentId) {
        await updateLmsContent(form.contentId, {
          title:         form.title,
          body:          form.contentType === "TEXT"  ? form.body     : null,
          videoUrl:      form.contentType === "VIDEO" ? form.videoUrl : null,
          requiredLevel: form.requiredLevel,
          version:       form.version,
        });
      } else {
        await createLmsContent({
          categoryId:    form.categoryId,
          title:         form.title,
          body:          form.contentType === "TEXT"  ? form.body     : null,
          videoUrl:      form.contentType === "VIDEO" ? form.videoUrl : null,
          requiredLevel: form.requiredLevel,
          contentType:   form.contentType,
          version:       form.version,
        });
      }
      await fetchCourses();
      setModal(null);
    } catch (e) {
      alert("저장에 실패했습니다.");
    }
  }

  async function toggleActive(course) {
    try {
      if (course.isActive) {
        await deactivateLmsContent(course.contentId);
      } else {
        await activateLmsContent(course.contentId);
      }
      await fetchCourses();
    } catch (e) {
      alert("상태 변경에 실패했습니다.");
    }
  }

  async function handleEngineerSearch() {
    if (!engSearch) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getEngineerConfirmations(engSearch, null);
      setEngineers(res.data);
    } catch (e) {
      setError("이수 현황을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const filteredEng = engineers.filter((e) => {
    if (engFilter === "DONE")    return e.confirmedAt !== null;
    if (engFilter === "PENDING") return e.confirmedAt === null;
    return true;
  });

  const careerLabel  = (key) => REQUIRED_LEVELS.find((cl) => cl.key === key)?.label ?? key;
  const categoryName = (id)  => CATEGORIES.find((c) => c.id === id)?.name ?? "-";

  return (
      <div className="admin-page">
        <div className="admin-section">
          <div className="admin-tabs">
            {[
              { key: "matrix",   label: "교육 과정 매트릭스" },
              { key: "engineer", label: "기사별 이수 현황" },
            ].map((t) => (
                <button
                    key={t.key}
                    className={`admin-tab${tab === t.key ? " admin-tab--active" : ""}`}
                    onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
            ))}
          </div>

          {/* ── 교육 과정 매트릭스 ── */}
          {tab === "matrix" && (
              <div className="admin-section__body">
                {loading && <p style={{ padding: 20 }}>불러오는 중...</p>}
                {error   && <p style={{ padding: 20, color: "red" }}>{error}</p>}

                {!loading && !error && (
                    <>
                      <div className="admin-filter-bar">
                        <p style={{ fontSize: 13, color: "#555" }}>
                          전문 가전 카테고리 × 대상 등급별 교육 과정입니다. 공통 컬럼은 전체 등급 공통 이수 콘텐츠입니다.
                        </p>
                        <button
                            className="admin-btn admin-btn--primary"
                            style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}
                            onClick={() => setModal({})}
                        >
                          <Plus size={14} /> 콘텐츠 등록
                        </button>
                      </div>

                      <div className="lms-matrix">
                        <div className="lms-matrix__row lms-matrix__row--header">
                          <div className="lms-matrix__cell lms-matrix__cell--label" />
                          {REQUIRED_LEVELS.map((cl) => (
                              <div key={cl.key} className="lms-matrix__cell lms-matrix__cell--head">
                                {cl.label}
                              </div>
                          ))}
                        </div>

                        {CATEGORIES.map((cat) => (
                            <div key={cat.id} className="lms-matrix__row">
                              <div className="lms-matrix__cell lms-matrix__cell--label">{cat.name}</div>
                              {REQUIRED_LEVELS.map((cl) => {
                                const cellCourses = getCourses(cat.id, cl.key);
                                return (
                                    <div key={cl.key} className="lms-matrix__cell lms-matrix__cell--course">
                                      {cellCourses.length === 0 ? (
                                          <p className="lms-matrix__empty">등록된 콘텐츠 없음</p>
                                      ) : (
                                          cellCourses.map((course) => (
                                              <CourseCard
                                                  key={course.contentId}
                                                  course={course}
                                                  onEdit={setModal}
                                                  onToggle={toggleActive}
                                              />
                                          ))
                                      )}
                                    </div>
                                );
                              })}
                            </div>
                        ))}
                      </div>
                    </>
                )}
              </div>
          )}

          {/* ── 기사별 이수 현황 ── */}
          {tab === "engineer" && (
              <div className="admin-section__body">
                <div className="admin-filter-bar">
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search
                        size={14}
                        style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }}
                    />
                    <input
                        className="admin-search-input"
                        style={{ paddingLeft: 32 }}
                        placeholder="기사 ID 입력 후 Enter"
                        value={engSearch}
                        onChange={(e) => setEngSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleEngineerSearch(); }}
                    />
                  </div>
                  <button className="admin-btn admin-btn--primary" onClick={handleEngineerSearch}>
                    조회
                  </button>
                  <select
                      className="admin-select"
                      value={engFilter}
                      onChange={(e) => setEngFilter(e.target.value)}
                  >
                    <option value="ALL">이수 전체</option>
                    <option value="DONE">이수 완료</option>
                    <option value="PENDING">미이수</option>
                  </select>
                </div>

                {loading && <p style={{ padding: 20 }}>불러오는 중...</p>}
                {error   && <p style={{ padding: 20, color: "red" }}>{error}</p>}

                {!loading && (
                    <table className="admin-table">
                      <thead>
                      <tr>
                        <th>콘텐츠 제목</th>
                        <th>카테고리</th>
                        <th>대상 등급</th>
                        <th>이수 버전</th>
                        <th>이수 일시</th>
                      </tr>
                      </thead>
                      <tbody>
                      {filteredEng.map((confirm) => (
                          <tr key={confirm.confirmationId}>
                            <td style={{ fontWeight: 600 }}>{confirm.content?.title}</td>
                            <td>
                        <span className="admin-badge admin-badge--gray">
                          {categoryName(confirm.content?.categoryId)}
                        </span>
                            </td>
                            <td>
                        <span className="admin-badge admin-badge--blue">
                          {careerLabel(confirm.content?.requiredLevel)}
                        </span>
                            </td>
                            <td>{confirm.confirmedVersion}</td>
                            <td style={{ color: "#666" }}>
                              {confirm.confirmedAt
                                  ? new Date(confirm.confirmedAt).toLocaleDateString("ko-KR")
                                  : "-"}
                            </td>
                          </tr>
                      ))}
                      {filteredEng.length === 0 && (
                          <tr>
                            <td colSpan={5} className="admin-empty">
                              기사 ID를 입력하고 조회하세요.
                            </td>
                          </tr>
                      )}
                      </tbody>
                    </table>
                )}
              </div>
          )}
        </div>

        {modal !== null && (
            <ContentModal item={modal} onClose={() => setModal(null)} onSave={handleSave} />
        )}
      </div>
  );
}