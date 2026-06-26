import { Outlet } from "react-router-dom";
import CustomerNavbar from "../pages/customer/CustomerNavbar.jsx";
import "../styles/Customer/CustomerNavbar.css";

export default function CustomerLayout() {
  return (
    <div className="customer-layout">
      <CustomerNavbar />
      <main className="customer-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
