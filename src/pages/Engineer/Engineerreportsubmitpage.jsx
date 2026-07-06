import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import {
  submitWorkReport,
  // [신규 필요] 아래 두 함수는 백엔드/apis 파일에 아직 없을 수 있습니다.
  // - getWorkReportDetail(reportId): 기존 보고서 상세 조회 (수정 화면 진입 시 폼 채우기용)
  // - updateWorkReport(reportId, payload): 기존 보고서 수정 저장
  // 없다면 apis/engineers.js에 추가하고, 백엔드에도 대응 엔드포인트가 필요합니다.
  getWorkReportDetail,
  updateWorkReport,
  getRepairParts, getReportFormData,
} from "../../apis/engineers";
import "../../styles/Engineer/Engineerreportsubmitpage.css";

const VISIT_FEE = 28000; // 출장비(기본) — 백엔드 VISIT_FEE와 반드시 동일 값 유지

const DIAGNOSIS_OPTIONS = [
  { value: "NORMAL", label: "정상 확인" },
  { value: "REPAIRED", label: "수리 완료" },
  { value: "PART_REPLACED", label: "부품 교체" },
  { value: "UNREPAIRABLE", label: "수리 불가" },
];

export default function EngineerReportSubmitPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // [연동] EngineerReportPage에서 넘어오는 두 가지 진입 방식:
  // - 신규 작성: { requestId } 만 전달됨
  // - 수정:      { reportId, requestId } 함께 전달됨 → 기존 데이터를 불러와 폼에 채움
  const requestId = location.state?.requestId;
  const passedRequestCode = location.state?.requestCode; // 포맷팅된 접수번호 (화면 전시용)
  const reportId  = location.state?.reportId;
  const isEditMode = !!reportId;
  // 작업 컨텍스트: 수정(reportId) 또는 신규(requestId) 중 하나는 있어야 함
  const hasWorkContext = isEditMode || !!requestId;

  const [diagnosisResult, setDiagnosisResult] = useState("REPAIRED");
  const [workDurationMin, setWorkDurationMin] = useState("");
  const [memo, setMemo] = useState("");
  const [parts, setParts] = useState([]);

  // [연동] 부품 ID를 직접 입력하던 방식 → 드롭다운(검색)으로 교체.
  // repair_parts 마스터 목록을 미리 불러와서 이름/코드로 검색·선택할 수 있게 함.
  const [partOptions, setPartOptions] = useState([]);
  const [partOptionsLoading, setPartOptionsLoading] = useState(true);
  const [partOptionsError, setPartOptionsError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getRepairParts()
      .then((res) => {
        if (mounted) setPartOptions(res.data ?? []);
      })
      .catch((err) => {
        console.error("부품 목록 조회 실패:", err);
        if (mounted) setPartOptionsError(true);
      })
      .finally(() => {
        if (mounted) setPartOptionsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // [임시방편] 백엔드 응답에 repairPartId가 없어서, 부품 마스터 목록이
  // 로드되면 partCode로 역매칭해서 repairPartId를 채워 넣음.
  // repairPartId가 이미 있는 항목(사용자가 직접 새로 선택한 것)은 건드리지 않음.
  useEffect(() => {
    if (partOptions.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 부품 마스터 로드 후 partCode 역매칭 1회 동기화(의도된 패턴)
    setParts((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        if (p.repairPartId || !p._matchCode) return p;
        const matched = partOptions.find((po) => po.partCode === p._matchCode);
        if (!matched) return p;
        changed = true;
        return { ...p, repairPartId: String(matched.repairPartId) };
      });
      return changed ? next : prev;
    });
  }, [partOptions]);

  // 컨텍스트가 없으면 스피너 없이 바로 안내 메시지를 노출하도록 초기값을 hasWorkContext로 둠
  const [loadingDetail, setLoadingDetail] = useState(hasWorkContext);
  const [loadError, setLoadError] = useState(null);
  // [연동 준비] 수정 모드에서 불러온 상세 데이터에 형식화된 접수번호
  // (requestCode)가 있으면 화면 표시용으로 저장. 없으면 숫자 requestId 그대로 사용.
  const [requestDisplayCode, setRequestDisplayCode] = useState(passedRequestCode || null);
  const [blockedByApproval, setBlockedByApproval] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 수정 모드일 때 기존 보고서 상세를 불러와 폼에 채움
  useEffect(() => {
    // 컨텍스트가 없으면 이펙트에서 상태를 건드리지 않고 종료(안내는 렌더 단에서 파생값으로 처리)
    if (!hasWorkContext) return;

    let mounted = true;

    /* eslint-disable react-hooks/set-state-in-effect -- 비동기 조회 직전 로딩/에러 상태 초기화(재조회 대비 의도된 동작) */
    setLoadingDetail(true);
    setLoadError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    const fetchApi = isEditMode
        ? getWorkReportDetail(reportId)
        : getReportFormData(requestId);

    fetchApi
        .then((res) => {
          if (!mounted) return;
          const d = res.data;

          // 수정 모드일 때 승인 완료 차단 로직
          if (isEditMode && d.status === "APPROVED") {
            setBlockedByApproval(true);
            return;
          }

        setDiagnosisResult(d.diagnosisResult ?? "REPAIRED");
        setRequestDisplayCode(d.requestCode ?? null);
        setWorkDurationMin(d.workDurationMin != null ? String(d.workDurationMin) : "");
        setMemo(d.memo ?? "");
        // [버그 수정] 이미 사용된 부품이 지금은 단종(is_active=0)이라
        // ⚠ [백엔드 확인 필요] 이 응답의 parts 항목에 repairPartId가 아예 없고
        // partName/partCode/quantity/appliedUnitPrice/importance만 있음.
        // repairPartId가 없으면 드롭다운에서 정확히 매칭할 방법이 없어서,
        // 일단 partCode로 부품 마스터 목록에서 역매칭하는 임시방편을 씀
        // (아래 useEffect 참고). 근본적으로는 이 API 응답에도 repairPartId를
        // 포함해달라고 백엔드에 요청하는 게 맞음.
        setParts(
          (d.parts ?? []).map((p) => ({
            repairPartId: p.repairPartId != null ? String(p.repairPartId) : "",
            quantity: p.quantity ?? 1,
            appliedUnitPrice: p.appliedUnitPrice != null ? String(p.appliedUnitPrice) : "",
            _fallbackName: p.partName,
            _fallbackCode: p.partCode,
            _matchCode: p.partCode, // repairPartId 없을 때 이 코드로 역매칭 시도
          }))
        );
      })
      .catch((err) => {
        console.error("보고서 상세 조회 실패:", err);
        if (mounted) setLoadError("기존 보고서 정보를 불러오지 못했습니다.");
      })
      .finally(() => { if (mounted) setLoadingDetail(false); });

    return () => { mounted = false; };
  }, [isEditMode, reportId, requestId, hasWorkContext]);

  // 최종 금액 = 부품 합계 + 출장비 (백엔드와 동일 규칙, 기사 직접 입력 없음)
  const partsTotal = parts.reduce((sum, p) => {
    if (!p.repairPartId) return sum;
    const qty = Number(p.quantity) || 1;
    const price = Number(p.appliedUnitPrice) || 0;
    return sum + qty * price;
  }, 0);
  const computedFinalAmount = partsTotal + VISIT_FEE;

  const addPart = () => {
    setParts((prev) => [...prev, { repairPartId: "", quantity: 1, appliedUnitPrice: "" }]);
  };

  const updatePart = (idx, field, value) => {
    setParts((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const removePart = (idx) => {
    setParts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isEditMode && !requestId) {
      setError("연결된 작업 정보(requestId)가 없습니다. 대시보드나 작업 목록에서 다시 진입해주세요.");
      return;
    }
    if (!workDurationMin) {
      setError("작업 시간은 필수입니다.");
      return;
    }

    const payload = {
      requestId,
      diagnosisResult,
      workDurationMin: Number(workDurationMin),
      finalAmount: computedFinalAmount, // 서버가 재계산하지만 표시 일관성을 위해 함께 전송
      memo: memo || undefined,
      parts: parts
        .filter((p) => p.repairPartId)
        .map((p) => ({
          repairPartId: Number(p.repairPartId),
          quantity: Number(p.quantity) || 1,
          appliedUnitPrice: p.appliedUnitPrice ? Number(p.appliedUnitPrice) : undefined,
        })),
    };

    setSubmitting(true);
    try {
      const res = isEditMode
        ? await updateWorkReport(reportId, payload)
        : await submitWorkReport(payload);
      alert(res.data ?? (isEditMode ? "보고서가 수정되었습니다." : "보고서가 제출되었습니다."));
      // [수정] 수정 완료 시엔 목록이 아니라 방금 수정한 보고서의 상세 페이지로 이동
      if (isEditMode) {
        navigate(`/engineer/reports/${reportId}`);
      } else {
        navigate("/engineer/report");
      }
    } catch (err) {
      console.error("보고서 제출 실패:", err);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;

      // [연동] PUT /work-reports/{reportId} 확인된 실제 응답:
      // - 403: 본인이 작성한 게 아니거나, 이미 고객이 승인한(APPROVED) 보고서 수정 시도
      //   (서버가 "고객이 이미 승인한 보고서는 수정할 수 없습니다." 같은 명확한 메시지를 주므로
      //    serverMsg를 그대로 보여주는 것이 가장 정확함)
      // - 404: 존재하지 않는 보고서
      if (status === 403) {
        setError(serverMsg ?? "이 보고서를 수정할 권한이 없습니다.");
      } else if (status === 404) {
        setError(serverMsg ?? "존재하지 않는 보고서입니다.");
      } else {
        setError(serverMsg ?? (isEditMode ? "보고서 수정에 실패했습니다." : "보고서 제출에 실패했습니다."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDetail) {
    return (
      <div className="ersp">
        <p style={{ padding: 24 }}>불러오는 중...</p>
      </div>
    );
  }

  if (blockedByApproval) {
    return (
      <div className="ersp">
        <button className="ersp-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={14} /> 뒤로가기
        </button>
        <div className="ersp-error" style={{ marginTop: 16 }}>
          이미 승인 완료된 보고서는 수정할 수 없습니다.
        </div>
      </div>
    );
  }

  // 로드 실패(loadError) 또는 진입 컨텍스트 없음을 하나의 파생값으로 합쳐 렌더
  const effectiveLoadError =
    loadError ?? (!hasWorkContext ? "연결된 작업 정보가 없습니다. 목록에서 다시 진입해주세요." : null);
  if (effectiveLoadError) {
    return (
      <div className="ersp">
        <button className="ersp-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={14} /> 뒤로가기
        </button>
        <div className="ersp-error" style={{ marginTop: 16 }}>{effectiveLoadError}</div>
      </div>
    );
  }

  return (
    <div className="ersp">
      <button className="ersp-back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={14} /> 뒤로가기
      </button>

      <h1 className="ersp-header__title">
        {isEditMode ? "작업 완료 보고서 수정" : "작업 완료 보고서 작성"}
      </h1>
      <p className={`ersp-header__sub ${!requestId && !isEditMode ? "ersp-header__sub--warn" : ""}`}>
        {requestDisplayCode ? `요청 ID: ${requestDisplayCode}` : requestId ? `요청 ID: ${requestId}` : !isEditMode ? "⚠ 연결된 작업 정보가 없습니다." : ""}
      </p>

      {error && <div className="ersp-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="ersp-field">
          <label className="ersp-field__label">진단 결과 *</label>
          <select className="ersp-select" value={diagnosisResult} onChange={(e) => setDiagnosisResult(e.target.value)}>
            {DIAGNOSIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="ersp-field__row">
          <div className="ersp-field">
            <label className="ersp-field__label">작업 시간 (분) *</label>
            <input
              className="ersp-input"
              type="number"
              min="0"
              value={workDurationMin}
              onChange={(e) => setWorkDurationMin(e.target.value)}
              placeholder="예: 80"
            />
          </div>
          <div className="ersp-field">
            <label className="ersp-field__label">최종 청구 금액 (원)</label>
            <input
              className="ersp-input"
              type="text"
              value={`${computedFinalAmount.toLocaleString()}원`}
              readOnly
              style={{ background: "#f7f7fb", color: "#333", fontWeight: 700 }}
            />
            <p className="ersp-parts-note" style={{ marginTop: 6 }}>
              부품 합계 {partsTotal.toLocaleString()}원 + 출장비 {VISIT_FEE.toLocaleString()}원 = 최종 {computedFinalAmount.toLocaleString()}원
              <br />※ 최종 금액은 부품 합계와 출장비로 자동 계산됩니다.
            </p>
          </div>
        </div>

        <div className="ersp-field">
          <div className="ersp-parts-header">
            <label className="ersp-field__label">교체 부품 (선택)</label>
            <button type="button" className="ersp-parts-add-btn" onClick={addPart}>
              <Plus size={13} /> 부품 추가
            </button>
          </div>

          {parts.length === 0 && <p className="ersp-parts-empty">교체한 부품이 있으면 추가해주세요.</p>}

          {parts.map((p, idx) => {
            const selectedPart = partOptions.find((po) => String(po.repairPartId) === String(p.repairPartId));
            const displayValue = p.repairPartId || (!selectedPart && p._fallbackName ? "__unmatched__" : "");

            // 🌟 신규: 현재 입력된 수량과 단가를 곱해서 부품 소계(총액)를 계산
            const qty = Number(p.quantity) || 1;
            const unitPrice = Number(p.appliedUnitPrice) || 0;
            const partTotal = qty * unitPrice;

            return (
                <div key={idx} className="ersp-part-row-container" style={{ marginBottom: "12px" }}>
                  <div className="ersp-part-row" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <select
                        className="ersp-part-row__id"
                        value={displayValue}
                        onChange={(e) => {
                          if (e.target.value === "__unmatched__") return;
                          const selected = partOptions.find((po) => String(po.repairPartId) === e.target.value);
                          updatePart(idx, "repairPartId", e.target.value);
                          if (selected) {
                            updatePart(idx, "appliedUnitPrice", String(selected.baseUnitPrice));
                          }
                        }}
                        disabled={partOptionsLoading}
                    >
                      <option value="">부품 선택</option>
                      {!selectedPart && p._fallbackName && (
                          <option value="__unmatched__">{p._fallbackName}</option>
                      )}
                      {partOptions.map((po) => (
                          <option key={po.repairPartId} value={po.repairPartId}>
                            {po.partName}{po.spec ? ` (${po.spec})` : ""}
                          </option>
                      ))}
                      {partOptionsError && <option disabled>부품 목록을 불러오지 못했습니다</option>}
                    </select>

                    <input
                        className="ersp-part-row__qty"
                        type="number"
                        min="1"
                        placeholder="수량"
                        value={p.quantity}
                        onChange={(e) => updatePart(idx, "quantity", e.target.value)}
                    />

                    {/* 🌟 UX 개선: 부품 1개당 가격임을 시각적으로 명확히 표시 */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                          className="ersp-part-row__price"
                          type="number"
                          placeholder="1개당 단가 (미입력시 기본값)" // 1. Placeholder 직관적으로 변경
                          value={p.appliedUnitPrice}
                          title="부품 1개의 가격(단가)을 입력하세요." // 2. 마우스 오버 시 툴팁 제공
                          onChange={(e) => updatePart(idx, "appliedUnitPrice", e.target.value)}
                          style={{ width: "160px" }} // 필요시 input 너비 조절
                      />
                      {/* 3. 단위 고정 노출로 '총액'이 아님을 각인 */}
                      <span style={{ fontSize: "13px", color: "#666", whiteSpace: "nowrap" }}>원/개</span>
                    </div>

                    <button type="button" className="ersp-part-row__remove" onClick={() => removePart(idx)}>
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* 🌟 신규: 부품 선택 후 단가나 수량이 있으면 하단에 소계를 실시간으로 보여줌 */}
                  {unitPrice > 0 && (
                      <div style={{ fontSize: "12px", color: "#5B4FF5", textAlign: "right", marginTop: "4px" }}>
                        부품 소계: {partTotal.toLocaleString()}원
                      </div>
                  )}
                </div>
            );
          })}
          <p className="ersp-parts-note">※ 부품을 선택하면 기준 단가가 자동으로 채워지며, 필요시 직접 수정할 수 있습니다.</p>
        </div>

        <div className="ersp-field">
          <label className="ersp-field__label">기타 사항 (선택)</label>
          <textarea
            className="ersp-textarea"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={4}
            placeholder="작업 중 특이사항이나 고객 안내 내용을 입력하세요."
          />
        </div>

        <button type="submit" className="ersp-submit-btn" disabled={submitting}>
          {submitting ? (isEditMode ? "수정 중..." : "제출 중...") : (isEditMode ? "보고서 수정" : "보고서 제출")}
        </button>
      </form>
    </div>
  );
}