export function getNonceAttr(provided?: string) {
  if (provided) return provided;
  const s = document.querySelector("script[nonce]") as HTMLScriptElement | null;
  return s?.nonce ?? undefined;
}

export function getExistingScript(id: string) {
  return document.getElementById(id) as HTMLScriptElement | null;
}

export function buildSrc(
  appKey: string,
  libs: readonly string[],
  autoload: boolean
) {
  const uniq = Array.from(new Set(libs)).filter(Boolean);
  const libQuery = uniq.length ? `&libraries=${uniq.join(",")}` : "";
  return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=${
    autoload ? "true" : "false"
  }${libQuery}`;
}

export function sameQuery(a: string, b: string) {
  try {
    const ua = new URL(a, location.origin);
    const ub = new URL(b, location.origin);
    return (
      ua.origin + ua.pathname === ub.origin + ub.pathname &&
      ua.searchParams.toString().split("&").sort().join("&") ===
        ub.searchParams.toString().split("&").sort().join("&")
    );
  } catch {
    return a === b;
  }
}
