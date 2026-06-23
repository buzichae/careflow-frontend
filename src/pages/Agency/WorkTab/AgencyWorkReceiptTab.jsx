import { useState } from "react";
import {
  ClipboardList, Clock, Users, Hourglass, XCircle,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Download, MoreVertical,
} from "lucide-react";
import "../../../styles/Agency/WorkTab/AgencyWorkReceiptTab.css";
import WorkDetailModal from "../../Agency/Modal/WorkDetailModal";

// ──────────────────────────────────────────
// TODO: API 연동 포인트
// GET /api/agency/work-requests?page=0&size=10&sort=created_at,desc
// 필터: brand, region_id, type, status, keyword, dateFrom, dateTo
// as_requests + appliances + users(고객) + appliance_categories JOIN
// ──────────────────────────────────────────

const STATUS_MAP = {
  PENDING:         { label: "접수",      type: "pending"   },
  AGENCY_RECEIVED: { label: "배정 대기", type: "waiting"   },
  ASSIGNED:        { label: "배정 진행", type: "assigned"  },
  ACCEPTED:        { label: "기사 수락 대기", type: "accepted" },
  IN_PROGRESS:     { label: "진행 중",   type: "visiting"  },
  COMPLETED:       { label: "완료 대기", type: "completed" },
  PAID:            { label: "정산 완료", type: "paid"      },
  CANCELLED:       { label: "취소 / 반려", type: "cancelled" },
};

function formatRequestId(requestId, createdAt) {
  const date = new Date(createdAt);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `AS-${yy}${mm}${dd}-${String(requestId).padStart(4, "0")}`;
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const days = ["일","월","화","수","목","금","토"];
  const yy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const day = days[d.getDay()];
  const hh = String(d.getHours()).padStart(2,"0");
  const min = String(d.getMinutes()).padStart(2,"0");
  return { date: `${yy}.${mm}.${dd} (${day})`, time: `${hh}:${min}` };
}

function formatVisitDate(dateStr, startTime, endTime) {
  const d = new Date(dateStr);
  const days = ["일","월","화","수","목","금","토"];
  const yy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const day = days[d.getDay()];
  return `${yy}.${mm}.${dd} (${day})\n${startTime} ~ ${endTime}`;
}

const receiptList = [
  { requestId: 1,  createdAt: "2024-06-18 09:20", customer: "김민지", phone: "010-1234-5678", productName: "LG 디오스 냉장고",   modelNo: "M874GBB231",    symptomDesc: "냉장이 잘 되지 않아요",  visitDate: "2024-06-20", startTime: "10:00", endTime: "12:00", type: "출장 A/S", status: "AGENCY_RECEIVED" },
  { requestId: 2,  createdAt: "2024-06-18 09:45", customer: "이영희", phone: "010-2345-6789", productName: "삼성 그랑데 세탁기", modelNo: "WF21T6500KP",   symptomDesc: "세탁기 배수가 안 돼요", visitDate: "2024-06-19", startTime: "14:00", endTime: "16:00", type: "출장 A/S", status: "ASSIGNED"        },
  { requestId: 3,  createdAt: "2024-06-18 10:10", customer: "박준호", phone: "010-3456-7890", productName: "LG 휘센 에어컨",     modelNo: "FQ18HDWHRN",   symptomDesc: "에어컨에서 냄새가 나요", visitDate: "2024-06-19", startTime: "16:00", endTime: "18:00", type: "출장 A/S", status: "ACCEPTED"        },
  { requestId: 4,  createdAt: "2024-06-18 10:30", customer: "최서연", phone: "010-4567-8901", productName: "삼성 QLED TV",       modelNo: "KQ55QC674FXKR", symptomDesc: "화면이 나오지 않아요",  visitDate: "2024-06-20", startTime: "11:00", endTime: "13:00", type: "설치/점검", status: "AGENCY_RECEIVED" },
  { requestId: 5,  createdAt: "2024-06-18 11:05", customer: "정유진", phone: "010-5678-9012", productName: "LG 식기세척기",      modelNo: "DFB22S",        symptomDesc: "물이 새요",            visitDate: "2024-06-21", startTime: "09:00", endTime: "11:00", type: "출장 A/S", status: "ASSIGNED"        },
  { requestId: 6,  createdAt: "2024-06-18 11:30", customer: "이태훈", phone: "010-6789-0123", productName: "위니아 김치냉장고",  modelNo: "WQ57DGK",      symptomDesc: "김치가 너무 시원해요",  visitDate: "2024-06-21", startTime: "13:00", endTime: "15:00", type: "출장 A/S", status: "CANCELLED"       },
  { requestId: 7,  createdAt: "2024-06-18 12:15", customer: "홍길동", phone: "010-7890-1234", productName: "LG 오브제 냉장고",   modelNo: "M872MEE312",   symptomDesc: "소음이 심해요",         visitDate: "2024-06-22", startTime: "10:00", endTime: "12:00", type: "출장 A/S", status: "AGENCY_RECEIVED" },
  { requestId: 8,  createdAt: "2024-06-18 13:20", customer: "김수현", phone: "010-8901-2345", productName: "삼성 에어드레서",    modelNo: "DF60A8500KG",  symptomDesc: "전원이 안 켜져요",      visitDate: "2024-06-22", startTime: "15:00", endTime: "17:00", type: "출장 A/S", status: "ASSIGNED"        },
];

const statCards = [
  { label: "전체 접수",    value: 42, today: "+8", icon: ClipboardList, color: "purple" },
  { label: "배정 대기",    value: 12, today: "+3", icon: Clock,         color: "orange" },
  { label: "배정 진행",    value: 18, today: "+4", icon: Users,         color: "blue"   },
  { label: "기사 수락 대기",value: 7, today: "+1", icon: Hourglass,     color: "amber"  },
  { label: "취소 / 반려",  value: 5,  today: "+0", icon: XCircle,       color: "red"    },
];

export default function AgencyWorkReceiptTab() {
  const [currentPage, setCurrentPage] = useState(1);
 // const [pageSize] = useState(10);
  const totalPages = 5;
  const [selectedItem, setSelectedItem] = useState(null);


  return (
    <div className="receipt-tab">
      {/* 통계 카드 */}
      <div className="receipt-stats">
        {statCards.map((s) => (
          <div key={s.label} className="receipt-stat-card">
            <div className={`receipt-stat-card__icon receipt-stat-card__icon--${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="receipt-stat-card__label">{s.label}</p>
              <p className="receipt-stat-card__value">{s.value}<span>건</span></p>
              <p className="receipt-stat-card__today">오늘 {s.today}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="receipt-filters">
        <div className="receipt-filter-date">
          <span>2024.06.01 ~ 2024.06.30</span>
          <Download size={14} color="#aaa" />
        </div>
        <div className="receipt-filter-select"><span>전체 브랜드</span><ChevronDown size={14} /></div>
        <div className="receipt-filter-select"><span>전체 지역</span><ChevronDown size={14} /></div>
        <div className="receipt-filter-select"><span>전체 유형</span><ChevronDown size={14} /></div>
        <div className="receipt-filter-select"><span>전체 상태</span><ChevronDown size={14} /></div>
        <div className="receipt-search">
          <Search size={14} color="#aaa" />
          <input type="text" placeholder="고객명, 제품명, 접수번호 검색" />
        </div>
        <button className="receipt-excel-btn">
          <Download size={14} /> 엑셀 다운로드
        </button>
      </div>

      {/* 테이블 헤더 */}
      <div className="receipt-table-meta">
        <span className="receipt-total">총 42건</span>
        <div className="receipt-table-meta__right">
          <div className="receipt-sort-select">
            최신순 <ChevronDown size={13} />
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="receipt-table">
        <div className="receipt-table__header">
          <span>접수번호</span>
          <span>접수 일시</span>
          <span>고객명</span>
          <span>연락처</span>
          <span>제품 정보</span>
          <span>신청 증상</span>
          <span>희망 방문 일정</span>
          <span>유형</span>
          <span>상태</span>
          <span></span>
        </div>

        {receiptList.map((item) => {
          const s = STATUS_MAP[item.status] || { label: item.status, type: "pending" };
          const displayId = formatRequestId(item.requestId, item.createdAt);
          const dt = formatDateTime(item.createdAt);
          const visit = formatVisitDate(item.visitDate, item.startTime, item.endTime);

          return (
            <div key={item.requestId} className="receipt-table__row">
              <span className="receipt-table__id">{displayId}</span>
              <span className="receipt-table__datetime">
                <span>{dt.date}</span>
                <span className="receipt-table__time">{dt.time}</span>
              </span>
              <span className="receipt-table__customer">{item.customer}</span>
              <span className="receipt-table__phone">{item.phone}</span>
              <span className="receipt-table__product">
                <span className="receipt-table__product-name">{item.productName}</span>
                <span className="receipt-table__model">{item.modelNo}</span>
              </span>
              <span className="receipt-table__symptom">{item.symptomDesc}</span>
              <span className="receipt-table__visit">
                {visit.split("\n").map((line, i) => (
                  <span key={i} className={i === 1 ? "receipt-table__visit-time" : ""}>{line}</span>
                ))}
              </span>
              <span className="receipt-table__type">{item.type}</span>
              <span>
                <span className={`receipt-badge receipt-badge--${s.type}`}>{s.label}</span>
              </span>
              <span className="receipt-table__actions">
                <button className="receipt-detail-btn" onClick={() => setSelectedItem(item)}>상세보기</button>
                <button className="receipt-more-btn"><MoreVertical size={14} /></button>
              </span>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      <div className="receipt-pagination">
        <div className="receipt-pagination__left">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
          {[1,2,3,4,5].map(p => (
            <button
              key={p}
              className={currentPage === p ? "receipt-pagination__page--active" : ""}
              onClick={() => setCurrentPage(p)}
            >{p}</button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
        </div>
        <div className="receipt-page-size">
          <span>10개씩 보기</span><ChevronDown size={13} />
        </div>
      </div>
      {selectedItem && (
        <WorkDetailModal onClose={() => setSelectedItem(null)} detail={selectedItem} />
      )}
    </div>
  );
}