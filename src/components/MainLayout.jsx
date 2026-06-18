import { Outlet } from "react-router-dom";
import CustomerSidebar from "../components/sidebars/CustomerSidebar.jsx";
import EngineerSidebar from "../components/sidebars/EngineerSidebar.jsx";
import AgencySidebar from "../components/sidebars/AgencySidebar.jsx";
import AdminSidebar from "../components/sidebars/AdminSidebar.jsx";
import "../styles/Sidebars.css"

// 임시 role - 나중에 로그인 상태(Context or zustand)로 교체
const MOCK_ROLE = "AGENCY"; // "CUSTOMER" | "ENGINEER" | "AGENCY" | "ADMIN"

const SIDEBARS = {
  CUSTOMER: <CustomerSidebar />,
  ENGINEER: <EngineerSidebar />,
  AGENCY: <AgencySidebar />,
  ADMIN: <AdminSidebar />,
};

export default function MainLayout() {
  return (
    <div className="layout">
      {SIDEBARS[MOCK_ROLE]}
      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}