import { NavLink } from "react-router-dom";
import "../../styles/Sidebars.css";

const MENU = [
  { label: "운영 대시보드", path: "/admin/dashboard", icon: "⊞" },
  { label: "회원 관리", path: "/admin/members", icon: "👥" },
  { label: "A/S 운영", path: "/admin/as", icon: "🔧" },
  { label: "정산 관리", path: "/admin/settlement", icon: "💰" },
  { label: "통계 · 인사이트", path: "/admin/statistics", icon: "📊" },
  { label: "시스템 설정", path: "/admin/settings", icon: "⚙️" },
];

export default function AdminSidebar() {
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
    </aside>
  );
}