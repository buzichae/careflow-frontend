import { useState, useEffect } from "react";
import {
  GraduationCap,
  CheckCircle,
  Clock,
  ChevronRight,
  X,
  BookOpen,
} from "lucide-react";
import "../../styles/Engineer/Engineerlmspage.css";
import {
  getMyLmsContents,
  getMyLmsStatus,
  completeContent,
} from "../../apis/lms";
import api from "../../apis/axiosInstance";

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

export default function EngineerLmsPage() {
  const [contents, setContents] = useState([]);
  const [engineerInfo, setEngineerInfo] = useState(null);
  const [lmsStatus, setLmsStatus] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);

      // 기사 프로필 + 콘텐츠 목록 + 이수 현황 동시 조회
      const [profileRes, contentsRes, statusRes] = await Promise.all([
        api.get("/api/engineers/me/profile"),
        getMyLmsContents(),
        getMyLmsStatus(),
      ]);

      const profile = profileRes.data;
      setEngineerInfo({
        categoryId: profile.categoryId,
        categoryName:
          CATEGORIES.find((c) => c.id === profile.categoryId)?.name ?? "-",
        skillLevel: profile.skillLevel,
        isLmsCompleted: profile.isLmsCompleted,
      });

      // getMyLmsContents() 응답: List<LmsContentWithStatusDto>
      // { content: { contentId, title, body, requiredLevel, version, ... }, completed, confirmedAt }
      setContents(contentsRes.data);
      setLmsStatus(statusRes.data);
    } catch (e) {
      setError("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(contentId) {
    try {
      await completeContent(contentId);
      await fetchAll(); // 이수 후 전체 새로고침
      setSelectedContent(null);
    } catch (e) {
      alert("이수 처리에 실패했습니다.");
    }
  }

  if (loading)
    return (
      <div className="elp">
        <p style={{ padding: 40 }}>불러오는 중...</p>
      </div>
    );
  if (error)
    return (
      <div className="elp">
        <p style={{ padding: 40, color: "red" }}>{error}</p>
      </div>
    );
  if (!engineerInfo) return null;

  const totalCount = lmsStatus?.totalCount ?? 0;
  const completedCount = lmsStatus?.completedCount ?? 0;
  const allCompleted = lmsStatus?.isCompleted ?? false;
  const currentYear = new Date().getFullYear();

  return (
    <div className="elp">
      {/* 헤더 */}
      <div className="elp-header">
        <div>
          <h1 className="elp-header__title">LMS 교육</h1>
          <p className="elp-header__sub">
            {engineerInfo.categoryName} 전문 · {engineerInfo.skillLevel} 등급
            필수 교육 콘텐츠입니다.
          </p>
        </div>
        <div
          className={`elp-lms-status ${allCompleted ? "elp-lms-status--done" : "elp-lms-status--pending"}`}
        >
          {allCompleted ? (
            <>
              <CheckCircle size={14} /> {currentYear}년 이수 완료 · 배차 가능
            </>
          ) : (
            <>
              <Clock size={14} /> {currentYear}년 이수 중 · 미완료 시 배차 제한
            </>
          )}
        </div>
      </div>

      {/* 진행률 카드 */}
      <div className="elp-progress-card">
        <div className="elp-progress-card__left">
          <GraduationCap size={28} color="#5B4FF5" />
          <div>
            <p className="elp-progress-card__label">
              {currentYear}년 필수 교육 이수 현황
            </p>
            <p className="elp-progress-card__count">
              <span className="elp-progress-card__done">{completedCount}</span>
              <span> / {totalCount}개 완료</span>
            </p>
          </div>
        </div>
        <div className="elp-progress-card__right">
          <div className="elp-progress-bar-wrap">
            <div
              className="elp-progress-bar"
              style={{
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="elp-progress-pct">
            {totalCount > 0
              ? Math.round((completedCount / totalCount) * 100)
              : 0}
            %
          </span>
        </div>
      </div>

      <div className="elp-body">
        {/* 콘텐츠 목록 */}
        <div className="elp-list">
          <p className="elp-list__title">필수 교육 목록</p>
          <p className="elp-list__desc">
            기사님의 전문 카테고리({engineerInfo.categoryName})와 기술 등급(
            {engineerInfo.skillLevel})에 해당하는 콘텐츠입니다.
          </p>

          {contents.map((item) => {
            // LmsContentWithStatusDto: { content, completed, confirmedAt }
            const { content, completed, confirmedAt } = item;
            const isSelected =
              selectedContent?.content?.contentId === content.contentId;

            return (
              <div
                key={content.contentId}
                className={`elp-content-card ${completed ? "elp-content-card--done" : ""} ${isSelected ? "elp-content-card--selected" : ""}`}
                onClick={() => setSelectedContent(item)}
              >
                <div
                  className={`elp-content-card__icon ${completed ? "elp-content-card__icon--done" : ""}`}
                >
                  {completed ? (
                    <CheckCircle size={20} color="#16a34a" />
                  ) : (
                    <BookOpen size={20} color="#5B4FF5" />
                  )}
                </div>
                <div className="elp-content-card__info">
                  <p className="elp-content-card__title">{content.title}</p>
                  <div className="elp-content-card__meta">
                    <span
                      className={`elp-level-badge elp-level-badge--${content.requiredLevel.toLowerCase()}`}
                    >
                      {content.requiredLevel === "ALL"
                        ? "전 등급"
                        : content.requiredLevel}
                    </span>
                    <span className="elp-type-badge">
                      {content.contentType}
                    </span>
                    <span className="elp-version">v{content.version}</span>
                  </div>
                  {completed && confirmedAt && (
                    <p className="elp-content-card__confirmed">
                      ✓ 이수 완료 · {confirmedAt.slice(0, 10)}
                    </p>
                  )}
                </div>
                <ChevronRight size={16} color="#aaa" />
              </div>
            );
          })}

          {contents.length === 0 && (
            <p style={{ color: "#aaa", padding: 20, textAlign: "center" }}>
              이수 대상 콘텐츠가 없습니다.
            </p>
          )}
        </div>

        {/* 상세 뷰어 */}
        {selectedContent && (
          <div className="elp-viewer">
            <div className="elp-viewer__header">
              <div>
                <p className="elp-viewer__title">
                  {selectedContent.content.title}
                </p>
                <div className="elp-viewer__meta">
                  <span
                    className={`elp-level-badge elp-level-badge--${selectedContent.content.requiredLevel.toLowerCase()}`}
                  >
                    {selectedContent.content.requiredLevel === "ALL"
                      ? "전 등급"
                      : selectedContent.content.requiredLevel}
                  </span>
                  <span className="elp-type-badge">
                    {selectedContent.content.contentType}
                  </span>
                  <span className="elp-version">
                    v{selectedContent.content.version}
                  </span>
                </div>
              </div>
              <button
                className="elp-viewer__close"
                onClick={() => setSelectedContent(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* 본문 */}
            <div className="elp-viewer__body">
              {selectedContent.content.body.split("\n").map((line, i) => {
                if (line.startsWith("# "))
                  return (
                    <h2 key={i} className="elp-md-h1">
                      {line.slice(2)}
                    </h2>
                  );
                if (line.startsWith("## "))
                  return (
                    <h3 key={i} className="elp-md-h2">
                      {line.slice(3)}
                    </h3>
                  );
                if (line.startsWith("- "))
                  return (
                    <p key={i} className="elp-md-li">
                      • {line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}
                    </p>
                  );
                if (/^\d+\./.test(line))
                  return (
                    <p key={i} className="elp-md-ol">
                      {line}
                    </p>
                  );
                if (line.trim() === "")
                  return <div key={i} className="elp-md-br" />;
                return (
                  <p key={i} className="elp-md-p">
                    {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                  </p>
                );
              })}
            </div>

            {/* 이수 버튼 */}
            <div className="elp-viewer__footer">
              {selectedContent.completed ? (
                <div className="elp-viewer__done">
                  <CheckCircle size={16} color="#16a34a" />
                  이수 완료 · {selectedContent.confirmedAt?.slice(0, 10)}
                </div>
              ) : (
                <>
                  <p className="elp-viewer__hint">
                    콘텐츠를 끝까지 읽은 후 이수 완료 처리하세요.
                  </p>
                  <button
                    className="elp-confirm-btn"
                    onClick={() =>
                      handleConfirm(selectedContent.content.contentId)
                    }
                  >
                    <CheckCircle size={14} /> 이수 완료 처리
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
