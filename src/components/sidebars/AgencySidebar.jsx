import { NavLink } from "react-router-dom";
import "../../styles/Sidebars.css";

const MENU = [
  { label: "대시보드", path: "/agency/dashboard", icon: "⊞" },
  { label: "작업 관리", path: "/agency/work", icon: "📋" },
  { label: "기사 관리", path: "/agency/engineers", icon: "👥" },
  { label: "정산 관리", path: "/agency/settlement", icon: "💰" },
  { label: "고객 관리", path: "/agency/customers", icon: "👤" },
  { label: "평가 및 리뷰", path: "/agency/reviews", icon: "⭐" },
  { label: "통계 및 리포트", path: "/agency/statistics", icon: "📊" },
  { label: "공지사항", path: "/agency/notice", icon: "🔔" },
  { label: "설정", path: "/agency/settings", icon: "⚙️" },
];

export default function AgencySidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span>💜</span> CareFlow
      </div>
      <nav className="sidebar__nav">
        {MENU.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__item ${isActive ? "sidebar__item--active" : ""}`
            }
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">
        <p className="sidebar__cs-label">고객센터</p>
        <p className="sidebar__cs-number">1588-1234</p>
        <p className="sidebar__cs-hours">평일 09:00 - 18:00</p>
        <button className="sidebar__cs-btn">💬 문의하기</button>
      </div>
    </aside>
  );
}