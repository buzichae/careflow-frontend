import { useEffect, useRef } from "react";

export default function YoutubePlayer({ videoId, onEnded }) {
    const containerRef = useRef(null);
    const playerRef    = useRef(null);
    const onEndedRef   = useRef(onEnded);

    useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

    useEffect(() => {
        if (!videoId || !containerRef.current) return;

        // React 렌더링 트리 밖 별도 div에 플레이어 생성
        const wrapper = document.createElement("div");
        containerRef.current.appendChild(wrapper);

        function initPlayer() {
            if (!containerRef.current) return;

            playerRef.current = new window.YT.Player(wrapper, {
                videoId,
                width: "100%",
                height: "360",
                playerVars: { rel: 0 },
                events: {
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onEndedRef.current?.();
                        }
                    },
                },
            });
        }

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            if (!document.getElementById("youtube-api-script")) {
                const tag = document.createElement("script");
                tag.id  = "youtube-api-script";
                tag.src = "https://www.youtube.com/iframe_api";
                document.body.appendChild(tag);
            }
            window.onYouTubeIframeAPIReady = initPlayer;
        }

        return () => {
            // destroy 전에 wrapper를 먼저 React 컨테이너에서 분리
            // React는 containerRef(빈 div)만 언마운트하므로 충돌 없음
            try {
                if (playerRef.current) {
                    playerRef.current.destroy();
                    playerRef.current = null;
                }
            } catch (e) {}

            try {
                if (containerRef.current && wrapper.parentNode === containerRef.current) {
                    containerRef.current.removeChild(wrapper);
                }
            } catch (e) {}
        };
    }, [videoId]);

    if (!videoId) return null;

    // React는 이 빈 div만 관리 — 내부 iframe은 YouTube API가 직접 관리
    return <div ref={containerRef} style={{ width: "100%", borderRadius: 8, overflow: "hidden" }} />;
}