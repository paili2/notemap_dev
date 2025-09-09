export function extractViewMeta(data: any) {
  const pinKind =
    data?.pinKind ??
    data?.kind ??
    data?.markerKind ??
    data?.view?.pinKind ??
    "1room";

  const baseAreaTitleView =
    data?.baseAreaTitle ?? data?.areaTitle ?? data?.areaSetTitle ?? "";

  const extraAreaTitlesView: string[] =
    (Array.isArray(data?.extraAreaTitles) && data.extraAreaTitles) ||
    (Array.isArray(data?.areaSetTitles) && data.areaSetTitles) ||
    [];

  return {
    pinKind,
    baseAreaTitleView,
    extraAreaTitlesView,
  };
}
