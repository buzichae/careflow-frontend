import { Outlet } from "react-router-dom";
import AdminNavbar from "../pages/Admin/AdminNavbar.jsx";
import "../styles/Admin/AdminNavbar.css";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
