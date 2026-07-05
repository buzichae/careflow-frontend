import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, Calendar,
} from "lucide-react";
import { getEngineerReviews, getEngineerReviewStats } from "../../apis/engineers"; 
import "../../styles/Engineer/Engineerreviewpage.css";

const RATING_TAB_LABELS = {
  ALL: "전체",
  "5": "5점",
  "4": "4점",
  "3": "3점",
  "2": "2점",
  "1": "1점",
};

function formatDateOnly(isoString) {
  if (!isoString) return "-";
  return isoString.split("T")[0].replace(/-/g, ".");
}

function StarRating({ rating, size = 16 }) {
  return (
    <div className="erv-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`erv-star ${s <= rating ? "erv-star--full" : ""}`} style={{ fontSize: size }}>★</span>
      ))}
    </div>
  );
}

function CustomerAvatar({ name, index }) {
  const colors = ["#eeeaff", "#eaf3de", "#fef0e0", "#e6f1fb", "#fce7f3"];
  const textColors = ["#5B4FF5", "#16a34a", "#d97706", "#2563eb", "#db2777"];
  return (
    <div className="erv-avatar" style={{ background: colors[index % 5], color: textColors[index % 5] }}>
      {name?.charAt(0)}
    </div>
  );
}

export default function EngineerReviewPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({ avgRating: 0, totalCount: 0 });
  const [ratingDist, setRatingDist] = useState({}); // { "5": 12, "4": 5, ... }

  const [reviewList, setReviewList] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // 종합 평점 + 평점 분포 — /api/engineer/reviews/stats
  useEffect(() => {
    getEngineerReviewStats()
      .then((res) => {
        const d = res.data;
        setSummary({
         avgRating: d.avgRating ?? 0,
         totalCount: d.totalReviews ?? 0,
        });
        setRatingDist(d.ratingDistribution ?? {});
      })
      .catch((err) => {
        console.error("리뷰 통계 조회 실패:", err);
      });
  }, []);

  // 리뷰 목록 (페이지네이션)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getEngineerReviews(activeTab, currentPage - 1, 10)
      .then((res) => {
        if (!mounted) return;
        const d = res.data;
        setReviewList(d.content ?? []);
        setTotalPages(d.totalPages ?? 1);
      })
      .catch((err) => {
        console.error("리뷰 조회 실패:", err);
        if (mounted) setError("리뷰를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [activeTab, currentPage]);

  const totalDistCount = Object.values(ratingDist).reduce((a, b) => a + b, 0);

  return (
    <div className="erv">
      <div className="erv-header">
        <h1 className="erv-header__title">고객 평가</h1>
        <p className="erv-header__sub">고객들이 남겨주신 평가와 리뷰를 확인할 수 있습니다.</p>
      </div>

      <div className="erv-summary">
        <div className="erv-summary__rating">
          <p className="erv-summary__rating-label">종합 평점</p>
          <p className="erv-summary__rating-value">{summary.avgRating.toFixed(1)} <span>/ 5.0</span></p>
          <StarRating rating={Math.round(summary.avgRating)} size={20} />
          <p className="erv-summary__rating-count">총 {summary.totalCount}건의 평가</p>
        </div>

        <div className="erv-summary__dist">
          <p className="erv-summary__dist-label">평가 분포</p>
          {["5", "4", "3", "2", "1"].map((score) => {
            const count = ratingDist[score] ?? 0;
            const pct = totalDistCount > 0 ? Math.round((count / totalDistCount) * 100) : 0;
            return (
              <div key={score} className="erv-dist-row">
                <span className="erv-dist-score">{score}점</span>
                <div className="erv-dist-bar-wrap">
                  <div className="erv-dist-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="erv-dist-count">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="erv-tab-row">
        <div className="erv-tabs">
          {Object.keys(RATING_TAB_LABELS).map((key) => (
            <button
              key={key}
              className={`erv-tab ${activeTab === key ? "erv-tab--active" : ""}`}
              onClick={() => { setActiveTab(key); setCurrentPage(1); }}
            >
              {RATING_TAB_LABELS[key]} {key !== "ALL" && `(${ratingDist[key] ?? 0})`}
            </button>
          ))}
        </div>
        <div className="erv-tab-actions">
          <div className="erv-filter-date">
            <Calendar size={13} color="#aaa" />
            <span>전체 기간</span>
          </div>
          <div className="erv-filter-select"><span>최신순</span><ChevronDown size={13} /></div>
        </div>
      </div>

      {loading && <p style={{ padding: "16px" }}>불러오는 중...</p>}
      {error && <p style={{ padding: "16px", color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="erv-list">
            {reviewList.map((item, i) => (
              <div key={item.reviewId} className="erv-review-card">
                <div className="erv-review-card__left">
                  <CustomerAvatar name={item.customerName} index={i} />
                  <div className="erv-review-card__customer">
                    <p className="erv-review-card__customer-name">{item.customerName}</p>
                    <p className="erv-review-card__date">{formatDateOnly(item.createdAt)}</p>
                  </div>
                </div>

                <div className="erv-review-card__center">
                  <div className="erv-review-card__rating-row">
                    <StarRating rating={item.rating} size={15} />
                    <span className="erv-review-card__rating-val">{item.rating}.0</span>
                  </div>
                  <p className="erv-review-card__content">{item.content}</p>
                </div>

                <div className="erv-review-card__right">
                  <p className="erv-review-card__product">{item.applianceInfo}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="erv-pagination">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={currentPage === p ? "erv-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
          </div>
        </>
      )}
    </div>
  );
}