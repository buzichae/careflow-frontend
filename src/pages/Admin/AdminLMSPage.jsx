import { useState } from "react";
import { Plus, X, Search, CheckCircle, Circle } from "lucide-react";
import "../../styles/Admin/Admin.css";

/* ── 목 데이터 ── */
const mockContents = [
  { id: 1, title: "냉장고 압축기 점검 및 교체 실무",   category: "냉장고", grade: "ADVANCED",     version: "2024.1", active: true  },
  { id: 2, title: "세탁기 드럼 모터 진단 기초",         category: "세탁기", grade: "BEGINNER",     version: "2024.1", active: true  },
  { id: 3, title: "에어컨 냉매 충전 안전 수칙",          category: "에어컨", grade: "INTERMEDIATE", version: "2024.2", active: true  },
  { id: 4, title: "TV 패널 불량 진단법",               category: "TV",    grade: "BEGINNER",     version: "2024.1", active: false },
  { id: 5, title: "건조기 히터 교체 실무",              category: "건조기", grade: "INTERMEDIATE", version: "2024.1", active: true  },
];

const mockEngineerLMS = [
  { id: 1, name: "박기사", agency: "한국서비스대행사", category: "냉장고", completions: [true, true, false, true, false] },
  { id: 2, name: "김수리", agency: "미래전자서비스",   category: "세탁기", completions: [true, false, false, false, false] },
  { id: 3, name: "이엔지", agency: "스마트케어",      category: "에어컨", completions: [true, true, true, true, true] },
];

const GRADE_BADGE = { BEGINNER: "green", INTERMEDIATE: "blue", ADVANCED: "purple" };
const GRADE_LABEL = { BEGINNER: "초급",  INTERMEDIATE: "중급",   ADVANCED: "고급" };
const CATEGORIES  = ["전체", "냉장고", "세탁기", "에어컨", "TV", "건조기"];

function ContentModal({ item, onClose, onSave }) {
  const isNew = !item.id;
  const [form, setForm] = useState(
    item.id
      ? { ...item }
      : { title: "", body: "", category: "냉장고", grade: "BEGINNER", version: "2024.1" }
  );

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ width: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">{isNew ? "콘텐츠 등록" : "콘텐츠 수정"}</h2>
          <button className="admin-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="admin-modal__field">
          <label className="admin-modal__label">제목</label>
          <input className="admin-modal__input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="콘텐츠 제목" />
        </div>
        <div className="admin-modal__field">
          <label className="admin-modal__label">본문</label>
          <textarea className="admin-modal__textarea" style={{ minHeight: 120 }} value={form.body || ""} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} placeholder="교육 내용을 입력하세요." />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="admin-modal__field" style={{ flex: 1 }}>
            <label className="admin-modal__label">가전 카테고리</label>
            <select className="admin-select" style={{ width: "100%" }} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              {["냉장고", "세탁기", "에어컨", "TV", "건조기"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="admin-modal__field" style={{ flex: 1 }}>
            <label className="admin-modal__label">필수 등급</label>
            <select className="admin-select" style={{ width: "100%" }} value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}>
              <option value="BEGINNER">초급 (BEGINNER)</option>
              <option value="INTERMEDIATE">중급 (INTERMEDIATE)</option>
              <option value="ADVANCED">고급 (ADVANCED)</option>
            </select>
          </div>
          <div className="admin-modal__field" style={{ flex: 1 }}>
            <label className="admin-modal__label">버전</label>
            <input className="admin-modal__input" value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} placeholder="예: 2024.1" />
          </div>
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

export default function AdminLMSPage() {
  const [tab, setTab] = useState("contents");
  const [contents, setContents] = useState(mockContents);
  const [catFilter, setCatFilter] = useState("전체");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [modal, setModal] = useState(null);
  const [engSearch, setEngSearch] = useState("");

  const filtered = contents.filter((c) => {
    const matchCat    = catFilter === "전체" || c.category === catFilter;
    const matchGrade  = gradeFilter === "ALL" || c.grade === gradeFilter;
    const matchActive = activeFilter === "ALL" || (activeFilter === "ACTIVE" ? c.active : !c.active);
    return matchCat && matchGrade && matchActive;
  });

  const filteredEng = mockEngineerLMS.filter((e) =>
    e.name.includes(engSearch) || e.agency.includes(engSearch)
  );

  function handleSave(form) {
    if (form.id) {
      setContents((prev) => prev.map((c) => c.id === form.id ? { ...c, ...form } : c));
    } else {
      setContents((prev) => [...prev, { ...form, id: Date.now(), active: true }]);
    }
    setModal(null);
  }

  function toggleActive(id) {
    setContents((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  }

  return (
    <div className="admin-page">
      <div className="admin-section">
        <div className="admin-tabs">
          {[
            { key: "contents", label: "콘텐츠 목록" },
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

        {/* ── 콘텐츠 목록 ── */}
        {tab === "contents" && (
          <div className="admin-section__body">
            <div className="admin-filter-bar">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    className={`admin-btn admin-btn--sm ${catFilter === c ? "admin-btn--primary" : "admin-btn--outline"}`}
                    onClick={() => setCatFilter(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <select className="admin-select" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                <option value="ALL">등급 전체</option>
                <option value="BEGINNER">초급</option>
                <option value="INTERMEDIATE">중급</option>
                <option value="ADVANCED">고급</option>
              </select>
              <select className="admin-select" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                <option value="ALL">상태 전체</option>
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
              </select>
              <button
                className="admin-btn admin-btn--primary"
                style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}
                onClick={() => setModal({})}
              >
                <Plus size={14} /> 콘텐츠 등록
              </button>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>카테고리</th>
                  <th>등급</th>
                  <th>버전</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.title}</td>
                    <td><span className="admin-badge admin-badge--gray">{c.category}</span></td>
                    <td><span className={`admin-badge admin-badge--${GRADE_BADGE[c.grade]}`}>{GRADE_LABEL[c.grade]}</span></td>
                    <td style={{ color: "#888", fontSize: 12 }}>{c.version}</td>
                    <td>
                      {c.active
                        ? <span className="admin-badge admin-badge--green">활성</span>
                        : <span className="admin-badge admin-badge--gray">비활성</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="admin-btn admin-btn--outline admin-btn--sm" onClick={() => setModal(c)}>수정</button>
                        <button
                          className={`admin-btn admin-btn--sm ${c.active ? "admin-btn--danger" : "admin-btn--approve"}`}
                          onClick={() => toggleActive(c.id)}
                        >
                          {c.active ? "비활성화" : "활성화"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">해당 조건의 콘텐츠가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
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
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>기사명</th>
                  <th>소속 대행사</th>
                  <th>전문 카테고리</th>
                  {mockContents.map((c) => (
                    <th key={c.id} style={{ fontSize: 11, maxWidth: 100 }}>
                      <span title={c.title} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80 }}>
                        {c.title}
                      </span>
                    </th>
                  ))}
                  <th>이수율</th>
                </tr>
              </thead>
              <tbody>
                {filteredEng.map((eng) => {
                  const done = eng.completions.filter(Boolean).length;
                  const total = eng.completions.length;
                  return (
                    <tr key={eng.id}>
                      <td style={{ fontWeight: 600 }}>{eng.name}</td>
                      <td style={{ color: "#666" }}>{eng.agency}</td>
                      <td><span className="admin-badge admin-badge--gray">{eng.category}</span></td>
                      {eng.completions.map((done, i) => (
                        <td key={i} style={{ textAlign: "center" }}>
                          {done
                            ? <CheckCircle size={16} color="#16a34a" />
                            : <Circle size={16} color="#ddd" />}
                        </td>
                      ))}
                      <td>
                        <span className={`admin-badge admin-badge--${done === total ? "green" : done > 0 ? "orange" : "gray"}`}>
                          {done}/{total}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredEng.length === 0 && (
                  <tr><td colSpan={4 + mockContents.length} className="admin-empty">검색 결과가 없습니다.</td></tr>
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
