// [신규] SSE 실시간 알림 구독 React 훅
//
// 마운트 시 /api/sse/subscribe 를 구독하고, 새 알림 이벤트가 도착하면
// onNotification 콜백을 호출한다. 언마운트 시 자동으로 구독을 해제한다.
//
// 사용 예:
//   useNotificationStream(useCallback((payload) => {
//     fetchList(); fetchSummary();
//   }, [fetchList, fetchSummary]));

import { useEffect, useRef } from "react";
import { openNotificationStream } from "../apis/notificationStream";

// 구독 직후 백엔드가 503 방지용으로 보내는 더미 핑 메시지.
// (NotificationService.subscribe → "EventStream Created. [userId=...]")
const CONNECT_PING_PREFIX = "EventStream Created";

export function useNotificationStream(onNotification, { onOpen, onError } = {}) {
  // 콜백을 ref 로 보관해, 콜백이 바뀌어도 SSE 연결은 재수립하지 않도록 함
  const cbRef = useRef(onNotification);
  cbRef.current = onNotification;
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  const errRef = useRef(onError);
  errRef.current = onError;

  useEffect(() => {
    const close = openNotificationStream({
      onOpen: () => openRef.current?.(),
      onError: (e) => errRef.current?.(e),
      onMessage: (evt) => {
        // 연결 직후 더미 핑은 무시
        if (!evt.data || evt.data.startsWith(CONNECT_PING_PREFIX)) return;

        // 실제 알림 payload 는 JSON 이지만, 문자열로 올 수도 있으니 방어적으로 파싱
        let payload = null;
        try {
          payload = JSON.parse(evt.data);
        } catch {
          payload = evt.data;
        }
        cbRef.current?.(payload, evt);
      },
    });

    return close; // 언마운트 시 구독 해제
  }, []); // 최초 1회만 연결 (콜백은 ref 로 최신값 사용)
}
