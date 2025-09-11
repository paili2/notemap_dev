import {
  dataUrlToBlob,
  getImageUrlFromRef,
  putImageBlob,
  type ImageRef,
} from "@/lib/imageStore";
import { isBlobLike, isDataLike, isHttpLike, isImageRefLike } from "./utils";

/** 카드/파일 소스들을 IDB ImageRef로 저장하는 코어.
 *  baseKeyPrefix만 주입하면 어떤 도메인에도 재사용 가능.
 */
export async function materializeToRefs(
  baseKeyPrefix: string, // 예: "prop:123" | "pin:abc"
  cards: any[][],
  files: any[],
  now: () => number = Date.now
): Promise<{ cardRefs: ImageRef[][]; fileRefs: ImageRef[] }> {
  const cardRefs: ImageRef[][] = [];

  for (let gi = 0; gi < (cards?.length || 0); gi++) {
    const group = cards[gi] || [];
    const refs: ImageRef[] = [];

    for (let ii = 0; ii < group.length; ii++) {
      const it = group[ii] || {};
      if (isImageRefLike(it)) {
        refs.push({ idbKey: it.idbKey, name: it.name, caption: it.caption });
        continue;
      }
      const source: string | undefined = it.dataUrl || it.url;
      if (!source) continue;

      if (isHttpLike(source)) {
        refs.push({
          idbKey: `url:${source}`,
          name: it.name,
          caption: it.caption,
        });
        continue;
      }
      if (isDataLike(source)) {
        const blob = dataUrlToBlob(source);
        const idbKey = `${baseKeyPrefix}:card:${gi}:${ii}:${now()}`;
        await putImageBlob(idbKey, blob);
        refs.push({ idbKey, name: it.name, caption: it.caption });
        continue;
      }
      if (isBlobLike(source)) {
        try {
          const res = await fetch(source);
          const blob = await res.blob();
          const idbKey = `${baseKeyPrefix}:card:${gi}:${ii}:${now()}`;
          await putImageBlob(idbKey, blob);
          refs.push({ idbKey, name: it.name, caption: it.caption });
        } catch (e) {
          console.warn("blob(card): fetch 실패로 스킵", e);
        }
      }
    }
    if (refs.length) cardRefs.push(refs);
  }

  const fileRefs: ImageRef[] = [];
  for (let fi = 0; fi < (files?.length || 0); fi++) {
    const it = files[fi] || {};
    if (isImageRefLike(it)) {
      fileRefs.push({ idbKey: it.idbKey, name: it.name, caption: it.caption });
      continue;
    }
    const source: string | undefined = it.dataUrl || it.url;
    if (!source) continue;

    if (isHttpLike(source)) {
      fileRefs.push({
        idbKey: `url:${source}`,
        name: it.name,
        caption: it.caption,
      });
      continue;
    }
    if (isDataLike(source)) {
      const blob = dataUrlToBlob(source);
      const idbKey = `${baseKeyPrefix}:file:${fi}:${now()}`;
      await putImageBlob(idbKey, blob);
      fileRefs.push({ idbKey, name: it.name, caption: it.caption });
      continue;
    }
    if (isBlobLike(source)) {
      try {
        const res = await fetch(source);
        const blob = await res.blob();
        const idbKey = `${baseKeyPrefix}:file:${fi}:${now()}`;
        await putImageBlob(idbKey, blob);
        fileRefs.push({ idbKey, name: it.name, caption: it.caption });
      } catch (e) {
        console.warn("blob(file): fetch 실패로 스킵", e);
      }
    }
  }

  return { cardRefs, fileRefs };
}

export async function hydrateRefsToMedia(
  cardRefs: ImageRef[][],
  fileRefs: ImageRef[]
): Promise<{ hydratedCards: any[][]; hydratedFiles: any[] }> {
  const hydratedCards: any[][] = [];
  for (const g of cardRefs ?? []) {
    const arr: any[] = [];
    for (const r of g) {
      const url = await getImageUrlFromRef(r);
      if (url) arr.push({ url, name: r.name, caption: r.caption });
    }
    if (arr.length) hydratedCards.push(arr);
  }

  const hydratedFiles: any[] = [];
  for (const r of fileRefs ?? []) {
    const url = await getImageUrlFromRef(r);
    if (url) hydratedFiles.push({ url, name: r.name, caption: r.caption });
  }

  return { hydratedCards, hydratedFiles };
}
