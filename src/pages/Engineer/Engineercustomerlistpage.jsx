import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEngineerCustomers  } from "../../apis/engineers"
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import "../../styles/Engineer/EngineerCustomerListPage.css";

export default function EngineerCustomerListPage() {
  const navigate = useNavigate();

  // =========================
  // state
  // =========================
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [regionFilter, setRegionFilter] = useState("거주 지역 선택");
  const [brandFilter, setBrandFilter] = useState("보유 가전 브랜드 선택");

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);

  // =========================
  // API
  // =========================
 const fetchCustomers = async () => {
  try {
    setLoading(true);
    setError(null);

    const params = {
      search: searchQuery,
      status: statusFilter === "전체 상태" ? "" : statusFilter,
      region: regionFilter === "거주 지역 선택" ? "" : regionFilter,
      brand: brandFilter === "보유 가전 브랜드 선택" ? "" : brandFilter,
      page: page - 1,
      size,
    };

    const res = await getEngineerCustomers(params);

    setCustomers(res.data.content ?? []);
    setTotal(res.data.totalElements ?? 0);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  // =========================
  // effect
  // =========================
 useEffect(() => {
  fetchCustomers();
}, [page, size, searchQuery, statusFilter, regionFilter, brandFilter]);

  // =========================
  // handlers
  // =========================
  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("전체 상태");
    setRegionFilter("거주 지역 선택");
    setBrandFilter("보유 가전 브랜드 선택");
    setPage(1);
  };

  const goToDetail = (customerId) => {
    navigate(`/engineer/customers/${customerId}`);
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div className="eclp">
      {/* =========================
          HEADER
      ========================= */}
      <div className="eclp-header">
        <h1 className="eclp-header__title">고객 정보 조회</h1>
        <p className="eclp-header__sub">
          담당 고객의 기본 정보, 가전 보유 현황, A/S 이력 및 진행 중인 작업을
          확인할 수 있습니다.
        </p>
      </div>

      {/* =========================
          SEARCH BAR
      ========================= */}
      <div className="eclp-search-bar">
        <select
          className="eclp-filter-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option>전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
        </select>

        <div className="eclp-search">
          <Search size={14} color="#aaa" />
          <input
            type="text"
            placeholder="이름, 연락처, 고객ID 검색"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="eclp-filter-select"
          value={regionFilter}
          onChange={(e) => {
            setRegionFilter(e.target.value);
            setPage(1);
          }}
        >
          <option>거주 지역 선택</option>
          <option value="서울">서울</option>
          <option value="경기">경기</option>
          <option value="인천">인천</option>
          <option value="부산">부산</option>
          <option value="대전">대전</option>
          <option value="광주">광주</option>
        </select>

        <select
          className="eclp-filter-select"
          value={brandFilter}
          onChange={(e) => {
            setBrandFilter(e.target.value);
            setPage(1);
          }}
        >
          <option>보유 가전 브랜드 선택</option>
          <option value="LG">LG</option>
          <option value="SAMSUNG">삼성</option>
        </select>

        <button className="eclp-adv-btn">
          <SlidersHorizontal size={13} /> 상세 검색
        </button>

        <button className="eclp-reset-btn" onClick={handleReset}>
          <RefreshCw size={13} /> 초기화
        </button>
      </div>

      {/* =========================
          TABLE
      ========================= */}
      <div className="eclp-section">
        <div className="eclp-table-header-row">
          <p className="eclp-result-count">
            검색 결과 <span className="eclp-result-count__num">{total}건</span>
          </p>

          <select
            className="eclp-per-page-select"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={20}>20개씩 보기</option>
            <option value={50}>50개씩 보기</option>
          </select>
        </div>

        {loading && <p>로딩중...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <table className="eclp-table">
          <thead>
            <tr>
              <th>고객 ID</th>
              <th>고객명</th>
              <th>연락처</th>
              <th>거주 지역</th>
              <th>보유 가전 수</th>
              <th>A/S 건수</th>
              <th>진행 중 작업</th>
              <th>상태</th>
              <th>최근 작업일</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {customers.map((c) => (
              <tr key={c.customerId}>
                <td>
                  <span
                    className="eclp-id-link"
                    onClick={() => goToDetail(c.customerId)}
                  >
                    {c.customerId}
                  </span>
                </td>

                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.region}</td>

                <td className="eclp-td-center">{c.appliances}</td>
                <td className="eclp-td-center">{c.as}</td>

                <td className="eclp-td-center">
                  {c.inProgress > 0 ? (
                    <span className="eclp-inprogress-badge">
                      {c.inProgress}건
                    </span>
                  ) : (
                    <span className="eclp-zero">0건</span>
                  )}
                </td>

                <td>
                  <span
                    className={`eclp-status-badge eclp-status-badge--${c.status.toLowerCase()}`}
                  >
                    {c.status === "ACTIVE" ? "활성" : "비활성"}
                  </span>
                </td>

                <td>{c.lastWork}</td>

                <td className="eclp-td-actions">
                  <button
                    className="eclp-detail-btn"
                    onClick={() => goToDetail(c.customerId)}
                  >
                    상세보기
                  </button>
                  <button className="eclp-more-btn">
                    <MoreVertical size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* =========================
            PAGINATION
        ========================= */}
        <div className="eclp-pagination">
          <div className="eclp-page-btns">
            <button
              className="eclp-pg-btn"
              onClick={() => setPage(1)}
            >
              «
            </button>

            <button
              className="eclp-pg-btn"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(0, 5)
              .map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`eclp-pg-btn ${
                    n === page ? "eclp-pg-btn--active" : ""
                  }`}
                >
                  {n}
                </button>
              ))}

            <button
              className="eclp-pg-btn"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              ›
            </button>

            <button
              className="eclp-pg-btn"
              onClick={() => setPage(totalPages)}
            >
              »
            </button>
          </div>

          <p className="eclp-page-info">
            {total === 0
              ? "0건"
              : `${(page - 1) * size + 1}-${
                  Math.min(page * size, total)
                } / ${total}건`}
          </p>
        </div>
      </div>
    </div>
  );
}