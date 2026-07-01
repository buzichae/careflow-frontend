import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../apis/axiosInstance";

function OAuth2Callback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      alert("로그인 처리 중 오류가 발생했습니다.");
      navigate("/auth/login", { replace: true });
      return;
    }

    api
      .post("/api/auth/oauth2/exchange", { code })
      .then((res) => {
        const { accessToken, refreshToken } = res.data;
        localStorage.setItem("token", accessToken);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
        navigate("/customer/home", { replace: true });
      })
      .catch(() => {
        alert("로그인 처리 중 오류가 발생했습니다.");
        navigate("/auth/login", { replace: true });
      });
  }, [navigate]);

  return <div>로그인 처리 중...</div>;
}

export default OAuth2Callback;
