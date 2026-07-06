import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import "../../styles/Customer/PaymentModal.css";
import { processPayment } from "../../apis/as";

/*
 * 토스페이먼츠 결제창에서 successUrl/failUrl로 리다이렉트되어 오는 공용 결과 페이지.
 * - success=true: paymentKey/orderId/amount로 백엔드 승인(confirm) API 호출 후 결과 표시
 * - success=false: 토스가 붙여주는 code/message를 그대로 표시 (백엔드 호출 불필요 — 결제 자체가 진행되지 않음)
 */
export default function PaymentResultPage({ success }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState(success ? "confirming" : "failed");
  const [errorMessage, setErrorMessage] = useState(searchParams.get("message"));
  const amount = searchParams.get("amount");
  const requested = useRef(false);

  useEffect(() => {
    if (!success || requested.current) return;
    requested.current = true;

    const requestId = searchParams.get("requestId");
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amountParam = Number(searchParams.get("amount"));

    processPayment(requestId, { paymentKey, orderId, amount: amountParam })
      .then(() => setState("success"))
      .catch((err) => {
        setErrorMessage(
          err.response?.data?.message || "결제 승인 처리에 실패했습니다.",
        );
        setState("failed");
      });
  }, [success, searchParams]);

  return (
    <div className="cas-payment-overlay" style={{ position: "fixed" }}>
      <div className="cas-payment-modal">
        <div className="cas-payment-status">
          {state === "confirming" && (
            <>
              <div className="cas-payment-status__spinner" />
              <p className="cas-payment-status__title">
                결제 승인을 확인하고 있습니다...
              </p>
            </>
          )}

          {state === "success" && (
            <>
              <CheckCircle2 size={44} color="#10b981" />
              <p className="cas-payment-status__title">결제가 완료되었습니다</p>
              {amount && (
                <p className="cas-payment-status__amount">
                  {Number(amount).toLocaleString()}원
                </p>
              )}
              <button
                className="cas-payment-modal__btn cas-payment-modal__btn--primary cas-payment-status__confirm-btn"
                onClick={() => navigate("/customer/as")}
              >
                A/S 내역으로 돌아가기
              </button>
            </>
          )}

          {state === "failed" && (
            <>
              <AlertCircle size={44} color="#ef4444" />
              <p className="cas-payment-status__title">결제에 실패했습니다</p>
              {errorMessage && (
                <p className="cas-payment-status__desc">{errorMessage}</p>
              )}
              <button
                className="cas-payment-modal__btn cas-payment-modal__btn--outline cas-payment-status__confirm-btn"
                onClick={() => navigate("/customer/as")}
              >
                A/S 내역으로 돌아가기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
