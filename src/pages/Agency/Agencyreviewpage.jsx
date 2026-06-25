import { useState } from "react";
import {
  Star, Smile,  MessageSquare, 
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, X,
} from "lucide-react";
import "../../styles/Agency/AgencyReviewPage.css";

 
// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/agency/reviews?page=0&size=10
// reviews + as_requests + appliances + users(고객) + engineer_profiles + agencies JOIN
// 응답 필드:
//   reviewId, requestId (reviews.request_id)
//   customerId, customerName, customerGrade (users)
//   engineerId, engineerName (engineer_profiles)
//   agencyName (agencies.name)
//   productName, modelNo (appliances)
//   visitDate, visitTime (as_requests.scheduled_date, scheduled_time)
//   rating (reviews.rating 1~5 TINYINT)
//   content (reviews.content)            ← DB 필드명
//   isVisible (reviews.is_visible)
//   createdAt (reviews.created_at)
//   scores: { kindness, expertise, punctuality, satisfaction } ← 세부 평점 (기획서 확인 필요)
// ──────────────────────────────────────────
 
const REVIEW_TABS = ["전체 리뷰", "5점 리뷰", "4점 이하 리뷰", ];
 
const statCards = [
  { label: "전체 평균 평점",      value: "4.8 / 5.0", sub: "전월 대비 +0.2",   subType: "up",      icon: Star,          color: "amber"  },
  { label: "전체 리뷰 수",        value: "2,148건",    sub: "전월 대비 +156",   subType: "up",      icon: Smile,         color: "green"  },
  { label: "5점 리뷰 비율",       value: "78.6%",      sub: "전월 대비 +5.3%p", subType: "up",      icon: Star,          color: "orange" },
  { label: "이번 달 신규 리뷰",   value: "256건",      sub: "전월 대비 +32",    subType: "up",      icon: MessageSquare, color: "blue"   },
 
];
 
const GRADE_MAP = {
  VIP:    { label: "VIP",    type: "vip"    },
  GOLD:   { label: "GOLD",   type: "gold"   },
  SILVER: { label: "SILVER", type: "silver" },
  BRONZE: { label: "BRONZE", type: "bronze" },
  NORMAL: { label: "",       type: "normal" },
};
 
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
 
// ──────────────────────────────────────────
// TODO: API 연동 - 리뷰 목록
// reviews.content → content (DB 필드명)
// reviews.is_visible → isVisible
// ──────────────────────────────────────────
const reviewList = [
  { id: 1,  reviewId: "AS-20240618-0105", customerName: "김민수",  customerGrade: "VIP",    engineerName: "김현수 기사", engineerId: "ENG-00123", productName: "삼성 에어컨",   modelNo: "AF17B7538WZ",  rating: 5.0,  content: "에어컨 냉방이 안 돼서 정말 당황받았는데, 빠르게 원인을 찾아 수리해주셨어요. 진절하고 꼼꼼합니다!", createdAt: "2024.06.18", createdTime: "(화) 15:30", isVisible: true,  needsAction: false, agencyName: "퀵케어 서비스", requestId: "AS-20240618-0103", visitDate: "2024.06.18 (화) 10:30", visitTime: "13:00" },
  { id: 2,  reviewId: "AS-20240618-0104", customerName: "박지영",  customerGrade: "GOLD",   engineerName: "박민수 기사", engineerId: "ENG-00124", productName: "LG 세탁기",     modelNo: "F21VDSK",      rating: 5.0,  content: "시간 약속도 잘 지켜주시고 설명도 자세히 해주셨습니다. 다음에도 부탁드리고 싶어요.", createdAt: "2024.06.18", createdTime: "(화) 14:20", isVisible: true,  needsAction: false, agencyName: "퀵케어 서비스", requestId: "AS-20240618-0104", visitDate: "2024.06.18 (화) 12:00", visitTime: "14:00" },
  { id: 3,  reviewId: "AS-20240618-0103", customerName: "이현우",  customerGrade: "NORMAL", engineerName: "이정호 기사", engineerId: "ENG-00125", productName: "위니아 냉장고", modelNo: "WRB570EHD",    rating: 2.0,  content: "수리는 잘 해주셨지만, 도착 시간이 너무 늦었습니다. 미리 연락이라도 주셨으면 좋았을 것 같아요.", createdAt: "2024.06.18", createdTime: "(화) 13:50", isVisible: true,  needsAction: true,  agencyName: "케어플로우 수리센터", requestId: "AS-20240618-0103", visitDate: "2024.06.18 (화) 10:30", visitTime: "13:00" },
  { id: 4,  reviewId: "AS-20240618-0102", customerName: "최수연",  customerGrade: "SILVER", engineerName: "최재민 기사", engineerId: "ENG-00126", productName: "삼성 TV",       modelNo: "QN65Q80C",     rating: 5.0,  content: "오래된 제품인데도 부품 교체까지 깔끔하게 해주셨어요. 정말 감사합니다!", createdAt: "2024.06.18", createdTime: "(화) 12:40", isVisible: true,  needsAction: false, agencyName: "퀵케어 서비스", requestId: "AS-20240618-0102", visitDate: "2024.06.18 (화) 10:00", visitTime: "12:00" },
  { id: 5,  reviewId: "AS-20240618-0101", customerName: "정우성",  customerGrade: "BRONZE", engineerName: "정우진 기사", engineerId: "ENG-00127", productName: "에어컨",        modelNo: "AF23A8377WZN", rating: 4.0,  content: "친절하고 작업도 신속하게 해주셔서 만족합니다. 가격 설명도 투명해서 좋았어요.", createdAt: "2024.06.18", createdTime: "(화) 11:30", isVisible: true,  needsAction: false, agencyName: "퀵케어 서비스", requestId: "AS-20240618-0101", visitDate: "2024.06.18 (화) 09:00", visitTime: "11:00" },
  { id: 6,  reviewId: "AS-20240618-0100", customerName: "임세훈",  customerGrade: "NORMAL", engineerName: "홍길동 기사", engineerId: "ENG-00128", productName: "LG 냉장고",     modelNo: "M875GBB231",   rating: 4.0,  content: "수리 후 문제없이 잘 사용하고 있습니다. 좋은 서비스 감사합니다!", createdAt: "2024.06.18", createdTime: "(화) 10:25", isVisible: true,  needsAction: false, agencyName: "퀵케어 서비스", requestId: "AS-20240618-0100", visitDate: "2024.06.18 (화) 08:00", visitTime: "10:00" },
  { id: 7,  reviewId: "AS-20240617-0099", customerName: "오하나",  customerGrade: "NORMAL", engineerName: "김수현 기사", engineerId: "ENG-00124", productName: "세탁기",        modelNo: "WF21T6500KP",  rating: 1.0,  content: "예약시간보다 늦게 도착하셔서 기다리는 시간이 길었어요.", createdAt: "2024.06.17", createdTime: "(월) 18:10", isVisible: true,  needsAction: true,  agencyName: "퀵케어 서비스", requestId: "AS-20240617-0099", visitDate: "2024.06.17 (월) 14:00", visitTime: "16:00" },
  { id: 8,  reviewId: "AS-20240617-0098", customerName: "한동근",  customerGrade: "NORMAL", engineerName: "이재훈 기사", engineerId: "ENG-00130", productName: "TV",            modelNo: "OLED77C3KNA",  rating: 3.0, content: "전반적으로 만족스러운 서비스였습니다. 다만 설명이 조금 더 자세했으면 합니다.", createdAt: "2024.06.17", createdTime: "(월) 16:45", isVisible: true,  needsAction: false, agencyName: "퀵케어 서비스", requestId: "AS-20240617-0098", visitDate: "2024.06.17 (월) 14:00", visitTime: "16:00" },
];
 
export default function AgencyReviewPage() {
  const [activeTab, setActiveTab] = useState("전체 리뷰");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailTab, setDetailTab] = useState("기본 정보");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const totalPages = 27;
 
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
            <div className={`arp-stat-card__icon arp-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
            <div>
              <p className="arp-stat-card__label">{s.label}</p>
              <p className="arp-stat-card__value">{s.value}</p>
              <p className={`arp-stat-card__sub arp-stat-card__sub--${s.subType}`}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
 
      {/* 필터 */}
      <div className="arp-filters">
        <div className="arp-filter-date"><span>2024.06.01 ~ 2024.06.18</span></div>
        <div className="arp-filter-select"><span>전체 평점</span><ChevronDown size={13} /></div>
        <div className="arp-filter-select"><span>전체 기사</span><ChevronDown size={13} /></div>
        <div className="arp-filter-select"><span>전체 대행사</span><ChevronDown size={13} /></div>
        <div className="arp-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
        <div className="arp-search">
          <Search size={13} color="#aaa" />
          <input type="text" placeholder="고객명, 기사명, 주문번호 검색" />
        </div>
        <button className="arp-reset-btn"><RefreshCw size={13} /> 필터 초기화</button>
      </div>
 
      <div className="arp-body">
        <div className="arp-left">
          {/* 탭 */}
          <div className="arp-tabs">
            {REVIEW_TABS.map((tab) => (
              <button
                key={tab}
                className={`arp-tab ${activeTab === tab ? "arp-tab--active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
 
          {/* 테이블 헤더 */}
          <div className="arp-table">
            <div className="arp-table__header">
              <span>리뷰 정보</span>
              <span>주문 정보</span>
              <span>평가</span>
              <span>작성일</span>
              <span>관리</span>
            </div>
 
            {reviewList.map((item) => {
              const grade = GRADE_MAP[item.customerGrade];
              const isSelected = selectedItem?.id === item.id;
              return (
                <div key={item.id} className={`arp-table__row ${isSelected ? "arp-table__row--selected" : ""}`}>
                  {/* 리뷰 정보 */}
                  <div className="arp-table__review-col">
                    <div className="arp-table__customer">
                      <Avatar name={item.customerName} size={32} />
                      <div>
                        <span className="arp-table__customer-name">{item.customerName} 고객</span>
                        {grade.label && <span className={`arp-grade-badge arp-grade-badge--${grade.type}`}>{grade.label}</span>}
                      </div>
                    </div>
                    <p className="arp-table__content">{item.content}</p>
                  </div>
 
                  {/* 주문 정보 */}
                  <div className="arp-table__order-col">
                    <span className="arp-table__request-id">{item.reviewId}</span>
                    <span className="arp-table__product">{item.productName} ({item.modelNo})</span>
                   
                  </div>
 
                  {/* 평가 */}
                  <div className="arp-table__rating-col">
                    <StarRow rating={Math.round(item.rating)} />
                    <span className="arp-table__rating-val">{item.rating.toFixed(1)}</span>
                  </div>
 
                  {/* 작성일 */}
                  <div className="arp-table__date-col">
                    <span>{item.createdAt}</span>
                    <span className="arp-table__date-time">{item.createdTime}</span>
                  </div>
 
                  {/* 관리 */}
                  <div className="arp-table__action-col">
                    <button
                      className={`arp-detail-btn ${isSelected ? "arp-detail-btn--active" : ""}`}
                      onClick={() => { setSelectedItem(item); setDetailTab("기본 정보"); }}
                    >
                      상세보기
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
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {[1,2,3,4,5].map(p => (
                <button key={p} className={currentPage === p ? "arp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <span className="arp-pagination__ellipsis">...</span>
              <button className={currentPage === 27 ? "arp-pagination__active" : ""} onClick={() => setCurrentPage(27)}>27</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="arp-page-size">10개씩 보기 <ChevronDown size={13} /></div>
          </div>
        </div>
 
        {/* 우측 상세 패널 */}
        {selectedItem && (
          <aside className="arp-detail">
            <div className="arp-detail__header">
              <span className="arp-detail__title">리뷰 상세 정보</span>
              <button className="arp-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
            </div>
 
            {/* 고객 프로필 */}
            <div className="arp-detail__profile">
              <Avatar name={selectedItem.customerName} size={44} />
              <div>
                <div className="arp-detail__profile-name">
                  {selectedItem.customerName} 고객
                  {GRADE_MAP[selectedItem.customerGrade].label && (
                    <span className={`arp-grade-badge arp-grade-badge--${GRADE_MAP[selectedItem.customerGrade].type}`}>
                      {GRADE_MAP[selectedItem.customerGrade].label}
                    </span>
                  )}
                </div>
                <p className="arp-detail__profile-id">CUST-20240618-{String(selectedItem.id).padStart(4, "0")}</p>
              </div>
            </div>
 
            {/* 탭 */}
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
                  {/* 주문 정보 */}
                  <div className="arp-detail__section">
                    <div className="arp-detail__row"><span className="arp-detail__label">주문 번호</span><span className="arp-detail__value arp-detail__value--id">{selectedItem.requestId}</span></div>
                    <div className="arp-detail__row"><span className="arp-detail__label">가전 제품</span><span className="arp-detail__value">{selectedItem.productName} ({selectedItem.modelNo})</span></div>
                    <div className="arp-detail__row"><span className="arp-detail__label">접수일</span><span className="arp-detail__value">{selectedItem.createdAt} {selectedItem.createdTime}</span></div>
                    <div className="arp-detail__row"><span className="arp-detail__label">방문일</span><span className="arp-detail__value">{selectedItem.visitDate}</span></div>
                    <div className="arp-detail__row"><span className="arp-detail__label">담당 기사</span><span className="arp-detail__value">{selectedItem.engineerName} ({selectedItem.engineerId})</span></div>
                    <div className="arp-detail__row"><span className="arp-detail__label">대행사</span><span className="arp-detail__value">{selectedItem.agencyName}</span></div>
                  </div>
 
                  {/* 평가 점수 */}
                  <div className="arp-detail__section">
                    <p className="arp-detail__section-label">평가 점수</p>
                    <div className="arp-detail__score-row">
                      <span className="arp-detail__score-label">평균 평점</span>
                      <div className="arp-detail__score-right">
                        <ScoreStars score={Math.round(selectedItem.rating)} />
                        <span className="arp-detail__score-val">{selectedItem.rating.toFixed(1)} / 5.0</span>
                      </div>
                    </div>
                  </div>
 
                  {/* 리뷰 내용 - reviews.content */}
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
                <div className="arp-detail__coming-soon">
                  관리 이력 — API 연동 후 구현
                </div>
              )}
            </div>
 
          </aside>
        )}
      </div>
    </div>
  );
}