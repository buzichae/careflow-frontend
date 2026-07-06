import { useState } from "react";
import { CreditCard, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import "../../styles/Customer/PaymentModal.css";

/* ── 모의 결제 모달 (Phase 1: MOCK PG) ── */
export default function PaymentModal({ item, amount, onConfirm, onClose }) {
  const [step, setStep] = useState("confirm"); // confirm | processing | success | error
  const [errorMessage, setErrorMessage] = useState("");

  async function handlePay() {
    setStep("processing");
    try {
      // 모의 PG 연동 화면처럼 보이도록 최소 처리 시간을 둔다
      await Promise.all([
        onConfirm(),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);
      setStep("success");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "결제 처리에 실패했습니다. 다시 시도해주세요.",
      );
      setStep("error");
    }
  }

  const closable = step !== "processing";

  return (
    <div
      className="cas-payment-overlay"
      onClick={() => closable && onClose()}
    >
      <div className="cas-payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cas-payment-modal__header">
          <div className="cas-payment-modal__header-left">
            <CreditCard size={18} color="#7c5cf7" />
            <h3>결제</h3>
          </div>
          {closable && (
            <button className="cas-payment-modal__close" onClick={onClose}>
              <X size={17} />
            </button>
          )}
        </div>

        {step === "confirm" && (
          <>
            <div className="cas-payment-modal__target">
              <p className="cas-payment-modal__target-name">
                {item.appliance}
              </p>
              <p className="cas-payment-modal__target-info">
                수리 완료 · 결제 승인 대기
              </p>
            </div>

            <div className="cas-payment-modal__body">
              <div className="cas-payment-amount">
                <span className="cas-payment-amount__label">결제 금액</span>
                <span className="cas-payment-amount__value">
                  {amount != null ? amount.toLocaleString() : "—"}원
                </span>
              </div>

              <div className="cas-payment-method">
                <p className="cas-payment-method__label">결제 수단</p>
                <div className="cas-payment-method__card">
                  <CreditCard size={16} color="#7c5cf7" />
                  <span>신한카드 (**** 1234)</span>
                  <span className="cas-payment-method__badge">모의결제</span>
                </div>
                <p className="cas-payment-modal__notice-text">
                  현재 실제 PG사와 연동되지 않은 모의 결제 단계로,
                  실제 카드 승인이나 출금은 발생하지 않습니다.
                </p>
              </div>
            </div>

            <div className="cas-payment-modal__footer">
              <button
                className="cas-payment-modal__btn cas-payment-modal__btn--outline"
                onClick={onClose}
              >
                취소
              </button>
              <button
                className="cas-payment-modal__btn cas-payment-modal__btn--primary"
                onClick={handlePay}
              >
                {amount != null ? `${amount.toLocaleString()}원 결제하기` : "결제하기"}
              </button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="cas-payment-status">
            <Loader2 size={40} className="cas-payment-status__spinner" />
            <p className="cas-payment-status__title">결제 처리 중입니다...</p>
            <p className="cas-payment-status__desc">잠시만 기다려주세요.</p>
          </div>
        )}

        {step === "success" && (
          <div className="cas-payment-status">
            <CheckCircle2 size={44} color="#10b981" />
            <p className="cas-payment-status__title">결제가 완료되었습니다</p>
            <p className="cas-payment-status__amount">
              {amount != null ? amount.toLocaleString() : "—"}원
            </p>
            <button
              className="cas-payment-modal__btn cas-payment-modal__btn--primary cas-payment-status__confirm-btn"
              onClick={onClose}
            >
              확인
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="cas-payment-status">
            <AlertCircle size={44} color="#ef4444" />
            <p className="cas-payment-status__title">결제에 실패했습니다</p>
            <p className="cas-payment-status__desc">{errorMessage}</p>
            <button
              className="cas-payment-modal__btn cas-payment-modal__btn--outline cas-payment-status__confirm-btn"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
