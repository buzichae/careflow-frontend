import { useState } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, Calendar,
} from "lucide-react";
import "../../styles/Engineer/Engineerreviewpage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/reviews?rating=&page=0&size=10
// reviews WHERE engineer_id = 로그인기사 AND is_visible=1
// + users(고객) + as_requests + appliances JOIN
//
// DB 필드:
//   reviews.review_id
//   reviews.rating        TINYINT(1~5)
//   reviews.content       TEXT
//   reviews.is_visible    TINYINT(1)
//   reviews.created_at
//   reviews.customer_id   → users.name (고객명)
//   reviews.request_id    → as_requests → appliances.name, model_no
//                         → as_requests.scheduled_date, scheduled_time
//
// engineer_profiles.avg_rating    → 종합 평점 (역정규화)
// engineer_profiles.total_reviews → 총 리뷰 수
//
// ⚠ DB에 없어서 제거한 항목:
//   - 평균 응답 시간 (별도 컬럼 없음)
//   - 재이용 의사 % (별도 컬럼 없음)
//   - 리뷰 태그 (별도 테이블 없음)
//   - 고객명 마스킹 → 백엔드에서 처리
// ──────────────────────────────────────────

const RATING_TABS = [
  { key: "ALL", label: "전체", count: 96 },
  { key: "5",   label: "5점",  count: 72 },
  { key: "4",   label: "4점",  count: 20 },
  { key: "3",   label: "3점",  count: 3  },
  { key: "2",   label: "2점",  count: 1  },
  { key: "1",   label: "1점",  count: 0  },
];

// 평점 분포 - reviews.rating 집계
const ratingDist = [
  { score: 5, count: 72, pct: 75 },
  { score: 4, count: 20, pct: 21 },
  { score: 3, count: 3,  pct: 3  },
  { score: 2, count: 1,  pct: 1  },
  { score: 1, count: 0,  pct: 0  },
];

// 더미 리뷰 목록 - reviews + users + as_requests + appliances JOIN
const reviewList = [
  {
    reviewId: 1,
    customerName: "이지현 고객님", customerMasked: "lee***",
    rating: 5,
    content: "냉장고 소음 문제로 방문해 주셨는데, 원인을 정확히 설명해 주시고 빠르게 해결해 주셨어요. 작업도 꼼꼼하고 친절하셔서 만족합니다!",
    createdAt: "2024.06.18",
    productName: "LG 오브제 냉장고",
    scheduledDate: "2024.06.18 (화) 14:00",
    requestId: "AS-2024-0618-0001",
  },
  {
    reviewId: 2,
    customerName: "박준호 고객님", customerMasked: "p****",
    rating: 5,
    content: "세탁기 배수가 안 됐는데 신속하게 점검해주시고 부품 교체까지 완벽하게 해주셨어요. 전문성이 느껴졌습니다. 감사합니다!",
    createdAt: "2024.06.15",
    productName: "삼성 그랑데 세탁기",
    scheduledDate: "2024.06.15 (토) 10:30",
    requestId: "AS-2024-0615-0003",
  },
  {
    reviewId: 3,
    customerName: "김서연 고객님", customerMasked: "seo***",
    rating: 4,
    content: "에어컨 설치 잘 해주셨어요. 설명도 자세하고 좋았습니다. 다만 도착 시간이 조금 늦어져서 아쉬웠어요.",
    createdAt: "2024.06.10",
    productName: "LG 휘센 에어컨",
    scheduledDate: "2024.06.10 (화) 16:00",
    requestId: "AS-2024-0610-0002",
  },
  {
    reviewId: 4,
    customerName: "최민수 고객님", customerMasked: "choi***",
    rating: 5,
    content: "TV 화면이 안 나와서 급하게 요청드렸는데 바로 와주셔서 해결해 주셨어요. 친절하시고 실력도 최고입니다!",
    createdAt: "2024.06.08",
    productName: "LG 올레드 TV",
    scheduledDate: "2024.06.08 (토) 13:20",
    requestId: "AS-2024-0608-0005",
  },
  {
    reviewId: 5,
    customerName: "정유진 고객님", customerMasked: "jung***",
    rating: 4,
    content: "냉장고 문이 잘 안 닫혀서 수리 받았는데 꼼꼼하게 해결해주셨어요. 부품 가격도 합리적이어서 만족합니다.",
    createdAt: "2024.06.05",
    productName: "LG 디오스 냉장고",
    scheduledDate: "2024.06.05 (수) 11:00",
    requestId: "AS-2024-0605-0004",
  },
];

function StarRating({ rating, size = 16 }) {
  return (
    <div className="erv-stars">
      {[1,2,3,4,5].map(s => (
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
  const totalPages = 5;

  const filteredList = activeTab === "ALL"
    ? reviewList
    : reviewList.filter(r => String(r.rating) === activeTab);

  return (
    <div className="erv">
      {/* 헤더 */}
      <div className="erv-header">
        <h1 className="erv-header__title">고객 평가</h1>
        <p className="erv-header__sub">고객들이 남겨주신 평가와 리뷰를 확인할 수 있습니다.</p>
      </div>

      {/* 상단 요약 - engineer_profiles.avg_rating, total_reviews + reviews 집계 */}
      <div className="erv-summary">
        {/* 종합 평점 */}
        <div className="erv-summary__rating">
          <p className="erv-summary__rating-label">종합 평점</p>
          <p className="erv-summary__rating-value">4.8 <span>/ 5.0</span></p>
          <StarRating rating={5} size={20} />
          <p className="erv-summary__rating-count">총 96건의 평가</p>
        </div>

        {/* 평점 분포 - reviews.rating 집계 */}
        <div className="erv-summary__dist">
          <p className="erv-summary__dist-label">평가 분포</p>
          {ratingDist.map(r => (
            <div key={r.score} className="erv-dist-row">
              <span className="erv-dist-score">{r.score}점</span>
              <div className="erv-dist-bar-wrap">
                <div className="erv-dist-bar" style={{ width: `${r.pct}%` }} />
              </div>
              <span className="erv-dist-count">{r.count} ({r.pct}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* 탭 + 필터 */}
      <div className="erv-tab-row">
        <div className="erv-tabs">
          {RATING_TABS.map(tab => (
            <button
              key={tab.key}
              className={`erv-tab ${activeTab === tab.key ? "erv-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} ({tab.count})
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

      {/* 리뷰 목록 */}
      <div className="erv-list">
        {filteredList.map((item, i) => (
          <div key={item.reviewId} className="erv-review-card">
            {/* 고객 정보 */}
            <div className="erv-review-card__left">
              <CustomerAvatar name={item.customerName} index={i} />
              <div className="erv-review-card__customer">
                {/* users.name (마스킹은 백엔드 처리) */}
                <p className="erv-review-card__customer-name">{item.customerName}</p>
                <p className="erv-review-card__masked">{item.customerMasked}</p>
                {/* reviews.created_at */}
                <p className="erv-review-card__date">{item.createdAt}</p>
              </div>
            </div>

            {/* 리뷰 내용 */}
            <div className="erv-review-card__center">
              <div className="erv-review-card__rating-row">
                {/* reviews.rating */}
                <StarRating rating={item.rating} size={15} />
                <span className="erv-review-card__rating-val">{item.rating}.0</span>
              </div>
              {/* reviews.content */}
              <p className="erv-review-card__content">{item.content}</p>
            </div>

            {/* 제품/작업 정보 */}
            <div className="erv-review-card__right">
              {/* appliances.name → as_requests JOIN */}
              <p className="erv-review-card__product">{item.productName}</p>
              {/* as_requests.scheduled_date, scheduled_time */}
              <p className="erv-review-card__work-date">{item.scheduledDate}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      <div className="erv-pagination">
        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
        {[1,2,3,4,5].map(p => (
          <button key={p} className={currentPage === p ? "erv-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
        ))}
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}