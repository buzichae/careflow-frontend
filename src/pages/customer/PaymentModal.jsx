import { useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { CreditCard, X, AlertCircle } from "lucide-react";
import "../../styles/Customer/PaymentModal.css";

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

/* ── 결제 모달 (토스페이먼츠 결제창 연동) ── */
export default function PaymentModal({ item, amount, onClose }) {
  const [step, setStep] = useState("confirm"); // confirm | processing | error
  const [errorMessage, setErrorMessage] = useState("");

  async function handlePay() {
    setStep("processing");
    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      // 결제 성공/실패 시 브라우저가 successUrl/failUrl로 이동하며 이 페이지는 벗어난다.
      // requestId는 우리가 쿼리파라미터로 실어보내고, paymentKey/orderId/amount는
      // 토스가 리다이렉트 시 자동으로 붙여준다.
      const origin = window.location.origin;
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId: `AS${item.requestId}-${Date.now()}`,
        orderName: item.appliance ?? "A/S 수리 결제",
        successUrl: `${origin}/customer/payment/success?requestId=${item.requestId}`,
        failUrl: `${origin}/customer/payment/fail?requestId=${item.requestId}`,
      });
    } catch (error) {
      setErrorMessage(
        error?.message || "결제 요청에 실패했습니다. 다시 시도해주세요.",
      );
      setStep("error");
    }
  }

  const closable = step !== "processing";

  return (
    <div className="cas-payment-overlay" onClick={() => closable && onClose()}>
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
                  <span>신용·체크카드</span>
                </div>
                <p className="cas-payment-modal__notice-text">
                  결제하기를 누르면 토스페이먼츠 결제창으로 이동합니다.
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
            <div className="cas-payment-status__spinner" />
            <p className="cas-payment-status__title">
              결제창으로 이동하고 있습니다...
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="cas-payment-status">
            <AlertCircle size={44} color="#ef4444" />
            <p className="cas-payment-status__title">결제 요청에 실패했습니다</p>
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
