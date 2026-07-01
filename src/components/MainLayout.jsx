import { Outlet, Navigate } from "react-router-dom";
import CustomerSidebar from "../components/sidebars/CustomerSidebar.jsx";
import EngineerSidebar from "../components/sidebars/EngineerSidebar.jsx";
import AgencySidebar from "../components/sidebars/AgencySidebar.jsx";
import AdminSidebar from "../components/sidebars/AdminSidebar.jsx";

import AgencyNavbar from "../pages/Agency/AgencyNavbar.jsx";
import AdminNavbar from "../pages/Admin/AdminNavbar.jsx";
import EngineerNavbar from "../pages/Engineer/Engineernavbar.jsx";
import CustomerNavbar from "../pages/customer/CustomerNavbar.jsx";

import "../styles/Sidebars.css";
import { getRoleFromToken } from "../utils/auth.js";

const SIDEBARS = {
  CUSTOMER: <CustomerSidebar />,
  ENGINEER: <EngineerSidebar />,
  AGENCY:   <AgencySidebar />,
  ADMIN:    <AdminSidebar />,
};

const NAVBARS = {
  CUSTOMER: <CustomerNavbar />,
  ENGINEER: <EngineerNavbar />,
  AGENCY:   <AgencyNavbar />,
  ADMIN:    <AdminNavbar />,
};

export default function MainLayout() {
  const role = getRoleFromToken();

  if (!role) return <Navigate to="/auth/login" replace />;

  return (
    <div className="layout">
      {SIDEBARS[role]}
      <div className="layout__main">
        {NAVBARS[role]}
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
