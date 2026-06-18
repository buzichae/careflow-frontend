import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout.jsx";
import LandingPage from "./pages/Landing/LandingPage.jsx";
import LoginPage from "./pages/Auth/LoginPage.jsx";

// 고객
import CustomerDashboard from "./pages/Customer/Dashboard/DashboardPage.jsx";
import CustomerAppliances from "./pages/Customer/Appliances/AppliancesPage.jsx";
import CustomerRepairHistory from "./pages/Customer/RepairHistory/RepairHistoryPage.jsx";
import CustomerAS from "./pages/Customer/AS/ASPage.jsx";
import CustomerPayment from "./pages/Customer/Payment/PaymentPage.jsx";
import CustomerMarket from "./pages/Customer/Market/MarketPage.jsx";
import CustomerNotice from "./pages/Customer/Notice/NoticePage.jsx";

// 기사
import EngineerDashboard from "./pages/Engineer/Dashboard/DashboardPage.jsx";
import EngineerSchedule from "./pages/Engineer/Schedule/SchedulePage.jsx";
import EngineerWork from "./pages/Engineer/Work/WorkPage.jsx";
import EngineerWorkDone from "./pages/Engineer/WorkDone/WorkDonePage.jsx";
import EngineerSettlement from "./pages/Engineer/Settlement/SettlementPage.jsx";
import EngineerReviews from "./pages/Engineer/Reviews/ReviewsPage.jsx";
import EngineerNotice from "./pages/Engineer/Notice/NoticePage.jsx";
import EngineerProfile from "./pages/Engineer/Profile/ProfilePage.jsx";
import EngineerHelp from "./pages/Engineer/Help/HelpPage.jsx";

// 대행사
import AgencyDashboard from "./pages/Agency/Dashboard/DashboardPage.jsx";
import AgencyWork from "./pages/Agency/Work/WorkPage.jsx";
import AgencyEngineers from "./pages/Agency/Engineers/EngineersPage.jsx";
import AgencySettlement from "./pages/Agency/Settlement/SettlementPage.jsx";
import AgencyCustomers from "./pages/Agency/Customers/CustomersPage.jsx";
import AgencyReviews from "./pages/Agency/Reviews/ReviewsPage.jsx";
import AgencyStatistics from "./pages/Agency/Statistics/StatisticsPage.jsx";
import AgencyNotice from "./pages/Agency/Notice/NoticePage.jsx";
import AgencySettings from "./pages/Agency/Settings/SettingsPage.jsx";

// 관리자
import AdminDashboard from "./pages/Admin/Dashboard/DashboardPage.jsx";
import AdminMembers from "./pages/Admin/Members/MembersPage.jsx";
import AdminAS from "./pages/Admin/AS/ASPage.jsx";
import AdminSettlement from "./pages/Admin/Settlement/SettlementPage.jsx";
import AdminStatistics from "./pages/Admin/Statistics/StatisticsPage.jsx";
import AdminSettings from "./pages/Admin/Settings/SettingsPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 랜딩 / 인증 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 내부 페이지 - 사이드바 레이아웃 */}
        <Route element={<MainLayout />}>

          {/* 고객 */}
          <Route path="/customer/home" element={<CustomerDashboard />} />
          <Route path="/customer/appliances" element={<CustomerAppliances />} />
          <Route path="/customer/repair-history" element={<CustomerRepairHistory />} />
          <Route path="/customer/as" element={<CustomerAS />} />
          <Route path="/customer/payment" element={<CustomerPayment />} />
          <Route path="/customer/market" element={<CustomerMarket />} />
          <Route path="/customer/notice" element={<CustomerNotice />} />

          {/* 기사 */}
          <Route path="/engineer/dashboard" element={<EngineerDashboard />} />
          <Route path="/engineer/schedule" element={<EngineerSchedule />} />
          <Route path="/engineer/work" element={<EngineerWork />} />
          <Route path="/engineer/work-done" element={<EngineerWorkDone />} />
          <Route path="/engineer/settlement" element={<EngineerSettlement />} />
          <Route path="/engineer/reviews" element={<EngineerReviews />} />
          <Route path="/engineer/notice" element={<EngineerNotice />} />
          <Route path="/engineer/profile" element={<EngineerProfile />} />
          <Route path="/engineer/help" element={<EngineerHelp />} />

          {/* 대행사 */}
          <Route path="/agency/dashboard" element={<AgencyDashboard />} />
          <Route path="/agency/work" element={<AgencyWork />} />
          <Route path="/agency/engineers" element={<AgencyEngineers />} />
          <Route path="/agency/settlement" element={<AgencySettlement />} />
          <Route path="/agency/customers" element={<AgencyCustomers />} />
          <Route path="/agency/reviews" element={<AgencyReviews />} />
          <Route path="/agency/statistics" element={<AgencyStatistics />} />
          <Route path="/agency/notice" element={<AgencyNotice />} />
          <Route path="/agency/settings" element={<AgencySettings />} />

          {/* 관리자 */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/members" element={<AdminMembers />} />
          <Route path="/admin/as" element={<AdminAS />} />
          <Route path="/admin/settlement" element={<AdminSettlement />} />
          <Route path="/admin/statistics" element={<AdminStatistics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}