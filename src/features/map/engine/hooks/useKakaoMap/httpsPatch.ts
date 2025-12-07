const forceHttps = (u?: string) =>
  typeof u === "string" ? u.replace(/^http:\/\//, "https://") : u;

/** 지도 DOM 하위에서 http 이미지를 실시간 https로 치환 */
export function installHttpsImagePatch(root: HTMLElement) {
  const toHttps = (s: string) => s.replaceAll("http://", "https://");

  const fixElement = (el: Element) => {
    // <img src="http://...">
    if (el instanceof HTMLImageElement) {
      const raw = el.getAttribute("src");
      if (raw && raw.startsWith("http://")) {
        el.setAttribute("src", toHttps(raw));
      }
    }
    // inline style에 background: url("http://...")
    if (el instanceof HTMLElement) {
      const styleAttr = el.getAttribute("style");
      if (styleAttr && styleAttr.includes("http://")) {
        el.setAttribute("style", toHttps(styleAttr));
      }
    }
  };

  // 초기 스캔
  root.querySelectorAll("*").forEach(fixElement);

  // 이후 변경 감시
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "attributes") {
        if (
          (m.target instanceof HTMLImageElement && m.attributeName === "src") ||
          (m.target instanceof HTMLElement && m.attributeName === "style")
        ) {
          fixElement(m.target as Element);
        }
      }
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            const el = n as Element;
            fixElement(el);
            el.querySelectorAll?.("*").forEach(fixElement);
          }
        });
      }
    }
  });

  mo.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["src", "style"],
  });

  return () => mo.disconnect();
}

/** Kakao SDK 관련 HTTP → HTTPS 패치 (MarkerClusterer, TileUrl) */
export function patchKakaoHttps(kakao: any) {
  try {
    // 1) 클러스터 기본 스프라이트 경로 https로 고정
    if (kakao?.maps?.MarkerClusterer) {
      kakao.maps.MarkerClusterer.prototype.IMAGE_PATH =
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerCluster";
    }
    // 2) 타일 URL이 http로 반환되면 https로 치환
    if (kakao?.maps?.services?.TileUrl) {
      const origin = kakao.maps.services.TileUrl;
      kakao.maps.services.TileUrl = (...args: any[]) =>
        forceHttps(origin(...args));
    }
  } catch (patchErr) {
    console.warn("[Kakao HTTPS patch] skipped:", patchErr);
  }
}
