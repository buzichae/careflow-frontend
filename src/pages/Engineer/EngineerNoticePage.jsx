import { useState } from "react";
import {
  Bell, Truck, GraduationCap, ShieldCheck, Wrench,
  Search, ChevronLeft, ChevronRight, MoreVertical, CheckCheck,
} from "lucide-react";
import "../../styles/Engineer/EngineerNoticePage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/notifications?type=&page=0&size=10
// notifications WHERE user_id = 로그인기사
// ORDER BY created_at DESC
//
// DB notifications 컬럼:
//   notification_id, user_id, type, title, body, channel, created_at
//
// type ENUM: AS_STATUS / CONSUMABLE / WARRANTY / LMS
//
// ⚠ DB에 없어서 제거한 항목:
//   - is_read (v7에서 삭제됨) → 읽음/안읽음 상태 없음
//   - 정산 알림 타입 → DB ENUM에 없음
//   - 시스템 알림 타입 → DB ENUM에 없음
//   - 알림 설정 토글 → DB에 없음
//   - 중요 알림 섹션 → DB에 없음
// ──────────────────────────────────────────

// DB type ENUM 기준 탭
const TABS = [
  { key: "ALL",       label: "전체",    count: 12 },
  { key: "AS_STATUS", label: "작업/배정", count: 5  },
  { key: "LMS",       label: "교육",    count: 3  },
  { key: "CONSUMABLE",label: "소모품",  count: 2  },
  { key: "WARRANTY",  label: "무상기간", count: 2  },
];

// DB type → 아이콘/색상 매핑
const TYPE_MAP = {
  AS_STATUS:  { label: "작업/배정", icon: Truck,         color: "purple", bg: "#eeeaff" },
  LMS:        { label: "교육",     icon: GraduationCap, color: "green",  bg: "#eaf3de" },
  CONSUMABLE: { label: "소모품",   icon: Wrench,        color: "orange", bg: "#fef0e0" },
  WARRANTY:   { label: "무상기간", icon: ShieldCheck,   color: "blue",   bg: "#e6f1fb" },
};

// 더미 데이터 - notifications.title, body, type, channel, created_at 기준
const notificationList = [
  {
    id: 1, notificationId: "NOT-20240618-001",
    type: "AS_STATUS",
    title: "새로운 작업이 배정되었습니다.",
    body: "냉장고 수리 (AS-20240618-0001) 작업이 배정되었습니다.",
    channel: "SSE",
    createdAt: "2024.06.18 09:30",
  },
  {
    id: 2, notificationId: "NOT-20240617-002",
    type: "LMS",
    title: "2024년 필수 LMS 교육을 이수해주세요.",
    body: "미이수 시 배차 제한이 적용될 수 있습니다.",
    channel: "PUSH",
    createdAt: "2024.06.17 14:20",
  },
  {
    id: 3, notificationId: "NOT-20240617-003",
    type: "AS_STATUS",
    title: "작업 일정 변경 알림",
    body: "내일 오전 작업 시간이 변경되었습니다.",
    channel: "SSE",
    createdAt: "2024.06.17 11:05",
  },
  {
    id: 4, notificationId: "NOT-20240616-004",
    type: "AS_STATUS",
    title: "작업 보고서 작성 항목이 변경되었습니다.",
    body: "6월부터 보고서 제출 항목이 변경됩니다.",
    channel: "SSE",
    createdAt: "2024.06.16 16:40",
  },
  {
    id: 5, notificationId: "NOT-20240616-005",
    type: "CONSUMABLE",
    title: "소모품 교체 주기 알림",
    body: "담당 고객 에어컨 필터 교체 주기가 도래했습니다.",
    channel: "PUSH",
    createdAt: "2024.06.16 09:00",
  },
  {
    id: 6, notificationId: "NOT-20240615-006",
    type: "WARRANTY",
    title: "무상 A/S 기간 만료 임박 알림",
    body: "홍길동 고객의 LG 에어컨 무상기간이 30일 남았습니다.",
    channel: "SSE",
    createdAt: "2024.06.15 18:30",
  },
];

const statCards = [
  { key: "ALL",       label: "전체 알림",  value: 12, icon: Bell,          color: "purple" },
  { key: "AS_STATUS", label: "작업/배정",  value: 5,  icon: Truck,         color: "blue"   },
  { key: "LMS",       label: "교육",      value: 3,  icon: GraduationCap, color: "green"  },
  { key: "CONSUMABLE",label: "소모품",    value: 2,  icon: Wrench,        color: "orange" },
  { key: "WARRANTY",  label: "무상기간",  value: 2,  icon: ShieldCheck,   color: "teal"   },
];

function NotifIcon({ type }) {
  const t = TYPE_MAP[type];
  const Icon = t.icon;
  return (
    <div className="enp-notif-icon" style={{ background: t.bg }}>
      <Icon size={16} color={`var(--enp-${t.color})`} />
    </div>
  );
}

export default function EngineerNoticePage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2;

  const filteredList = activeTab === "ALL"
    ? notificationList
    : notificationList.filter(n => n.type === activeTab);

  return (
    <div className="enp">
      {/* 헤더 */}
      <div className="enp-header">
        <h1 className="enp-header__title">알림</h1>
        <p className="enp-header__sub">작업 배정, 일정, 공지 등 중요한 알림을 확인하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="enp-stats">
        {statCards.map((s) => (
          <div key={s.key} className="enp-stat-card" onClick={() => setActiveTab(s.key)}>
            <div className={`enp-stat-card__icon enp-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
            <div>
              <p className="enp-stat-card__label">{s.label}</p>
              <p className="enp-stat-card__value">{s.value}<span>건</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* 탭 + 필터 */}
      <div className="enp-tab-bar">
        <div className="enp-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`enp-tab ${activeTab === tab.key ? "enp-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className={`enp-tab__count ${activeTab === tab.key ? "enp-tab__count--active" : ""}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="enp-tab-actions">
          <div className="enp-search">
            <Search size={13} color="#aaa" />
            <input type="text" placeholder="알림 제목 검색" />
          </div>
          <button className="enp-read-all-btn"><CheckCheck size={13} /> 모두 읽음 처리</button>
        </div>
      </div>

      {/* 목록 */}
      <div className="enp-table">
        <div className="enp-table__header">
          <span><input type="checkbox" /></span>
          <span>알림 내용</span>
          <span>유형</span>
          <span>채널</span>
          <span>시간</span>
          <span></span>
        </div>

        {filteredList.map((item) => {
          const typeInfo = TYPE_MAP[item.type];
          return (
            <div key={item.id} className="enp-table__row">
              <span><input type="checkbox" /></span>
              <span className="enp-table__content-col">
                <NotifIcon type={item.type} />
                <div>
                  <p className="enp-table__title">{item.title}</p>
                  <p className="enp-table__body">{item.body}</p>
                </div>
              </span>
              <span>
                <span className={`enp-type-badge enp-type-badge--${typeInfo.color}`}>{typeInfo.label}</span>
              </span>
              <span className="enp-table__channel">{item.channel}</span>
              <span className="enp-table__time">{item.createdAt}</span>
              <span>
                <button className="enp-more-btn"><MoreVertical size={14} /></button>
              </span>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      <div className="enp-pagination">
        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
        {[1, 2].map(p => (
          <button key={p} className={currentPage === p ? "enp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
        ))}
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}