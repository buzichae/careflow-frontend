import { useState } from "react";
import {
  Bell, Mail, Calendar, AlertCircle,
  ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, X, CheckCheck,
  ClipboardList, Wrench, ShieldCheck, GraduationCap,
} from "lucide-react";
import "../../styles/Agency/agency/Agencynoticepage.css";

const NOTICE_TABS = [
  { key: "ALL",        label: "전체"      },
  { key: "AS_STATUS",  label: "AS 상태"   },
  { key: "CONSUMABLE", label: "소모품"    },
  { key: "WARRANTY",   label: "무상기간"  },
  { key: "LMS",        label: "LMS 교육" },
];

const TYPE_MAP = {
  AS_STATUS:  { label: "AS 상태",  icon: ClipboardList, color: "purple", bgColor: "#eeeaff" },
  CONSUMABLE: { label: "소모품",   icon: Wrench,        color: "orange", bgColor: "#fef0e0" },
  WARRANTY:   { label: "무상기간", icon: ShieldCheck,   color: "blue",   bgColor: "#e6f1fb" },
  LMS:        { label: "LMS 교육", icon: GraduationCap, color: "green",  bgColor: "#eaf3de" },
};

const statCards = [
  { label: "전체 알림",      value: 1248, icon: Bell,        color: "purple" },
  { label: "읽지 않은 알림", value: 18,   icon: Mail,        color: "orange" },
  { label: "오늘 발생 알림", value: 42,   icon: Calendar,    color: "blue"   },
  { label: "중요 알림",      value: 5,    icon: AlertCircle, color: "red"    },
];

const notificationList = [
  { id: 1, notificationId: "NOT-20240618-001", type: "AS_STATUS",  title: "김철수 기사님이 배정을 수락했습니다.",           body: "AS-20240618-0105 | 김민지 고객 | LG 디오스 냉장고", channel: "SSE",   createdAt: "2024-06-18 14:35:22", timeAgo: "3분 전",    isRead: false, detail: { requestId: "AS-20240618-0105", engineerName: "김철수 기사", engineerRating: 4.9, engineerPhone: "010-1111-2222", customerName: "김민지 고객", productName: "LG 디오스 냉장고", content: "김철수 기사님이 배정을 수락했습니다. 작업 일시: 2024.06.18 (화) 15:30", confirmedAt: "2024.06.18 (화) 14:38:10" } },
  { id: 2, notificationId: "NOT-20240618-002", type: "AS_STATUS",  title: "AS-20240618-0103 작업이 완료되었습니다.",         body: "이영호 기사 | 박준호 고객",                          channel: "SSE",   createdAt: "2024-06-18 13:30:00", timeAgo: "1시간 전",  isRead: false, detail: { requestId: "AS-20240618-0103", engineerName: "이영호 기사", engineerRating: 4.7, engineerPhone: "010-3333-4444", customerName: "박준호 고객", productName: "LG 에어컨", content: "AS-20240618-0103 작업이 완료되었습니다.", confirmedAt: "2024.06.18 (화) 13:45:00" } },
  { id: 3, notificationId: "NOT-20240618-003", type: "LMS",        title: "홍길동 기사님이 LMS 필수 교육을 미이수 상태입니다.", body: "배차 대상에서 제외됩니다.",                           channel: "SSE",   createdAt: "2024-06-18 13:00:00", timeAgo: "1시간 전",  isRead: false, detail: { content: "홍길동 기사님(ENG-00128)이 LMS 필수 교육을 미이수 상태입니다.", confirmedAt: null } },
  { id: 4, notificationId: "NOT-20240618-004", type: "AS_STATUS",  title: "배정 요청이 재배차 되었습니다.",                   body: "AS-20240618-0102 | 30분 내 미수락",                 channel: "SSE",   createdAt: "2024-06-18 12:00:00", timeAgo: "2시간 전",  isRead: true,  detail: { requestId: "AS-20240618-0102", content: "AS-20240618-0102 배정 요청이 30분 내 미수락으로 재배차 되었습니다.", confirmedAt: "2024.06.18 (화) 12:05:00" } },
  { id: 5, notificationId: "NOT-20240618-005", type: "WARRANTY",   title: "김민지 고객의 LG 에어컨 무상 A/S 기간이 곧 만료됩니다.", body: "만료일: 2024.07.01 | appliance_id: 105",         channel: "PUSH",  createdAt: "2024-06-18 10:00:00", timeAgo: "4시간 전",  isRead: true,  detail: { content: "김민지 고객의 LG 에어컨(appliance_id: 105) 무상 A/S 기간이 2024.07.01에 만료됩니다.", confirmedAt: "2024.06.18 (화) 10:10:00" } },
  { id: 6, notificationId: "NOT-20240618-006", type: "CONSUMABLE", title: "이영희 고객의 삼성 세탁기 필터 교체 주기가 도래했습니다.", body: "소모품: 세탁기 필터 | 교체 주기: 6개월",            channel: "KAKAO", createdAt: "2024-06-18 09:00:00", timeAgo: "5시간 전",  isRead: true,  detail: { content: "이영희 고객의 삼성 세탁기(appliance_id: 203) 필터 교체 주기(6개월)가 도래했습니다.", confirmedAt: "2024.06.18 (화) 09:15:00" } },
  { id: 7, notificationId: "NOT-20240617-007", type: "LMS",        title: "2024년 LMS 필수 교육 이수 기한이 30일 남았습니다.", body: "미이수 기사: 3명",                                  channel: "SSE",   createdAt: "2024-06-17 09:00:00", timeAgo: "어제 09:00", isRead: true, detail: { content: "2024년 LMS 필수 교육 이수 기한이 30일 남았습니다. 미이수 기사 3명에게 안내해 주세요.", confirmedAt: "2024.06.17 (월) 09:30:00" } },
  { id: 8, notificationId: "NOT-20240617-008", type: "AS_STATUS",  title: "AS-20240617-0099 작업이 완료되었습니다.",         body: "김수현 기사 | 오하나 고객",                          channel: "SSE",   createdAt: "2024-06-17 18:10:00", timeAgo: "어제 18:10", isRead: true, detail: { requestId: "AS-20240617-0099", engineerName: "김수현 기사", engineerRating: 4.5, engineerPhone: "010-7777-8888", customerName: "오하나 고객", productName: "삼성 세탁기", content: "AS-20240617-0099 작업이 완료되었습니다.", confirmedAt: "2024.06.17 (월) 18:20:00" } },
];

function NoticeIcon({ type }) {
  const t = TYPE_MAP[type] ?? TYPE_MAP["AS_STATUS"];
  const Icon = t.icon;
  return (
    <div className="anp-notice-icon" style={{ background: t.bgColor }}>
      <Icon size={15} style={{ color: `var(--anp-${t.color})` }} />
    </div>
  );
}

export default function AgencyNoticePage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const totalPages = 21;

  const filteredList = activeTab === "ALL"
    ? notificationList
    : notificationList.filter((n) => n.type === activeTab);

  return (
    <div className="anp">
      {/* 헤더 */}
      <div className="anp-header">
        <div>
          <h1 className="anp-header__title">알림센터</h1>
          <p className="anp-header__sub">전체 알림 내역을 확인하고 관리할 수 있습니다.</p>
        </div>
        <div className="anp-refresh-bar">
          <span className="anp-refresh-label">자동 새로고침</span>
          <div className={`anp-toggle ${autoRefresh ? "anp-toggle--on" : ""}`} onClick={() => setAutoRefresh(p => !p)}>
            <div className="anp-toggle__thumb" />
          </div>
          <div className="anp-refresh-select">30초 <ChevronDown size={13} /></div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="anp-stats">
        {statCards.map((s) => (
          <div key={s.label} className="anp-stat-card">
            <div className="anp-stat-card__text">
              <p className="anp-stat-card__value">{s.value.toLocaleString()}<span>건</span></p>
              <p className="anp-stat-card__label">{s.label}</p>
            </div>
            <div className={`anp-stat-card__icon anp-stat-card__icon--${s.color}`}>
              <s.icon size={40} strokeWidth={1} />
            </div>
          </div>
        ))}
      </div>

      <div className="anp-body">
        <div className="anp-left">
          <div className="anp-tab-bar">
            <div className="anp-tabs">
              {NOTICE_TABS.map((tab) => (
                <button key={tab.key} className={`anp-tab ${activeTab === tab.key ? "anp-tab--active" : ""}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>
              ))}
            </div>
            <button className="anp-action-btn"><CheckCheck size={13} /> 모두 읽음 처리</button>
          </div>

          <div className="anp-table">
            <div className="anp-table__header">
              <span>알림</span><span>유형</span><span>채널</span><span>발생 시간</span><span></span>
            </div>
            {filteredList.map((item) => {
              const typeInfo = TYPE_MAP[item.type];
              const isSelected = selectedItem?.id === item.id;
              return (
                <div key={item.id} className={`anp-table__row ${isSelected ? "anp-table__row--selected" : ""} ${!item.isRead ? "anp-table__row--unread" : ""}`}>
                  <span className="anp-table__notice-col">
                    {!item.isRead && <span className="anp-unread-dot" />}
                    <NoticeIcon type={item.type} />
                    <div>
                      <p className="anp-table__title">{item.title}</p>
                      <p className="anp-table__body">{item.body}</p>
                    </div>
                  </span>
                  <span><span className={`anp-type-badge anp-type-badge--${typeInfo.color}`}>{typeInfo.label}</span></span>
                  <span className="anp-table__channel">{item.channel}</span>
                  <span className="anp-table__time">{item.timeAgo}</span>
                  <span>
                    <button className={`anp-detail-btn ${isSelected ? "anp-detail-btn--active" : ""}`} onClick={() => setSelectedItem(item)}>상세</button>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="anp-pagination">
            <div className="anp-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {[1,2,3,4,5].map(p => (<button key={p} className={currentPage === p ? "anp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>))}
              <span className="anp-pagination__ellipsis">...</span>
              <button className={currentPage === 21 ? "anp-pagination__active" : ""} onClick={() => setCurrentPage(21)}>21</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="anp-page-size">10개씩 보기 <ChevronDown size={13} /></div>
          </div>
        </div>

        {selectedItem && (
          <aside className="anp-detail">
            <div className="anp-detail__header">
              <span className="anp-detail__title">알림 상세 정보</span>
              <button className="anp-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
            </div>
            <div className="anp-detail__body">
              <div className="anp-detail__badge-row">
                <span className={`anp-type-badge anp-type-badge--${TYPE_MAP[selectedItem.type].color}`}>{TYPE_MAP[selectedItem.type].label}</span>
              </div>
              <p className="anp-detail__id">{selectedItem.notificationId}</p>
              <div className="anp-detail__row"><span className="anp-detail__label">발생 시간</span><span className="anp-detail__value">{selectedItem.createdAt}</span></div>
              <div className="anp-detail__row"><span className="anp-detail__label">발송 채널</span><span className="anp-detail__value">{selectedItem.channel}</span></div>

              {selectedItem.detail?.engineerName && (
                <div className="anp-detail__section">
                  <p className="anp-detail__section-label">대상 기사</p>
                  <div className="anp-detail__engineer-card">
                    <div className="anp-detail__engineer-avatar">{selectedItem.detail.engineerName.charAt(0)}</div>
                    <div>
                      <p className="anp-detail__engineer-name">
                        {selectedItem.detail.engineerName}
                        {selectedItem.detail.engineerRating && <span className="anp-detail__engineer-rating"> ⭐ {selectedItem.detail.engineerRating}</span>}
                      </p>
                      {selectedItem.detail.engineerPhone && <p className="anp-detail__engineer-phone">{selectedItem.detail.engineerPhone}</p>}
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.detail?.requestId && (
                <div className="anp-detail__section">
                  <p className="anp-detail__section-label">관련 작업</p>
                  <div className="anp-detail__info-row"><span className="anp-detail__label">접수 번호</span><span className="anp-detail__value anp-detail__value--id">{selectedItem.detail.requestId}</span></div>
                  {selectedItem.detail.customerName && <div className="anp-detail__info-row"><span className="anp-detail__label">고객</span><span className="anp-detail__value">{selectedItem.detail.customerName}</span></div>}
                  {selectedItem.detail.productName  && <div className="anp-detail__info-row"><span className="anp-detail__label">제품</span><span className="anp-detail__value">{selectedItem.detail.productName}</span></div>}
                </div>
              )}

              <div className="anp-detail__section">
                <p className="anp-detail__section-label">내용</p>
                <div className="anp-detail__content-box">
                  <p className="anp-detail__content">{selectedItem.detail?.content}</p>
                </div>
              </div>

              {selectedItem.detail?.confirmedAt && (
                <div className="anp-detail__section">
                  <div className="anp-detail__info-row">
                    <span className="anp-detail__label">확인 시간</span>
                    <span className="anp-detail__value">{selectedItem.detail.confirmedAt}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="anp-detail__footer">
              {selectedItem.detail?.requestId && (
                <button className="anp-detail__footer-btn anp-detail__footer-btn--outline">관련 작업 보기</button>
              )}
              <button className="anp-detail__footer-btn anp-detail__footer-btn--primary" onClick={() => setSelectedItem(null)}>닫기</button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}