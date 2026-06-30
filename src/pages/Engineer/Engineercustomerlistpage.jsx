import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, SlidersHorizontal,
  RefreshCw, MoreVertical,
} from "lucide-react";
import "../../styles/Engineer/EngineerCustomerListPage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/customers?search=&status=&region=&brand=&page=&size=
// ──────────────────────────────────────────

const DUMMY_CUSTOMERS = [
  { id: "CUST-2024-000123", name: "홍길동",  phone: "010-1234-5678", region: "서울 강남구",   appliances: 3, as: 8,  inProgress: 1, status: "ACTIVE",   lastWork: "2024.06.02" },
  { id: "CUST-2024-000124", name: "김영희",  phone: "010-2345-6789", region: "경기 성남시",   appliances: 2, as: 4,  inProgress: 0, status: "ACTIVE",   lastWork: "2024.05.28" },
  { id: "CUST-2024-000125", name: "박민수",  phone: "010-3456-7890", region: "인천 미추홀구", appliances: 4, as: 6,  inProgress: 1, status: "ACTIVE",   lastWork: "2024.05.27" },
  { id: "CUST-2024-000126", name: "이서연",  phone: "010-4567-8901", region: "서울 송파구",   appliances: 3, as: 5,  inProgress: 0, status: "ACTIVE",   lastWork: "2024.05.25" },
  { id: "CUST-2024-000127", name: "최지훈",  phone: "010-5678-9012", region: "경기 수원시",   appliances: 2, as: 3,  inProgress: 0, status: "INACTIVE", lastWork: "2024.04.30" },
  { id: "CUST-2024-000128", name: "정은지",  phone: "010-6789-0123", region: "서울 마포구",   appliances: 5, as: 10, inProgress: 2, status: "ACTIVE",   lastWork: "2024.06.01" },
  { id: "CUST-2024-000129", name: "강현우",  phone: "010-7890-1234", region: "대전 서구",     appliances: 2, as: 2,  inProgress: 0, status: "ACTIVE",   lastWork: "2024.05.20" },
  { id: "CUST-2024-000130", name: "오수현",  phone: "010-8901-2345", region: "부산 해운대구", appliances: 3, as: 7,  inProgress: 1, status: "ACTIVE",   lastWork: "2024.05.31" },
  { id: "CUST-2024-000131", name: "임재현",  phone: "010-9012-3456", region: "광주 북구",     appliances: 1, as: 1,  inProgress: 0, status: "INACTIVE", lastWork: "2024.04.15" },
  { id: "CUST-2024-000132", name: "배지영",  phone: "010-1230-4567", region: "서울 강동구",   appliances: 2, as: 3,  inProgress: 0, status: "ACTIVE",   lastWork: "2024.05.18" },
];

export default function EngineerCustomerListPage() {
  const navigate = useNavigate();

  const [searchQuery,  setSearchQuery]  = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [regionFilter, setRegionFilter] = useState("거주 지역 선택");
  const [brandFilter,  setBrandFilter]  = useState("보유 가전 브랜드 선택");

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("전체 상태");
    setRegionFilter("거주 지역 선택");
    setBrandFilter("보유 가전 브랜드 선택");
  };

  const goToDetail = (customerId) => {
    navigate(`/engineer/customers/${customerId}`);
  };

  return (
    <div className="eclp">
      <div className="eclp-header">
        <h1 className="eclp-header__title">고객 정보 조회</h1>
        <p className="eclp-header__sub">
          담당 고객의 기본 정보, 가전 보유 현황, A/S 이력 및 진행 중인 작업을 확인할 수 있습니다.
        </p>
      </div>

      <div className="eclp-search-bar">
        <select className="eclp-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>전체 상태</option>
          <option>활성</option>
          <option>비활성</option>
        </select>
        <div className="eclp-search">
          <Search size={14} color="#aaa" />
          <input
            type="text"
            placeholder="이름, 연락처, 고객ID 검색"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="eclp-filter-select" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
          <option>거주 지역 선택</option>
          <option>서울</option><option>경기</option><option>인천</option>
          <option>부산</option><option>대전</option><option>광주</option>
        </select>
        <select className="eclp-filter-select" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
          <option>보유 가전 브랜드 선택</option>
          <option>LG</option><option>삼성</option>
        </select>
        <button className="eclp-adv-btn"><SlidersHorizontal size={13} /> 상세 검색</button>
        <button className="eclp-reset-btn" onClick={handleReset}><RefreshCw size={13} /> 초기화</button>
      </div>

      <div className="eclp-section">
        <div className="eclp-table-header-row">
          <p className="eclp-result-count">검색 결과 <span className="eclp-result-count__num">128건</span></p>
          <select className="eclp-per-page-select">
            <option>20개씩 보기</option>
            <option>50개씩 보기</option>
          </select>
        </div>

        <table className="eclp-table">
          <thead>
            <tr>
              <th>고객 ID</th><th>고객명</th><th>연락처</th><th>거주 지역</th>
              <th>보유 가전 수</th><th>A/S 건수</th><th>진행 중 작업</th>
              <th>상태</th><th>최근 작업일</th><th></th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_CUSTOMERS.map(c => (
              <tr key={c.id}>
                <td>
                  <span className="eclp-id-link" onClick={() => goToDetail(c.id)}>
                    {c.id}
                  </span>
                </td>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.region}</td>
                <td className="eclp-td-center">{c.appliances}</td>
                <td className="eclp-td-center">{c.as}</td>
                <td className="eclp-td-center">
                  {c.inProgress > 0
                    ? <span className="eclp-inprogress-badge">{c.inProgress}건</span>
                    : <span className="eclp-zero">0건</span>}
                </td>
                <td>
                  <span className={`eclp-status-badge eclp-status-badge--${c.status.toLowerCase()}`}>
                    {c.status === "ACTIVE" ? "활성" : "비활성"}
                  </span>
                </td>
                <td>{c.lastWork}</td>
                <td className="eclp-td-actions">
                  <button className="eclp-detail-btn" onClick={() => goToDetail(c.id)}>상세보기</button>
                  <button className="eclp-more-btn"><MoreVertical size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="eclp-pagination">
          <div className="eclp-page-btns">
            <button className="eclp-pg-btn">«</button>
            <button className="eclp-pg-btn">‹</button>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} className={`eclp-pg-btn ${n === 1 ? "eclp-pg-btn--active" : ""}`}>{n}</button>
            ))}
            <button className="eclp-pg-btn">…</button>
            <button className="eclp-pg-btn">13</button>
            <button className="eclp-pg-btn">›</button>
            <button className="eclp-pg-btn">»</button>
          </div>
          <p className="eclp-page-info">1-20 / 128건</p>
        </div>
      </div>
    </div>
  );
}