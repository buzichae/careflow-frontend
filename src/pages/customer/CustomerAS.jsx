import { useState } from "react";
import { Bell, MessageSquare, ChevronDown } from "lucide-react";
import "../../styles/CustomerAS.css";

const AS_LIST = [
  {
    id: 1,
    appliance: "LG 오브제 냉장고",
    model: "M83FD421E",
    desc: "냉장이 잘 안돼요. (냉실 온도가 ...",
    datetime: "2026.06.16 (화) 10:00",
    engineerStatus: "전문 기사 배정 완료",
    status: "예약 확정",
    actions: ["상세보기", "예약 취소"],
  },
  {
    id: 2,
    appliance: "LG 오브제 냉장고",
    model: "M83FD421E",
    desc: "냉장이 잘 안돼요. (냉실 온도가 ...",
    datetime: "2026.06.16 (화) 10:00",
    engineerStatus: "전문 기사 배정 완료",
    status: "A/S 완료",
    actions: ["수리 보고서 보기", "기사님 리뷰 남기기"],
  },
  {
    id: 3,
    appliance: "LG 오브제 냉장고",
    model: "M83FD421E",
    desc: "냉장이 잘 안돼요. (냉실 온도가 ...",
    datetime: "2026.06.16 (화) 10:00",
    engineerStatus: "전문 기사 배정 완료",
    status: "A/S 완료",
    actions: ["수리 보고서 보기", "작성한 리뷰 보기"],
  },
];

const FILTER_TABS = ["전체", "접수 대기", "예약 확정", "수리 진행 중", "완료", "취소"];

const STATUS_STYLE = {
  "예약 확정": "purple",
  "A/S 완료": "green",
  "접수 대기": "gray",
  "수리 진행 중": "blue",
  "취소": "red",
};

const ACTION_STYLE = {
  "상세보기": "outline",
  "예약 취소": "outline",
  "수리 보고서 보기": "outline",
  "기사님 리뷰 남기기": "primary",
  "작성한 리뷰 보기": "outline",
};

export default function CustomerAS() {
  const [activeFilter, setActiveFilter] = useState("전체");

  const filtered = activeFilter === "전체"
    ? AS_LIST
    : AS_LIST.filter((item) => item.status === activeFilter);

  return (
    <div className="cas-wrap">
      {/* 헤더 */}
      <header className="cas-header">
        <h1>A/S 신청 · 예약</h1>
        <div className="cas-header__right">
          <button className="cas-icon-btn"><Bell size={20} /></button>
          <button className="cas-icon-btn"><MessageSquare size={20} /></button>
          <div className="cas-profile">
            <div className="cas-avatar">혜</div>
            <span>혜민님</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </header>

      {/* 통계 카드 */}
      <div className="cas-stats">
        <div className="cas-stat">
          <p className="cas-stat__label">전체 신청</p>
          <p className="cas-stat__num">4 <span>건</span></p>
        </div>
        <div className="cas-stat">
          <p className="cas-stat__label">진행 중</p>
          <p className="cas-stat__num">2 <span>건</span></p>
        </div>
        <div className="cas-stat cas-stat--alert">
          <p className="cas-stat__label">결제 대기 중</p>
          <p className="cas-stat__num cas-stat__num--red">1 <span>건</span></p>
        </div>
        <div className="cas-stat">
          <p className="cas-stat__label">이번 달 방문 예정</p>
          <p className="cas-stat__num">1 <span>건</span></p>
        </div>
      </div>

      {/* 내 신청 내역 + 예약 버튼 */}
      <div className="cas-list-header">
        <h2>내 신청 내역</h2>
        <button className="cas-reserve-btn">A/S 예약하기</button>
      </div>

      {/* 필터 탭 */}
      <div className="cas-filters">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            className={`cas-filter ${activeFilter === tab ? "cas-filter--active" : ""}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 신청 목록 */}
      <div className="cas-list">
        {filtered.length === 0 ? (
          <div className="cas-empty">해당 상태의 신청 내역이 없습니다.</div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="cas-item">
              <div className="cas-item__img" />
              <div className="cas-item__info">
                <div className="cas-item__title-row">
                  <span className="cas-item__name">{item.appliance}</span>
                  <span className="cas-item__model">{item.model}</span>
                </div>
                <p className="cas-item__desc">{item.desc}</p>
                <p className="cas-item__datetime">
                  {item.datetime}
                  <span className="cas-item__engineer">&nbsp;&nbsp;{item.engineerStatus}</span>
                </p>
              </div>
              <div className="cas-item__middle">
                <span className={`cas-badge cas-badge--${STATUS_STYLE[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <div className="cas-item__actions">
                {item.actions.map((action) => (
                  <button
                    key={action}
                    className={`cas-action-btn cas-action-btn--${ACTION_STYLE[action]}`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
