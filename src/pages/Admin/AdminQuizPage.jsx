import { useState, useEffect } from "react";
import { Plus, X, AlertTriangle, CheckCircle, Search } from "lucide-react";
import {
    getAdminQuizQuestions,
    createQuizQuestion,
    updateQuizQuestion,
    deactivateQuizQuestion,
    deleteQuizQuestion,
    getUnderRegisteredTiers,
    getAdminQuizAttempts,
} from "../../apis/quiz";

const CATEGORIES = [
    { id: 11, name: "냉장고" },   { id: 12, name: "전기밥솥" },
    { id: 13, name: "인덕션" },   { id: 14, name: "오븐" },
    { id: 15, name: "식기세척기" },{ id: 21, name: "세탁기" },
    { id: 22, name: "건조기" },   { id: 23, name: "에어컨" },
    { id: 24, name: "공기청정기" },{ id: 25, name: "선풍기" },
    { id: 26, name: "청소기" },   { id: 31, name: "TV" },
    { id: 32, name: "빔프로젝터" },{ id: 41, name: "사운드바" },
    { id: 42, name: "홈시어터" }, { id: 43, name: "스피커" },
];

const LEVELS = [
    { key: "BEGINNER",     label: "초급 (1~5년)" },
    { key: "INTERMEDIATE", label: "중급 (6~10년)" },
    { key: "ADVANCED",     label: "고급 (11년 이상)" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear + 1];

const categoryName = (id)  => CATEGORIES.find((c) => c.id === id)?.name ?? "-";
const levelLabel   = (key) => LEVELS.find((l) => l.key === key)?.label ?? key;

/* ── 문항 등록/수정 모달 ── */
function QuizModal({ item, onClose, onSave }) {
    const isNew = !item?.questionId;
    const [form, setForm] = useState({
        categoryId:    item?.categoryId    ?? CATEGORIES[0].id,
        requiredLevel: item?.requiredLevel ?? "BEGINNER",
        quizYear:      item?.quizYear      ?? currentYear,
        sortOrder:     item?.sortOrder     ?? 1,
        questionText:  item?.questionText  ?? "",
        correctAnswer: item?.correctAnswer ?? true,
    });

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal__header">
                    <h2 className="admin-modal__title">{isNew ? "문항 등록" : "문항 수정"}</h2>
                    <button className="admin-modal__close" onClick={onClose}><X size={18} /></button>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                    <div className="admin-modal__field" style={{ flex: 1 }}>
                        <label className="admin-modal__label">가전 카테고리</label>
                        <select className="admin-select" style={{ width: "100%" }}
                                value={form.categoryId}
                                onChange={(e) => setForm((p) => ({ ...p, categoryId: Number(e.target.value) }))}>
                            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="admin-modal__field" style={{ flex: 1 }}>
                        <label className="admin-modal__label">기술 등급</label>
                        <select className="admin-select" style={{ width: "100%" }}
                                value={form.requiredLevel}
                                onChange={(e) => setForm((p) => ({ ...p, requiredLevel: e.target.value }))}>
                            {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                    <div className="admin-modal__field" style={{ flex: 1 }}>
                        <label className="admin-modal__label">출제 연도</label>
                        <select className="admin-select" style={{ width: "100%" }}
                                value={form.quizYear}
                                onChange={(e) => setForm((p) => ({ ...p, quizYear: Number(e.target.value) }))}>
                            {YEAR_OPTIONS.map((y) => (
                                <option key={y} value={y}>
                                    {y}년{y === currentYear + 1 ? " (사전 등록)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-modal__field" style={{ flex: 1 }}>
                        <label className="admin-modal__label">문항 번호</label>
                        <select className="admin-select" style={{ width: "100%" }}
                                value={form.sortOrder}
                                onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}>
                            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}번</option>)}
                        </select>
                    </div>
                </div>

                <div className="admin-modal__field">
                    <label className="admin-modal__label">문항 내용</label>
                    <textarea className="admin-modal__textarea" style={{ minHeight: 100 }}
                              value={form.questionText}
                              onChange={(e) => setForm((p) => ({ ...p, questionText: e.target.value }))}
                              placeholder="문항 내용을 입력하세요." />
                </div>

                <div className="admin-modal__field">
                    <label className="admin-modal__label">정답</label>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button
                            type="button"
                            className={`admin-quiz-answer-btn ${form.correctAnswer === true ? "admin-quiz-answer-btn--selected-o" : ""}`}
                            onClick={() => setForm((p) => ({ ...p, correctAnswer: true }))}
                        >
                            O (정답)
                        </button>
                        <button
                            type="button"
                            className={`admin-quiz-answer-btn ${form.correctAnswer === false ? "admin-quiz-answer-btn--selected-x" : ""}`}
                            onClick={() => setForm((p) => ({ ...p, correctAnswer: false }))}
                        >
                            X (오답)
                        </button>
                    </div>
                    <p style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                        * 정답은 기사 화면에 표시되지 않습니다.
                    </p>
                </div>

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

/* ── 메인 ── */
export default function AdminQuizPage() {
    const [innerTab, setInnerTab]         = useState("matrix"); // "matrix" | "attempts"
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [questions, setQuestions]       = useState([]);
    const [underTiers, setUnderTiers]     = useState([]);
    const [modal, setModal]               = useState(null);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState(null);

    // 응시 이력 조회
    const [engSearch, setEngSearch]       = useState("");
    const [attempts, setAttempts]         = useState([]);
    const [attLoading, setAttLoading]     = useState(false);

    useEffect(() => { fetchAll(); }, [selectedYear]);

    async function fetchAll() {
        try {
            setLoading(true);
            setError(null);
            const [qRes, tierRes] = await Promise.all([
                getAdminQuizQuestions({ quizYear: selectedYear }),
                getUnderRegisteredTiers(selectedYear),
            ]);
            setQuestions(qRes.data);
            setUnderTiers(tierRes.data ?? []);
        } catch (e) {
            setError("데이터를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    // 특정 계층의 문항 수 반환
    function getQuestionCount(categoryId, level) {
        return questions.filter(
            (q) => q.categoryId === categoryId && q.requiredLevel === level && q.isActive
        ).length;
    }

    // 계층 뱃지 스타일 결정
    function getTierBadgeClass(count) {
        if (count >= 5) return "admin-quiz-tier--done";
        if (count > 0)  return "admin-quiz-tier--partial";
        return "admin-quiz-tier--empty";
    }

    async function handleSave(form) {
        try {
            // 수정 여부는 modal에 questionId 있는지로 판단
            if (modal?.questionId) {
                await updateQuizQuestion(modal.questionId, {
                    questionText:  form.questionText,
                    correctAnswer: form.correctAnswer,
                    sortOrder:     form.sortOrder,
                });
            } else {
                await createQuizQuestion(form);
            }
            await fetchAll();
            setModal(null);
        } catch (e) {
            alert(e.response?.data?.message ?? "저장에 실패했습니다.");
        }
    }

    async function handleDeactivate(question) {
        if (!confirm(`[${categoryName(question.categoryId)} ${levelLabel(question.requiredLevel)} ${question.sortOrder}번] 문항을 비활성화하시겠습니까?`)) return;
        try {
            await deactivateQuizQuestion(question.questionId);
            await fetchAll();
        } catch (e) {
            alert("비활성화에 실패했습니다.");
        }
    }

    async function handleDelete(question) {
        if (!confirm(`[${categoryName(question.categoryId)} ${levelLabel(question.requiredLevel)} ${question.sortOrder}번] 문항을 삭제하시겠습니까?\n응시 이력이 있으면 삭제가 불가합니다.`)) return;
        try {
            await deleteQuizQuestion(question.questionId);
            await fetchAll();
        } catch (e) {
            alert(e.response?.data?.message ?? "삭제에 실패했습니다.");
        }
    }

    async function handleSearchAttempts() {
        if (!engSearch) return;
        try {
            setAttLoading(true);
            const res = await getAdminQuizAttempts(engSearch);
            setAttempts(res.data);
        } catch (e) {
            alert("응시 이력을 불러오지 못했습니다.");
        } finally {
            setAttLoading(false);
        }
    }

    // 선택된 계층의 문항 목록 (매트릭스 셀 클릭 시 모달 또는 인라인 표시용)
    function getQuestions(categoryId, level) {
        return questions
            .filter((q) => q.categoryId === categoryId && q.requiredLevel === level)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return (
        <div className="admin-section__body">

            {/* 미등록 계층 경고 배너 */}
            {underTiers.length > 0 && (
                <div className="admin-quiz-warning-banner">
                    <AlertTriangle size={16} color="#f59e0b" />
                    <span>
            {selectedYear}년도 문항 미등록/미완성 계층이 <strong>{underTiers.length}개</strong> 있습니다.
            1월 1일 전까지 등록해 주세요.
          </span>
                </div>
            )}

            {/* 연도 선택 + 내부 탭 */}
            <div className="admin-filter-bar" style={{ marginBottom: 0 }}>
                <div style={{ display: "flex", gap: 8 }}>
                    {YEAR_OPTIONS.map((y) => (
                        <button
                            key={y}
                            className={`admin-tab ${selectedYear === y ? "admin-tab--active" : ""}`}
                            onClick={() => setSelectedYear(y)}
                        >
                            {y}년{y === currentYear + 1 ? " (사전 등록)" : ""}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                    {[
                        { key: "matrix",   label: "OX퀴즈 매트릭스" },
                        { key: "attempts", label: "기사별 응시 현황" },
                    ].map((t) => (
                        <button
                            key={t.key}
                            className={`admin-tab ${innerTab === t.key ? "admin-tab--active" : ""}`}
                            onClick={() => setInnerTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                    <button
                        className="admin-btn admin-btn--primary"
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                        onClick={() => setModal({})}
                    >
                        <Plus size={14} /> 문항 등록
                    </button>
                </div>
            </div>

            {loading && <p style={{ padding: 20 }}>불러오는 중...</p>}
            {error   && <p style={{ padding: 20, color: "red" }}>{error}</p>}

            {/* ── OX퀴즈 매트릭스 ── */}
            {innerTab === "matrix" && !loading && !error && (
                <div className="lms-matrix" style={{ marginTop: 16 }}>
                    {/* 헤더 */}
                    <div className="lms-matrix__row lms-matrix__row--header">
                        <div className="lms-matrix__cell lms-matrix__cell--label" />
                        {LEVELS.map((l) => (
                            <div key={l.key} className="lms-matrix__cell lms-matrix__cell--head">
                                {l.label}
                            </div>
                        ))}
                    </div>

                    {/* 데이터 행 */}
                    {CATEGORIES.map((cat) => (
                        <div key={cat.id} className="lms-matrix__row">
                            <div className="lms-matrix__cell lms-matrix__cell--label">{cat.name}</div>
                            {LEVELS.map((l) => {
                                const count = getQuestionCount(cat.id, l.key);
                                const tierQuestions = getQuestions(cat.id, l.key);
                                return (
                                    <div key={l.key} className="lms-matrix__cell lms-matrix__cell--course">
                                        {/* 등록 현황 배지 */}
                                        <div
                                            className={`admin-quiz-tier-badge ${getTierBadgeClass(count)}`}
                                            title={`${count}/5 문항`}
                                        >
                                            {count >= 5
                                                ? <><CheckCircle size={11} /> 5/5 완료</>
                                                : count > 0
                                                    ? `${count}/5 미완성`
                                                    : "미등록"
                                            }
                                        </div>

                                        {/* 등록된 문항 목록 */}
                                        {tierQuestions.map((q) => (
                                            <div key={q.questionId} className="admin-quiz-question-row">
                                                <span className="admin-quiz-question-num">{q.sortOrder}번</span>
                                                <span className="admin-quiz-question-text">{q.questionText.slice(0, 20)}{q.questionText.length > 20 ? "…" : ""}</span>
                                                <span className={`admin-quiz-answer-badge ${q.correctAnswer ? "admin-quiz-answer-badge--o" : "admin-quiz-answer-badge--x"}`}>
                          {q.correctAnswer ? "O" : "X"}
                        </span>
                                                <div className="admin-quiz-question-actions">
                                                    <button className="admin-btn admin-btn--outline admin-btn--xs"
                                                            onClick={() => setModal(q)}>수정</button>
                                                    <button className="admin-btn admin-btn--outline admin-btn--xs"
                                                            onClick={() => handleDeactivate(q)}>비활성</button>
                                                    <button className="admin-btn admin-btn--danger admin-btn--xs"
                                                            onClick={() => handleDelete(q)}>삭제</button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* 문항 추가 버튼 (5개 미만인 경우) */}
                                        {count < 5 && (
                                            <button
                                                className="admin-quiz-add-btn"
                                                onClick={() => setModal({ categoryId: cat.id, requiredLevel: l.key, quizYear: selectedYear, sortOrder: count + 1 })}
                                            >
                                                <Plus size={11} /> {count === 0 ? "등록" : "추가"}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* ── 기사별 응시 현황 ── */}
            {innerTab === "attempts" && (
                <div style={{ marginTop: 16 }}>
                    <div className="admin-filter-bar">
                        <div style={{ position: "relative", flex: 1 }}>
                            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                            <input
                                className="admin-search-input"
                                style={{ paddingLeft: 32 }}
                                placeholder="기사 ID 입력 후 Enter"
                                value={engSearch}
                                onChange={(e) => setEngSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSearchAttempts(); }}
                            />
                        </div>
                        <button className="admin-btn admin-btn--primary" onClick={handleSearchAttempts}>
                            조회
                        </button>
                    </div>

                    {attLoading && <p style={{ padding: 20, color: "#aaa" }}>불러오는 중...</p>}

                    {!attLoading && (
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>연도</th>
                                <th>회차</th>
                                <th>결과</th>
                                <th>응시 일시</th>
                            </tr>
                            </thead>
                            <tbody>
                            {attempts.map((a, i) => (
                                <tr key={a.attemptId}>
                                    <td>{a.quizYear}년</td>
                                    <td>{attempts.length - i}회차</td>
                                    <td>
                                        {a.isPassed
                                            ? <span className="admin-badge admin-badge--green">합격</span>
                                            : <span className="admin-badge admin-badge--gray">불합격</span>
                                        }
                                    </td>
                                    <td style={{ color: "#666" }}>
                                        {new Date(a.attemptedAt).toLocaleDateString("ko-KR")}
                                    </td>
                                </tr>
                            ))}
                            {attempts.length === 0 && !attLoading && (
                                <tr>
                                    <td colSpan={4} className="admin-empty">기사 ID를 입력하고 조회하세요.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* 문항 등록/수정 모달 */}
            {modal !== null && (
                <QuizModal
                    item={modal}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}