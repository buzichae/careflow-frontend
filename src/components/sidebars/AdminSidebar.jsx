import { NavLink } from "react-router-dom";
import "../../styles/Sidebars.css";
import {House, UsersRound, ShieldCheck, HandCoins, ChartNoAxesCombined, Settings} from "lucide-react"

const MENU = [
  { label: "운영 대시보드", path: "/admin/dashboard", icon: (active) => <House size={18} color={ active ? "#ffffff" : "#000000"} />},
  { label: "회원 관리", path: "/admin/members", icon: (active) => <UsersRound size={18} color={ active ? "#ffffff" : "#000000"} />},
  { label: "A/S 운영", path: "/admin/as", icon: (active) => <ShieldCheck size={18} color={ active ? "#ffffff" : "#000000"} />},
  { label: "정산 관리", path: "/admin/settlement", icon: (active) => <HandCoins size={18} color={ active ? "#ffffff" : "#000000"} />},
  { label: "통계 · 인사이트", path: "/admin/statistics", icon: (active) => <ChartNoAxesCombined size={18} color={ active ? "#ffffff" : "#000000"} />},
  { label: "시스템 설정", path: "/admin/settings", icon: (active) => <Settings size={18} color={ active ? "#ffffff" : "#000000"} />},
];

export default function AdminSidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
  <img src="/src/assets/logo.png" alt="CareFlow" className="sidebar__logo-img" />
  CareFlow
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
                {({ isActive }) => (
                 <>
                 <span className="sidebar__icon">{item.icon(isActive)}</span>
                 <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}