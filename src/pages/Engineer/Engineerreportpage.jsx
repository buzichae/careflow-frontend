import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, MoreVertical, Download,
  FileText, Clock, CheckCircle, AlertCircle,
} from "lucide-react";
import "../../styles/Engineer/Engineerreportpage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/work-reports?page=0&size=20
// work_reports WHERE engineer_id = 로그인기사
// + as_requests + appliances + users(고객) JOIN
//
// DB 필드:
//   work_reports.report_id
//   work_reports.request_id → as_requests
//   work_reports.diagnosis_result ENUM('NORMAL','REPAIRED','PART_REPLACED','UNREPAIRABLE')
//   work_reports.work_duration_min
//   work_reports.final_amount
//   work_reports.customer_approved (0/1)
//   work_reports.approved_at
//   work_reports.submitted_at
//
// 보고서 상태 (DB 컬럼 조합으로 판단):
//   작성 대기: work_reports 행 없음 (as_assignments.status=ACCEPTED)
//   제출 완료: submitted_at IS NOT NULL AND customer_approved=0 AND approved_at IS NULL
//   고객 승인 대기: submitted_at IS NOT NULL AND customer_approved=0
//   승인 완료: customer_approved=1
//   반려: 별도 상태 컬럼 없음 → ⚠ 백엔드 확인 필요
// ──────────────────────────────────────────

// 상태 배지
// 보고서 상태 (DB 컬럼 조합으로 판단)
// DRAFT    → work_reports 행 없음
// SUBMITTED→ submitted_at IS NOT NULL AND customer_approved=0
// PENDING  → submitted_at IS NOT NULL AND customer_approved=0 (고객 미확인)
// APPROVED → customer_approved=1
const STATUS_MAP = {
  DRAFT:     { label: "작성 대기",    type: "draft"     },
  SUBMITTED: { label: "제출 완료",    type: "submitted" },
  PENDING:   { label: "고객 승인 대기", type: "pending"   },
  APPROVED:  { label: "승인 완료",    type: "approved"  },
};

// work_reports.diagnosis_result ENUM
const DIAGNOSIS_MAP = {
  NORMAL:        { label: "정상 확인",  type: "normal"   },
  REPAIRED:      { label: "수리 완료",  type: "repaired" },
  PART_REPLACED: { label: "부품 교체",  type: "part"     },
  UNREPAIRABLE:  { label: "수리 불가",  type: "unrepair" },
};

const statCards = [
  { label: "전체",        value: 18, icon: FileText,    color: "purple" },
  { label: "작성 대기",   value: 2,  icon: Clock,       color: "orange" },
  { label: "제출 완료",   value: 12, icon: CheckCircle, color: "blue"   },
  { label: "고객 승인 대기", value: 3, icon: AlertCircle, color: "amber"  },
  { label: "승인 완료",   value: 10, icon: CheckCircle, color: "green"  },
];

// 더미 데이터 - work_reports + as_requests + appliances + users JOIN
const reportList = [
  {
    reportId: 1, requestId: "AS-2024-0601-0001",
    customerName: "홍길동",
    productName: "LG 디오스 냉장고", modelNo: "F875S10E",
    workDate: "2024.06.02 (일)", workTimeStart: "14:00", workTimeEnd: "16:00",
    status: "PENDING",
    diagnosisResult: "PART_REPLACED",
    finalAmount: 180000,
    submittedAt: "2024.06.02 15:50", approvedAt: null,
  },
  {
    reportId: 2, requestId: "AS-2024-0515-0003",
    customerName: "이영희",
    productName: "삼성 그랑데 세탁기", modelNo: "WF21T6500KP",
    workDate: "2024.05.15 (수)", workTimeStart: "10:00", workTimeEnd: "11:30",
    status: "APPROVED",
    diagnosisResult: "REPAIRED",
    finalAmount: 120000,
    submittedAt: "2024.05.15 11:20", approvedAt: "2024.05.15 12:05",
  },
  {
    reportId: 3, requestId: "AS-2024-0618-0002",
    customerName: "박준호",
    productName: "LG 휘센 에어컨", modelNo: "FQ18HDWHRN",
    workDate: "2024.06.18 (화)", workTimeStart: "09:00", workTimeEnd: "10:00",
    status: "SUBMITTED",
    diagnosisResult: "NORMAL",
    finalAmount: 150000,
    submittedAt: "2024.06.18 10:25", approvedAt: null,
  },
  {
    reportId: 4, requestId: "AS-2024-0520-0004",
    customerName: "최서연",
    productName: "위니아 김치냉장고", modelNo: "WQ57DGK",
    workDate: "2024.05.20 (월)", workTimeStart: "15:00", workTimeEnd: "16:20",
    status: "DRAFT",
    diagnosisResult: null,
    finalAmount: null,
    submittedAt: null, approvedAt: null,
  },
  {
    reportId: 5, requestId: "AS-2024-0605-0005",
    customerName: "김수현",
    productName: "삼성 비스포크 냉장고", modelNo: "RF85C9002AP",
    workDate: "2024.06.05 (수)", workTimeStart: "11:00", workTimeEnd: "12:30",
    status: "APPROVED",
    diagnosisResult: "PART_REPLACED",
    finalAmount: 200000,
    submittedAt: "2024.06.05 12:40", approvedAt: "2024.06.05 13:10",
  },
  {
    reportId: 6, requestId: "AS-2024-0603-0006",
    customerName: "정민수",
    productName: "LG 코드제로 청소기", modelNo: "A9S-MAX",
    workDate: "2024.06.03 (월)", workTimeStart: "13:30", workTimeEnd: "14:00",
    status: "SUBMITTED",
    diagnosisResult: "REPAIRED",
    finalAmount: 80000,
    submittedAt: "2024.06.03 14:15", approvedAt: null,
  },
  {
    reportId: 7, requestId: "AS-2024-0528-0007",
    customerName: "정유진",
    productName: "삼성 에어드레서", modelNo: "DF60A8500KG",
    workDate: "2024.05.28 (화)", workTimeStart: "09:30", workTimeEnd: "10:30",
    status: "PENDING",
    diagnosisResult: "NORMAL",
    finalAmount: 90000,
    submittedAt: "2024.05.28 10:35", approvedAt: null,
  },
  {
    reportId: 8, requestId: "AS-2024-0607-0008",
    customerName: "이태훈",
    productName: "LG 식기세척기", modelNo: "DFB22S",
    workDate: "2024.06.07 (금)", workTimeStart: "16:00", workTimeEnd: "17:00",
    status: "SUBMITTED",
    diagnosisResult: "REPAIRED",
    finalAmount: 110000,
    submittedAt: "2024.06.07 17:05", approvedAt: null,
  },
];

export default function EngineerReportPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const totalPages = 3;

  return (
    <div className="erp">
      {/* 헤더 */}
      <div className="erp-header">
        <div>
          <h1 className="erp-header__title">작업 보고서 목록</h1>
          <p className="erp-header__sub">완료된 작업 보고서를 조회하고 관리할 수 있습니다.</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="erp-filters">
        <div className="erp-filter-date"><span>2024.06.01 ~ 2024.06.30</span></div>
        <div className="erp-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
        <div className="erp-filter-select"><span>전체 브랜드</span><ChevronDown size={13} /></div>
        <div className="erp-search">
          <Search size={13} color="#aaa" />
          <input type="text" placeholder="고객명, 모델명, 접수번호 검색" />
        </div>
        <button className="erp-excel-btn"><Download size={13} /> 엑셀 다운로드</button>
      </div>

      {/* 통계 카드 */}
      <div className="erp-stats">
        {statCards.map((s) => (
          <div key={s.label} className="erp-stat-card">
            <div className={`erp-stat-card__icon erp-stat-card__icon--${s.color}`}><s.icon size={18} /></div>
            <div>
              <p className="erp-stat-card__label">{s.label}</p>
              <p className="erp-stat-card__value">{s.value}<span>건</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* 목록 메타 */}
      <div className="erp-list-meta">
        <span className="erp-list-count">총 {reportList.length}건</span>
        <div className="erp-list-controls">
          <div className="erp-sort-select">최신순 <ChevronDown size={13} /></div>
          <div className="erp-size-select">20개씩 <ChevronDown size={13} /></div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="erp-table">
        <div className="erp-table__header">
          <span>접수번호</span>
          <span>고객명</span>
          <span>제품명</span>
          <span>작업 일시</span>
          <span>상태</span>
          <span>작업 금액</span>
          <span>보고서 제출일</span>
          <span>고객 승인일</span>
          <span>관리</span>
        </div>

        {reportList.map((item) => {
          const status = STATUS_MAP[item.status];
          const diagnosis = item.diagnosisResult ? DIAGNOSIS_MAP[item.diagnosisResult] : null;
          return (
            <div key={item.reportId} className="erp-table__row">
              <span className="erp-table__request-id">{item.requestId}</span>
              <span className="erp-table__customer">{item.customerName}</span>
              <span className="erp-table__product-col">
                <span className="erp-table__product">{item.productName}</span>
                <span className="erp-table__model">{item.modelNo}</span>
              </span>
              <span className="erp-table__work-date">
                <span>{item.workDate}</span>
                <span className="erp-table__work-time">{item.workTimeStart} ~ {item.workTimeEnd}</span>
              </span>
              <span>
                <span className={`erp-status-badge erp-status-badge--${status.type}`}>{status.label}</span>
              </span>
              <span className="erp-table__amount">
                {item.finalAmount ? `${item.finalAmount.toLocaleString()}원` : "-"}
              </span>
              <span className="erp-table__date">{item.submittedAt ?? "-"}</span>
              <span className="erp-table__date">{item.approvedAt ?? "-"}</span>
              <span className="erp-table__actions">
                {item.status === "DRAFT"
                  ? <button className="erp-write-btn">보고서 작성</button>
                  : <button className="erp-detail-btn" onClick={() => navigate(`/engineer/reports/${item.reportId}`)}>상세보기</button>
                }
                <button className="erp-more-btn"><MoreVertical size={14} /></button>
              </span>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      <div className="erp-pagination">
        <div className="erp-pagination__left">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
          {[1,2,3].map(p => (
            <button key={p} className={currentPage === p ? "erp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
        </div>
        <div className="erp-page-size">20개씩 <ChevronDown size={13} /></div>
      </div>
    </div>
  );
}