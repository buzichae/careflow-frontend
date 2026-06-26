import { useState } from "react";
import { X, Shield } from "lucide-react";
import "../../styles/Admin/Admin.css";

/* ── 목 데이터 ── */
const mockAsStat = [
  { status: "접수",     count: 23, color: "orange" },
  { status: "배정 완료", count: 41, color: "blue"   },
  { status: "작업 중",  count: 15, color: "purple"  },
  { status: "완료",    count: 312, color: "green"   },
  { status: "취소",    count:  8,  color: "gray"    },
];

const mockAsDetails = [
  { id: "AS-2026-0891", customer: "김철수", appliance: "냉장고", symptom: "냉각 불량",   region: "서울", status: "접수",     date: "2026.06.25" },
  { id: "AS-2026-0890", customer: "이영희", appliance: "세탁기", symptom: "소음 발생",   region: "경기", status: "배정 완료", date: "2026.06.25" },
  { id: "AS-2026-0889", customer: "박민준", appliance: "에어컨", symptom: "냉방 효율 저하", region: "인천", status: "작업 중",  date: "2026.06.24" },
  { id: "AS-2026-0888", customer: "최수연", appliance: "TV",    symptom: "화면 깜빡임", region: "서울", status: "완료",    date: "2026.06.24" },
  { id: "AS-2026-0887", customer: "정다은", appliance: "건조기", symptom: "건조 미흡",   region: "부산", status: "취소",    date: "2026.06.23" },
];

const STATUS_BADGE = {
  "접수":     "orange",
  "배정 완료": "blue",
  "작업 중":  "purple",
  "완료":     "green",
  "취소":     "gray",
};

const mockRepairCosts = [
  { id: 1, category: "냉장고", symptom: "냉각 불량",     avgCost: 85000  },
  { id: 2, category: "냉장고", symptom: "소음 발생",     avgCost: 45000  },
  { id: 3, category: "세탁기", symptom: "탈수 불량",     avgCost: 72000  },
  { id: 4, category: "세탁기", symptom: "소음 발생",     avgCost: 38000  },
  { id: 5, category: "에어컨", symptom: "냉방 효율 저하",  avgCost: 95000  },
  { id: 6, category: "TV",    symptom: "화면 깜빡임",    avgCost: 120000 },
  { id: 7, category: "건조기", symptom: "건조 미흡",     avgCost: 65000  },
];

const mockBadgeCriteria = { minGrade: "B", minScore: 75 };

function CostEditModal({ item, onClose, onSave }) {
  const [cost, setCost] = useState(item.avgCost);
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">수리 비용 가이드 수정</h2>
          <button className="admin-modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
          <strong>{item.category}</strong> · {item.symptom}
        </p>
        <div className="admin-modal__field">
          <label className="admin-modal__label">예상 평균 비용 (원)</label>
          <input
            className="admin-modal__input"
            type="number"
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </div>
        <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
          * 매일 자정 Quartz 배치로 지난 1년 동일 증상 완료 건 평균이 자동 갱신됩니다.
        </p>
        <div className="admin-modal__footer">
          <button className="admin-btn admin-btn--outline" onClick={onClose}>취소</button>
          <button className="admin-btn admin-btn--primary" onClick={() => onSave(cost)}>저장</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminServicePage() {
  const [tab, setTab] = useState("as");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [repairCosts, setRepairCosts] = useState(mockRepairCosts);
  const [editCost, setEditCost] = useState(null);
  const [badge, setBadge] = useState(mockBadgeCriteria);
  const [badgeEdit, setBadgeEdit] = useState(false);
  const [badgeDraft, setBadgeDraft] = useState(mockBadgeCriteria);

  const filteredAs = mockAsDetails.filter((a) => {
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
    const matchRegion = regionFilter === "ALL" || a.region === regionFilter;
    return matchStatus && matchRegion;
  });

  return (
    <div className="admin-page">

      {/* 탭 */}
      <div className="admin-section">
        <div className="admin-tabs">
          {[
            { key: "as",     label: "전체 A/S 처리 내역" },
            { key: "cost",   label: "수리 비용 가이드" },
            { key: "badge",  label: "인증 뱃지 기준" },
          ].map((t) => (
            <button
              key={t.key}
              className={`admin-tab${tab === t.key ? " admin-tab--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── A/S 처리 현황 ── */}
        {tab === "as" && (
          <div className="admin-section__body">
            {/* 통계 요약 */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {mockAsStat.map((s) => (
                <div key={s.status} className="admin-stat-card" style={{ flex: 1, minWidth: 0 }}>
                  <p className="admin-stat-card__num">{s.count}<span style={{ fontSize: 14, fontWeight: 400, color: "#aaa" }}>건</span></p>
                  <p className="admin-stat-card__label">
                    <span className={`admin-badge admin-badge--${s.color}`}>{s.status}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* 필터 */}
            <div className="admin-filter-bar">
              <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">상태 전체</option>
                <option value="접수">접수</option>
                <option value="배정 완료">배정 완료</option>
                <option value="작업 중">작업 중</option>
                <option value="완료">완료</option>
                <option value="취소">취소</option>
              </select>
              <select className="admin-select" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
                <option value="ALL">지역 전체</option>
                <option value="서울">서울</option>
                <option value="경기">경기</option>
                <option value="인천">인천</option>
                <option value="부산">부산</option>
              </select>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>접수번호</th>
                  <th>고객</th>
                  <th>가전</th>
                  <th>증상</th>
                  <th>지역</th>
                  <th>상태</th>
                  <th>접수일</th>
                </tr>
              </thead>
              <tbody>
                {filteredAs.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontSize: 11, color: "#aaa" }}>{a.id}</td>
                    <td>{a.customer}</td>
                    <td>{a.appliance}</td>
                    <td style={{ color: "#555" }}>{a.symptom}</td>
                    <td>{a.region}</td>
                    <td><span className={`admin-badge admin-badge--${STATUS_BADGE[a.status]}`}>{a.status}</span></td>
                    <td style={{ color: "#888", fontSize: 12 }}>{a.date}</td>
                  </tr>
                ))}
                {filteredAs.length === 0 && (
                  <tr><td colSpan={7} className="admin-empty">해당 조건의 A/S 내역이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 수리 비용 가이드 ── */}
        {tab === "cost" && (
          <div className="admin-section__body">
            <p style={{ fontSize: 12, color: "#aaa", marginBottom: 14 }}>
              가전 카테고리 × 증상별 예상 평균 수리 비용입니다. 항목을 클릭하여 수동으로 수정할 수 있습니다.
            </p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>증상</th>
                  <th>예상 평균 비용</th>
                  <th>수정</th>
                </tr>
              </thead>
              <tbody>
                {repairCosts.map((c) => (
                  <tr key={c.id}>
                    <td><span className="admin-badge admin-badge--purple">{c.category}</span></td>
                    <td>{c.symptom}</td>
                    <td style={{ fontWeight: 600 }}>{c.avgCost.toLocaleString()}원</td>
                    <td>
                      <button className="admin-btn admin-btn--outline admin-btn--sm" onClick={() => setEditCost(c)}>수정</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 인증 뱃지 기준 ── */}
        {tab === "badge" && (
          <div className="admin-section__body">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <Shield size={20} color="#734bcf" />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>CareFlow 인증 뱃지 기준</h3>
                </div>

                {!badgeEdit ? (
                  <>
                    <div style={{ background: "#f8f8fc", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                      <p style={{ fontSize: 12, color: "#888", margin: "0 0 6px" }}>현재 인증 기준</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
                        {badge.minGrade}등급 이상 &amp; {badge.minScore}점 이상
                      </p>
                      <p style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>
                        A/S 완료 후 위 기준 충족 시 CareFlow 인증 뱃지가 자동 부여됩니다.
                      </p>
                    </div>
                    <button className="admin-btn admin-btn--primary" onClick={() => { setBadgeDraft(badge); setBadgeEdit(true); }}>
                      기준 수정
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                      <div className="admin-modal__field" style={{ flex: 1 }}>
                        <label className="admin-modal__label">최소 등급</label>
                        <select className="admin-select" style={{ width: "100%" }} value={badgeDraft.minGrade} onChange={(e) => setBadgeDraft((p) => ({ ...p, minGrade: e.target.value }))}>
                          {["A", "B", "C", "D"].map((g) => <option key={g} value={g}>{g}등급</option>)}
                        </select>
                      </div>
                      <div className="admin-modal__field" style={{ flex: 1 }}>
                        <label className="admin-modal__label">최소 점수</label>
                        <input className="admin-modal__input" type="number" min={0} max={100} value={badgeDraft.minScore} onChange={(e) => setBadgeDraft((p) => ({ ...p, minScore: Number(e.target.value) }))} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="admin-btn admin-btn--outline" onClick={() => setBadgeEdit(false)}>취소</button>
                      <button className="admin-btn admin-btn--primary" onClick={() => { setBadge(badgeDraft); setBadgeEdit(false); alert("저장되었습니다."); }}>저장</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {editCost && (
        <CostEditModal
          item={editCost}
          onClose={() => setEditCost(null)}
          onSave={(newCost) => {
            setRepairCosts((prev) => prev.map((c) => c.id === editCost.id ? { ...c, avgCost: newCost } : c));
            setEditCost(null);
          }}
        />
      )}
    </div>
  );
}
