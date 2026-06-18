import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout.jsx";

function TempPage({ title }) {
  return <div style={{ padding: "32px" }}><h1>{title}</h1></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/agency/dashboard" replace />} />

        <Route element={<MainLayout />}>

          {/* 고객 */}
          <Route path="/customer/home" element={<TempPage title="고객 - 홈" />} />
          <Route path="/customer/appliances" element={<TempPage title="고객 - 내 가전" />} />
          <Route path="/customer/repair-history" element={<TempPage title="고객 - 가전별 수리 이력" />} />
          <Route path="/customer/as" element={<TempPage title="고객 - A/S 신청/예약" />} />
          <Route path="/customer/payment" element={<TempPage title="고객 - 정산/결제" />} />
          <Route path="/customer/market" element={<TempPage title="고객 - 중고 마켓" />} />
          <Route path="/customer/notice" element={<TempPage title="고객 - 알림" />} />

          {/* 기사 */}
          <Route path="/engineer/dashboard" element={<TempPage title="기사 - 대시보드" />} />
          <Route path="/engineer/schedule" element={<TempPage title="기사 - 오늘의 일정" />} />
          <Route path="/engineer/work" element={<TempPage title="기사 - 작업 목록" />} />
          <Route path="/engineer/work-done" element={<TempPage title="기사 - 작업 완료 내역" />} />
          <Route path="/engineer/settlement" element={<TempPage title="기사 - 정산/수익" />} />
          <Route path="/engineer/reviews" element={<TempPage title="기사 - 고객 평가" />} />
          <Route path="/engineer/notice" element={<TempPage title="기사 - 공지사항" />} />
          <Route path="/engineer/profile" element={<TempPage title="기사 - 내 정보" />} />
          <Route path="/engineer/help" element={<TempPage title="기사 - 도움말" />} />

          {/* 대행사 */}
          <Route path="/agency/dashboard" element={<TempPage title="대행사 - 대시보드" />} />
          <Route path="/agency/work" element={<TempPage title="대행사 - 작업 관리" />} />
          <Route path="/agency/engineers" element={<TempPage title="대행사 - 기사 관리" />} />
          <Route path="/agency/settlement" element={<TempPage title="대행사 - 정산 관리" />} />
          <Route path="/agency/customers" element={<TempPage title="대행사 - 고객 관리" />} />
          <Route path="/agency/reviews" element={<TempPage title="대행사 - 평가 및 리뷰" />} />
          <Route path="/agency/statistics" element={<TempPage title="대행사 - 통계 및 리포트" />} />
          <Route path="/agency/notice" element={<TempPage title="대행사 - 공지사항" />} />
          <Route path="/agency/settings" element={<TempPage title="대행사 - 설정" />} />

          {/* 관리자 */}
          <Route path="/admin/dashboard" element={<TempPage title="관리자 - 운영 대시보드" />} />
          <Route path="/admin/members" element={<TempPage title="관리자 - 회원 관리" />} />
          <Route path="/admin/as" element={<TempPage title="관리자 - A/S 운영" />} />
          <Route path="/admin/settlement" element={<TempPage title="관리자 - 정산 관리" />} />
          <Route path="/admin/statistics" element={<TempPage title="관리자 - 통계 인사이트" />} />
          <Route path="/admin/settings" element={<TempPage title="관리자 - 시스템 설정" />} />

        </Route>

        <Route path="*" element={<Navigate to="/agency/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}