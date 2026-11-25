// [신규] SSE 실시간 알림 구독 유틸
//
// 백엔드 SSE 엔드포인트: GET /api/sse/subscribe (produces text/event-stream)
// 인증: JwtFilter가 "Authorization: Bearer <token>" 헤더로만 토큰을 읽는다.
//   → 브라우저 기본 EventSource는 커스텀 헤더를 실을 수 없으므로 사용할 수 없다.
//   → fetch + ReadableStream 으로 직접 SSE를 파싱하여 Bearer 헤더를 실어 보낸다.
//     (토큰이 URL 쿼리에 노출되지 않아 더 안전하고, 백엔드 인증 변경도 불필요.)
//
// 반환값: 구독 해제 함수. 컴포넌트 언마운트 시 반드시 호출할 것.

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"; // axiosInstance.js 의 baseURL 과 동일

/**
 * @param {object}   handlers
 * @param {(evt: {event: string, id: string|null, data: string|null}) => void} handlers.onMessage
 * @param {() => void}        [handlers.onOpen]
 * @param {(err: Error) => void} [handlers.onError]
 * @returns {() => void} 구독 해제 함수
 */
export function openNotificationStream({ onMessage, onOpen, onError } = {}) {
  const token = localStorage.getItem("token");
  // 미로그인 상태면 구독하지 않음 (no-op 해제 함수 반환)
  if (!token) return () => {};

  let closed = false;
  let controller = null;
  let retryDelay = 1000;      // 재연결 백오프 시작값 (1초)
  const MAX_DELAY = 30000;    // 최대 30초
  let lastEventId = "";       // 재연결 시 유실 구간 요청용 (백엔드가 지원하면 활용)

  // 하나의 SSE 이벤트 블록("\n\n"로 구분)을 필드 단위로 파싱
  function parseEvent(raw) {
    let event = "message";
    let id = null;
    const dataLines = [];

    for (const line of raw.split("\n")) {
      if (line === "" || line.startsWith(":")) continue; // 빈 줄/주석 무시
      const idx = line.indexOf(":");
      const field = idx === -1 ? line : line.slice(0, idx);
      let value = idx === -1 ? "" : line.slice(idx + 1);
      if (value.startsWith(" ")) value = value.slice(1); // SSE 규격: 콜론 뒤 공백 1개 제거

      if (field === "event") event = value;
      else if (field === "data") dataLines.push(value);
      else if (field === "id") id = value;
    }

    return { event, id, data: dataLines.length ? dataLines.join("\n") : null };
  }

  async function connect() {
    if (closed) return;
    controller = new AbortController();

    try {
      const res = await fetch(`${BASE_URL}/api/sse/subscribe`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
          ...(lastEventId ? { "Last-Event-ID": lastEventId } : {}),
        },
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`SSE 연결 실패: HTTP ${res.status}`);
      }

      onOpen?.();
      retryDelay = 1000; // 연결 성공 시 백오프 초기화

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (!closed) {
        const { value, done } = await reader.read();
        if (done) break; // 서버가 스트림을 종료 → 아래 재연결 로직으로
        buffer += decoder.decode(value, { stream: true });

        let sepIndex;
        while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          const parsed = parseEvent(rawEvent);
          if (parsed.id) lastEventId = parsed.id;
          if (parsed.data !== null) onMessage?.(parsed);
        }
      }
    } catch (err) {
      // 정상 종료(구독 해제)로 인한 abort 는 에러로 취급하지 않음
      if (closed || err?.name === "AbortError") return;
      onError?.(err);
    }

    // 명시적으로 닫지 않았다면 백오프 후 재연결
    if (!closed) {
      const delay = retryDelay;
      retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
      setTimeout(connect, delay);
    }
  }

  connect();

  return () => {
    closed = true;
    controller?.abort();
  };
}
