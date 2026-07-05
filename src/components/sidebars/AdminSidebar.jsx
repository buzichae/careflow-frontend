import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/Sidebars.css";
import { House, UsersRound, Wrench, BookOpen, HandCoins, Banknote } from "lucide-react";

const MENU = [
  {
    label: "운영 대시보드",
    path: "/admin/dashboard",
    icon: (active) => (
      <House size={18} color={active ? "#ffffff" : "#000000"} />
    ),
  },
  {
    label: "회원 관리",
    path: "/admin/members",
    icon: (active) => (
      <UsersRound size={18} color={active ? "#ffffff" : "#000000"} />
    ),
  },
  {
    label: "서비스 운영",
    path: "/admin/service",
    icon: (active) => (
      <Wrench size={18} color={active ? "#ffffff" : "#000000"} />
    ),
  },
  {
    label: "정산 관리",
    path: "/admin/settlement",
    icon: (active) => (
      <HandCoins size={18} color={active ? "#ffffff" : "#000000"} />
    ),
  },
  {
    label: "기사 지급 관리",
    path: "/admin/engineer-payouts",
    icon: (active) => (
      <Banknote size={18} color={active ? "#ffffff" : "#000000"} />
    ),
  },
  {
    label: "LMS 콘텐츠 관리",
    path: "/admin/lms",
    icon: (active) => (
      <BookOpen size={18} color={active ? "#ffffff" : "#000000"} />
    ),
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <div
        className="sidebar__logo"
        onClick={() => navigate("/admin/dashboard")}
        style={{ cursor: "pointer" }}
      >
        <img
          src="/src/assets/logo.png"
          alt="CareFlow"
          className="sidebar__logo-img"
        />
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
