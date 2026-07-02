import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { submitWorkReport } from "../../apis/engineers"; 
import "../../styles/Engineer/Engineerreportsubmitpage.css";

const DIAGNOSIS_OPTIONS = [
  { value: "NORMAL", label: "정상 확인" },
  { value: "REPAIRED", label: "수리 완료" },
  { value: "PART_REPLACED", label: "부품 교체" },
  { value: "UNREPAIRABLE", label: "수리 불가" },
];

export default function EngineerReportSubmitPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestId = location.state?.requestId;

  const [diagnosisResult, setDiagnosisResult] = useState("REPAIRED");
  const [workDurationMin, setWorkDurationMin] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [parts, setParts] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

    if (!requestId) {
      setError("연결된 작업 정보(requestId)가 없습니다. 대시보드나 작업 목록에서 다시 진입해주세요.");
      return;
    }
    if (!workDurationMin || !finalAmount) {
      setError("작업 시간과 최종 금액은 필수입니다.");
      return;
    }

    const payload = {
      requestId,
      diagnosisResult,
      workDurationMin: Number(workDurationMin),
      finalAmount: Number(finalAmount),
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
      const res = await submitWorkReport(payload);
      alert(res.data ?? "보고서가 제출되었습니다.");
      navigate("/engineer/report");
    } catch (err) {
      console.error("보고서 제출 실패:", err);
      const serverMsg = err.response?.data?.message;
      setError(serverMsg ?? "보고서 제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ersp">
      <button className="ersp-back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={14} /> 뒤로가기
      </button>

      <h1 className="ersp-header__title">작업 완료 보고서 작성</h1>
      <p className={`ersp-header__sub ${!requestId ? "ersp-header__sub--warn" : ""}`}>
        {requestId ? `요청 ID: ${requestId}` : "⚠ 연결된 작업 정보가 없습니다."}
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
            <label className="ersp-field__label">최종 청구 금액 (원) *</label>
            <input
              className="ersp-input"
              type="number"
              min="0"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              placeholder="예: 180000"
            />
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

          {parts.map((p, idx) => (
            <div key={idx} className="ersp-part-row">
              <input
                className="ersp-part-row__id"
                type="number"
                placeholder="부품 ID"
                value={p.repairPartId}
                onChange={(e) => updatePart(idx, "repairPartId", e.target.value)}
              />
              <input
                className="ersp-part-row__qty"
                type="number"
                min="1"
                placeholder="수량"
                value={p.quantity}
                onChange={(e) => updatePart(idx, "quantity", e.target.value)}
              />
              <input
                className="ersp-part-row__price"
                type="number"
                placeholder="단가(선택, 미입력시 기본단가)"
                value={p.appliedUnitPrice}
                onChange={(e) => updatePart(idx, "appliedUnitPrice", e.target.value)}
              />
              <button type="button" className="ersp-part-row__remove" onClick={() => removePart(idx)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {/* ⚠ 부품 목록(이름/코드) 조회 API가 없어 부품 ID를 직접 숫자로 입력하는 방식입니다.
              repair_parts 목록 조회 API가 생기면 드롭다운(부품명 검색)으로 교체하는 게 좋습니다. */}
          <p className="ersp-parts-note">※ 부품 ID를 모르면 비워두셔도 됩니다.</p>
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
          {submitting ? "제출 중..." : "보고서 제출"}
        </button>
      </form>
    </div>
  );
}