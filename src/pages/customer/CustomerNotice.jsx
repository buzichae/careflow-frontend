import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Shield,
  Wrench,
  CheckCheck,
} from "lucide-react";
import "../../styles/Customer/CustomerNotice.css";
import {
  getMyNotifications,
  getNotificationSummary,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../apis/customerNotifications";

/* ─── 타입 메타 (DB enum 기준) ─── */
const TYPE_META = {
  AS_STATUS: {
    label: "A/S 단계 변경",
    color: "#3b82f6",
    bg: "#eff6ff",
    Icon: Wrench,
  },
  CONSUMABLE: {
    label: "소모품 교체",
    color: "#f59e0b",
    bg: "#fff7e6",
    Icon: RefreshCw,
  },
  WARRANTY: {
    label: "무상 A/S 만료",
    color: "#734bcf",
    bg: "#f0edff",
    Icon: Shield,
  },
};

const KPI_KEYS = [
  { key: "전체", typeKey: null, label: "전체", Icon: Bell },
  {
    key: "AS_STATUS",
    typeKey: "AS_STATUS",
    label: "A/S 단계 변경",
    Icon: Wrench,
  },
  {
    key: "CONSUMABLE",
    typeKey: "CONSUMABLE",
    label: "소모품 교체",
    Icon: RefreshCw,
  },
  {
    key: "WARRANTY",
    typeKey: "WARRANTY",
    label: "무상 A/S 만료",
    Icon: Shield,
  },
];

const EMPTY_STATS = {
  total: { count: 0, unreadCount: 0 },
  AS_STATUS: { count: 0, unreadCount: 0 },
  CONSUMABLE: { count: 0, unreadCount: 0 },
  WARRANTY: { count: 0, unreadCount: 0 },
};

/* ─── 메인 ─── */
export default function CustomerNotice() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [activeTab, setActiveTab] = useState("전체");
  const [page, setPage] = useState(0); // 0-indexed (백엔드 Page 규격에 맞춤)
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState(EMPTY_STATS);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getNotificationSummary();
      setStats({ ...EMPTY_STATS, ...res.data });
    } catch (e) {
      console.error("알림 요약 조회 실패", e);
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyNotifications({
        type: activeCategory,
        unreadOnly: activeTab === "안읽음",
        page,
        size: 10,
      });
      setNotifications(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (e) {
      console.error("알림 목록 조회 실패", e);
      setError("알림을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeTab, page]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function handleCategoryChange(key) {
    setActiveCategory(key);
    setPage(0);
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setPage(0);
  }

  async function handleOpenNotification(item) {
    if (item.isRead) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
    );
    try {
      await markNotificationRead(item.id);
      fetchSummary();
    } catch (e) {
      console.error("읽음 처리 실패", e);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: false } : n)),
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      await Promise.all([fetchList(), fetchSummary()]);
    } catch (e) {
      console.error("모두 읽음 처리 실패", e);
      alert("모두 읽음 처리에 실패했습니다.");
    }
  }

  return (
    <div className="cn-wrap">
      {/* 카테고리 KPI 탭 */}
      <div className="cn-kpi-grid">
        {KPI_KEYS.map(({ key, typeKey, label, Icon }) => {
          const stat = typeKey ? stats[typeKey] : stats.total;
          return (
            <button
              key={key}
              className={`cn-kpi${activeCategory === key ? " cn-kpi--active" : ""}${(stat?.unreadCount ?? 0) > 0 ? " cn-kpi--has-unread" : ""}`}
              onClick={() => handleCategoryChange(key)}
            >
              <div className="cn-kpi__text">
                <p className="cn-kpi__value">
                  {stat?.count ?? 0}
                  <span>건</span>
                </p>
                <p className="cn-kpi__label">{label}</p>
                <p className="cn-kpi__unread">
                  읽지 않음 {stat?.unreadCount ?? 0}건
                </p>
              </div>
              <Icon className="cn-kpi__watermark" strokeWidth={1} />
            </button>
          );
        })}
      </div>

      {/* 서브 탭 + 툴바 */}
      <div className="cn-toolbar">
        <div className="cn-subtabs">
          {["전체", "안읽음"].map((t) => (
            <button
              key={t}
              className={`cn-subtab ${activeTab === t ? "cn-subtab--active" : ""}`}
              onClick={() => handleTabChange(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="cn-toolbar__right">
          <button className="cn-settings-open-btn" onClick={handleMarkAllRead}>
            <CheckCheck size={14} /> 모두 읽음 처리
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="cn-table">
        <div className="cn-table__head">
          <span className="cn-col-content">알림 내용</span>
          <span className="cn-col-target">관련 대상</span>
          <span className="cn-col-time">알림 시간</span>
          <span className="cn-col-status">상태</span>
        </div>

        {loading && <div className="cn-table-message">불러오는 중...</div>}
        {error && (
          <div className="cn-table-message" style={{ color: "#ef4444" }}>
            {error}
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="cn-table-message">알림이 없습니다.</div>
        )}

        {!loading &&
          !error &&
          notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? {
              label: n.type,
              color: "#aaa",
              bg: "#f5f5f5",
              Icon: Bell,
            };
            const { Icon: TypeIcon } = meta;
            return (
              <div
                key={n.id}
                className={`cn-row ${!n.isRead ? "cn-row--unread" : ""}`}
                onClick={() => handleOpenNotification(n)}
                style={{ cursor: n.isRead ? "default" : "pointer" }}
              >
                <span className="cn-col-content">
                  <span
                    className="cn-row__icon"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <TypeIcon size={14} />
                  </span>
                  <span className="cn-row__text">
                    <span className="cn-row__title">{n.title}</span>
                    <span className="cn-row__subject">{n.body}</span>
                  </span>
                </span>
                <span className="cn-col-target">
                  <span
                    className="cn-tag"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </span>
                <span className="cn-col-time">{n.createdAt}</span>
                <span className="cn-col-status">
                  <span
                    className={`cn-status ${n.isRead ? "cn-status--read" : "cn-status--unread"}`}
                  >
                    {n.isRead ? "읽음" : "안읽음"}
                  </span>
                </span>
              </div>
            );
          })}
      </div>

      {/* 페이지네이션 */}
      <div className="cn-pagination">
        <button
          className="cn-page-btn"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
          <button
            key={p}
            className={`cn-page-btn ${page === p ? "cn-page-btn--active" : ""}`}
            onClick={() => setPage(p)}
          >
            {p + 1}
          </button>
        ))}
        <button
          className="cn-page-btn"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
