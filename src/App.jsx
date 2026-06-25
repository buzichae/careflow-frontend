import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import SignupPage from "./pages/auth/SignupPage.jsx";
import CustomerHome from "./pages/customer/CustomerHome.jsx";
import CustomerAppliances from "./pages/customer/CustomerAppliances.jsx";
import CustomerAS from "./pages/customer/CustomerAS.jsx";
import CustomerNotice from "./pages/customer/CustomerNotice.jsx";
import CustomerPayment from "./pages/customer/CustomerPayment.jsx";
import CustomerMyPage from "./pages/customer/CustomerMyPage.jsx";
// import LandingPage from "../src/pages/Landing/LandingPage.jsx";
import LandingPage from "../src/pages/Landing/LandingPage.jsx";
import ServicePage from "../src/pages/Landing/ServicePage.jsx"
import FeaturePage from "../src/pages/Landing/FeaturePage.jsx";
import GuidePage from "../src/pages/Landing/GuidePage.jsx";

import ReassignAlertPage from "../src/pages/Agency/ReassignAlertPage.jsx";
import AgencyDashboard from "../src/pages/Agency/AgencyDashboard";
import AgencyWorkPage from "./pages/Agency/AgencyWorkPage";
import AgencyEngineerPage from "../src/pages/Agency/AgencyEngineerPage.jsx"
import AgencySettlementPage from "../src/pages/Agency/Agencysettlementpage.jsx"
import AgencyCustomerPage from "../src/pages/Agency/AgencyCustomerPage.jsx"
import AgencyReviewPage from "../src/pages/Agency/Agencyreviewpage.jsx"
import AgencyStatisticsPage from "../src/pages/Agency/AgencyStatisticsPage.jsx"
import AgencyNoticePage from "../src/pages/Agency/Agencynoticepage.jsx"
import AgencySettingPage from "../src/pages/Agency/Agencysettingpage.jsx"

function TempPage({ title }) {
  return <div style={{ padding: "32px" }}><h1>{title}</h1></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage title="메인페이지"/>} />
        <Route path="/service" element={<ServicePage title="메인페이지-서비스소개"/>} />
        <Route path="/features" element={<FeaturePage title="메인페이지-주요소개"/>} />
        <Route path="/guide" element={<GuidePage title="메인페이지-기능"/>} />

        {/* 인증 (MainLayout 밖) */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth" element={<Navigate to="/auth/login" replace />} />

        <Route element={<MainLayout />}>

          {/* 고객 */}
          <Route path="/customer/home" element={<CustomerHome />} />
          <Route path="/customer/appliances" element={<CustomerAppliances />} />
          <Route path="/customer/as" element={<CustomerAS />} />
          <Route path="/customer/payment" element={<CustomerPayment />} />
          <Route path="/customer/market" element={<TempPage title="고객 - 중고 마켓" />} />
          <Route path="/customer/notice" element={<CustomerNotice />} />
          <Route path="/customer/mypage" element={<CustomerMyPage />} />

          {/* 기사 */}
          <Route path="/engineer/dashboard" element={<TempPage title="기사 - 대시보드" />} />
          <Route path="/engineer/schedule" element={<TempPage title="기사 - 작업 일정" />} />
          <Route path="/engineer/work" element={<TempPage title="기사 - 작업 관리" />} />
          <Route path="/engineer/customers" element={<TempPage title="기사 - 고객 정보 조회" />} />
          <Route path="/engineer/report" element={<TempPage title="기사 - 작업 보고서" />} />
          <Route path="/engineer/settlement" element={<TempPage title="기사 - 실적/정산" />} />
          <Route path="/engineer/reviews" element={<TempPage title="기사 - 고객 평가" />} />
          <Route path="/engineer/profile" element={<TempPage title="기사 - 프로필 관리" />} />
          <Route path="/engineer/notice" element={<TempPage title="기사 - 알림" />} />

          {/* 대행사 */}
          <Route path="/agency/dashboard" element={<AgencyDashboard  title="대행사 - 대시보드" />} />
          <Route path="/agency/work" element={<AgencyWorkPage  title="대행사 - 작업 관리" />} />
          <Route path="/agency/reassign-alerts" element={<ReassignAlertPage title="대행사 - 재배차알림"/>} />
          <Route path="/agency/engineers" element={<AgencyEngineerPage  title="대행사 - 기사 관리" />} />
          <Route path="/agency/settlement" element={<AgencySettlementPage  title="대행사 - 정산 관리" />} />
          <Route path="/agency/customers" element={<AgencyCustomerPage  title="대행사 - 고객 관리" />} />
          <Route path="/agency/reviews" element={<AgencyReviewPage title="대행사 - 평가 및 리뷰" />} />
          <Route path="/agency/statistics" element={<AgencyStatisticsPage title="대행사 - 통계 및 리포트" />} />
          <Route path="/agency/notice" element={<AgencyNoticePage  title="대행사 - 공지사항" />} />
          <Route path="/agency/settings" element={<AgencySettingPage title="대행사 - 설정" />} />

          {/* 관리자 */}
          <Route path="/admin/dashboard" element={<TempPage title="관리자 - 운영 대시보드" />} />
          <Route path="/admin/members" element={<TempPage title="관리자 - 회원 관리" />} />
          <Route path="/admin/as" element={<TempPage title="관리자 - A/S 운영" />} />
          <Route path="/admin/settlement" element={<TempPage title="관리자 - 정산 관리" />} />
          <Route path="/admin/statistics" element={<TempPage title="관리자 - 통계 인사이트" />} />
          <Route path="/admin/settings" element={<TempPage title="관리자 - 시스템 설정" />} />

        </Route>

        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}