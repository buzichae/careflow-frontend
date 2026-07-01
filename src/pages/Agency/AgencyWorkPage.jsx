import { useState } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/Agency/AgencyWorkPage.css";
import AgencyWorkReceiptTab  from "../../pages/Agency/WorkTab/AgencyWorkReceiptTab";
import AgencyWorkMonitorTab  from "../../pages/Agency/WorkTab/AgencyWorkMonitorTab";
import AgencyWorkCompleteTab from "../../pages/Agency/WorkTab/AgencyWorkCompleteTab";

const tabs = ["접수 목록", "진행 모니터링", "완료 내역"];

export default function AgencyWorkPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab ?? "접수 목록");

  return (
    <div className="aw-page">
      <div className="aw-header">
        <h1 className="aw-header__title">작업 관리</h1>
        <p className="aw-header__sub">접수 현황을 확인하고 작업을 배정·관리할 수 있습니다.</p>
      </div>

      <div className="aw-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`aw-tab ${activeTab === tab ? "aw-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "접수 목록"     && <AgencyWorkReceiptTab />}
      {activeTab === "진행 모니터링" && <AgencyWorkMonitorTab />}
      {activeTab === "완료 내역"     && <AgencyWorkCompleteTab />}
    </div>
  );
}