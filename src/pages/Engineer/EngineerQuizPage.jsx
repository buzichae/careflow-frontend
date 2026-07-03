import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, RefreshCw, BookOpen } from "lucide-react";
import {
    getQuizStatus,
    getQuizQuestions,
    submitQuiz,
    getMyQuizAttempts,
} from "../../apis/quiz";

export default function EngineerQuizPage({ engineerInfo }) {
    const [status, setStatus]           = useState(null);   // QuizStatusDto
    const [phase, setPhase]             = useState("status"); // "status" | "quiz" | "result"
    const [questions, setQuestions]     = useState([]);
    const [answers, setAnswers]         = useState({});      // { questionId: true/false }
    const [currentIdx, setCurrentIdx]   = useState(0);
    const [result, setResult]           = useState(null);    // QuizResultDto
    const [attempts, setAttempts]       = useState([]);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);

    useEffect(() => { fetchStatus(); }, []);

    async function fetchStatus() {
        try {
            setLoading(true);
            const [statusRes, attemptsRes] = await Promise.all([
                getQuizStatus(),
                getMyQuizAttempts(),
            ]);
            setStatus(statusRes.data);
            setAttempts(attemptsRes.data);
            setPhase("status");
        } catch (e) {
            setError("데이터를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    async function handleStartQuiz() {
        try {
            setLoading(true);
            setError(null);
            const res = await getQuizQuestions();
            setQuestions(res.data);
            setAnswers({});
            setCurrentIdx(0);
            setPhase("quiz");
        } catch (e) {
            setError(e.response?.data?.message ?? "문항을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    function handleSelectAnswer(questionId, value) {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }

    function handleNext() {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx((i) => i + 1);
        }
    }

    function handlePrev() {
        if (currentIdx > 0) setCurrentIdx((i) => i - 1);
    }

    async function handleSubmit() {
        // 미답변 문항 확인
        const unanswered = questions.filter((q) => answers[q.questionId] === undefined);
        if (unanswered.length > 0) {
            alert(`${unanswered.length}개 문항에 아직 답하지 않았습니다.`);
            return;
        }
        try {
            setLoading(true);
            const payload = {
                answers: questions.map((q) => ({
                    questionId:      q.questionId,
                    submittedAnswer: answers[q.questionId],
                })),
            };
            const res = await submitQuiz(payload);
            setResult(res.data);
            setPhase("result");
            // 상태 새로고침
            const statusRes = await getQuizStatus();
            setStatus(statusRes.data);
            const attemptsRes = await getMyQuizAttempts();
            setAttempts(attemptsRes.data);
        } catch (e) {
            setError(e.response?.data?.message ?? "제출에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }

    function handleRetry() {
        setResult(null);
        setPhase("status");
    }

    if (loading && phase === "status") {
        return <div style={{ padding: 40, color: "#aaa" }}>불러오는 중...</div>;
    }

    // ── 퀴즈 진행 화면 ──
    if (phase === "quiz" && questions.length > 0) {
        const q = questions[currentIdx];
        const selectedAnswer = answers[q.questionId];
        const allAnswered = questions.every((q) => answers[q.questionId] !== undefined);

        return (
            <div className="equiz-wrap">
                {/* 상단 공지 배너 */}
                <div className="equiz-notice">
                    <AlertCircle size={14} />
                    3회 불합격 시 LMS 교육 콘텐츠를 재이수해야 합니다.
                </div>

                {/* 진행 바 */}
                <div className="equiz-progress">
                    <span className="equiz-progress__text">{currentIdx + 1} / {questions.length}</span>
                    <div className="equiz-progress__bar-wrap">
                        <div
                            className="equiz-progress__bar"
                            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* 문항 카드 */}
                <div className="equiz-question-card">
                    <p className="equiz-question__num">문항 {currentIdx + 1}</p>
                    <p className="equiz-question__text">{q.questionText}</p>

                    <div className="equiz-choices">
                        <button
                            className={`equiz-choice equiz-choice--o ${selectedAnswer === true ? "equiz-choice--selected" : ""}`}
                            onClick={() => handleSelectAnswer(q.questionId, true)}
                        >
                            O
                        </button>
                        <button
                            className={`equiz-choice equiz-choice--x ${selectedAnswer === false ? "equiz-choice--selected" : ""}`}
                            onClick={() => handleSelectAnswer(q.questionId, false)}
                        >
                            X
                        </button>
                    </div>
                </div>

                {/* 이전 / 다음 / 제출 */}
                <div className="equiz-nav">
                    <button
                        className="equiz-nav__btn equiz-nav__btn--prev"
                        onClick={handlePrev}
                        disabled={currentIdx === 0}
                    >
                        이전
                    </button>
                    {currentIdx < questions.length - 1 ? (
                        <button
                            className="equiz-nav__btn equiz-nav__btn--next"
                            onClick={handleNext}
                        >
                            다음
                        </button>
                    ) : (
                        <button
                            className="equiz-nav__btn equiz-nav__btn--submit"
                            onClick={handleSubmit}
                            disabled={!allAnswered || loading}
                        >
                            {loading ? "제출 중..." : "제출하기"}
                        </button>
                    )}
                </div>

                {/* 문항 인덱스 점 */}
                <div className="equiz-dots">
                    {questions.map((q, i) => (
                        <button
                            key={q.questionId}
                            className={`equiz-dot
                ${i === currentIdx ? "equiz-dot--current" : ""}
                ${answers[q.questionId] !== undefined ? "equiz-dot--answered" : ""}
              `}
                            onClick={() => setCurrentIdx(i)}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // ── 결과 화면 ──
    if (phase === "result" && result) {
        return (
            <div className="equiz-wrap">
                {result.isPassed ? (
                    // 합격
                    <div className="equiz-result equiz-result--pass">
                        <CheckCircle size={48} color="#16a34a" />
                        <p className="equiz-result__title">합격 ✓</p>
                        <p className="equiz-result__sub">배차 가능 상태로 전환되었습니다.</p>
                        <p className="equiz-result__count">{result.attemptCount}회차 응시</p>

                        {/* 합격 시에만 정오답 상세 표시 */}
                        {result.answerDetails && result.answerDetails.length > 0 && (
                            <div className="equiz-answer-detail">
                                <p className="equiz-answer-detail__title">문항별 결과</p>
                                {result.answerDetails.map((a) => (
                                    <div key={a.questionId} className={`equiz-answer-row ${a.isCorrect ? "equiz-answer-row--correct" : "equiz-answer-row--wrong"}`}>
                                        <span className="equiz-answer-row__num">{a.sortOrder}번</span>
                                        <span className="equiz-answer-row__text">{a.questionText}</span>
                                        <span className="equiz-answer-row__badge">
                      {a.isCorrect ? "✓ 정답" : `✗ 오답 (정답: ${a.correctAnswer ? "O" : "X"})`}
                    </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // 불합격
                    <div className="equiz-result equiz-result--fail">
                        <AlertCircle size={48} color="#ef4444" />
                        <p className="equiz-result__title">불합격</p>
                        <p className="equiz-result__count">{result.attemptCount}회차 응시</p>

                        {result.forceReLearning ? (
                            // 3회 초과 → 재이수 강제
                            <>
                                <p className="equiz-result__warn">
                                    3회 불합격으로 LMS 교육 콘텐츠를 다시 이수해야 합니다.
                                </p>
                                <button
                                    className="equiz-result__btn equiz-result__btn--relearn"
                                    onClick={handleRetry}
                                >
                                    <BookOpen size={14} /> 교육 이수 탭으로 이동
                                </button>
                            </>
                        ) : (
                            // 재응시 가능
                            <>
                                <p className="equiz-result__sub">
                                    남은 응시 횟수: {3 - result.attemptCount}회
                                </p>
                                <button
                                    className="equiz-result__btn equiz-result__btn--retry"
                                    onClick={handleStartQuiz}
                                >
                                    <RefreshCw size={14} /> 재응시
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ── 응시 전 상태 화면 ──
    return (
        <div className="equiz-wrap">
            {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

            {/* 상태 배너 */}
            {status && (
                <div className={`equiz-status-banner ${
                    status.isPassed         ? "equiz-status-banner--pass"
                        : status.isForceReLearning ? "equiz-status-banner--relearn"
                            : status.isContentCompleted && status.isQuestionRegistered ? "equiz-status-banner--ready"
                                : "equiz-status-banner--pending"
                }`}>
                    {status.isPassed && (
                        <>
                            <CheckCircle size={16} />
                            <span>합격 ✓ 배차 가능 상태입니다.</span>
                        </>
                    )}
                    {!status.isPassed && status.isForceReLearning && (
                        <>
                            <AlertCircle size={16} />
                            <span>3회 불합격으로 교육 콘텐츠를 다시 이수해야 합니다.</span>
                        </>
                    )}
                    {!status.isPassed && !status.isForceReLearning && !status.isContentCompleted && (
                        <>
                            <BookOpen size={16} />
                            <span>콘텐츠를 모두 이수한 후 응시할 수 있습니다.</span>
                            <div className="equiz-status-banner__progress">
                                (교육 이수 탭에서 콘텐츠를 이수해 주세요.)
                            </div>
                        </>
                    )}
                    {!status.isPassed && !status.isForceReLearning && status.isContentCompleted && !status.isQuestionRegistered && (
                        <>
                            <AlertCircle size={16} />
                            <span>현재 연도 시험 문항이 준비 중입니다. 관리자에게 문의하세요.</span>
                        </>
                    )}
                    {!status.isPassed && !status.isForceReLearning && status.isContentCompleted && status.isQuestionRegistered && (
                        <>
                            <CheckCircle size={16} />
                            <span>OX퀴즈에 응시하세요. ({status.attemptCount}/{status.maxAttempts}회 응시)</span>
                        </>
                    )}
                </div>
            )}

            {/* 응시 버튼 */}
            <button
                className="equiz-start-btn"
                disabled={
                    !status ||
                    status.isPassed ||
                    status.isForceReLearning ||
                    !status.isContentCompleted ||
                    !status.isQuestionRegistered ||
                    loading
                }
                onClick={handleStartQuiz}
            >
                응시하기
            </button>

            {/* 응시 이력 */}
            {attempts.length > 0 && (
                <div className="equiz-history">
                    <p className="equiz-history__title">응시 이력</p>
                    <table className="equiz-history__table">
                        <thead>
                        <tr>
                            <th>회차</th>
                            <th>연도</th>
                            <th>결과</th>
                            <th>응시 일시</th>
                        </tr>
                        </thead>
                        <tbody>
                        {attempts.map((a, i) => (
                            <tr key={a.attemptId}>
                                <td>{attempts.length - i}회차</td>
                                <td>{a.quizYear}년</td>
                                <td>
                                    {a.isPassed
                                        ? <span className="equiz-badge equiz-badge--pass">합격</span>
                                        : <span className="equiz-badge equiz-badge--fail">불합격</span>
                                    }
                                </td>
                                <td style={{ color: "#888" }}>
                                    {new Date(a.attemptedAt).toLocaleDateString("ko-KR")}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}