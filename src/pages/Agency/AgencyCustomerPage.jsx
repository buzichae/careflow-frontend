import { useState, useEffect, useCallback } from "react";
import {
  Users, UserCheck, UserX, UserPlus,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, MoreVertical, RefreshCw, X,
  Phone, Mail, Pencil, Lock, Ban,
} from "lucide-react";
import {
  getAgencyCustomers,
  getAgencyCustomerAppliances,
  getAgencyCustomerAsRequests,
  getAgencyCustomerPayments,
} from "../../apis/agencyCustomers";
import "../../styles/Agency/AgencyCustomerPage.css";

// 등급은 백엔드 DB 미지원 필드 — 항상 UNKNOWN으로 표시(추후 컬럼 추가 시 연동)
const GRADE_MAP = {
  VIP:    { label: "VIP",    icon: "👑" },
  GOLD:   { label: "GOLD",   icon: "⭐⭐⭐" },
  SILVER: { label: "SILVER", icon: "⭐⭐" },
  BRONZE: { label: "BRONZE", icon: "⭐" },
  NORMAL: { label: "NORMAL", icon: "" },
  UNKNOWN:{ label: "-",      icon: "" },
};

const STATUS_MAP = {
  ACTIVE:    { label: "활성",   type: "active"    },
  INACTIVE:  { label: "비활성", type: "inactive"  },
  SUSPENDED: { label: "휴면",   type: "suspended" },
};

const STATUS_OPTIONS = [
  { value: "", label: "활동 상태 전체" },
  { value: "ACTIVE", label: "활성" },
  { value: "INACTIVE", label: "비활성" },
  { value: "SUSPENDED", label: "휴면" },
];

const PAGE_SIZE = 10;
const DETAIL_TABS = ["기본 정보", "가전 정보", "A/S 이력", "결제 내역"];

// 고객 ID 포맷
function formatCustomerId(id) {
  return `CUST-${String(id).padStart(6, "0")}`;
}

// ISO LocalDateTime → "yyyy.MM.dd" / "yyyy.MM.dd HH:mm"
function formatDate(iso) {
  if (!iso) return "-";
  return iso.slice(0, 10).replaceAll("-", ".");
}
function formatDateTime(iso) {
  if (!iso) return "-";
  const [date, time] = iso.split("T");
  return `${date.replaceAll("-", ".")} ${time?.slice(0, 5) ?? ""}`;
}

function Avatar({ name, size = 40 }) {
  return (
    <div className="acp-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

export default function AgencyCustomerPage() {
  const [currentPage, setCurrentPage] = useState(1); // UI는 1-base, API는 0-base
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState(null);
  const [customerList, setCustomerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedItem, setSelectedItem] = useState(null);
  const [detailTab, setDetailTab] = useState("기본 정보");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 탭별 상세 데이터 (가전/A·S이력/결제내역)
  const [appliances, setAppliances] = useState([]);
  const [asRequests, setAsRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAgencyCustomers({
        page: currentPage - 1,
        size: PAGE_SIZE,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      });
      setCustomerList(res.data.content);
      setStats(res.data.stats);
      setTotalPages(Math.max(1, res.data.totalPages));
      setTotalElements(res.data.totalElements);
    } catch {
      setError("고객 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, keyword, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function handleSearch() {
    setCurrentPage(1);
    setKeyword(keywordInput);
  }

  function handleResetFilters() {
    setKeywordInput("");
    setKeyword("");
    setStatusFilter("");
    setCurrentPage(1);
  }

  function selectCustomer(item) {
    setSelectedItem(item);
    setDetailTab("기본 정보");
    setAppliances([]);
    setAsRequests([]);
    setPayments([]);
    setDetailError(null);
  }

  // 상세 패널 탭 전환 시 필요한 데이터를 그때그때 불러온다
  useEffect(() => {
    if (!selectedItem) return;

    async function fetchDetailTab() {
      try {
        setDetailLoading(true);
        setDetailError(null);
        if (detailTab === "가전 정보" && appliances.length === 0) {
          const res = await getAgencyCustomerAppliances(selectedItem.userId);
          setAppliances(res.data);
        } else if (detailTab === "A/S 이력" && asRequests.length === 0) {
          const res = await getAgencyCustomerAsRequests(selectedItem.userId);
          setAsRequests(res.data);
        } else if (detailTab === "결제 내역" && payments.length === 0) {
          const res = await getAgencyCustomerPayments(selectedItem.userId);
          setPayments(res.data);
        }
      } catch {
        setDetailError("정보를 불러오지 못했습니다.");
      } finally {
        setDetailLoading(false);
      }
    }

    fetchDetailTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem, detailTab]);

  const statCards = stats ? [
    { label: "전체 고객", value: stats.totalCount.toLocaleString(), sub: `전월 대비 ${stats.prevMonthDiff >= 0 ? "+" : ""}${stats.prevMonthDiff}명`, subType: "up", icon: Users, color: "purple" },
    { label: "활성 고객", value: stats.activeCount.toLocaleString(), sub: stats.totalCount ? `${((stats.activeCount / stats.totalCount) * 100).toFixed(1)}%` : "0%", subType: "neutral", icon: UserCheck, color: "green" },
    { label: "비활성 고객", value: stats.inactiveCount.toLocaleString(), sub: stats.totalCount ? `${((stats.inactiveCount / stats.totalCount) * 100).toFixed(1)}%` : "0%", subType: "neutral", icon: UserX, color: "orange" },
    { label: "신규 고객 (이번 달)", value: stats.newThisMonth.toLocaleString(), sub: `전월 대비 ${stats.newThisMonthDiff >= 0 ? "+" : ""}${stats.newThisMonthDiff}명`, subType: "up", icon: UserPlus, color: "blue" },
  ] : [];

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
          <input
            type="text"
            placeholder="이름, 연락처, 이메일 검색"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          />
        </div>

        <select
          className="acp-filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button className="acp-reset-btn" onClick={handleResetFilters}><RefreshCw size={13} /> 필터 초기화</button>
        <button className="acp-register-btn" onClick={handleSearch}><Search size={14} /> 검색</button>
      </div>

      <div className="acp-body">
        <div className="acp-left">
          <div className="acp-table-meta">
            {loading ? "불러오는 중..." : error ? error : `전체 ${totalElements.toLocaleString()}명`}
          </div>

          <div className="acp-table">
            <div className="acp-table__header">
              <span><input type="checkbox" /></span>
              <span>고객 ID</span>
              <span>이름</span>
              <span>연락처</span>
              <span>이메일</span>
              <span>가입일</span>
              <span>활동 상태</span>
              <span>등록 가전 수</span>
              <span>최근 활동일</span>
              <span>관리</span>
            </div>

            {customerList.map((item) => {
              const status = STATUS_MAP[item.status] ?? STATUS_MAP.ACTIVE;
              const grade = GRADE_MAP[item.grade] ?? GRADE_MAP.UNKNOWN;
              const isSelected = selectedItem?.userId === item.userId;

              return (
                <div key={item.userId} className={`acp-table__row ${isSelected ? "acp-table__row--selected" : ""}`}>
                  <span><input type="checkbox" /></span>
                  <span className="acp-table__id">{formatCustomerId(item.userId)}</span>
                  <span className="acp-table__name">{item.name}</span>
                  <span className="acp-table__phone">{item.phone}</span>
                  <span className="acp-table__email">{item.email}</span>
                  <span className="acp-table__joined">{formatDate(item.joinedAt)}</span>
                  <span>
                    <span className={`acp-status-badge acp-status-badge--${status.type}`}>{status.label}</span>
                  </span>

                  <span className="acp-table__count">{item.applianceCount}대</span>
                  <span className="acp-table__active">{formatDate(item.lastLoginAt)}</span>
                  <span className="acp-table__actions">
                    <button
                      className={`acp-detail-btn ${isSelected ? "acp-detail-btn--active" : ""}`}
                      onClick={() => selectCustomer(item)}
                    >
                      상세
                    </button>
                    <button className="acp-more-btn"><MoreVertical size={14} /></button>
                  </span>
                </div>
              );
            })}

            {!loading && customerList.length === 0 && (
              <div className="acp-detail__coming-soon">조회된 고객이 없습니다.</div>
            )}
          </div>

          {/* 페이지네이션 */}
          <div className="acp-pagination">
            <div className="acp-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} className={currentPage === p ? "acp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="acp-page-size">{PAGE_SIZE}개씩 보기 <ChevronDown size={13} /></div>
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
                  <span className={`acp-status-badge acp-status-badge--${(STATUS_MAP[selectedItem.status] ?? STATUS_MAP.ACTIVE).type}`}>
                    {(STATUS_MAP[selectedItem.status] ?? STATUS_MAP.ACTIVE).label}
                  </span>
                </div>
                <p className="acp-detail__profile-id">{formatCustomerId(selectedItem.userId)}</p>
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

                  <div className="acp-detail__info-row"><span className="acp-detail__label">주소</span><span className="acp-detail__value">{selectedItem.address || "-"}</span></div>
                  <div className="acp-detail__info-row"><span className="acp-detail__label">가입일</span><span className="acp-detail__value">{formatDate(selectedItem.joinedAt)}</span></div>
                  <div className="acp-detail__info-row"><span className="acp-detail__label">가입 경로</span><span className="acp-detail__value">{selectedItem.joinPath || "-"}</span></div>
                  <div className="acp-detail__info-row">
                    <span className="acp-detail__label">고객 등급</span>
                    <span className="acp-grade-badge acp-grade-badge--normal">
                      {(GRADE_MAP[selectedItem.grade] ?? GRADE_MAP.UNKNOWN).label} {(GRADE_MAP[selectedItem.grade] ?? GRADE_MAP.UNKNOWN).icon}
                    </span>
                  </div>
                  <div className="acp-detail__info-row">
                    <span className="acp-detail__label">활동 상태</span>
                    <span className={`acp-status-badge acp-status-badge--${(STATUS_MAP[selectedItem.status] ?? STATUS_MAP.ACTIVE).type}`}>
                      {(STATUS_MAP[selectedItem.status] ?? STATUS_MAP.ACTIVE).label}
                    </span>
                  </div>

                  <div className="acp-detail__info-row"><span className="acp-detail__label">최근 로그인</span><span className="acp-detail__value">{formatDateTime(selectedItem.lastLoginAt)}</span></div>


                  {/* 관리 버튼 (추후 API 연동 예정) */}
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
                <div>
                  {detailLoading && <p className="acp-detail__memo-empty">불러오는 중...</p>}
                  {!detailLoading && detailError && <p className="acp-detail__memo-empty">{detailError}</p>}
                  {!detailLoading && !detailError && appliances.length === 0 && (
                    <p className="acp-detail__memo-empty">등록된 가전이 없습니다.</p>
                  )}
                  {!detailLoading && !detailError && appliances.map((a) => (
                    <div key={a.applianceId} className="acp-detail__memo-box" style={{ marginBottom: 8 }}>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">카테고리</span><span className="acp-detail__value">{a.categoryName}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">브랜드/모델</span><span className="acp-detail__value">{a.brand} {a.modelName}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">시리얼</span><span className="acp-detail__value">{a.serialNumber || "-"}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">구매일</span><span className="acp-detail__value">{a.purchaseDate ?? "-"}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">보증 만료일</span><span className="acp-detail__value">{a.warrantyEndDate ?? "-"}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">상태</span><span className="acp-detail__value">{a.status}</span></div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === "A/S 이력" && (
                <div>
                  {detailLoading && <p className="acp-detail__memo-empty">불러오는 중...</p>}
                  {!detailLoading && detailError && <p className="acp-detail__memo-empty">{detailError}</p>}
                  {!detailLoading && !detailError && asRequests.length === 0 && (
                    <p className="acp-detail__memo-empty">A/S 이력이 없습니다.</p>
                  )}
                  {!detailLoading && !detailError && asRequests.map((r) => (
                    <div key={r.requestId} className="acp-detail__memo-box" style={{ marginBottom: 8 }}>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">가전</span><span className="acp-detail__value">{r.applianceBrand} {r.applianceModelName}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">증상</span><span className="acp-detail__value">{r.symptomName}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">방문지</span><span className="acp-detail__value">{r.visitAddress}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">방문 일정</span><span className="acp-detail__value">{r.scheduledDate} {r.scheduledTime}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">상태</span><span className="acp-detail__value">{r.status}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">접수일</span><span className="acp-detail__value">{formatDateTime(r.createdAt)}</span></div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === "결제 내역" && (

                <div>
                  {detailLoading && <p className="acp-detail__memo-empty">불러오는 중...</p>}
                  {!detailLoading && detailError && <p className="acp-detail__memo-empty">{detailError}</p>}
                  {!detailLoading && !detailError && payments.length === 0 && (
                    <p className="acp-detail__memo-empty">결제 내역이 없습니다.</p>
                  )}
                  {!detailLoading && !detailError && payments.map((p) => (
                    <div key={p.paymentId} className="acp-detail__memo-box" style={{ marginBottom: 8 }}>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">가전</span><span className="acp-detail__value">{p.applianceBrand} {p.applianceModelName}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">결제금액</span><span className="acp-detail__value">{p.amount.toLocaleString()}원</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">PG사</span><span className="acp-detail__value">{p.pgProvider}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">상태</span><span className="acp-detail__value">{p.status}</span></div>
                      <div className="acp-detail__info-row"><span className="acp-detail__label">결제일</span><span className="acp-detail__value">{formatDateTime(p.paidAt)}</span></div>
                    </div>
                  ))}

                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
