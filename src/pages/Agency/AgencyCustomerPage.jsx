import { useState } from "react";
import {
  Users, UserCheck, UserX, UserPlus,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, MoreVertical, RefreshCw, X,
  Phone, Mail, Pencil, Lock, Ban,
} from "lucide-react";
import "../../styles/Agency/AgencyCustomerPage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/agency/customers?page=0&size=10
// 해당 대행사에 수리 이력이 있는 고객만 조회
//
// users WHERE user_id IN (
//   SELECT DISTINCT customer_id FROM as_requests
//   WHERE agency_id = 로그인대행사.agency_id
// )
// + appliances COUNT (applianceCount)
//
// 응답 필드:
//   userId, name, phone, email (users)
//   regionId → regions.name + address_detail → 주소 합산 표시
//   status (users.status ENUM: ACTIVE/INACTIVE/SUSPENDED)
//   lastLoginAt (users.last_login_at)
//   createdAt (users.created_at) → joinedAt
//   grade: 백엔드 산정 (as_requests 건수/payments 합산)
//   joinPath: DB 없음 → password_hash=NULL이면 소셜 로그인
// ──────────────────────────────────────────

const statCards = [
  { label: "전체 고객",           value: "12,458", sub: "전월 대비 +425명", subType: "up",      icon: Users,     color: "purple" },
  { label: "활성 고객",           value: "8,756",  sub: "70.3%",            subType: "neutral", icon: UserCheck, color: "green"  },
  { label: "비활성 고객",         value: "3,702",  sub: "29.7%",            subType: "neutral", icon: UserX,     color: "orange" },
  { label: "신규 고객 (이번 달)", value: "568",    sub: "전월 대비 +68명",  subType: "up",      icon: UserPlus,  color: "blue"   },
];

const GRADE_MAP = {
  VIP:    { label: "VIP",    stars: 5, type: "vip",    icon: "👑" },
  GOLD:   { label: "GOLD",   stars: 4, type: "gold",   icon: "⭐⭐⭐" },
  SILVER: { label: "SILVER", stars: 3, type: "silver", icon: "⭐⭐" },
  BRONZE: { label: "BRONZE", stars: 2, type: "bronze", icon: "⭐" },
  NORMAL: { label: "NORMAL", stars: 1, type: "normal", icon: "" },
};

const STATUS_MAP = {
  ACTIVE:   { label: "활성", type: "active"   },
  INACTIVE: { label: "비활성", type: "inactive" },
  SUSPENDED:{ label: "휴면", type: "suspended" },
};

// 고객 ID 포맷
function formatCustomerId(id) {
  return `CUST-20240618-${String(id).padStart(4, "0")}`;
}

// ──────────────────────────────────────────
// 더미 데이터 - 해당 대행사 수리 이력 있는 고객만
// as_requests WHERE agency_id = 로그인대행사 → customer_id 기준 필터
// ──────────────────────────────────────────
const customerList = [
  { id: 1,  name: "김민수", phone: "010-1234-5678", email: "kimms@email.com", joinedAt: "2024.06.18", status: "ACTIVE",    grade: "VIP",    applianceCount: 5, lastLoginAt: "2024.06.18", address: "서울특별시 강남구 테헤란로 123", joinPath: "모바일 앱",  memo: "VIP 고객, 에어컨 정기점검 서비스 이용 중.", memoWriter: "관리자", memoAt: "2024.06.10 09:15" },
  { id: 2,  name: "박지영", phone: "010-2345-6789", email: "parkjy@email.com", joinedAt: "2024.06.17", status: "ACTIVE",    grade: "GOLD",   applianceCount: 3, lastLoginAt: "2024.06.17", address: "서울특별시 서초구 반포대로 45",  joinPath: "웹사이트",   memo: null, memoWriter: null, memoAt: null },
  { id: 3,  name: "이준호", phone: "010-3456-7890", email: "leejh@email.com",  joinedAt: "2024.06.16", status: "ACTIVE",    grade: "SILVER", applianceCount: 2, lastLoginAt: "2024.06.16", address: "서울특별시 송파구 올림픽로 100", joinPath: "모바일 앱",  memo: null, memoWriter: null, memoAt: null },
  { id: 4,  name: "최유진", phone: "010-4567-8901", email: "choiuj@email.com", joinedAt: "2024.06.15", status: "INACTIVE",  grade: "SILVER", applianceCount: 1, lastLoginAt: "2024.06.10", address: "경기도 성남시 분당구 판교로 20",  joinPath: "카카오",     memo: null, memoWriter: null, memoAt: null },
  { id: 5,  name: "정우성", phone: "010-5678-9012", email: "jungws@email.com", joinedAt: "2024.06.15", status: "ACTIVE",    grade: "BRONZE", applianceCount: 1, lastLoginAt: "2024.06.15", address: "인천광역시 남동구 구월로 50",    joinPath: "웹사이트",   memo: null, memoWriter: null, memoAt: null },
  { id: 6,  name: "한소연", phone: "010-6789-0123", email: "hansy@email.com",  joinedAt: "2024.06.14", status: "SUSPENDED", grade: "BRONZE", applianceCount: 2, lastLoginAt: "2024.05.20", address: "부산광역시 해운대구 해운대로 30",  joinPath: "모바일 앱",  memo: null, memoWriter: null, memoAt: null },
  { id: 7,  name: "강태민", phone: "010-7890-1234", email: "kangtm@email.com", joinedAt: "2024.06.14", status: "ACTIVE",    grade: "NORMAL", applianceCount: 1, lastLoginAt: "2024.06.14", address: "대구광역시 수성구 동대구로 10",   joinPath: "웹사이트",   memo: null, memoWriter: null, memoAt: null },
  { id: 8,  name: "임세은", phone: "010-8901-2345", email: "limse@email.com",  joinedAt: "2024.06.13", status: "INACTIVE",  grade: "NORMAL", applianceCount: 1, lastLoginAt: "2024.06.05", address: "광주광역시 북구 첨단과기로 5",    joinPath: "카카오",     memo: null, memoWriter: null, memoAt: null },
  { id: 9,  name: "오현우", phone: "010-9012-3456", email: "ohhw@email.com",   joinedAt: "2024.06.13", status: "SUSPENDED", grade: "NORMAL", applianceCount: 2, lastLoginAt: "2024.05.18", address: "울산광역시 남구 삼산로 20",       joinPath: "모바일 앱",  memo: null, memoWriter: null, memoAt: null },
  { id: 10, name: "윤지은", phone: "010-0123-4567", email: "yje@email.com",    joinedAt: "2024.06.12", status: "ACTIVE",    grade: "NORMAL", applianceCount: 2, lastLoginAt: "2024.06.12", address: "경기도 수원시 영통구 광교로 15",  joinPath: "웹사이트",   memo: null, memoWriter: null, memoAt: null },
];

const DETAIL_TABS = ["기본 정보", "가전 정보", "A/S 이력", "결제 내역"];

function Avatar({ name, size = 40 }) {
  return (
    <div className="acp-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

export default function AgencyCustomerPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailTab, setDetailTab] = useState("기본 정보");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const totalPages = 125;

  return (
    <div className="acp">
      {/* 헤더 */}
      <div className="acp-header">
        <div>
          <h1 className="acp-header__title">고객 관리</h1>
          <p className="acp-header__sub">고객 정보를 조회하고 관리할 수 있습니다.</p>
        </div>
        <div className="acp-refresh-bar">
          <span className="acp-refresh-label">자동 갱신</span>
          <div className={`acp-toggle ${autoRefresh ? "acp-toggle--on" : ""}`} onClick={() => setAutoRefresh(p => !p)}>
            <div className="acp-toggle__thumb" />
          </div>
          <div className="acp-refresh-select">30초 <ChevronDown size={13} /></div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="acp-stats">
        {statCards.map((s) => (
          <div key={s.label} className="acp-stat-card">
            <div className={`acp-stat-card__icon acp-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
            <div>
              <p className="acp-stat-card__label">{s.label}</p>
              <p className="acp-stat-card__value">{s.value}<span>명</span></p>
              <p className={`acp-stat-card__sub acp-stat-card__sub--${s.subType}`}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="acp-filters">
        <div className="acp-search">
          <Search size={13} color="#aaa" />
          <input type="text" placeholder="이름, 연락처, 이메일 검색" />
        </div>
        <div className="acp-filter-select"><span>가입 경로 전체</span><ChevronDown size={13} /></div>
        <div className="acp-filter-select"><span>활동 상태 전체</span><ChevronDown size={13} /></div>
        <div className="acp-filter-select"><span>고객 등급 전체</span><ChevronDown size={13} /></div>
        <div className="acp-filter-select"><span>가입 기간</span><ChevronDown size={13} /></div>
        <div className="acp-filter-date">
          <span>2024.05.01</span>
          <span className="acp-filter-date__sep">~</span>
          <span>2024.06.18</span>
        </div>
        <button className="acp-reset-btn"><RefreshCw size={13} /> 필터 초기화</button>
        <button className="acp-register-btn"><UserPlus size={14} /> 고객 등록</button>
      </div>

      <div className="acp-body">
        <div className="acp-left">
          <div className="acp-table-meta">전체 12,458명</div>

          <div className="acp-table">
            <div className="acp-table__header">
              <span><input type="checkbox" /></span>
              <span>고객 ID</span>
              <span>이름</span>
              <span>연락처</span>
              <span>이메일</span>
              <span>가입일</span>
              <span>활동 상태</span>
              <span>고객 등급</span>
              <span>등록 가전 수</span>
              <span>최근 활동일</span>
              <span>관리</span>
            </div>

            {customerList.map((item) => {
              const status = STATUS_MAP[item.status];
              const grade = GRADE_MAP[item.grade];
              const isSelected = selectedItem?.id === item.id;
              return (
                <div key={item.id} className={`acp-table__row ${isSelected ? "acp-table__row--selected" : ""}`}>
                  <span><input type="checkbox" /></span>
                  <span className="acp-table__id">{formatCustomerId(item.id)}</span>
                  <span className="acp-table__name">{item.name}</span>
                  <span className="acp-table__phone">{item.phone}</span>
                  <span className="acp-table__email">{item.email}</span>
                  <span className="acp-table__joined">{item.joinedAt}</span>
                  <span>
                    <span className={`acp-status-badge acp-status-badge--${status.type}`}>{status.label}</span>
                  </span>
                  <span>
                    <span className={`acp-grade-badge acp-grade-badge--${grade.type}`}>
                      {grade.label} {grade.icon}
                    </span>
                  </span>
                  <span className="acp-table__count">{item.applianceCount}대</span>
                  <span className="acp-table__active">{item.lastLoginAt}</span>
                  <span className="acp-table__actions">
                    <button
                      className={`acp-detail-btn ${isSelected ? "acp-detail-btn--active" : ""}`}
                      onClick={() => { setSelectedItem(item); setDetailTab("기본 정보"); }}
                    >
                      상세
                    </button>
                    <button className="acp-more-btn"><MoreVertical size={14} /></button>
                  </span>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          <div className="acp-pagination">
            <div className="acp-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {[1,2,3,4,5].map(p => (
                <button key={p} className={currentPage === p ? "acp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <span className="acp-pagination__ellipsis">...</span>
              <button className={currentPage === 125 ? "acp-pagination__active" : ""} onClick={() => setCurrentPage(125)}>125</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="acp-page-size">10개씩 보기 <ChevronDown size={13} /></div>
          </div>
        </div>

        {/* 우측 상세 패널 */}
        {selectedItem && (
          <aside className="acp-detail">
            <div className="acp-detail__header">
              <span className="acp-detail__title">고객 상세 정보</span>
              <button className="acp-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
            </div>

            {/* 프로필 */}
            <div className="acp-detail__profile">
              <Avatar name={selectedItem.name} size={44} />
              <div>
                <div className="acp-detail__profile-name">
                  {selectedItem.name}
                  <span className={`acp-status-badge acp-status-badge--${STATUS_MAP[selectedItem.status].type}`}>
                    {STATUS_MAP[selectedItem.status].label}
                  </span>
                </div>
                <p className="acp-detail__profile-id">{formatCustomerId(selectedItem.id)}</p>
              </div>
            </div>

            {/* 탭 */}
            <div className="acp-detail__tabs">
              {DETAIL_TABS.map((tab) => (
                <button
                  key={tab}
                  className={`acp-detail__tab ${detailTab === tab ? "acp-detail__tab--active" : ""}`}
                  onClick={() => setDetailTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="acp-detail__body">
              {detailTab === "기본 정보" && (
                <div>
                  <div className="acp-detail__info-row"><span className="acp-detail__label">연락처</span><span className="acp-detail__value">{selectedItem.phone} <Phone size={11} /></span></div>
                  <div className="acp-detail__info-row"><span className="acp-detail__label">이메일</span><span className="acp-detail__value">{selectedItem.email} <Mail size={11} /></span></div>
                  <div className="acp-detail__info-row"><span className="acp-detail__label">주소</span><span className="acp-detail__value">{selectedItem.address}</span></div>
                  <div className="acp-detail__info-row"><span className="acp-detail__label">가입일</span><span className="acp-detail__value">{selectedItem.joinedAt}</span></div>
                  <div className="acp-detail__info-row"><span className="acp-detail__label">가입 경로</span><span className="acp-detail__value">{selectedItem.joinPath}</span></div>
                  <div className="acp-detail__info-row">
                    <span className="acp-detail__label">고객 등급</span>
                    <span className={`acp-grade-badge acp-grade-badge--${GRADE_MAP[selectedItem.grade].type}`}>
                      {GRADE_MAP[selectedItem.grade].label} {GRADE_MAP[selectedItem.grade].icon}
                    </span>
                  </div>
                  <div className="acp-detail__info-row">
                    <span className="acp-detail__label">활동 상태</span>
                    <span className={`acp-status-badge acp-status-badge--${STATUS_MAP[selectedItem.status].type}`}>
                      {STATUS_MAP[selectedItem.status].label}
                    </span>
                  </div>
                  <div className="acp-detail__info-row"><span className="acp-detail__label">최근 로그인</span><span className="acp-detail__value">{selectedItem.lastLoginAt} 14:30</span></div>

                  {/* 메모 */}
                  <div className="acp-detail__memo-section">
                    <p className="acp-detail__section-label">메모</p>
                    <div className="acp-detail__memo-box">
                      {selectedItem.memo
                        ? <>
                            <p className="acp-detail__memo-text">{selectedItem.memo}</p>
                            <p className="acp-detail__memo-meta">작성자 {selectedItem.memoWriter} · {selectedItem.memoAt}</p>
                          </>
                        : <p className="acp-detail__memo-empty">메모가 없습니다.</p>
                      }
                      <button className="acp-detail__memo-edit"><Pencil size={11} /></button>
                    </div>
                  </div>

                  {/* 관리 버튼 */}
                  <div className="acp-detail__manage-section">
                    <p className="acp-detail__section-label">관리</p>
                    <div className="acp-detail__manage-btns">
                      <button className="acp-manage-btn acp-manage-btn--edit"><Pencil size={12} /> 수정</button>
                      <button className="acp-manage-btn acp-manage-btn--reset"><Lock size={12} /> 비밀번호 초기화</button>
                      <button className="acp-manage-btn acp-manage-btn--ban"><Ban size={12} /> 고객 차단</button>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "가전 정보" && (
                <div className="acp-detail__coming-soon">
                  가전 정보 탭 — API 연동 후 구현<br />
                  <span>GET /api/agency/customers/{"{userId}"}/appliances</span>
                </div>
              )}
              {detailTab === "A/S 이력" && (
                <div className="acp-detail__coming-soon">
                  A/S 이력 탭 — API 연동 후 구현<br />
                  <span>GET /api/agency/customers/{"{userId}"}/as-requests</span>
                </div>
              )}
              {detailTab === "결제 내역" && (
                <div className="acp-detail__coming-soon">
                  결제 내역 탭 — API 연동 후 구현<br />
                  <span>GET /api/agency/customers/{"{userId}"}/payments</span>
                </div>
              )}
            
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}