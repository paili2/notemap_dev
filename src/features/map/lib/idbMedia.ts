import {
  dataUrlToBlob,
  getImageUrlFromRef,
  putImageBlob,
  type ImageRef,
} from "@/lib/imageStore";
import {
  isBlobLike,
  isDataLike,
  isHttpLike,
  isImageRefLike,
} from "../utils/images";

export type ImageRefGroup = ImageRef[];

export async function materializeToRefs(
  propertyId: string,
  cards: any[][],
  files: any[]
) {
  const cardRefs: ImageRefGroup[] = [];
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
        const idbKey = `prop:${propertyId}:card:${gi}:${ii}:${Date.now()}`;
        await putImageBlob(idbKey, blob);
        refs.push({ idbKey, name: it.name, caption: it.caption });
        continue;
      }
      if (isBlobLike(source)) {
        try {
          const res = await fetch(source);
          const blob = await res.blob();
          const idbKey = `prop:${propertyId}:card:${gi}:${ii}:${Date.now()}`;
          await putImageBlob(idbKey, blob);
          refs.push({ idbKey, name: it.name, caption: it.caption });
        } catch (e) {
          console.warn("blob: fetch 실패로 스킵", e);
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
      const idbKey = `prop:${propertyId}:file:${fi}:${Date.now()}`;
      await putImageBlob(idbKey, blob);
      fileRefs.push({ idbKey, name: it.name, caption: it.caption });
      continue;
    }
    if (isBlobLike(source)) {
      try {
        const res = await fetch(source);
        const blob = await res.blob();
        const idbKey = `prop:${propertyId}:file:${fi}:${Date.now()}`;
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
  cardRefs: ImageRefGroup[],
  fileRefs: ImageRef[]
) {
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
