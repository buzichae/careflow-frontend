import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell, Mail, Calendar, AlertCircle,
  ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, X, CheckCheck,
  ClipboardList, Wrench, ShieldCheck, GraduationCap,
} from "lucide-react";
import "../../styles/Agency/agency/Agencynoticepage.css";
import {
  getAgencyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../apis/agencyNotification";

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

// 생성 시각 기준 상대 시간 계산
function computeTimeAgo(createdAt) {
  if (!createdAt) return "-";
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "어제";
  return `${days}일 전`;
}

// LocalDateTime 문자열을 표시용 포맷으로 변환
function formatCreatedAt(createdAt) {
  if (!createdAt) return "-";
  const d = new Date(createdAt);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// API 응답 NotificationItem → 컴포넌트 내부 형식으로 매핑
// 백엔드가 isRead(boolean) 필드를 내려주므로 그대로 사용
function mapItem(item) {
  return {
    id: item.notificationId,
    notificationId: `NOT-${String(item.notificationId).padStart(8, "0")}`,
    type: item.type,
    title: item.title,
    body: item.body,
    channel: item.channel,
    createdAt: formatCreatedAt(item.createdAt),
    timeAgo: computeTimeAgo(item.createdAt),
    isRead: item.isRead ?? false,
    detail: {
      content: item.body || item.title,
      confirmedAt: null,
    },
  };
}

// 페이지 번호 배열 생성 (최대 5개, 현재 페이지 중앙)
function buildPageNumbers(current, total) {
  if (total <= 1) return [1];
  const half = 2;
  let start = Math.max(1, current - half);
  let end   = Math.min(total, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  const nums = [];
  for (let p = start; p <= end; p++) nums.push(p);
  return nums;
}

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
  const [activeTab,    setActiveTab]    = useState("ALL");
  const [currentPage,  setCurrentPage]  = useState(1);       // 1-based
  const [selectedItem, setSelectedItem] = useState(null);
  const [autoRefresh,  setAutoRefresh]  = useState(true);

  // API 상태
  const [stats,         setStats]         = useState({ totalCount: 0, unreadCount: 0, todayCount: 0 });
  const [notifications, setNotifications] = useState([]);
  const [totalPages,    setTotalPages]    = useState(1);
  const [loading,       setLoading]       = useState(false);

  // 읽음/전체읽음 처리 중 중복 클릭 방지
  const [markingAll, setMarkingAll] = useState(false);

  const timerRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await getAgencyNotifications({ page: currentPage - 1, size: 10, type: activeTab });
      const data = res.data;
      setStats(data.stats ?? { totalCount: 0, unreadCount: 0, todayCount: 0 });
      setNotifications((data.content ?? []).map(mapItem));
      setTotalPages(data.totalPages || 1);
    } catch {
      // 에러 시 기존 데이터 유지
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage]);

  // 탭 또는 페이지 변경 시 재조회
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 자동 새로고침 (30초 폴링)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRefresh) {
      timerRef.current = setInterval(fetchNotifications, 30000);
    }
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, fetchNotifications]);

  // 탭 전환 시 페이지 초기화
  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
    setSelectedItem(null);
  };

  // 알림 상세 열기 + 읽음 처리
  // PATCH .../{id}/read 는 unreadCount를 내려주지 않으므로,
  // 성공 후 목록을 재조회해서 최신 stats.unreadCount를 반영한다 (백엔드 확정 방식)
  const handleSelectItem = async (item) => {
    setSelectedItem(item);

    if (item.isRead) return; // 이미 읽은 알림이면 API 호출 불필요

    try {
      await markNotificationAsRead(item.id);
      await fetchNotifications();
    } catch (err) {
      console.error("알림 읽음 처리 실패:", err);
      // 읽음 처리는 실패해도 상세보기 자체는 유지 (사용자 흐름 방해 X)
    }
  };

  // 전체 읽음 처리
  // 결과가 결정적(전체 읽음 → unreadCount는 반드시 0)이므로 재조회 없이 로컬에서 바로 갱신
  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setStats(prev => ({ ...prev, unreadCount: 0 }));
    } catch (err) {
      console.error("전체 읽음 처리 실패:", err);
      alert("전체 읽음 처리에 실패했습니다.");
    } finally {
      setMarkingAll(false);
    }
  };

  const statCards = [
    { label: "전체 알림",      value: stats.totalCount,  icon: Bell,        color: "purple" },
    { label: "읽지 않은 알림", value: stats.unreadCount, icon: Mail,        color: "orange" },
    { label: "오늘 발생 알림", value: stats.todayCount,  icon: Calendar,    color: "blue"   },
    { label: "중요 알림",      value: 0,                  icon: AlertCircle, color: "red"    },
  ];

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

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
                <button
                  key={tab.key}
                  className={`anp-tab ${activeTab === tab.key ? "anp-tab--active" : ""}`}
                  onClick={() => handleTabChange(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              className="anp-action-btn"
              onClick={handleMarkAllRead}
              disabled={markingAll || stats.unreadCount === 0}
            >
              <CheckCheck size={13} /> {markingAll ? "처리 중..." : "모두 읽음 처리"}
            </button>
          </div>

          <div className="anp-table">
            <div className="anp-table__header">
              <span>알림</span><span>유형</span><span>채널</span><span>발생 시간</span><span></span>
            </div>

            {loading && (
              <div style={{ padding: "24px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                불러오는 중...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                알림이 없습니다.
              </div>
            )}

            {!loading && notifications.map((item) => {
              const typeInfo = TYPE_MAP[item.type] ?? TYPE_MAP["AS_STATUS"];
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`anp-table__row ${isSelected ? "anp-table__row--selected" : ""} ${!item.isRead ? "anp-table__row--unread" : ""}`}
                >
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
                    <button
                      className={`anp-detail-btn ${isSelected ? "anp-detail-btn--active" : ""}`}
                      onClick={() => handleSelectItem(item)}
                    >
                      상세
                    </button>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="anp-pagination">
            <div className="anp-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {pageNumbers.map(p => (
                <button
                  key={p}
                  className={currentPage === p ? "anp-pagination__active" : ""}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              {totalPages > pageNumbers[pageNumbers.length - 1] && (
                <>
                  <span className="anp-pagination__ellipsis">...</span>
                  <button
                    className={currentPage === totalPages ? "anp-pagination__active" : ""}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
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
                <span className={`anp-type-badge anp-type-badge--${(TYPE_MAP[selectedItem.type] ?? TYPE_MAP["AS_STATUS"]).color}`}>
                  {(TYPE_MAP[selectedItem.type] ?? TYPE_MAP["AS_STATUS"]).label}
                </span>
              </div>
              <p className="anp-detail__id">{selectedItem.notificationId}</p>
              <div className="anp-detail__row"><span className="anp-detail__label">발생 시간</span><span className="anp-detail__value">{selectedItem.createdAt}</span></div>
              <div className="anp-detail__row"><span className="anp-detail__label">발송 채널</span><span className="anp-detail__value">{selectedItem.channel}</span></div>

              <div className="anp-detail__section">
                <p className="anp-detail__section-label">제목</p>
                <div className="anp-detail__content-box">
                  <p className="anp-detail__content">{selectedItem.title}</p>
                </div>
              </div>

              <div className="anp-detail__section">
                <p className="anp-detail__section-label">내용</p>
                <div className="anp-detail__content-box">
                  <p className="anp-detail__content">{selectedItem.detail?.content}</p>
                </div>
              </div>
            </div>

            <div className="anp-detail__footer">
              <button className="anp-detail__footer-btn anp-detail__footer-btn--primary" onClick={() => setSelectedItem(null)}>닫기</button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}