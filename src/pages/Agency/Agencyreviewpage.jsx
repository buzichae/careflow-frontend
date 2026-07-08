import { useState, useEffect, useCallback } from "react";
import {
  Star, Smile, MessageSquare,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, X,
} from "lucide-react";
import "../../styles/Agency/agency/Agencyreviewpage.css";
import { getAgencyReviews } from "../../apis/agencyReview";

const REVIEW_TABS = ["전체 리뷰", "5점 리뷰", "4점 이하 리뷰"];

function StarRow({ rating, max = 5 }) {
  return (
    <div className="arp-stars">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`arp-star ${i < rating ? "arp-star--full" : ""}`}>★</span>
      ))}
    </div>
  );
}

function ScoreStars({ score }) {
  return (
    <div className="arp-score-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`arp-star arp-star--sm ${i < score ? "arp-star--full" : ""}`}>★</span>
      ))}
    </div>
  );
}

function Avatar({ name, size = 32 }) {
  return (
    <div className="arp-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

// LocalDateTime → 날짜/시간 분리
function splitDateTime(dt) {
  if (!dt) return { date: "-", time: "" };
  const d = new Date(dt);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const day = days[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${d.getFullYear()}.${mm}.${dd}`, time: `(${day}) ${hh}:${min}` };
}

// API 응답 ReviewSummary → 컴포넌트 내부 형식으로 매핑
function mapReview(item) {
  const { date, time } = splitDateTime(item.createdAt);
  return {
    id: item.reviewId,
    reviewId: item.reviewId,
    requestId: item.requestId,
    engineerName: item.engineerName ? `${item.engineerName} 기사` : "-",
    engineerId: item.engineerId ? `ENG-${String(item.engineerId).padStart(5, "0")}` : "-",
    productName: item.productName ?? "-",
    modelNo: item.modelNo ?? "-",
    rating: item.rating,
    content: item.content ?? "",
    createdAt: date,
    createdTime: time,
    isVisible: item.isVisible,
    agencyName: item.agencyName ?? "-",
    visitDate: item.visitDate
      ? `${item.visitDate}${item.visitTime ? " " + item.visitTime : ""}`
      : "-",
    visitTime: item.visitTime ?? "-",
  };
}

// 페이지 번호 배열 생성
function buildPageNumbers(current, total) {
  if (total <= 1) return [1];
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end   = Math.min(total, start + 4);
  const nums  = [];
  for (let p = start; p <= end; p++) nums.push(p);
  return nums;
}

export default function AgencyReviewPage() {
  const [activeTab,    setActiveTab]    = useState("전체 리뷰");
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailTab,    setDetailTab]    = useState("기본 정보");
  const [autoRefresh,  setAutoRefresh]  = useState(true);

  // 필터 상태
  const [keyword,   setKeyword]   = useState("");
  const [inputKw,   setInputKw]   = useState("");  // 검색창 입력값 (엔터로 반영)

  // API 상태
  const [stats,      setStats]      = useState({ avgRating: 0, totalCount: 0, fiveStarRate: 0, newThisMonth: 0 });
  const [reviews,    setReviews]    = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);

  // 탭에 따른 rating 필터 결정
  const getRatingFilter = () => {
    if (activeTab === "5점 리뷰") return 5;
    return undefined;
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const filter = {};
      const ratingFilter = getRatingFilter();
      if (ratingFilter) filter.rating = ratingFilter;
      if (keyword) filter.keyword = keyword;

      const res  = await getAgencyReviews({ page: currentPage - 1, size: 10, filter });
      const data = res.data;

      setStats(data.stats ?? { avgRating: 0, totalCount: 0, fiveStarRate: 0, newThisMonth: 0 });

      let content = (data.content ?? []).map(mapReview);
      // "4점 이하 리뷰" 탭은 서버 필터 미지원 → 클라이언트 필터
      if (activeTab === "4점 이하 리뷰") {
        content = content.filter(r => r.rating <= 4);
      }
      setReviews(content);
      setTotalPages(data.totalPages || 1);
    } catch {
      // 에러 시 기존 데이터 유지
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, keyword]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // 탭 전환 시 페이지 초기화
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedItem(null);
  };

  // 필터 초기화
  const handleReset = () => {
    setInputKw("");
    setKeyword("");
    setCurrentPage(1);
    setActiveTab("전체 리뷰");
  };

  const statCards = [
    { label: "전체 평균 평점",    value: `${(stats.avgRating ?? 0).toFixed(1)} / 5.0`, icon: Star,          color: "amber"  },
    { label: "전체 리뷰 수",      value: `${(stats.totalCount ?? 0).toLocaleString()}건`, icon: Smile,       color: "green"  },
    { label: "5점 리뷰 비율",     value: `${(stats.fiveStarRate ?? 0).toFixed(1)}%`,     icon: Star,        color: "orange" },
    { label: "이번 달 신규 리뷰", value: `${stats.newThisMonth ?? 0}건`,                 icon: MessageSquare, color: "blue" },
  ];

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <div className="arp">
      {/* 헤더 */}
      <div className="arp-header">
        <div>
          <h1 className="arp-header__title">평가 및 리뷰</h1>
          <p className="arp-header__sub">고객이 남긴 기사 평가 및 리뷰를 확인하고 관리할 수 있습니다.</p>
        </div>
        <div className="arp-refresh-bar">
          <span className="arp-refresh-label">자동 갱신</span>
          <div className={`arp-toggle ${autoRefresh ? "arp-toggle--on" : ""}`} onClick={() => setAutoRefresh(p => !p)}>
            <div className="arp-toggle__thumb" />
          </div>
          <div className="arp-refresh-select">30초 <ChevronDown size={13} /></div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="arp-stats">
        {statCards.map((s) => (
          <div key={s.label} className="arp-stat-card">
            <div className="arp-stat-card__text">
              <p className="arp-stat-card__value">{s.value}</p>
              <p className="arp-stat-card__label">{s.label}</p>
            </div>
            <div className={`arp-stat-card__icon arp-stat-card__icon--${s.color}`}>
              <s.icon size={40} strokeWidth={1} />
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="arp-filters">
        <div className="arp-filter-select"><span>전체 평점</span><ChevronDown size={13} /></div>
        <div className="arp-filter-select"><span>전체 기사</span><ChevronDown size={13} /></div>
        <div className="arp-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
        <div className="arp-search">
          <Search size={13} color="#aaa" />
          <input
            type="text"
            placeholder="고객명, 기사명, 주문번호 검색"
            value={inputKw}
            onChange={e => setInputKw(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setKeyword(inputKw);
                setCurrentPage(1);
              }
            }}
          />
        </div>
        <button className="arp-reset-btn" onClick={handleReset}><RefreshCw size={13} /> 필터 초기화</button>
      </div>

      <div className="arp-body">
        <div className="arp-left">
          <div className="arp-tabs">
            {REVIEW_TABS.map((tab) => (
              <button
                key={tab}
                className={`arp-tab ${activeTab === tab ? "arp-tab--active" : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="arp-table">
            <div className="arp-table__header">
              <span>리뷰 정보</span><span>주문 정보</span><span>평가</span><span>작성일</span><span>관리</span>
            </div>

            {loading && (
              <div style={{ padding: "24px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                불러오는 중...
              </div>
            )}

            {!loading && reviews.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                리뷰가 없습니다.
              </div>
            )}

            {!loading && reviews.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div key={item.id} className={`arp-table__row ${isSelected ? "arp-table__row--selected" : ""}`}>
                  <div className="arp-table__review-col">
                    <div className="arp-table__customer">
                      <Avatar name={item.engineerName} size={32} />
                      <span className="arp-table__customer-name">{item.engineerName}</span>
                    </div>
                    <p className="arp-table__content">{item.content}</p>
                  </div>
                  <div className="arp-table__order-col">
                    <span className="arp-table__request-id">#{item.requestId}</span>
                    <span className="arp-table__product">{item.productName} ({item.modelNo})</span>
                  </div>
                  <div className="arp-table__rating-col">
                    <StarRow rating={Math.round(item.rating)} />
                    <span className="arp-table__rating-val">{Number(item.rating).toFixed(1)}</span>
                  </div>
                  <div className="arp-table__date-col">
                    <span>{item.createdAt}</span>
                    <span className="arp-table__date-time">{item.createdTime}</span>
                  </div>
                  <div className="arp-table__action-col">
                    <button
                      className={`arp-detail-btn ${isSelected ? "arp-detail-btn--active" : ""}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedItem(null);
                        } else {
                          setSelectedItem(item);
                          setDetailTab("기본 정보");
                        }
                      }}
                    >
                      {isSelected ? "닫기" : "상세보기"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          <div className="arp-pagination">
            <div className="arp-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {pageNumbers.map(p => (
                <button
                  key={p}
                  className={currentPage === p ? "arp-pagination__active" : ""}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              {totalPages > pageNumbers[pageNumbers.length - 1] && (
                <>
                  <span className="arp-pagination__ellipsis">...</span>
                  <button
                    className={currentPage === totalPages ? "arp-pagination__active" : ""}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            {/* <div className="arp-page-size">10개씩 보기 <ChevronDown size={13} /></div> */}
          </div>
        </div>

        {/* 상세 패널 */}
        {selectedItem && (
          <aside className="arp-detail">
            <div className="arp-detail__header">
              <span className="arp-detail__title">리뷰 상세 정보</span>
              <button className="arp-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
            </div>
            <div className="arp-detail__profile">
              <Avatar name={selectedItem.engineerName} size={44} />
              <div>
                <div className="arp-detail__profile-name">{selectedItem.engineerName}</div>
                <p className="arp-detail__profile-id">{selectedItem.engineerId}</p>
              </div>
            </div>
            <div className="arp-detail__tabs">
              {["기본 정보", "관리 이력"].map((tab) => (
                <button
                  key={tab}
                  className={`arp-detail__tab ${detailTab === tab ? "arp-detail__tab--active" : ""}`}
                  onClick={() => setDetailTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="arp-detail__body">
              {detailTab === "기본 정보" && (
                <div>
                  <div className="arp-detail__section">
                    <div className="arp-detail__row"><span className="arp-detail__label">주문 번호</span><span className="arp-detail__value arp-detail__value--id">#{selectedItem.requestId}</span></div>
                    <div className="arp-detail__row"><span className="arp-detail__label">가전 제품</span><span className="arp-detail__value">{selectedItem.productName} ({selectedItem.modelNo})</span></div>
                    <div className="arp-detail__row"><span className="arp-detail__label">접수일</span><span className="arp-detail__value">{selectedItem.createdAt} {selectedItem.createdTime}</span></div>
                    <div className="arp-detail__row"><span className="arp-detail__label">방문일</span><span className="arp-detail__value">{selectedItem.visitDate}</span></div>
                    <div className="arp-detail__row"><span className="arp-detail__label">대행사</span><span className="arp-detail__value">{selectedItem.agencyName}</span></div>
                  </div>
                  <div className="arp-detail__section">
                    <p className="arp-detail__section-label">평가 점수</p>
                    <div className="arp-detail__score-row">
                      <span className="arp-detail__score-label">평균 평점</span>
                      <div className="arp-detail__score-right">
                        <ScoreStars score={Math.round(selectedItem.rating)} />
                        <span className="arp-detail__score-val">{Number(selectedItem.rating).toFixed(1)} / 5.0</span>
                      </div>
                    </div>
                  </div>
                  <div className="arp-detail__section">
                    <p className="arp-detail__section-label">리뷰 내용</p>
                    <div className="arp-detail__content-box">
                      <p className="arp-detail__content-text">{selectedItem.content}</p>
                      <p className="arp-detail__content-date">작성일 {selectedItem.createdAt} {selectedItem.createdTime}</p>
                    </div>
                  </div>
                </div>
              )}
              {detailTab === "관리 이력" && (
                <div className="arp-detail__coming-soon">관리 이력 — API 연동 후 구현</div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
