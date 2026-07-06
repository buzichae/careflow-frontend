import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getEngineerCustomers, getEngineerCustomerBrands } from "../../apis/engineers"
import { getRegions } from "../../apis/regions";
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

  // [연동] 구 단위 지역 목록 — 하드코딩된 시/도 대신 실제 API에서 받아온 구 목록으로 채움
  const [regionOptions, setRegionOptions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState(false);
  // [수정] "동구", "서구", "남구" 등은 대구/광주/인천/울산 등 여러 시/도에
  // 동명으로 존재해서, 이름만 보여주면 어느 지역인지 구분이 안 됨.
  // → 시/도(depth=1) 목록도 같이 받아서 "동구 (대구광역시)"처럼 표기.
  const [parentNameMap, setParentNameMap] = useState({});

  useEffect(() => {
    let mounted = true;
    Promise.all([getRegions(2), getRegions(1)])
      .then(([guRes, sidoRes]) => {
        if (!mounted) return;
        setRegionOptions(guRes.data ?? []);
        const map = {};
        (sidoRes.data ?? []).forEach((s) => { map[s.regionId] = s.name; });
        setParentNameMap(map);
      })
      .catch((err) => {
        console.error("지역 목록 조회 실패:", err);
        if (mounted) setRegionsError(true);
      })
      .finally(() => {
        if (mounted) setRegionsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // 동명 지역("동구", "서구" 등)만 상위 시/도명을 붙여서 구분되게 표시
  const nameCounts = useMemo(() => {
    const counts = {};
    regionOptions.forEach((r) => { counts[r.name] = (counts[r.name] ?? 0) + 1; });
    return counts;
  }, [regionOptions]);

  // [연동] 브랜드는 자유 텍스트라 마스터 API가 없어서, 실제 등록된 값을
  // distinct 조회하는 새 API(getEngineerCustomerBrands)로 채움.
  // ⚠ 백엔드에 이 엔드포인트가 아직 없을 수 있음 — 확인 필요.
  const [brandOptions, setBrandOptions] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getEngineerCustomerBrands()
      .then((res) => {
        if (mounted) setBrandOptions(res.data ?? []);
      })
      .catch((err) => {
        console.error("브랜드 목록 조회 실패:", err);
        if (mounted) setBrandsError(true);
      })
      .finally(() => {
        if (mounted) setBrandsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // =========================
  // API
  // =========================
  // [버그 수정] 필터를 빠르게 연속으로 바꾸면(예: 로드 직후 바로 지역 선택),
  // 응답이 도착하는 순서가 요청 순서와 다를 수 있어서, 늦게 도착한 "이전"
  // 요청 응답이 최신 필터 결과를 덮어써버리는 경쟁 상태(race condition)가 있었음.
  // → 요청마다 순번(requestId)을 매겨서, 가장 마지막에 보낸 요청의 응답만 반영.
  const latestRequestId = useRef(0);

 const fetchCustomers = async () => {
  const requestId = ++latestRequestId.current;
  try {
    setLoading(true);
    setError(null);

    // [버그 수정] 필터를 안 걸었을 때 빈 문자열("")을 넣으면 axios가 그대로
    // "region=" 처럼 값 없는 파라미터로 URL에 붙여버려서, 백엔드가 이걸
    // "빈 문자열로 검색"으로 잘못 처리해 결과가 0건으로 나오던 문제.
    // → undefined로 넣으면 axios가 아예 그 파라미터를 URL에서 제외함.
    const params = {
      search: searchQuery || undefined,
      status: statusFilter === "전체 상태" ? undefined : statusFilter,
      region: regionFilter === "거주 지역 선택" ? undefined : regionFilter,
      brand: brandFilter === "보유 가전 브랜드 선택" ? undefined : brandFilter,
      page: page - 1,
      size,
    };

    const res = await getEngineerCustomers(params);

    // 이 응답이 나간 뒤에 더 최신 요청이 나갔다면, 이 응답은 버림 (화면 갱신 안 함)
    if (requestId !== latestRequestId.current) return;

    setCustomers(res.data.content ?? []);
    setTotal(res.data.totalElements ?? 0);
  } catch (err) {
    if (requestId !== latestRequestId.current) return;
    setError(err.message);
  } finally {
    if (requestId === latestRequestId.current) setLoading(false);
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
          disabled={regionsLoading}
        >
          <option value="거주 지역 선택">거주 지역 선택</option>
          {/* [연동] 백엔드 확정 스펙: region 파라미터는 이제 지역명(문자열)이 아니라
              지역 ID(숫자)를 받음 — c.regionId.id와 정확히 매칭하기 위함.
              화면엔 그대로 지역명을 보여주되, 실제 option value는 regionId로 전송.
              [수정] "동구"/"서구" 등 동명 지역이 여러 시/도에 있어서 구분이
              안 되던 문제 → 동명인 경우에만 "동구 (대구광역시)"처럼 상위 시/도명 병기. */}
          {regionOptions.map((r) => {
            const isDuplicateName = nameCounts[r.name] > 1;
            const parentName = parentNameMap[r.parentId];
            const label = isDuplicateName && parentName ? `${r.name} (${parentName})` : r.name;
            return (
              <option key={r.regionId} value={r.regionId}>{label}</option>
            );
          })}
          {regionsError && <option disabled>지역 목록을 불러오지 못했습니다</option>}
        </select>

        <select
          className="eclp-filter-select"
          value={brandFilter}
          onChange={(e) => {
            setBrandFilter(e.target.value);
            setPage(1);
          }}
          disabled={brandsLoading}
        >
          <option>보유 가전 브랜드 선택</option>
          {/* [연동] 하드코딩된 LG/삼성(SAMSUNG) 대신, 실제 등록된 브랜드를
              distinct 조회해서 채움. brand는 자유 텍스트라 그대로 값으로 사용 —
              한글/영문 등 실제 DB에 저장된 그대로 오므로 필터링 시 값 불일치가 안 생김. */}
          {brandOptions.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
          {brandsError && <option disabled>브랜드 목록을 불러오지 못했습니다</option>}
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

                {/* [버그 수정] 실제 응답 필드명은 appliances/as/lastWork가 아니라
                    appliancesCount/totalAsCount/lastWorkDate 였음 */}
                <td className="eclp-td-center">{c.appliancesCount ?? 0}</td>
                <td className="eclp-td-center">{c.totalAsCount ?? 0}</td>

                <td className="eclp-td-center">
                  {/* [연동 준비] 백엔드에 inProgressCount 필드 추가 요청함 (응답 대기 중).
                      필드명이 확정되면 여기 c.inProgressCount만 그대로 쓰면 됨.
                      0건일 때와 "값 자체가 아직 없음"을 구분하기 위해 null/undefined
                      체크를 명시적으로 함. */}
                  {c.inProgressCount != null ? (
                    c.inProgressCount > 0 ? (
                      <span className="eclp-inprogress-badge">{c.inProgressCount}건</span>
                    ) : (
                      <span className="eclp-zero">0건</span>
                    )
                  ) : (
                    <span className="eclp-zero" title="백엔드 응답에 아직 필드가 없습니다">-</span>
                  )}
                </td>

                <td>
                  <span
                    className={`eclp-status-badge eclp-status-badge--${c.status?.toLowerCase()}`}
                  >
                    {c.status === "ACTIVE" ? "활성" : "비활성"}
                  </span>
                </td>

                <td>{c.lastWorkDate ?? "-"}</td>

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