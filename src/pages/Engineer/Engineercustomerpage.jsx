import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search, Phone, Mail, MapPin, Clock, FileText,
  ChevronRight, SlidersHorizontal, ArrowLeft,
} from "lucide-react";
import "../../styles/Engineer/Engineercustomerpage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/customers/{customerId}
// useParams()로 customerId 꺼내서 API 호출
// ──────────────────────────────────────────

const APPLIANCE_STATUS_MAP = {
  NORMAL:      { label: "정상",     type: "normal"      },
  NEED_REPAIR: { label: "수리 필요", type: "need-repair" },
  SOLD:        { label: "판매됨",   type: "sold"        },
};

const AS_STATUS_TABS = ["전체", "진행 중", "완료", "취소"];

const AS_STATUS_MAP = {
  PENDING:         { label: "접수 대기", type: "pending"   },
  AGENCY_RECEIVED: { label: "접수",     type: "received"  },
  ASSIGNED:        { label: "배정 완료", type: "assigned"  },
  ACCEPTED:        { label: "진행 중",  type: "accepted"  },
  IN_PROGRESS:     { label: "진행 중",  type: "progress"  },
  COMPLETED:       { label: "완료",    type: "completed" },
  PAID:            { label: "정산 완료", type: "paid"      },
  CANCELLED:       { label: "취소",    type: "cancelled" },
};

const customerDetail = {
  userId: 1001,
  customerId: "CUST-2024-000123",
  name: "홍길동",
  grade: "일반 고객",
  status: "ACTIVE",
  phone: "010-1234-5678",
  email: "honggildong@email.com",
  address: "서울 강남구 테헤란로 123, 101동 1004호",
  joinedAt: "2023.05.12",
  preferredContactTime: "평일 09:00 ~ 18:00",
  memo: "문 앞 주차 가능, 연락 후 방문 요청",
  totalAs: 8, doneAs: 6, inProgressAs: 1, cancelledAs: 1,
  totalPayment: 1248000,
  appliances: [
    { applianceId: 1, brand: "LG",   modelName: "디오스 냉장고", modelNo: "F875S10E",    purchaseDate: "2022.06.15", warrantyEndDate: "2025.06.14", status: "NORMAL",      imageUrl: null, registeredAt: "2024.05.20" },
    { applianceId: 2, brand: "삼성", modelName: "그랑데 세탁기", modelNo: "WF21T6500KP", purchaseDate: "2021.11.03", warrantyEndDate: "2024.11.02", status: "NEED_REPAIR", imageUrl: null, registeredAt: "2024.05.20" },
    { applianceId: 3, brand: "LG",   modelName: "휘센 에어컨",   modelNo: "FQ18HDWHRN",  purchaseDate: "2023.04.10", warrantyEndDate: "2026.04.09", status: "NORMAL",      imageUrl: null, registeredAt: "2024.05.20" },
  ],
  asHistory: [
    { requestId: "AS-2024-0601-0001", createdAt: "2024.06.01", productName: "LG 디오스 냉장고",  symptom: "냉장실 냉각 약함",  status: "IN_PROGRESS", visitDate: "2024.06.02", finalAmount: 180000 },
    { requestId: "AS-2024-0515-0003", createdAt: "2024.05.15", productName: "삼성 그랑데 세탁기", symptom: "탈수 시 소음 발생", status: "COMPLETED",   visitDate: "2024.05.16", finalAmount: 120000 },
    { requestId: "AS-2024-0410-0012", createdAt: "2024.04.10", productName: "LG 휘센 에어컨",    symptom: "바람이 약해요",     status: "COMPLETED",   visitDate: "2024.04.11", finalAmount: 150000 },
    { requestId: "AS-2024-0323-0007", createdAt: "2024.03.23", productName: "LG 디오스 냉장고",  symptom: "제빙 안됨",         status: "COMPLETED",   visitDate: "2024.03.24", finalAmount: 80000  },
    { requestId: "AS-2024-0120-0002", createdAt: "2024.01.20", productName: "삼성 그랑데 세탁기", symptom: "문 잠김 오류",      status: "CANCELLED",   visitDate: "-",          finalAmount: null   },
  ],
  memos: [
    { date: "2024.05.15", content: "고객 문의 전화\n세탁기 소음 관련 문의. 방문 후 부품 교체 진행." },
    { date: "2024.04.10", content: "기사메모\n에어컨 바람 약함 증상. 필터 청소 및 점검 완료."      },
  ],
  inProgressWork: {
    requestId: "AS-2024-0601-0001",
    productName: "LG 디오스 냉장고",
    symptom: "냉장실 냉각 약함",
    visitDate: "2024.06.02 (일) 14:00 ~ 16:00",
    progressStatus: "기사 배정 완료 → 방문 예정",
    status: "ACCEPTED",
  },
};

function Avatar({ name, size = 60 }) {
  return (
    <div className="ecp-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

function ApplianceImg({ imageUrl, size = 56 }) {
  return (
    <div className="ecp-appliance-img" style={{ width: size, height: size }}>
      {imageUrl ? <img src={imageUrl} alt="가전" /> : <span>📦</span>}
    </div>
  );
}

export default function EngineerCustomerPage() {
  const navigate = useNavigate();
  const { customerId } = useParams(); // 라우트 파라미터에서 고객 ID 추출

  const [asTab, setAsTab]             = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: customerId로 API 호출해서 데이터 가져오기
  const c = customerDetail;

  const filteredAs = asTab === "전체"   ? c.asHistory
    : asTab === "진행 중" ? c.asHistory.filter(a => ["ACCEPTED", "IN_PROGRESS", "ASSIGNED"].includes(a.status))
    : asTab === "완료"    ? c.asHistory.filter(a => ["COMPLETED", "PAID"].includes(a.status))
    : c.asHistory.filter(a => a.status === "CANCELLED");

  return (
    <div className="ecp">
      {/* 뒤로가기 버튼 */}
      <button className="ecp-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} />
        목록으로 돌아가기
      </button>

      <div className="ecp-header">
        <h1 className="ecp-header__title">고객 정보 조회</h1>
        <p className="ecp-header__sub">고객의 기본 정보, 가전 보유 현황, A/S 이력 및 진행 중인 작업을 확인할 수 있습니다.</p>
      </div>

      <div className="ecp-search-bar">
        <div className="ecp-search">
          <Search size={15} color="#aaa" />
          <input
            type="text"
            placeholder="이름, 연락처, 주소, 고객ID로 검색하세요."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="ecp-adv-search-btn">
          <SlidersHorizontal size={14} /> 상세 검색
        </button>
      </div>

      <div className="ecp-body">
        <div className="ecp-left">
          <div className="ecp-section">
            <h2 className="ecp-section__title">고객 기본 정보</h2>
            <div className="ecp-profile">
              <div className="ecp-profile__avatar-wrap">
                <Avatar name={c.name} size={64} />
              </div>
              <div className="ecp-profile__info">
                <div className="ecp-profile__name-row">
                  <span className="ecp-profile__name">{c.name} 고객님</span>
                  <span className="ecp-grade-badge">{c.grade}</span>
                  <span className={`ecp-status-badge ecp-status-badge--${c.status.toLowerCase()}`}>
                    {c.status === "ACTIVE" ? "활성" : "비활성"}
                  </span>
                </div>
                <p className="ecp-profile__id">고객ID &nbsp; {c.customerId}</p>
              </div>
            </div>

            <div className="ecp-info-list">
              <div className="ecp-info-row"><Phone size={13} color="#aaa" /><span className="ecp-info-label">연락처</span><span className="ecp-info-value">{c.phone}</span></div>
              <div className="ecp-info-row"><Mail size={13} color="#aaa" /><span className="ecp-info-label">이메일</span><span className="ecp-info-value">{c.email}</span></div>
              <div className="ecp-info-row"><MapPin size={13} color="#aaa" /><span className="ecp-info-label">주소</span><span className="ecp-info-value">{c.address}</span></div>
              <div className="ecp-info-row"><Clock size={13} color="#aaa" /><span className="ecp-info-label">회원가입일</span><span className="ecp-info-value">{c.joinedAt}</span></div>
              <div className="ecp-info-row"><Clock size={13} color="#aaa" /><span className="ecp-info-label">선호 연락 시간</span><span className="ecp-info-value">{c.preferredContactTime}</span></div>
              <div className="ecp-info-row"><FileText size={13} color="#aaa" /><span className="ecp-info-label">메모</span><span className="ecp-info-value">{c.memo}</span></div>
            </div>

            <div className="ecp-as-stats">
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">총 A/S 건수</p><p className="ecp-as-stat__value">{c.totalAs}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">완료 건수</p><p className="ecp-as-stat__value">{c.doneAs}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">진행 중</p><p className="ecp-as-stat__value">{c.inProgressAs}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">취소/거절</p><p className="ecp-as-stat__value">{c.cancelledAs}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">총 결제 금액</p><p className="ecp-as-stat__value ecp-as-stat__value--amount">{c.totalPayment.toLocaleString()}원</p></div>
            </div>
          </div>

          <div className="ecp-section">
            <h2 className="ecp-section__title">A/S 이력</h2>
            <div className="ecp-as-tabs">
              {AS_STATUS_TABS.map(tab => (
                <button
                  key={tab}
                  className={`ecp-as-tab ${asTab === tab ? "ecp-as-tab--active" : ""}`}
                  onClick={() => setAsTab(tab)}
                >
                  {tab}{" "}
                  {tab === "전체" ? `(${c.totalAs})` : tab === "진행 중" ? `(${c.inProgressAs})` : tab === "완료" ? `(${c.doneAs})` : `(${c.cancelledAs})`}
                </button>
              ))}
            </div>

            <div className="ecp-as-table">
              <div className="ecp-as-table__header">
                <span>접수번호</span><span>접수일</span><span>제품명</span><span>증상</span>
                <span>상태</span><span>방문일</span><span>최종 결제금액</span><span></span>
              </div>
              {filteredAs.map(a => {
                const s = AS_STATUS_MAP[a.status] ?? { label: a.status, type: "pending" };
                return (
                  <div key={a.requestId} className="ecp-as-table__row">
                    <span className="ecp-as-table__id">{a.requestId}</span>
                    <span>{a.createdAt}</span>
                    <span>{a.productName}</span>
                    <span>{a.symptom}</span>
                    <span><span className={`ecp-as-badge ecp-as-badge--${s.type}`}>{s.label}</span></span>
                    <span>{a.visitDate}</span>
                    <span className="ecp-as-table__amount">{a.finalAmount ? `${a.finalAmount.toLocaleString()}원` : "-"}</span>
                    <span><ChevronRight size={14} color="#aaa" /></span>
                  </div>
                );
              })}
            </div>
            <button className="ecp-more-btn">전체 A/S 이력 보기 <ChevronRight size={13} /></button>
          </div>
        </div>

        <aside className="ecp-right">
          <div className="ecp-panel">
            <div className="ecp-panel__header">
              <h3 className="ecp-panel__title">보유 가전 목록 ({c.appliances.length})</h3>
              <button className="ecp-panel__link">전체 보기</button>
            </div>
            <div className="ecp-appliance-list">
              {c.appliances.map(a => {
                const s = APPLIANCE_STATUS_MAP[a.status];
                return (
                  <div key={a.applianceId} className="ecp-appliance-item">
                    <ApplianceImg imageUrl={a.imageUrl} size={56} />
                    <div className="ecp-appliance-item__info">
                      <p className="ecp-appliance-item__name">{a.brand} {a.modelName}</p>
                      <p className="ecp-appliance-item__model">모델명 &nbsp; {a.modelNo}</p>
                      <p className="ecp-appliance-item__purchase">구매일 &nbsp; {a.purchaseDate}</p>
                    </div>
                    <div className="ecp-appliance-item__right">
                      <span className={`ecp-appliance-badge ecp-appliance-badge--${s.type}`}>{s.label}</span>
                      <p className="ecp-appliance-item__registered">제품 등록일<br />{a.registeredAt}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ecp-panel">
            <h3 className="ecp-panel__title">진행 중인 작업</h3>
            {c.inProgressWork && (
              <div className="ecp-inprogress-card">
                <div className="ecp-inprogress-card__header">
                  <span className="ecp-inprogress-card__id">{c.inProgressWork.requestId}</span>
                  <span className={`ecp-as-badge ecp-as-badge--${AS_STATUS_MAP[c.inProgressWork.status]?.type}`}>
                    {AS_STATUS_MAP[c.inProgressWork.status]?.label}
                  </span>
                </div>
                <div className="ecp-inprogress-card__body">
                  <ApplianceImg imageUrl={null} size={44} />
                  <div>
                    <p className="ecp-inprogress-card__product">{c.inProgressWork.productName}</p>
                    <p className="ecp-inprogress-card__symptom">{c.inProgressWork.symptom}</p>
                  </div>
                </div>
                <div className="ecp-inprogress-card__detail">
                  <div className="ecp-inprogress-card__row">
                    <Clock size={12} color="#aaa" />
                    <span className="ecp-inprogress-card__label">방문 예정일</span>
                    <span>{c.inProgressWork.visitDate}</span>
                  </div>
                  <div className="ecp-inprogress-card__row">
                    <ChevronRight size={12} color="#aaa" />
                    <span className="ecp-inprogress-card__label">진행 상태</span>
                    <span>{c.inProgressWork.progressStatus}</span>
                  </div>
                </div>
                <button className="ecp-inprogress-card__btn">상세 보기 <ChevronRight size={13} /></button>
              </div>
            )}
          </div>

          <div className="ecp-panel">
            <div className="ecp-panel__header">
              <h3 className="ecp-panel__title">최근 상담/메모</h3>
              <button className="ecp-panel__link">전체 보기 <ChevronRight size={12} /></button>
            </div>
            <div className="ecp-memo-list">
              {c.memos.map((m, i) => (
                <div key={i} className="ecp-memo-item">
                  <p className="ecp-memo-item__date">{m.date}</p>
                  <p className="ecp-memo-item__content">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}