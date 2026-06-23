import { Outlet } from "react-router-dom";
import CustomerSidebar from "../components/sidebars/CustomerSidebar.jsx";
import EngineerSidebar from "../components/sidebars/EngineerSidebar.jsx";
import AgencySidebar from "../components/sidebars/AgencySidebar.jsx";
import AdminSidebar from "../components/sidebars/AdminSidebar.jsx";

import AgencyNavbar from "../pages/Agency/AgencyNavbar.jsx"
import "../styles/Sidebars.css"

// 임시 role - 나중에 로그인 상태(Context or zustand)로 교체
const MOCK_ROLE = "AGENCY"; // "CUSTOMER" | "ENGINEER" | "AGENCY" | "ADMIN"

const SIDEBARS = {
  CUSTOMER: <CustomerSidebar />,
  ENGINEER: <EngineerSidebar />,
  AGENCY: <AgencySidebar />,
  ADMIN: <AdminSidebar />,
};

const NAVBARS = {
  CUSTOMER: null,   // 나중에 CustomerNavbar 만들면 교체
  ENGINEER: null,   // 나중에 EngineerNavbar 만들면 교체
  AGENCY: <AgencyNavbar />,
  ADMIN: null,      // 나중에 AdminNavbar 만들면 교체
};

export default function MainLayout() {
  return (
    <div className="layout">
      {SIDEBARS[MOCK_ROLE]}
      <div className="layout__main">
        {NAVBARS[MOCK_ROLE]}
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}