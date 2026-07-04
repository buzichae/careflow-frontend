import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { CheckCircle, Circle, ChevronRight, X, Search, Trophy } from "lucide-react";
import { getAgencyEngineersLmsStatus, getEngineerConfirmations, sendLmsNotification } from "../../apis/lms";
import { getAgencyEngineerQuizAttempts } from "../../apis/quiz";
import "../../styles/Agency/AgencyLmsPage.css";

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

const CAREER_LEVELS = [
    { key: "BEGINNER",     label: "초급" },
    { key: "INTERMEDIATE", label: "중급" },
    { key: "ADVANCED",     label: "고급" },
];

const careerLabel  = (key) => CAREER_LEVELS.find((cl) => cl.key === key)?.label ?? key;
const categoryName = (id)  => CATEGORIES.find((c) => c.id === id)?.name ?? "-";

/* ── 기사 상세 모달 ── */
function EngineerDetailModal({
    engineer, confirmations, quizAttempts,
    yearFilter, onYearChange, onClose, onNotify, loading,
}) {
    const selectedQuizPassed = quizAttempts.some(
        (a) => a.isPassed && a.quizYear === yearFilter
    );

    return (
        <div className="alms-modal-overlay" onClick={onClose}>
            <div className="alms-modal" onClick={(e) => e.stopPropagation()}>

                {/* 모달 헤더 */}
                <div className="alms-modal__header">
                    <div className="alms-modal__title-wrap">
                        <p className="alms-modal__name">{engineer.name} 기사</p>
                        <p className="alms-modal__sub">
                            {categoryName(engineer.categoryId)} · {careerLabel(engineer.skillLevel)}
                        </p>
                    </div>
                    <div className="alms-modal__header-actions">
                        {!engineer.isCompleted && (
                            <button
                                className="agency-lms__notify-btn"
                                onClick={(e) => onNotify(e, engineer)}
                            >
                                알림 발송
                            </button>
                        )}
                        <select
                            className="agency-lms__select"
                            value={yearFilter}
                            onChange={(e) => onYearChange(Number(e.target.value))}
                        >
                            {[2026, 2025, 2024].map((y) => (
                                <option key={y} value={y}>{y}년</option>
                            ))}
                        </select>
                        <button className="alms-modal__close" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="alms-modal__loading">불러오는 중...</p>
                ) : (
                    <div className="alms-modal__body">

                        {/* ── 콘텐츠 이수 내역 ── */}
                        <div className="alms-modal__section">
                            <p className="alms-modal__section-title">콘텐츠 이수 내역</p>
                            {confirmations.length > 0 ? (
                                <table className="alms-modal__table">
                                    <thead>
                                        <tr>
                                            <th>콘텐츠 제목</th>
                                            <th>버전</th>
                                            <th>이수 일시</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {confirmations.map((c) => (
                                            <tr key={c.confirmationId}>
                                                <td>{c.content?.title}</td>
                                                <td>v{c.confirmedVersion}</td>
                                                <td>
                                                    {c.confirmedAt
                                                        ? new Date(c.confirmedAt).toLocaleDateString("ko-KR")
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="alms-modal__empty">{yearFilter}년 이수 내역이 없습니다.</p>
                            )}
                        </div>

                        {/* ── OX퀴즈 응시 현황 ── */}
                        <div className="alms-modal__section">
                            <p className="alms-modal__section-title">
                                <Trophy size={13} />
                                OX퀴즈 응시 현황
                            </p>

                            {/* 합격 요약 배지 */}
                            <div className="alms-modal__quiz-summary">
                                {selectedQuizPassed ? (
                                    <span className="agency-lms__status-badge agency-lms__status-badge--done">
                                        <CheckCircle size={13} /> {yearFilter}년 합격
                                    </span>
                                ) : quizAttempts.length > 0 ? (
                                    <span className="agency-lms__status-badge agency-lms__status-badge--pending">
                                        <Circle size={13} /> 미합격 ({quizAttempts.length}회 응시)
                                    </span>
                                ) : (
                                    <span className="agency-lms__status-badge agency-lms__status-badge--pending">
                                        <Circle size={13} /> 미응시
                                    </span>
                                )}
                            </div>

                            {quizAttempts.length > 0 ? (
                                <table className="alms-modal__table">
                                    <thead>
                                        <tr>
                                            <th>회차</th>
                                            <th>결과</th>
                                            <th>응시 일시</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quizAttempts.map((a, i) => (
                                            <tr key={a.attemptId}>
                                                <td>{quizAttempts.length - i}회차</td>
                                                <td>
                                                    {a.isPassed
                                                        ? <span className="agency-lms__status-badge agency-lms__status-badge--done">합격</span>
                                                        : <span className="agency-lms__status-badge agency-lms__status-badge--pending">불합격</span>
                                                    }
                                                </td>
                                                <td>
                                                    {new Date(a.attemptedAt).toLocaleDateString("ko-KR")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="alms-modal__empty">{yearFilter}년 응시 이력이 없습니다.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── 메인 ── */
export default function AgencyLmsPage() {
    const [engineers, setEngineers]               = useState([]);
    const [filtered, setFiltered]                 = useState([]);
    const [selectedEngineer, setSelectedEngineer] = useState(null);
    const [confirmations, setConfirmations]       = useState([]);
    const [quizAttempts, setQuizAttempts]         = useState([]);
    const [search, setSearch]                     = useState("");
    const [statusFilter, setStatusFilter]         = useState("ALL");
    const [yearFilter, setYearFilter]             = useState(new Date().getFullYear());
    const [loading, setLoading]                   = useState(false);
    const [detailLoading, setDetailLoading]       = useState(false);
    const [error, setError]                       = useState(null);

    const token    = localStorage.getItem("token");
    const decoded  = token ? jwtDecode(token) : null;
    const agencyId = decoded?.agencyId ?? null;

    useEffect(() => { if (agencyId) fetchEngineers(); }, [agencyId]);
    useEffect(() => { applyFilter(); }, [engineers, search, statusFilter]);

    async function fetchEngineers() {
        try {
            setLoading(true);
            setError(null);
            const res = await getAgencyEngineersLmsStatus(agencyId);
            setEngineers(res.data);
        } catch (e) {
            setError("기사 LMS 현황을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    function applyFilter() {
        let result = [...engineers];
        if (search)                  result = result.filter((e) => e.name.includes(search));
        if (statusFilter === "DONE") result = result.filter((e) => e.isCompleted);
        if (statusFilter === "PENDING") result = result.filter((e) => !e.isCompleted);
        setFiltered(result);
    }

    /* 기사 행 클릭 → 모달 오픈 + 상세 데이터 조회 */
    async function handleSelectEngineer(engineer) {
        setSelectedEngineer(engineer);
        setConfirmations([]);
        setQuizAttempts([]);
        try {
            setDetailLoading(true);
            const [confirmRes, quizRes] = await Promise.all([
                getEngineerConfirmations(engineer.userId, yearFilter),
                getAgencyEngineerQuizAttempts(agencyId, engineer.userId, yearFilter),
            ]);
            setConfirmations(confirmRes.data);
            setQuizAttempts(quizRes.data);
        } catch (e) {
            setConfirmations([]);
            setQuizAttempts([]);
        } finally {
            setDetailLoading(false);
        }
    }

    /* 모달 내 연도 변경 */
    async function handleYearChange(year) {
        setYearFilter(year);
        if (!selectedEngineer) return;
        try {
            setDetailLoading(true);
            const [confirmRes, quizRes] = await Promise.all([
                getEngineerConfirmations(selectedEngineer.userId, year),
                getAgencyEngineerQuizAttempts(agencyId, selectedEngineer.userId, year),
            ]);
            setConfirmations(confirmRes.data);
            setQuizAttempts(quizRes.data);
        } catch (e) {
            setConfirmations([]);
            setQuizAttempts([]);
        } finally {
            setDetailLoading(false);
        }
    }

    function handleCloseModal() {
        setSelectedEngineer(null);
        setConfirmations([]);
        setQuizAttempts([]);
    }

    async function handleSendNotification(e, engineer) {
        e.stopPropagation();
        try {
            await sendLmsNotification(agencyId, engineer.userId);
            alert(`${engineer.name} 기사에게 LMS 이수 독려 알림을 발송했습니다.`);
        } catch (err) {
            const msg = err.response?.data?.message;
            alert(msg || "알림 발송에 실패했습니다.");
        }
    }

    const completedCount = engineers.filter((e) => e.isCompleted).length;
    const totalCount     = engineers.length;

    return (
        <div className="agency-lms">
            {/* 헤더 */}
            <div className="agency-lms__header">
                <div>
                    <h1 className="agency-lms__title">LMS 교육 관리</h1>
                    <p className="agency-lms__sub">소속 기사의 LMS 이수 현황을 확인할 수 있습니다.</p>
                </div>
                <div className="agency-lms__summary">
                    <div className="agency-lms__summary-card">
                        <p className="agency-lms__summary-label">전체 기사</p>
                        <p className="agency-lms__summary-value">{totalCount}명</p>
                    </div>
                    <div className="agency-lms__summary-card agency-lms__summary-card--done">
                        <p className="agency-lms__summary-label">이수 완료</p>
                        <p className="agency-lms__summary-value">{completedCount}명</p>
                    </div>
                    <div className="agency-lms__summary-card agency-lms__summary-card--pending">
                        <p className="agency-lms__summary-label">미이수</p>
                        <p className="agency-lms__summary-value">{totalCount - completedCount}명</p>
                    </div>
                </div>
            </div>

            {/* 필터 */}
            <div className="agency-lms__filters">
                <div className="agency-lms__search">
                    <Search size={14} color="#aaa" />
                    <input
                        type="text"
                        placeholder="기사 이름 검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="agency-lms__select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">이수 전체</option>
                    <option value="DONE">이수 완료</option>
                    <option value="PENDING">미이수</option>
                </select>
            </div>

            {loading && <p style={{ padding: 40, color: "#aaa" }}>불러오는 중...</p>}
            {error   && <p style={{ padding: 40, color: "red" }}>{error}</p>}

            {!loading && !error && (
                /* 기사 목록 — 우측 패널 없이 전체 너비 사용 */
                <table className="agency-lms__table agency-lms__table--full">
                    <thead>
                        <tr>
                            <th>기사명</th>
                            <th>전문 카테고리</th>
                            <th>기술 등급</th>
                            <th>이수 현황</th>
                            <th>이수 상태</th>
                            <th>미이수 알림</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((engineer) => (
                            <tr
                                key={engineer.userId}
                                className="agency-lms__row--clickable"
                                onClick={() => handleSelectEngineer(engineer)}
                            >
                                <td style={{ fontWeight: 600 }}>{engineer.name}</td>
                                <td>{categoryName(engineer.categoryId)}</td>
                                <td>
                                    <span className={`agency-lms__level-badge agency-lms__level-badge--${engineer.skillLevel?.toLowerCase()}`}>
                                        {careerLabel(engineer.skillLevel)}
                                    </span>
                                </td>
                                <td>{engineer.completedCount} / {engineer.totalCount}개</td>
                                <td>
                                    {engineer.isCompleted
                                        ? <span className="agency-lms__status-badge agency-lms__status-badge--done">
                                            <CheckCircle size={13} /> 이수 완료
                                          </span>
                                        : <span className="agency-lms__status-badge agency-lms__status-badge--pending">
                                            <Circle size={13} /> 미이수
                                          </span>
                                    }
                                </td>
                                <td>
                                    {!engineer.isCompleted && (
                                        <button
                                            className="agency-lms__notify-btn"
                                            onClick={(e) => handleSendNotification(e, engineer)}
                                        >
                                            알림 발송
                                        </button>
                                    )}
                                </td>
                                <td><ChevronRight size={14} color="#aaa" /></td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
                                    조회된 기사가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {/* 기사 상세 모달 */}
            {selectedEngineer && (
                <EngineerDetailModal
                    engineer={selectedEngineer}
                    confirmations={confirmations}
                    quizAttempts={quizAttempts}
                    yearFilter={yearFilter}
                    onYearChange={handleYearChange}
                    onClose={handleCloseModal}
                    onNotify={handleSendNotification}
                    loading={detailLoading}
                />
            )}
        </div>
    );
}
