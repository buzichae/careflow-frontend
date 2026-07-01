import { useEffect, useRef } from "react";

export default function YoutubePlayer({ videoId, onEnded }) {
    const playerRef    = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!videoId) return;

        // YouTube IFrame API 스크립트 로드 (이미 로드됐으면 스킵)
        if (!window.YT) {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
        }

        function createPlayer() {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
            playerRef.current = new window.YT.Player(containerRef.current, {
                videoId,
                width:  "100%",
                height: "360",
                events: {
                    onStateChange: (event) => {
                        // 0 = 영상 종료
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onEnded?.();
                        }
                    },
                },
            });
        }

        // API 이미 로드된 경우 바로 생성, 아니면 콜백 등록
        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            window.onYouTubeIframeAPIReady = createPlayer;
        }

        // 컴포넌트 언마운트 시 플레이어 정리
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [videoId]);

    return <div ref={containerRef} />;
}