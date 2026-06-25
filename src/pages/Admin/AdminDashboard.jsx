import { Users, Wrench, Star, CreditCard, ChevronRight, AlertCircle } from "lucide-react";
import "../../styles/Admin/Admin.css";

const KPI = [
  { icon: <Users size={18} />, color: "purple", num: "12명",  label: "오늘 신규 가입" },
  { icon: <Wrench size={18} />, color: "blue",   num: "87건",  label: "이번 달 A/S 처리" },
  { icon: <Star size={18} />,  color: "orange", num: "4.7",   label: "플랫폼 평균 평점" },
  { icon: <CreditCard size={18} />, color: "green", num: "5건", label: "정산 대기" },
];

const mockAsList = [
  { id: "AS-2024-0891", customer: "김철수", appliance: "냉장고", status: "접수", region: "서울", date: "2024.06.25" },
  { id: "AS-2024-0890", customer: "이영희", appliance: "세탁기", status: "배정 완료", region: "경기", date: "2024.06.25" },
  { id: "AS-2024-0889", customer: "박민준", appliance: "에어컨", status: "작업 중",   region: "인천", date: "2024.06.24" },
  { id: "AS-2024-0888", customer: "최수연", appliance: "TV",    status: "완료",     region: "서울", date: "2024.06.24" },
  { id: "AS-2024-0887", customer: "정다은", appliance: "건조기", status: "완료",     region: "부산", date: "2024.06.23" },
];

const STATUS_BADGE = {
  "접수":     "orange",
  "배정 완료": "blue",
  "작업 중":  "purple",
  "완료":     "green",
};

const mockPendingAgencies = [
  { name: "한국서비스대행사", bizNo: "123-45-67890", region: "서울·경기", appliedAt: "2024.06.20" },
  { name: "프리미엄AS",    bizNo: "234-56-78901", region: "대전·충청", appliedAt: "2024.06.22" },
  { name: "케어플러스",    bizNo: "345-67-89012", region: "광주·전남", appliedAt: "2024.06.23" },
];

export default function AdminDashboard() {
  return (
    <div className="admin-page">

      {/* 정산 대기 배너 */}
      <div className="admin-banner">
        <div className="admin-banner__left">
          <span className="admin-banner__label">정산 지급 대기</span>
          <span className="admin-banner__count">5건</span>
          <span className="admin-banner__desc">미지급 승인 건이 있습니다. 정산 관리에서 확인하세요.</span>
        </div>
        <AlertCircle size={40} style={{ opacity: 0.6 }} />
      </div>

      {/* KPI 카드 */}
      <div className="admin-stat-grid">
        {KPI.map((k) => (
          <div key={k.label} className="admin-stat-card">
            <div className={`admin-stat-card__icon admin-stat-card__icon--${k.color}`}>{k.icon}</div>
            <p className="admin-stat-card__num">{k.num}</p>
            <p className="admin-stat-card__label">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="admin-two-col">

        {/* 최근 A/S 현황 */}
        <div className="admin-section">
          <div className="admin-section__header">
            <h2 className="admin-section__title">최근 A/S 접수 현황</h2>
            <button className="admin-btn admin-btn--outline admin-btn--sm" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              전체 보기 <ChevronRight size={13} />
            </button>
          </div>
          <div className="admin-section__body" style={{ padding: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>접수번호</th>
                  <th>고객</th>
                  <th>가전</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {mockAsList.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontSize: 11, color: "#aaa" }}>{row.id}</td>
                    <td>{row.customer}</td>
                    <td>{row.appliance}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${STATUS_BADGE[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 대행사 미승인 목록 */}
        <div className="admin-section">
          <div className="admin-section__header">
            <h2 className="admin-section__title">대행사 승인 대기</h2>
            <button className="admin-btn admin-btn--outline admin-btn--sm" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              회원 관리 <ChevronRight size={13} />
            </button>
          </div>
          <div className="admin-section__body" style={{ padding: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>대행사명</th>
                  <th>사업자번호</th>
                  <th>서비스 지역</th>
                  <th>신청일</th>
                </tr>
              </thead>
              <tbody>
                {mockPendingAgencies.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{row.name}</td>
                    <td style={{ fontSize: 12, color: "#888" }}>{row.bizNo}</td>
                    <td>{row.region}</td>
                    <td style={{ fontSize: 12, color: "#888" }}>{row.appliedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
