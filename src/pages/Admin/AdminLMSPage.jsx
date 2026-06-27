import { useState } from "react";
import { Plus, X, Search, CheckCircle, Circle } from "lucide-react";
import "../../styles/Admin/Admin.css";

/* ── 상수 ── */
const CATEGORIES   = ["냉장고", "세탁기", "에어컨", "TV", "건조기"];
const CAREER_LEVELS = [
  { key: "JUNIOR", label: "1~5년" },
  { key: "MID",    label: "6~10년" },
  { key: "SENIOR", label: "11년 이상" },
];

/* ── 목 데이터 ── */
const mockCourses = [
  { id:  1, category: "냉장고", careerLevel: "JUNIOR",  title: "냉장고 기초 점검 실무",        version: "2026.1", active: true  },
  { id:  2, category: "냉장고", careerLevel: "MID",     title: "냉장고 압축기 진단 심화",       version: "2026.1", active: true  },
  { id:  3, category: "냉장고", careerLevel: "SENIOR",  title: "냉장고 시스템 전문가 과정",     version: "2026.1", active: true  },
  { id:  4, category: "세탁기", careerLevel: "JUNIOR",  title: "세탁기 기초 진단 실무",         version: "2026.1", active: true  },
  { id:  5, category: "세탁기", careerLevel: "MID",     title: "세탁기 드럼 모터 심화",         version: "2026.1", active: true  },
  { id:  6, category: "세탁기", careerLevel: "SENIOR",  title: "세탁기 전문가 과정",            version: "2026.1", active: true  },
  { id:  7, category: "에어컨", careerLevel: "JUNIOR",  title: "에어컨 냉매 기초 안전 수칙",    version: "2026.2", active: true  },
  { id:  8, category: "에어컨", careerLevel: "MID",     title: "에어컨 냉매 충전 실무",         version: "2026.2", active: true  },
  { id:  9, category: "에어컨", careerLevel: "SENIOR",  title: "에어컨 시스템 전문가 과정",     version: "2026.2", active: true  },
  { id: 10, category: "TV",     careerLevel: "JUNIOR",  title: "TV 패널 기초 진단법",           version: "2026.1", active: false },
  { id: 11, category: "TV",     careerLevel: "MID",     title: "TV 패널 심화 진단법",           version: "2026.1", active: false },
  { id: 12, category: "TV",     careerLevel: "SENIOR",  title: "TV 전문가 과정",               version: "2026.1", active: true  },
  { id: 13, category: "건조기", careerLevel: "JUNIOR",  title: "건조기 기초 점검 실무",         version: "2026.1", active: true  },
  { id: 14, category: "건조기", careerLevel: "MID",     title: "건조기 히터 교체 실무",         version: "2026.1", active: true  },
  { id: 15, category: "건조기", careerLevel: "SENIOR",  title: "건조기 전문가 과정",            version: "2026.1", active: true  },
];

const mockEngineers = [
  { id: 1, name: "박기사", agency: "한국서비스대행사", category: "냉장고", careerLevel: "MID",    completed: true  },
  { id: 2, name: "김수리", agency: "미래전자서비스",   category: "세탁기", careerLevel: "JUNIOR", completed: false },
  { id: 3, name: "이엔지", agency: "스마트케어",       category: "에어컨", careerLevel: "SENIOR", completed: true  },
  { id: 4, name: "최기사", agency: "한국서비스대행사", category: "건조기", careerLevel: "MID",    completed: false },
  { id: 5, name: "정수리", agency: "미래전자서비스",   category: "TV",     careerLevel: "JUNIOR", completed: true  },
];

/* ── 콘텐츠 등록/수정 모달 ── */
function ContentModal({ item, onClose, onSave }) {
  const isNew = !item.id;
  const [form, setForm] = useState(
    isNew
      ? { title: "", body: "", category: item.category || "냉장고", careerLevel: item.careerLevel || "JUNIOR", version: "2026.1" }
      : { ...item }
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
            <select className="admin-select" style={{ width: "100%" }} value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="admin-modal__field" style={{ flex: 1 }}>
            <label className="admin-modal__label">경력 구간</label>
            <select className="admin-select" style={{ width: "100%" }} value={form.careerLevel}
              onChange={(e) => setForm((p) => ({ ...p, careerLevel: e.target.value }))}>
              {CAREER_LEVELS.map((cl) => <option key={cl.key} value={cl.key}>{cl.label}</option>)}
            </select>
          </div>
          <div className="admin-modal__field" style={{ flex: 1 }}>
            <label className="admin-modal__label">버전</label>
            <input className="admin-modal__input" value={form.version}
              onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} placeholder="예: 2026.1" />
          </div>
        </div>

        <div className="admin-modal__field">
          <label className="admin-modal__label">제목</label>
          <input className="admin-modal__input" value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="콘텐츠 제목" />
        </div>
        <div className="admin-modal__field">
          <label className="admin-modal__label">본문</label>
          <textarea className="admin-modal__textarea" style={{ minHeight: 120 }} value={form.body || ""}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} placeholder="교육 내용을 입력하세요." />
        </div>

        {!isNew && <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>* 수정 시 버전 업이 필수입니다.</p>}
        <div className="admin-modal__footer">
          <button className="admin-btn admin-btn--outline" onClick={onClose}>취소</button>
          <button className="admin-btn admin-btn--primary" onClick={() => onSave(form)}>{isNew ? "등록" : "수정 저장"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── 메인 ── */
export default function AdminLMSPage() {
  const [tab, setTab]         = useState("matrix");
  const [courses, setCourses] = useState(mockCourses);
  const [modal, setModal]     = useState(null);
  const [engSearch, setEngSearch] = useState("");
  const [engFilter, setEngFilter] = useState("ALL");

  function getCourse(category, careerLevel) {
    return courses.find((c) => c.category === category && c.careerLevel === careerLevel) || null;
  }

  function handleSave(form) {
    if (form.id) {
      setCourses((prev) => prev.map((c) => c.id === form.id ? { ...c, ...form } : c));
    } else {
      setCourses((prev) => [...prev, { ...form, id: Date.now(), active: true }]);
    }
    setModal(null);
  }

  function toggleActive(id) {
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  }

  const filteredEng = mockEngineers.filter((e) => {
    const matchSearch = e.name.includes(engSearch) || e.agency.includes(engSearch);
    const matchFilter = engFilter === "ALL"
      || (engFilter === "DONE" && e.completed)
      || (engFilter === "PENDING" && !e.completed);
    return matchSearch && matchFilter;
  });

  const careerLabel = (key) => CAREER_LEVELS.find((cl) => cl.key === key)?.label ?? key;

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
            <div className="admin-filter-bar">
              <p style={{ fontSize: 13, color: "#555" }}>
                전문 가전 카테고리 × 경력 구간별로 교육 과정이 1개씩 배정됩니다.
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
              {/* 헤더 행 */}
              <div className="lms-matrix__row lms-matrix__row--header">
                <div className="lms-matrix__cell lms-matrix__cell--label" />
                {CAREER_LEVELS.map((cl) => (
                  <div key={cl.key} className="lms-matrix__cell lms-matrix__cell--head">
                    {cl.label}
                  </div>
                ))}
              </div>

              {/* 데이터 행 */}
              {CATEGORIES.map((cat) => (
                <div key={cat} className="lms-matrix__row">
                  <div className="lms-matrix__cell lms-matrix__cell--label">{cat}</div>
                  {CAREER_LEVELS.map((cl) => {
                    const course = getCourse(cat, cl.key);
                    return (
                      <div
                        key={cl.key}
                        className={`lms-matrix__cell lms-matrix__cell--course${course && !course.active ? " lms-matrix__cell--inactive" : ""}`}
                      >
                        {course ? (
                          <>
                            <div className="lms-course__title">{course.title}</div>
                            <div className="lms-course__meta">
                              <span className="lms-course__version">v{course.version}</span>
                              {course.active
                                ? <span className="admin-badge admin-badge--green">활성</span>
                                : <span className="admin-badge admin-badge--gray">비활성</span>}
                            </div>
                            <div className="lms-course__actions">
                              <button className="admin-btn admin-btn--outline admin-btn--sm"
                                onClick={() => setModal(course)}>수정</button>
                              <button
                                className={`admin-btn admin-btn--sm ${course.active ? "admin-btn--danger" : "admin-btn--approve"}`}
                                onClick={() => toggleActive(course.id)}>
                                {course.active ? "비활성화" : "활성화"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            className="lms-matrix__add-btn"
                            onClick={() => setModal({ category: cat, careerLevel: cl.key })}
                          >
                            <Plus size={16} />
                            <span>등록</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 기사별 이수 현황 ── */}
        {tab === "engineer" && (
          <div className="admin-section__body">
            <div className="admin-filter-bar">
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                <input
                  className="admin-search-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="기사 이름 또는 소속 대행사 검색"
                  value={engSearch}
                  onChange={(e) => setEngSearch(e.target.value)}
                />
              </div>
              <select className="admin-select" value={engFilter} onChange={(e) => setEngFilter(e.target.value)}>
                <option value="ALL">이수 전체</option>
                <option value="DONE">이수 완료</option>
                <option value="PENDING">미이수</option>
              </select>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>기사명</th>
                  <th>소속 대행사</th>
                  <th>전문 카테고리</th>
                  <th>경력 구간</th>
                  <th>배정 교육 과정</th>
                  <th>이수 여부</th>
                </tr>
              </thead>
              <tbody>
                {filteredEng.map((eng) => {
                  const course = getCourse(eng.category, eng.careerLevel);
                  return (
                    <tr key={eng.id}>
                      <td style={{ fontWeight: 600 }}>{eng.name}</td>
                      <td style={{ color: "#666" }}>{eng.agency}</td>
                      <td><span className="admin-badge admin-badge--gray">{eng.category}</span></td>
                      <td><span className="admin-badge admin-badge--blue">{careerLabel(eng.careerLevel)}</span></td>
                      <td style={{ fontSize: 13, color: "#333" }}>
                        {course ? course.title : <span style={{ color: "#bbb" }}>배정 없음</span>}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {eng.completed
                          ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle size={16} color="#16a34a" /><span className="admin-badge admin-badge--green">완료</span></span>
                          : <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Circle size={16} color="#ddd" /><span className="admin-badge admin-badge--gray">미이수</span></span>}
                      </td>
                    </tr>
                  );
                })}
                {filteredEng.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">검색 결과가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <ContentModal item={modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
