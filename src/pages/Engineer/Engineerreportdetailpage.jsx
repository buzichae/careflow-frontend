import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Pencil, Home,
  Phone, MapPin, Calendar, Clock,
} from "lucide-react";
import "../../styles/Engineer/Engineerreportdetailpage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/work-reports/{reportId}
// work_reports + as_requests + appliances + users(고객)
// + work_report_parts + repair_parts (부품 상세)
// + as_status_logs (진행 이력)
// + engineer_profiles + agencies (기사 정보)
//
// DB 필드:
//   work_reports.diagnosis_result ENUM('NORMAL','REPAIRED','PART_REPLACED','UNREPAIRABLE')
//   work_reports.work_duration_min → 총 작업 시간 (분)
//   work_reports.final_amount     → 최종 청구 금액
//   work_reports.memo             → 기타 사항
//   work_reports.image_urls       → 첨부 사진 JSON
//   work_reports.customer_approved → 고객 승인 여부
//   work_reports.approved_at      → 고객 승인 일시
//   work_reports.submitted_at     → 보고서 제출일
//   work_report_parts.quantity, applied_unit_price → 교체 부품
//   repair_parts.part_name, part_code → 부품 마스터
//   as_status_logs.to_status, created_at → 진행 이력
// ──────────────────────────────────────────

const STATUS_LOG_MAP = {
  WAITING:           "방문 대기",
  ENGINEER_DEPARTED: "출발",
  ENGINEER_ARRIVED:  "도착",
  IN_PROGRESS:       "작업 시작",
  COMPLETED:         "작업 완료 (보고서 제출)",
};

// 작업 진행 단계 (as_requests.status + as_status_logs.to_status 기반)
const PROGRESS_STEPS = [
  { key: "AGENCY_RECEIVED", label: "접수 완료"  },
  { key: "ASSIGNED",        label: "배정 완료"  },
  { key: "ENGINEER_DEPARTED", label: "출발"    },
  { key: "ENGINEER_ARRIVED",  label: "도착"    },
  { key: "IN_PROGRESS",       label: "작업 중" },
  { key: "COMPLETED",         label: "작업 완료" },
  { key: "PENDING_APPROVAL",  label: "고객 승인 대기" },
];

// 더미 보고서 상세 데이터
const reportDetail = {
  reportId: 1,
  requestId: "AS-2024-0601-0001",
  reportStatus: "PENDING", // customer_approved=0

  // 제품 - appliances 테이블
  productName: "LG 디오스 냉장고",
  modelNo: "F875S10E",
  serialNo: "312KRBN0A123",
  productImageUrl: null,

  // 고객 - users 테이블
  customerName: "홍길동",
  customerId: "CUST-2024-000123",
  customerPhone: "010-1234-5678",
  customerAddress: "서울 강남구 테헤란로 123, 101동 1004호",

  // 방문 일정 - as_requests.scheduled_date, scheduled_time
  scheduledDate: "2024.06.01 (토) 10:00",

  // 진행 시간 - as_status_logs.created_at 기준
  arrivedAt: "10:05",    // ENGINEER_ARRIVED created_at
  workStartAt: "10:10",  // IN_PROGRESS created_at
  workEndAt: "11:30",    // COMPLETED created_at

  // 진행 단계
  currentStep: "COMPLETED",

  // work_reports.diagnosis_result
  diagnosisResult: "PART_REPLACED",
  diagnosisSymptom: "냉장실 냉기가 약하고, 냉동실은 정상 작동.",
  diagnosisDetail: "냉장실 내부 팬 모터 회전 불량 확인\n냉각 팬 날개에 먼지 및 이물질 다량 확인\n팬 모터 베어링 마모로 인한 소음 및 회전 저하",

  // 작업 내용 - work_reports.memo 기반
  workContent: [
    "냉장실 내부 팬 모터 및 베어링 교체",
    "팬 날개 및 내부 먼지 제거, 클리닝",
    "정상 작동 확인 및 성능 테스트 완료",
  ],

  // work_reports.work_duration_min
  workDurationMin: 80, // 1시간 20분

  // work_report_parts + repair_parts JOIN
  // repair_parts.part_name, part_code / work_report_parts.quantity, applied_unit_price
  parts: [
    { partName: "냉각 팬 모터", partCode: "EAU62094502", quantity: 1, appliedUnitPrice: 80000 },
    { partName: "팬 모터 베어링", partCode: "6201ZZ",      quantity: 1, appliedUnitPrice: 15000 },
    { partName: "필터 (에어)",   partCode: "ADQ73214404", quantity: 1, appliedUnitPrice: 25000 },
  ],

  // work_reports.final_amount
  finalAmount: 180000,

  // work_reports.image_urls (JSON)
  imageUrls: [null, null, null, null],

  // work_reports.memo
  memo: "고객 요청으로 냉장고 사용 및 관리 방법 안내 완료.",

  // work_reports.submitted_at
  submittedAt: "2024.06.01 11:30",

  // work_reports.customer_approved, approved_at
  customerApproved: 0,
  approvedAt: null,

  // as_status_logs - 진행 이력
  statusLogs: [
    { toStatus: null,              label: "고객 접수 완료",      createdAt: "06.01 09:20" },
    { toStatus: null,              label: "배정 완료",           createdAt: "06.01 09:35" },
    { toStatus: "ENGINEER_DEPARTED", label: "출발",             createdAt: "06.01 09:50" },
    { toStatus: "ENGINEER_ARRIVED",  label: "도착",             createdAt: "06.01 10:05" },
    { toStatus: "IN_PROGRESS",       label: "작업 시작",         createdAt: "06.01 10:10" },
    { toStatus: "COMPLETED",         label: "작업 완료 (보고서 제출)", createdAt: "06.01 11:30", highlight: true },
  ],

  // 기사 정보 - engineer_profiles + users + agencies
  engineerName: "김철수",
  engineerSkillLevel: "ADVANCED", // LV.3
  agencyName: "강남 홈케어",      // agencies.name
  engineerPhone: "010-9876-5432",
};

const SKILL_LABEL = {
  BEGINNER:     "LV.1",
  INTERMEDIATE: "LV.2",
  ADVANCED:     "LV.3",
};

const DIAGNOSIS_MAP = {
  NORMAL:        "정상 확인",
  REPAIRED:      "수리 완료",
  PART_REPLACED: "부품 교체",
  UNREPAIRABLE:  "수리 불가",
};

function formatDuration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}시간 ${m > 0 ? m + "분" : ""}` : `${m}분`;
}

export default function EngineerReportDetailPage() {
  const navigate = useNavigate();
  const d = reportDetail;
  const partsTotal = d.parts.reduce((sum, p) => sum + p.quantity * p.appliedUnitPrice, 0);
  const currentStepIdx = PROGRESS_STEPS.findIndex(s => s.key === d.currentStep);

  const handleCancelApproval = () => {
    // TODO: DELETE /api/engineer/work-reports/{reportId}/approval-request
    alert("승인 요청 취소");
  };

  return (
    <div className="erdp">
      {/* 브레드크럼 + 헤더 버튼 */}
      <div className="erdp-topbar">
        <div className="erdp-breadcrumb">
          <Home size={13} color="#aaa" />
          <ChevronRight size={12} color="#ccc" />
          <span>작업 관리</span>
          <ChevronRight size={12} color="#ccc" />
          <span>작업 보고서</span>
          <ChevronRight size={12} color="#ccc" />
          <span className="erdp-breadcrumb__current">보고서 상세</span>
        </div>
        <div className="erdp-topbar__actions">
          <button className="erdp-back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={13} /> 목록으로
          </button>
          <button className="erdp-edit-btn">
            <Pencil size={13} /> 보고서 수정
          </button>
        </div>
      </div>

      {/* 페이지 타이틀 */}
      <div className="erdp-header">
        <h1 className="erdp-header__title">작업 보고서</h1>
        <p className="erdp-header__sub">A/S 작업이 완료된 후 작성한 보고서 상세 내용을 확인할 수 있습니다.</p>
      </div>

      {/* 접수번호 + 상태 */}
      <div className="erdp-id-row">
        <span className="erdp-request-id">{d.requestId}</span>
        <span className="erdp-status-badge erdp-status-badge--pending">고객 승인 대기</span>
      </div>

      <div className="erdp-body">
        <div className="erdp-left">
          {/* 상단 3단 요약 */}
          <div className="erdp-summary-grid">
            {/* 제품 정보 */}
            <div className="erdp-summary-card">
              <div className="erdp-summary-card__img">
                {d.productImageUrl
                  ? <img src={d.productImageUrl} alt={d.productName} />
                  : <span>🧊</span>
                }
              </div>
              <div>
                <p className="erdp-summary-card__product">{d.productName}</p>
                <p className="erdp-summary-card__row"><span>모델명</span><span>{d.modelNo}</span></p>
                <p className="erdp-summary-card__row"><span>시리얼</span><span>{d.serialNo}</span></p>
              </div>
            </div>

            {/* 고객 정보 */}
            <div className="erdp-summary-card">
              <p className="erdp-summary-card__section-label">고객 정보</p>
              <p className="erdp-summary-card__customer">{d.customerName} 고객 <span className="erdp-cust-id">({d.customerId})</span></p>
              <p className="erdp-summary-card__row-icon"><Phone size={11} /> {d.customerPhone}</p>
              <p className="erdp-summary-card__row-icon"><MapPin size={11} /> {d.customerAddress}</p>
            </div>

            {/* 작업 일정 */}
            <div className="erdp-summary-card">
              <p className="erdp-summary-card__section-label">작업 일정</p>
              <p className="erdp-summary-card__row-icon"><Calendar size={11} /> 방문 일시 &nbsp; {d.scheduledDate}</p>
              <p className="erdp-summary-card__row-icon"><Clock size={11} /> 도착 시간 &nbsp; {d.arrivedAt}</p>
              <p className="erdp-summary-card__row-icon"><Clock size={11} /> 작업 시간 &nbsp; {d.workStartAt} ~ {d.workEndAt} (총 {formatDuration(d.workDurationMin)})</p>
            </div>
          </div>

          {/* 진행 단계 - as_requests.status + as_status_logs.to_status */}
          <div className="erdp-section">
            <div className="erdp-progress-steps">
              {PROGRESS_STEPS.map((step, i) => {
                const isDone    = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                const log = d.statusLogs[i];
                return (
                  <div key={step.key} className="erdp-step">
                    <div className={`erdp-step__dot ${isDone ? "erdp-step__dot--done" : ""} ${isCurrent ? "erdp-step__dot--current" : ""}`}>
                      {isDone && <span>✓</span>}
                    </div>
                    {i < PROGRESS_STEPS.length - 1 && (
                      <div className={`erdp-step__line ${i < currentStepIdx ? "erdp-step__line--done" : ""}`} />
                    )}
                    <p className={`erdp-step__label ${isCurrent ? "erdp-step__label--current" : ""}`}>{step.label}</p>
                    {log && <p className="erdp-step__time">({log.createdAt})</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1. 진단 결과 - work_reports.diagnosis_result + memo */}
          <div className="erdp-section">
            <h3 className="erdp-section__title">1. 진단 결과</h3>
            <div className="erdp-diag-grid">
              <div>
                <p className="erdp-section__sub-label">고장 증상</p>
                <p className="erdp-diag-symptom">{d.diagnosisSymptom}</p>
              </div>
              <div>
                <p className="erdp-section__sub-label">진단 내용</p>
                {d.diagnosisDetail.split("\n").map((line, i) => (
                  <p key={i} className="erdp-diag-item">• {line}</p>
                ))}
              </div>
            </div>
          </div>

          {/* 2. 교체 부품 - work_report_parts + repair_parts */}
          <div className="erdp-section">
            <h3 className="erdp-section__title">2. 교체 부품</h3>
            <table className="erdp-parts-table">
              <thead>
                <tr>
                  <th>부품명</th>
                  <th>모델명 (part_code)</th>
                  <th>수량</th>
                  <th>단가</th>
                  <th>금액</th>
                </tr>
              </thead>
              <tbody>
                {d.parts.map((p, i) => (
                  <tr key={i}>
                    <td>{p.partName}</td>
                    <td className="erdp-parts-table__code">{p.partCode}</td>
                    <td>{p.quantity}</td>
                    <td>{p.appliedUnitPrice.toLocaleString()}원</td>
                    <td>{(p.quantity * p.appliedUnitPrice).toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="erdp-parts-table__total-label">부품 합계</td>
                  <td className="erdp-parts-table__total">{partsTotal.toLocaleString()}원</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 3. 작업 내용 - work_reports.memo */}
          <div className="erdp-section">
            <h3 className="erdp-section__title">3. 작업 내용</h3>
            {d.workContent.map((line, i) => (
              <p key={i} className="erdp-work-item">• {line}</p>
            ))}
          </div>

          {/* 4. 작업 시간 - work_reports.work_duration_min + as_status_logs */}
          <div className="erdp-section">
            <h3 className="erdp-section__title">4. 작업 시간</h3>
            <div className="erdp-time-grid">
              <div className="erdp-time-row"><span>시작 시간</span><span>{d.workStartAt}</span></div>
              <div className="erdp-time-row"><span>종료 시간</span><span>{d.workEndAt}</span></div>
              <div className="erdp-time-row"><span>총 작업 시간</span><span className="erdp-time-total">{formatDuration(d.workDurationMin)}</span></div>
            </div>
          </div>

          {/* 5. 첨부 사진 - work_reports.image_urls JSON */}
          <div className="erdp-section">
            <h3 className="erdp-section__title">5. 첨부 사진</h3>
            <div className="erdp-images">
              {d.imageUrls.slice(0, 4).map((url, i) => (
                <div key={i} className="erdp-image-thumb">
                  {url ? <img src={url} alt={`작업 사진 ${i+1}`} /> : <span>📷</span>}
                </div>
              ))}
              {d.imageUrls.length > 4 && (
                <div className="erdp-image-more">+ 더보기 ({d.imageUrls.length - 4})</div>
              )}
            </div>
          </div>

          {/* 6. 기타 사항 - work_reports.memo */}
          <div className="erdp-section">
            <h3 className="erdp-section__title">6. 기타 사항</h3>
            <p className="erdp-memo">{d.memo}</p>
          </div>
        </div>

        {/* 우측 패널 */}
        <aside className="erdp-right">
          {/* 작업 결과 요약 */}
          <div className="erdp-panel">
            <h3 className="erdp-panel__title">작업 결과 요약</h3>
            {/* work_reports.final_amount */}
            <div className="erdp-result-row erdp-result-row--total">
              <span>최종 금액</span>
              <span>{d.finalAmount.toLocaleString()}원</span>
            </div>
            <div className="erdp-result-row">
              <span>부품 비용</span>
              <span>{partsTotal.toLocaleString()}원</span>
            </div>
            {/* 나머지 금액 항목은 DB에 없으므로 final_amount - parts 로 표시 */}
            <div className="erdp-result-row">
              <span>기본 점검비 등</span>
              <span>{(d.finalAmount - partsTotal).toLocaleString()}원</span>
            </div>
          </div>

          {/* 작업 기사 정보 - engineer_profiles + users + agencies */}
          <div className="erdp-panel">
            <h3 className="erdp-panel__title">작업 기사 정보</h3>
            <div className="erdp-engineer-card">
              <div className="erdp-engineer-avatar">{d.engineerName.charAt(0)}</div>
              <div>
                <p className="erdp-engineer-name">
                  {d.engineerName} 기사님
                  <span className="erdp-level-badge">
                    {SKILL_LABEL[d.engineerSkillLevel] ?? "LV.1"}
                  </span>
                </p>
              </div>
            </div>
            <div className="erdp-panel-row"><span>소속</span><span>{d.agencyName}</span></div>
            <div className="erdp-panel-row"><span>연락처</span><span>{d.engineerPhone}</span></div>
          </div>

          {/* 진행 이력 - as_status_logs */}
          <div className="erdp-panel">
            <h3 className="erdp-panel__title">진행 이력</h3>
            <div className="erdp-timeline">
              {d.statusLogs.map((log, i) => (
                <div key={i} className="erdp-timeline-item">
                  <div className={`erdp-timeline-dot ${log.highlight ? "erdp-timeline-dot--highlight" : ""}`} />
                  {i < d.statusLogs.length - 1 && <div className="erdp-timeline-line" />}
                  <span className="erdp-timeline-time">{log.createdAt}</span>
                  <span className={`erdp-timeline-label ${log.highlight ? "erdp-timeline-label--highlight" : ""}`}>{log.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 승인 및 결제 - work_reports.customer_approved, approved_at */}
          <div className="erdp-panel">
            <h3 className="erdp-panel__title">승인 및 결제</h3>
            <div className="erdp-panel-row">
              <span>고객 승인 상태</span>
              <span className="erdp-status-badge erdp-status-badge--pending">승인 대기</span>
            </div>
            <div className="erdp-panel-row">
              <span>보고서 제출일</span>
              <span>{d.submittedAt}</span>
            </div>
            <button className="erdp-cancel-btn" onClick={handleCancelApproval}>승인 요청 취소</button>
          </div>
        </aside>
      </div>
    </div>
  );
}