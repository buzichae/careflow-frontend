import { useEffect, useRef } from "react";

export default function YoutubePlayer({ videoId, onEnded }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        if (!videoId) return;

        // YouTube postMessage 이벤트로 영상 종료 감지
        function handleMessage(event) {
            if (event.origin !== "https://www.youtube.com") return;
            try {
                const data = JSON.parse(event.data);
                // info.playerState 0 = 영상 종료
                if (data.event === "infoDelivery" && data.info?.playerState === 0) {
                    onEnded?.();
                }
            } catch (e) {
                // JSON 파싱 실패 무시
            }
        }

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [videoId, onEnded]);

    if (!videoId) return null;

    return (
        <iframe
            ref={iframeRef}
            width="100%"
            height="360"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: 8 }}
        />
    );
}