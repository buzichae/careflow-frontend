import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function OAuth2Callback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);

    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (accessToken) {
      localStorage.setItem("token", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      navigate("/customer/home", { replace: true });
    } else {
      alert("로그인 처리 중 오류가 발생했습니다.");
      navigate("/auth/login", { replace: true });
    }
  }, [navigate]);

  return <div>로그인 처리 중...</div>;
}

export default OAuth2Callback;