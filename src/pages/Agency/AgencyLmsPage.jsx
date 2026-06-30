import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { CheckCircle, Circle, ChevronRight, X, Search } from "lucide-react";
import { getAgencyEngineersLmsStatus, getEngineerConfirmations } from "../../apis/lms";
import "../../styles/Agency/AgencyLmsPage.css";

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

const CAREER_LEVELS = [
    { key: "BEGINNER",     label: "초급" },
    { key: "INTERMEDIATE", label: "중급" },
    { key: "ADVANCED",     label: "고급" },
];

const careerLabel = (key) =>
    CAREER_LEVELS.find((cl) => cl.key === key)?.label ?? key;

const categoryName = (id) =>
    CATEGORIES.find((c) => c.id === id)?.name ?? "-";

export default function AgencyLmsPage() {
    const [engineers, setEngineers]           = useState([]);
    const [filtered, setFiltered]             = useState([]);
    const [selectedEngineer, setSelectedEngineer] = useState(null);
    const [confirmations, setConfirmations]   = useState([]);
    const [search, setSearch]                 = useState("");
    const [statusFilter, setStatusFilter]     = useState("ALL");
    const [yearFilter, setYearFilter]         = useState(new Date().getFullYear());
    const [loading, setLoading]               = useState(false);
    const [detailLoading, setDetailLoading]   = useState(false);
    const [error, setError]                   = useState(null);

    // JWT에서 agencyId 추출
    const token = localStorage.getItem("token");
    const decoded = token ? jwtDecode(token) : null;
    const agencyId = decoded?.agencyId ?? null;

    useEffect(() => {
        if (agencyId) {
            fetchEngineers();
        }
    }, [agencyId]);

    useEffect(() => {
        applyFilter();
    }, [engineers, search, statusFilter]);

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

        // 이름 검색
        if (search) {
            result = result.filter((e) => e.name.includes(search));
        }

        // 이수 상태 필터
        if (statusFilter === "DONE")    result = result.filter((e) => e.isCompleted);
        if (statusFilter === "PENDING") result = result.filter((e) => !e.isCompleted);

        setFiltered(result);
    }

    // 기사 클릭 → 콘텐츠별 이수 상세 조회
    async function handleSelectEngineer(engineer) {
        setSelectedEngineer(engineer);
        try {
            setDetailLoading(true);
            const res = await getEngineerConfirmations(engineer.userId, yearFilter);
            setConfirmations(res.data);
        } catch (e) {
            setConfirmations([]);
        } finally {
            setDetailLoading(false);
        }
    }

    // 연도 변경 시 상세 재조회
    async function handleYearChange(year) {
        setYearFilter(year);
        if (!selectedEngineer) return;
        try {
            setDetailLoading(true);
            const res = await getEngineerConfirmations(selectedEngineer.userId, year);
            setConfirmations(res.data);
        } catch (e) {
            setConfirmations([]);
        } finally {
            setDetailLoading(false);
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
                {/* 요약 통계 */}
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

            {loading && <p style={{ padding: 40 }}>불러오는 중...</p>}
            {error   && <p style={{ padding: 40, color: "red" }}>{error}</p>}

            {!loading && !error && (
                <div className="agency-lms__body">
                    {/* 기사 목록 */}
                    <div className="agency-lms__list">
                        <table className="agency-lms__table">
                            <thead>
                            <tr>
                                <th>기사명</th>
                                <th>전문 카테고리</th>
                                <th>기술 등급</th>
                                <th>이수 현황</th>
                                <th>이수 상태</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map((engineer) => {
                                const isSelected = selectedEngineer?.userId === engineer.userId;
                                return (
                                    <tr
                                        key={engineer.userId}
                                        className={isSelected ? "agency-lms__row--selected" : ""}
                                        onClick={() => handleSelectEngineer(engineer)}
                                        style={{ cursor: "pointer" }}
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
                                        <td><ChevronRight size={14} color="#aaa" /></td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
                                        조회된 기사가 없습니다.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* 기사 이수 상세 패널 */}
                    {selectedEngineer && (
                        <aside className="agency-lms__detail">
                            <div className="agency-lms__detail-header">
                                <div>
                                    <p className="agency-lms__detail-name">{selectedEngineer.name} 기사</p>
                                    <p className="agency-lms__detail-sub">
                                        {categoryName(selectedEngineer.categoryId)} · {careerLabel(selectedEngineer.skillLevel)}
                                    </p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {/* 연도 필터 */}
                                    <select
                                        className="agency-lms__select"
                                        value={yearFilter}
                                        onChange={(e) => handleYearChange(Number(e.target.value))}
                                    >
                                        {[2026, 2025, 2024].map((y) => (
                                            <option key={y} value={y}>{y}년</option>
                                        ))}
                                    </select>
                                    <button
                                        className="agency-lms__detail-close"
                                        onClick={() => { setSelectedEngineer(null); setConfirmations([]); }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* 이수 요약 */}
                            <div className="agency-lms__detail-summary">
                                <span>{yearFilter}년 이수 현황</span>
                                <span>
                  <strong>{selectedEngineer.completedCount}</strong> / {selectedEngineer.totalCount}개 완료
                </span>
                                {selectedEngineer.isCompleted
                                    ? <span className="agency-lms__status-badge agency-lms__status-badge--done"><CheckCircle size={13} /> 이수 완료</span>
                                    : <span className="agency-lms__status-badge agency-lms__status-badge--pending"><Circle size={13} /> 미이수</span>
                                }
                            </div>

                            {/* 콘텐츠별 이수 상세 */}
                            {detailLoading
                                ? <p style={{ padding: 20, color: "#aaa" }}>불러오는 중...</p>
                                : confirmations.length > 0
                                    ? (
                                        <table className="agency-lms__table">
                                            <thead>
                                            <tr>
                                                <th>콘텐츠 제목</th>
                                                <th>이수 버전</th>
                                                <th>이수 일시</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {confirmations.map((c) => (
                                                <tr key={c.confirmationId}>
                                                    <td>{c.content?.title}</td>
                                                    <td>{c.confirmedVersion}</td>
                                                    <td style={{ color: "#666" }}>
                                                        {c.confirmedAt
                                                            ? new Date(c.confirmedAt).toLocaleDateString("ko-KR")
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    )
                                    : (
                                        <p style={{ padding: 20, color: "#aaa", textAlign: "center" }}>
                                            {yearFilter}년 이수 내역이 없습니다.
                                        </p>
                                    )
                            }
                        </aside>
                    )}
                </div>
            )}
        </div>
    );
}