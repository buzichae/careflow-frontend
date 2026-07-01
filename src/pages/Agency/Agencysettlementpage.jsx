import { useState, useEffect, useCallback } from "react";
import {
  Wallet, CheckCircle, Clock, Lock, FileText,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, X, Download, Building2,
} from "lucide-react";
import "../../styles/Agency/Agencysettlementpage.css";
import { getAgencySettlements, getAgencySettlementSummary, updateSettlementStatus, downloadMonthlySettlementCsv } from "../../apis/agencySettlement";

// 백엔드 status 값 → UI 레이블/스타일 매핑
const STATUS_MAP = {
  PAID:     { label: "지급 완료", type: "success"  },
  PENDING:  { label: "지급 대기", type: "ready"    },
  APPROVED: { label: "승인됨",   type: "approved" },
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

// 날짜를 yyyy-MM-dd 형식으로 포맷
function formatInputDate(date) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

const PAGE_SIZE = 10;

// 정산 ID 포맷
function formatSettlementId(id) {
  return `ST-${String(id).padStart(8, "0")}`;
}

// 금액 포맷 (원화)
function formatAmount(amount) {
  return `₩${Number(amount).toLocaleString()}`;
}

// paidAt(LocalDateTime) → 날짜 문자열
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return dateStr.replace("T", " ").slice(0, 16);
}

// 이번 달 year/month
function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function Avatar({ name, size = 32 }) {
  return (
    <div className="asp-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

export default function AgencySettlementPage() {
  const [activeTab, setActiveTab]     = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [keyword, setKeyword]           = useState("");
  const [inputKeyword, setInputKeyword] = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");

  // 목록 데이터
  const [settlements, setSettlements] = useState([]);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]         = useState(false);

  // 통계 카드 데이터
  const [summaryStats, setSummaryStats] = useState(null);

  // ── 통계 카드 조회 (이번 달 기준) ──────────────────────────
  useEffect(() => {
    const { year, month } = getCurrentYearMonth();
    getAgencySettlementSummary(year, month)
      .then((res) => setSummaryStats(res.data))
      .catch((err) => console.error("정산 요약 조회 실패:", err));
  }, []);

  // ── 목록 조회 ────────────────────────────────────────────
  const fetchSettlements = useCallback(() => {
    setLoading(true);
    const params = {
      page: currentPage - 1,  // 백엔드는 0-indexed
      size: PAGE_SIZE,
      status: TAB_STATUS_MAP[activeTab] ?? undefined,
      keyword: keyword || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };

    getAgencySettlements(params)
      .then((res) => {
        const data = res.data;
        setSettlements(data.content ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? 0);
        // 페이지 변경 시 상세 패널 닫기
        setSelectedItem(null);
      })
      .catch((err) => console.error("정산 목록 조회 실패:", err))
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
    const { year, month } = getCurrentYearMonth();
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
    }
  };

  // 통계 카드 구성 (summaryStats API 연동)
  const statCards = summaryStats
    ? [
        {
          label: "총 정산 금액 (이번 달)",
          value: formatAmount(summaryStats.totalGrossAmount),
          sub: summaryStats.prevMonthGrossDiff >= 0
            ? `전월 대비 +${formatAmount(summaryStats.prevMonthGrossDiff)}`
            : `전월 대비 ${formatAmount(summaryStats.prevMonthGrossDiff)}`,
          subType: summaryStats.prevMonthGrossDiff >= 0 ? "up" : "down",
          icon: Wallet, color: "purple",
        },
        {
          label: "지급 완료 금액",
          value: formatAmount(summaryStats.paidAmount),
          sub: summaryStats.totalGrossAmount > 0
            ? `${((summaryStats.paidAmount / summaryStats.totalGrossAmount) * 100).toFixed(1)}%`
            : "0%",
          subType: "neutral", icon: CheckCircle, color: "green",
        },
        {
          label: "지급 대기 금액",
          value: formatAmount(summaryStats.pendingAmount),
          sub: summaryStats.totalGrossAmount > 0
            ? `${((summaryStats.pendingAmount / summaryStats.totalGrossAmount) * 100).toFixed(1)}%`
            : "0%",
          subType: "neutral", icon: Clock, color: "orange",
        },
        {
          label: "보류 금액",
          value: formatAmount(summaryStats.disputedAmount),
          sub: summaryStats.totalGrossAmount > 0
            ? `${((summaryStats.disputedAmount / summaryStats.totalGrossAmount) * 100).toFixed(1)}%`
            : "0%",
          subType: "neutral", icon: Lock, color: "red",
        },
        {
          label: "정산 건수 (이번 달)",
          value: `${Number(summaryStats.totalCount).toLocaleString()}건`,
          sub: summaryStats.prevMonthCountDiff >= 0
            ? `전월 대비 +${summaryStats.prevMonthCountDiff}건`
            : `전월 대비 ${summaryStats.prevMonthCountDiff}건`,
          subType: summaryStats.prevMonthCountDiff >= 0 ? "up" : "down",
          icon: FileText, color: "blue",
        },
      ]
    : [
        { label: "총 정산 금액 (이번 달)", value: "-",  sub: "",  subType: "neutral", icon: Wallet,      color: "purple" },
        { label: "지급 완료 금액",         value: "-",  sub: "",  subType: "neutral", icon: CheckCircle, color: "green"  },
        { label: "지급 대기 금액",         value: "-",  sub: "",  subType: "neutral", icon: Clock,       color: "orange" },
        { label: "보류 금액",              value: "-",  sub: "",  subType: "neutral", icon: Lock,        color: "red"    },
        { label: "정산 건수 (이번 달)",    value: "-",  sub: "",  subType: "neutral", icon: FileText,    color: "blue"   },
      ];

  const selectedStatus = selectedItem ? STATUS_MAP[selectedItem.status] : null;
  const selectedType   = selectedItem ? TYPE_MAP[selectedItem.type]   : null;

  // 정산 상태 변경 — 해당 행만 즉시 UI 업데이트
  const handleStatusChange = async (settlementId, newStatus) => {
    try {
      await updateSettlementStatus(settlementId, newStatus);
      // 성공 시 해당 행의 status 만 갱신 (전체 재조회 없이 즉각 반영)
      setSettlements(prev =>
        prev.map(s =>
          s.settlementId === settlementId
            ? { ...s, status: newStatus, settledAt: newStatus === "PAID" ? new Date().toISOString() : s.settledAt }
            : s
        )
      );
      // 상세 패널이 열려있는 행이면 패널도 함께 업데이트
      if (selectedItem?.settlementId === settlementId) {
        setSelectedItem(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? "상태 변경에 실패했습니다.";
      alert(msg);
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
        <div className="asp-refresh-bar">
          <span className="asp-refresh-label">자동 갱신</span>
          <div className={`asp-toggle ${autoRefresh ? "asp-toggle--on" : ""}`} onClick={() => setAutoRefresh(p => !p)}>
            <div className="asp-toggle__thumb" />
          </div>
          <div className="asp-refresh-select">30초 <ChevronDown size={13} /></div>
        </div>
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
            placeholder="기사명, 정산 ID 검색"
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button className="asp-reset-btn" onClick={handleReset}><RefreshCw size={13} /> 필터 초기화</button>
        <button className="asp-excel-btn" onClick={handleDownloadCsv}><Download size={13} /> CSV 다운로드</button>
      </div>

      <div className="asp-body">
        <div className="asp-left">
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
              <span>승인 여부</span>
              <span>관리</span>
            </div>

            {loading && (
              <div className="asp-table__empty">조회 중...</div>
            )}

            {!loading && settlements.length === 0 && (
              <div className="asp-table__empty">정산 내역이 없습니다.</div>
            )}

            {!loading && settlements.map((item) => {
              const status = STATUS_MAP[item.status] ?? { label: item.status, type: "ready" };
              const type   = TYPE_MAP[item.type]     ?? { label: item.type,   type: "engineer" };
              const isSelected = selectedItem?.settlementId === item.settlementId;
              return (
                <div key={item.settlementId} className={`asp-table__row ${isSelected ? "asp-table__row--selected" : ""}`}>
                  <span className="asp-table__id">{formatSettlementId(item.settlementId)}</span>
                  <span>
                    <span className={`asp-type-badge asp-type-badge--${type.type}`}>{type.label}</span>
                  </span>
                  <span className="asp-table__name-col">
                    <span className="asp-table__name">{item.engineerName}</span>
                    <span className="asp-table__sub-id">ENG-{String(item.engineerId).padStart(5, "0")}</span>
                  </span>
                  <span className="asp-table__period">{item.periodStart} ~ {item.periodEnd}</span>
                  <span className="asp-table__count">{item.completedCount}건</span>
                  <span className="asp-table__amount">{formatAmount(item.grossAmount)}</span>
                  <span className="asp-table__fee">
                    {formatAmount(item.platformFee)}<br />
                    <span className="asp-table__fee-rate">({Number(item.platformFeeRate)}%)</span>
                  </span>
                  <span className="asp-table__fee">
                    {item.agencyFee ? formatAmount(item.agencyFee) : "-"}<br />
                    <span className="asp-table__fee-rate">({Number(item.agencyFeeRate)}%)</span>
                  </span>
                  <span className="asp-table__net">
                    {item.engineerNetAmount ? formatAmount(item.engineerNetAmount) : "-"}
                  </span>
                  <span>
                    <span className={`asp-status-badge asp-status-badge--${status.type}`}>{status.label}</span>
                  </span>
                  <span className="asp-table__settled-at">{formatDate(item.settledAt)}</span>
                  <span className="asp-table__approval">
                    {/* PAID: 변경 불가 — 잠금 표시 */}
                    {item.status === "PAID" && (
                      <span className="asp-approval-locked">지급완료</span>
                    )}
                    {/* PENDING: 승인 또는 보류 가능 */}
                    {item.status === "PENDING" && (
                      <>
                        <button className="asp-approval-btn asp-approval-btn--approve"
                          onClick={() => handleStatusChange(item.settlementId, "APPROVED")}>
                          승인
                        </button>
                        <button className="asp-approval-btn asp-approval-btn--dispute"
                          onClick={() => handleStatusChange(item.settlementId, "DISPUTED")}>
                          보류
                        </button>
                      </>
                    )}
                    {/* APPROVED: 지급완료 처리 또는 보류 가능 */}
                    {item.status === "APPROVED" && (
                      <>
                        <button className="asp-approval-btn asp-approval-btn--paid"
                          onClick={() => handleStatusChange(item.settlementId, "PAID")}>
                          지급처리
                        </button>
                        <button className="asp-approval-btn asp-approval-btn--dispute"
                          onClick={() => handleStatusChange(item.settlementId, "DISPUTED")}>
                          보류
                        </button>
                      </>
                    )}
                    {/* DISPUTED: 승인 또는 대기 복귀 가능 */}
                    {item.status === "DISPUTED" && (
                      <>
                        <button className="asp-approval-btn asp-approval-btn--approve"
                          onClick={() => handleStatusChange(item.settlementId, "APPROVED")}>
                          승인
                        </button>
                        <button className="asp-approval-btn asp-approval-btn--revert"
                          onClick={() => handleStatusChange(item.settlementId, "PENDING")}>
                          재검토
                        </button>
                      </>
                    )}
                  </span>
                  <span>
                    <button
                      className={`asp-detail-btn ${isSelected ? "asp-detail-btn--active" : ""}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      상세보기
                    </button>
                  </span>
                </div>
              );
            })}
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

          <p className="asp-footnote">* 실 지급액은 기사의 경우만 표시됩니다.</p>
        </div>

        {/* 우측 상세 패널 */}
        {selectedItem && (
          <aside className="asp-detail">
            <div className="asp-detail__header">
              <span className="asp-detail__title">정산 상세 정보</span>
              <div className="asp-detail__header-right">
                <span className={`asp-type-badge asp-type-badge--${selectedType?.type}`}>{selectedType?.label}</span>
                <span className={`asp-status-badge asp-status-badge--${selectedStatus?.type}`}>{selectedStatus?.label}</span>
                <button className="asp-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
              </div>
            </div>

            <div className="asp-detail__body">
              {/* 정산 ID */}
              <p className="asp-detail__id">{formatSettlementId(selectedItem.settlementId)}</p>

              {/* 기사 프로필 */}
              <div className="asp-detail__profile">
                {selectedItem.type === "ENGINEER"
                  ? <Avatar name={selectedItem.engineerName} size={40} />
                  : <div className="asp-detail__agency-icon"><Building2 size={20} /></div>
                }
                <div>
                  <p className="asp-detail__profile-name">{selectedItem.engineerName}</p>
                  <p className="asp-detail__profile-sub">ENG-{String(selectedItem.engineerId).padStart(5, "0")}</p>
                  {selectedItem.engineerPhone && <p className="asp-detail__profile-phone">{selectedItem.engineerPhone}</p>}
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="asp-detail__section">
                <div className="asp-detail__row"><span className="asp-detail__label">기준 기간</span><span className="asp-detail__value">{selectedItem.periodStart} ~ {selectedItem.periodEnd}</span></div>
                <div className="asp-detail__row"><span className="asp-detail__label">정산일</span><span className="asp-detail__value">{formatDate(selectedItem.settledAt)}</span></div>
                <div className="asp-detail__row"><span className="asp-detail__label">완료 건수</span><span className="asp-detail__value">{selectedItem.completedCount}건</span></div>
                <div className="asp-detail__row"><span className="asp-detail__label">총 정산 금액</span><span className="asp-detail__value asp-detail__value--amount">{formatAmount(selectedItem.grossAmount)}</span></div>
              </div>

              {/* 금액 상세 */}
              <div className="asp-detail__section">
                <p className="asp-detail__section-label">금액 상세</p>
                <div className="asp-detail__amount-box">
                  <div className="asp-detail__amount-row">
                    <span>총 정산 금액</span>
                    <span>{formatAmount(selectedItem.grossAmount)}</span>
                  </div>
                  <div className="asp-detail__amount-row asp-detail__amount-row--fee">
                    <span>CareFlow 수수료 ({Number(selectedItem.platformFeeRate)}%)</span>
                    <span>-{formatAmount(selectedItem.platformFee)}</span>
                  </div>
                  <div className="asp-detail__amount-row asp-detail__amount-row--fee">
                    <span>대행사 수수료 ({Number(selectedItem.agencyFeeRate)}%)</span>
                    <span>-{selectedItem.agencyFee ? formatAmount(selectedItem.agencyFee) : "-"}</span>
                  </div>
                  <div className="asp-detail__amount-divider" />
                  <div className="asp-detail__amount-row asp-detail__amount-row--net">
                    <span>실 지급액</span>
                    <span className="asp-detail__net-amount">
                      {selectedItem.engineerNetAmount ? formatAmount(selectedItem.engineerNetAmount) : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 연결된 대행사 */}
              {selectedItem.type === "ENGINEER" && (
                <div className="asp-detail__section">
                  <p className="asp-detail__section-label">연결된 대행사</p>
                  <div className="asp-detail__agency-card">
                    <div className="asp-detail__agency-icon--sm"><Building2 size={14} /></div>
                    <div>
                      <p className="asp-detail__agency-name">{selectedItem.agencyName}</p>
                      <p className="asp-detail__agency-rate">수수료율 {Number(selectedItem.agencyFeeRate)}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 지급 정보 */}
              <div className="asp-detail__section">
                <p className="asp-detail__section-label">지급 정보</p>
                <div className="asp-detail__row"><span className="asp-detail__label">지급 방식</span><span className="asp-detail__value">{selectedItem.payMethod ?? "-"}</span></div>
                <div className="asp-detail__row"><span className="asp-detail__label">지급 계좌</span><span className="asp-detail__value">{selectedItem.bankAccount ?? "-"}</span></div>
                <div className="asp-detail__row"><span className="asp-detail__label">지급 상태</span><span className={`asp-status-badge asp-status-badge--${selectedStatus?.type}`}>{selectedStatus?.label}</span></div>
                {selectedItem.settledAt && (
                  <div className="asp-detail__row"><span className="asp-detail__label">지급일</span><span className="asp-detail__value">{formatDate(selectedItem.settledAt)}</span></div>
                )}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="asp-detail__footer">
              <button className="asp-detail__footer-btn asp-detail__footer-btn--outline">
                <Download size={13} /> 정산 내역 다운로드
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
