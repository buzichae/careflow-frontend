import { useState, useEffect, useCallback } from "react";
import {
  Wallet, CheckCircle, Clock, Lock, FileText,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, X, Download, Building2,
} from "lucide-react";
import "../../styles/Agency/Agencysettlementpage.css";
import {
  getAgencySettlements,
  updateSettlementStatus,
  downloadMonthlySettlementCsv,
} from "../../apis/agencySettlement";

// 백엔드 status 값 → UI 레이블/스타일 매핑 ([DDL v11] APPROVED 상태 제거됨)
const STATUS_MAP = {
  PAID:     { label: "지급 완료", type: "success"  },
  PENDING:  { label: "지급 대기", type: "ready"    },
  DISPUTED: { label: "보류",     type: "hold"     },
};

const TYPE_MAP = {
  ENGINEER: { label: "기사", type: "engineer" },
  AGENCY:   { label: "대행사", type: "agency" },
};

// 탭 → API status 파라미터 매핑
const TAB_STATUS_MAP = {
  "전체":     null,
  "지급 대기": "PENDING",
  "지급 완료": "PAID",
  "보류":     "DISPUTED",
};

const SETTLEMENT_TABS = ["전체", "지급 대기", "지급 완료", "보류"];

const PAGE_SIZE = 10;

// 정산 ID 포맷
function formatSettlementId(id) {
  return `ST-${String(id).padStart(8, "0")}`;
}

// 금액 포맷 (원화)
function formatAmount(amount) {
  return `${Number(amount ?? 0).toLocaleString()}원`;
}

// settledAt(LocalDateTime) → 날짜 문자열
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return dateStr.replace("T", " ").slice(0, 16);
}

function Avatar({ name, size = 32 }) {
  return (
    <div className="asp-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

/* =========================================================
   정산 상세 모달
========================================================= */
function SettlementDetailModal({ item, onClose, onStatusChange }) {
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!item) return null;

  const status = STATUS_MAP[item.status] ?? { label: item.status, type: "ready" };
  const type   = TYPE_MAP[item.type]     ?? { label: item.type,   type: "engineer" };

  return (
    <div className="asp-modal-overlay" onClick={onClose}>
      <div className="asp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="asp-modal__header">
          <span className="asp-modal__title">정산 상세 정보</span>
          <div className="asp-modal__header-right">
            <span className={`asp-type-badge asp-type-badge--${type.type}`}>{type.label}</span>
            <span className={`asp-status-badge asp-status-badge--${status.type}`}>{status.label}</span>
            <button className="asp-modal__close" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="asp-modal__body">
          {/* 정산 ID */}
          <p className="asp-modal__id">{formatSettlementId(item.settlementId)}</p>

          {/* 기사/대행사 프로필 */}
          <div className="asp-modal__profile">
            {item.type === "ENGINEER"
              ? <Avatar name={item.engineerName} size={44} />
              : <div className="asp-modal__agency-icon"><Building2 size={20} /></div>
            }
            <div>
              <p className="asp-modal__profile-name">{item.engineerName ?? "-"}</p>
              {item.engineerId != null && (
                <p className="asp-modal__profile-sub">ENG-{String(item.engineerId).padStart(5, "0")}</p>
              )}
              {item.engineerPhone && <p className="asp-modal__profile-phone">{item.engineerPhone}</p>}
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="asp-modal__section">
            <div className="asp-modal__row"><span className="asp-modal__label">기준 기간</span><span className="asp-modal__value">{item.periodStart} ~ {item.periodEnd}</span></div>
            <div className="asp-modal__row"><span className="asp-modal__label">정산일</span><span className="asp-modal__value">{formatDate(item.settledAt)}</span></div>
            <div className="asp-modal__row"><span className="asp-modal__label">완료 건수</span><span className="asp-modal__value">{item.completedCount}건</span></div>
            <div className="asp-modal__row"><span className="asp-modal__label">총 정산 금액</span><span className="asp-modal__value asp-modal__value--amount">{formatAmount(item.grossAmount)}</span></div>
          </div>

          {/* 금액 상세 */}
          <div className="asp-modal__section">
            <p className="asp-modal__section-label">금액 상세</p>
            <div className="asp-modal__amount-box">
              <div className="asp-modal__amount-row">
                <span>총 정산 금액</span>
                <span>{formatAmount(item.grossAmount)}</span>
              </div>
              <div className="asp-modal__amount-row asp-modal__amount-row--fee">
                <span>CareFlow 수수료 ({Number(item.platformFeeRate)}%)</span>
                <span>-{formatAmount(item.platformFee)}</span>
              </div>
              <div className="asp-modal__amount-row asp-modal__amount-row--fee">
                <span>대행사 수수료 ({Number(item.agencyFeeRate)}%)</span>
                <span>-{item.agencyFee ? formatAmount(item.agencyFee) : "-"}</span>
              </div>
              <div className="asp-modal__amount-divider" />
              <div className="asp-modal__amount-row asp-modal__amount-row--net">
                <span>실 지급액</span>
                <span className="asp-modal__net-amount">
                  {item.engineerNetAmount ? formatAmount(item.engineerNetAmount) : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* 연결된 대행사 */}
          {item.type === "ENGINEER" && item.agencyName && (
            <div className="asp-modal__section">
              <p className="asp-modal__section-label">연결된 대행사</p>
              <div className="asp-modal__agency-card">
                <div className="asp-modal__agency-icon--sm"><Building2 size={14} /></div>
                <div>
                  <p className="asp-modal__agency-name">{item.agencyName}</p>
                  <p className="asp-modal__agency-rate">수수료율 {Number(item.agencyFeeRate)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* 지급 정보 */}
          <div className="asp-modal__section">
            <p className="asp-modal__section-label">지급 정보</p>
            <div className="asp-modal__row"><span className="asp-modal__label">지급 방식</span><span className="asp-modal__value">{item.payMethod ?? "-"}</span></div>
            <div className="asp-modal__row"><span className="asp-modal__label">지급 계좌</span><span className="asp-modal__value">{item.bankAccount ?? "-"}</span></div>
            <div className="asp-modal__row"><span className="asp-modal__label">지급 상태</span><span className={`asp-status-badge asp-status-badge--${status.type}`}>{status.label}</span></div>
            {item.settledAt && (
              <div className="asp-modal__row"><span className="asp-modal__label">지급일</span><span className="asp-modal__value">{formatDate(item.settledAt)}</span></div>
            )}
          </div>

          {/* 승인 처리 — [DDL v11] APPROVED 제거: PENDING↔DISPUTED 자유, 둘 다 PAID로 바로 전이 가능 */}
          <div className="asp-modal__section">
            <p className="asp-modal__section-label">지급 처리</p>
            {item.status === "PAID" && (
              <div className="asp-modal__locked"><Lock size={13} /> 지급이 완료된 건입니다</div>
            )}
            {item.status === "PENDING" && (
              <div className="asp-modal__action-row">
                <button className="asp-action-btn asp-action-btn--paid" onClick={() => onStatusChange(item.settlementId, "PAID")}>지급 처리</button>
                <button className="asp-action-btn asp-action-btn--dispute" onClick={() => onStatusChange(item.settlementId, "DISPUTED")}>보류</button>
              </div>
            )}
            {item.status === "DISPUTED" && (
              <div className="asp-modal__action-row">
                <button className="asp-action-btn asp-action-btn--paid" onClick={() => onStatusChange(item.settlementId, "PAID")}>지급 처리</button>
                <button className="asp-action-btn asp-action-btn--revert" onClick={() => onStatusChange(item.settlementId, "PENDING")}>재검토</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgencySettlementPage() {
  const [activeTab, setActiveTab]     = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [keyword, setKeyword]           = useState("");
  const [inputKeyword, setInputKeyword] = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");

  // 목록 + 통계 데이터 (한 번에 옴)
  const [settlements, setSettlements] = useState([]);
  const [stats, setStats]             = useState(null);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const [downloading, setDownloading] = useState(false);

  // ── 목록 + 통계 조회 (GET /api/agency/settlements) ──────────
  const fetchSettlements = useCallback(() => {
    setLoading(true);
    setError(null);
    getAgencySettlements({
      page: currentPage - 1, // 백엔드는 0-indexed
      size: PAGE_SIZE,
      status: TAB_STATUS_MAP[activeTab],
      keyword,
      dateFrom,
      dateTo,
    })
      .then((res) => {
        const data = res.data;
        setSettlements(data.content ?? []);
        setStats(data.stats ?? null);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? 0);
        setSelectedItem(null);
      })
      .catch((err) => {
        console.error("정산 목록 조회 실패:", err);
        setError("정산 목록을 불러오지 못했습니다.");
        setSettlements([]);
      })
      .finally(() => setLoading(false));
  }, [activeTab, currentPage, keyword, dateFrom, dateTo]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // 탭/키워드 변경 시 1페이지로 초기화
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setKeyword(inputKeyword);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setInputKeyword("");
    setKeyword("");
    setDateFrom("");
    setDateTo("");
    setActiveTab("전체");
    setCurrentPage(1);
  };

  // 월별 정산 CSV 다운로드 — 이번 달 기준
  const handleDownloadCsv = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    setDownloading(true);
    try {
      const res = await downloadMonthlySettlementCsv(year, month);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `settlement_report_${year}_${String(month).padStart(2, "0")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("CSV 다운로드에 실패했습니다.");
    } finally {
      setDownloading(false);
    }
  };

  // 필터가 하나라도 적용되어 있는지 (필터 적용 시 백엔드가 prevMonth 관련 필드를 null로 내려줌)
  const isFiltered = Boolean(TAB_STATUS_MAP[activeTab] || keyword || dateFrom || dateTo);
  const periodLabel = isFiltered ? "조회 기간" : "";

  // 통계 카드 구성 (목록 응답에 포함된 stats 사용)
  const statCards = stats
    ? [
        {
          label: `총 정산 금액 (${periodLabel})`,
          value: formatAmount(stats.thisMonthGrossAmount),
          // 필터 적용 시 백엔드가 prevMonthGrossDiff를 null로 내려줌 → null 체크 없이 >= 0 비교하면
          // null >= 0 이 true로 평가돼 "전월 대비 +0원"이 잘못 표시되므로, null이면 배지 자체를 숨김
          sub: stats.prevMonthGrossDiff == null
            ? ""
            : stats.prevMonthGrossDiff >= 0
              ? `전월 대비 +${formatAmount(stats.prevMonthGrossDiff)}`
              : `전월 대비 ${formatAmount(stats.prevMonthGrossDiff)}`,
          subType: stats.prevMonthGrossDiff == null ? "neutral" : (stats.prevMonthGrossDiff >= 0 ? "up" : "down"),
          icon: Wallet, color: "purple",
        },
        {
          label: "지급 완료 금액",
          value: formatAmount(stats.paidAmount),
          sub: stats.thisMonthGrossAmount > 0
            ? `${((stats.paidAmount / stats.thisMonthGrossAmount) * 100).toFixed(1)}%`
            : "0%",
          subType: "neutral", icon: CheckCircle, color: "green",
        },
        {
          label: "지급 대기 금액",
          value: formatAmount(stats.pendingAmount),
          sub: stats.thisMonthGrossAmount > 0
            ? `${((stats.pendingAmount / stats.thisMonthGrossAmount) * 100).toFixed(1)}%`
            : "0%",
          subType: "neutral", icon: Clock, color: "orange",
        },
        {
          label: "보류 금액",
          value: formatAmount(stats.disputedAmount),
          sub: stats.thisMonthGrossAmount > 0
            ? `${((stats.disputedAmount / stats.thisMonthGrossAmount) * 100).toFixed(1)}%`
            : "0%",
          subType: "neutral", icon: Lock, color: "red",
        },
        {
          label: `정산 건수 (${periodLabel})`,
          value: `${Number(stats.thisMonthCount).toLocaleString()}건`,
          // 동일하게 null 체크 — 필터 적용 시 배지 숨김
          sub: stats.prevMonthCountDiff == null
            ? ""
            : stats.prevMonthCountDiff >= 0
              ? `전월 대비 +${stats.prevMonthCountDiff}건`
              : `전월 대비 ${stats.prevMonthCountDiff}건`,
          subType: stats.prevMonthCountDiff == null ? "neutral" : (stats.prevMonthCountDiff >= 0 ? "up" : "down"),
          icon: FileText, color: "blue",
        },
      ]
    : [
        { label: `총 정산 금액 (${periodLabel})`, value: "-",  sub: "",  subType: "neutral", icon: Wallet,      color: "purple" },
        { label: "지급 완료 금액",         value: "-",  sub: "",  subType: "neutral", icon: CheckCircle, color: "green"  },
        { label: "지급 대기 금액",         value: "-",  sub: "",  subType: "neutral", icon: Clock,       color: "orange" },
        { label: "보류 금액",              value: "-",  sub: "",  subType: "neutral", icon: Lock,        color: "red"    },
        { label: `정산 건수 (${periodLabel})`, value: "-",  sub: "",  subType: "neutral", icon: FileText,    color: "blue"   },
      ];

  // 정산 상태 변경 — 성공 시 목록 재조회 (통계도 같이 갱신되도록)
  const handleStatusChange = async (settlementId, newStatus) => {
    try {
      await updateSettlementStatus(settlementId, newStatus);
      fetchSettlements();
      if (selectedItem?.settlementId === settlementId) {
        setSelectedItem(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("정산 상태 변경 실패:", err);
      alert(err.response?.data?.message ?? "상태 변경에 실패했습니다.");
    }
  };

  // 페이지 번호 목록 (최대 5개 표시)
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => i + 1
  );

  return (
    <div className="asp">
      {/* 헤더 */}
      <div className="asp-header">
        <div>
          <h1 className="asp-header__title">정산 관리</h1>
          <p className="asp-header__sub">기사 및 대행사별 정산 내역을 조회하고 정산 상태를 관리할 수 있습니다.</p>
        </div>
        <button className="asp-reset-btn" onClick={fetchSettlements}>
          <RefreshCw size={13} /> 새로고침
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="asp-stats">
        {statCards.map((s) => (
          <div key={s.label} className="asp-stat-card">
            <div className={`asp-stat-card__icon asp-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
            <div>
              <p className="asp-stat-card__label">{s.label}</p>
              <p className="asp-stat-card__value">{s.value}</p>
              {s.sub && <p className={`asp-stat-card__sub asp-stat-card__sub--${s.subType}`}>{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="asp-filters">
        <div className="asp-filter-date">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
          />
          <span>~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="asp-search">
          <Search size={13} color="#aaa" />
          <input
            type="text"
            placeholder="기사명 검색"
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button className="asp-reset-btn" onClick={handleReset}><RefreshCw size={13} /> 필터 초기화</button>
        <button className="asp-excel-btn" onClick={handleDownloadCsv} disabled={downloading}>
          <Download size={13} /> {downloading ? "다운로드 중..." : "CSV 다운로드"}
        </button>
      </div>

      {/* 탭 */}
      <div className="asp-tabs">
        {SETTLEMENT_TABS.map((tab) => (
          <button
            key={tab}
            className={`asp-tab ${activeTab === tab ? "asp-tab--active" : ""}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="asp-table-wrap">
        <div className="asp-table">
          <div className="asp-table__header">
            <span>정산 ID</span>
            <span>유형</span>
            <span>대행사 / 기사</span>
            <span>기준 기간</span>
            <span>건수</span>
            <span>총 정산 금액</span>
            <span>CareFlow 수수료</span>
            <span>대행사 수수료</span>
            <span>실 지급액</span>
            <span>상태</span>
            <span>정산일</span>
            <span>관리</span>
          </div>

          {loading && (
            <div className="asp-table__empty">조회 중...</div>
          )}

          {!loading && error && (
            <div className="asp-table__empty">{error}</div>
          )}

          {!loading && !error && settlements.length === 0 && (
            <div className="asp-table__empty">정산 내역이 없습니다.</div>
          )}

          {!loading && !error && settlements.map((item) => {
            const status = STATUS_MAP[item.status] ?? { label: item.status, type: "ready" };
            const type   = TYPE_MAP[item.type]     ?? { label: item.type,   type: "engineer" };
            return (
              <div key={item.settlementId} className="asp-table__row">
                <span className="asp-table__id">{formatSettlementId(item.settlementId)}</span>
                <span>
                  <span className={`asp-type-badge asp-type-badge--${type.type}`}>{type.label}</span>
                </span>
                <span className="asp-table__name-col">
                  <span className="asp-table__name">{item.engineerName ?? item.agencyName ?? "-"}</span>
                  {item.engineerId != null && (
                    <span className="asp-table__sub-id">ENG-{String(item.engineerId).padStart(5, "0")}</span>
                  )}
                </span>
                <span className="asp-table__period">{item.periodStart} ~ {item.periodEnd}</span>
                <span className="asp-table__count">{item.completedCount}건</span>
                <span className="asp-table__amount">{formatAmount(item.grossAmount)}</span>
                <span className="asp-table__fee">
                  {formatAmount(item.platformFee)}
                  <span className="asp-table__fee-rate">({Number(item.platformFeeRate)}%)</span>
                </span>
                <span className="asp-table__fee">
                  {item.agencyFee ? formatAmount(item.agencyFee) : "-"}
                  <span className="asp-table__fee-rate">({Number(item.agencyFeeRate)}%)</span>
                </span>
                <span className="asp-table__net">
                  {item.engineerNetAmount ? formatAmount(item.engineerNetAmount) : "-"}
                </span>
                <span>
                  <span className={`asp-status-badge asp-status-badge--${status.type}`}>{status.label}</span>
                </span>
                <span className="asp-table__settled-at">{formatDate(item.settledAt)}</span>
                <span>
                  <button
                    className="asp-detail-btn"
                    onClick={() => setSelectedItem(item)}
                  >
                    상세보기
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="asp-pagination">
        <div className="asp-pagination__left">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
          {pageNumbers.map(p => (
            <button key={p} className={currentPage === p ? "asp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
          ))}
          {totalPages > 5 && (
            <>
              <span className="asp-pagination__ellipsis">...</span>
              <button className={currentPage === totalPages ? "asp-pagination__active" : ""} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
            </>
          )}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
        </div>
        <div className="asp-page-size">{PAGE_SIZE}개씩 보기 <ChevronDown size={13} /></div>
      </div>

      <p className="asp-footnote">* 실 지급액은 기사의 경우만 표시됩니다. 승인/보류 등 상태 변경은 상세보기에서 진행합니다. 지급 방식/계좌 정보는 현재 백엔드 미구현으로 항상 "-"로 표시됩니다.</p>

      {/* 상세 정보 모달 */}
      {selectedItem && (
        <SettlementDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}