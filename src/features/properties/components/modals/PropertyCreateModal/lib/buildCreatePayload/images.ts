// PropertyCreateModal/lib/buildCreatePayload/images.ts
import type {
  ImageItem,
  StoredMediaItem,
} from "@/features/properties/types/media";

type NormalizedFolder = {
  title: string;
  items: ImageItem[];
};

export type ImagesOut = {
  imageFoldersStored: StoredMediaItem[][];
  imageCardsUI: { url: string; name: string; caption?: string }[][];
  imageCardCounts: number[];
  verticalImagesStored: StoredMediaItem[];
  verticalImagesUI: {
    url: string;
    name: string;
    caption?: string;
    idbKey?: string;
  }[];
  imageFoldersRaw: { title?: string; items: ImageItem[] }[];
  imageFolderTitles: string[];
  fileItemsRaw: ImageItem[];
  imagesFlatStrings: string[];
};

export function buildImages(
  imageFolders: (ImageItem[] | { title?: string; items: ImageItem[] })[],
  fileItems: ImageItem[]
): ImagesOut {
  const normalizedFolders: NormalizedFolder[] = (imageFolders ?? []).map(
    (folder: any): NormalizedFolder => {
      if (Array.isArray(folder)) {
        return {
          title: "",
          items: (folder as ImageItem[]).map((i) => ({ ...i })),
        };
      }
      const title =
        typeof folder?.title === "string" ? folder.title.trim() : "";
      const itemsSrc: ImageItem[] = Array.isArray(folder?.items)
        ? folder.items
        : [];
      return {
        title,
        items: itemsSrc.map((i) => ({ ...i })),
      };
    }
  );

  const cardsOnly: ImageItem[][] = normalizedFolders.map((f) => f.items);

  const imageFoldersRaw: { title?: string; items: ImageItem[] }[] =
    normalizedFolders.map((f) => ({
      title: f.title,
      items: f.items.map((i) => ({ ...i })),
    }));

  const imageFolderTitles: string[] = normalizedFolders.map((f) => f.title);

  const fileItemsRaw: ImageItem[] = fileItems.map((i) => ({ ...i }));

  const imageCardsUI: { url: string; name: string; caption?: string }[][] =
    cardsOnly.map((card) =>
      card
        .filter((it) => !!it.url)
        .map(({ url, name, caption }) => ({
          url: url as string,
          name: name ?? "",
          ...(caption ? { caption } : {}),
        }))
    );

  const imageFoldersStored: StoredMediaItem[][] = cardsOnly.map((card) =>
    card.map(
      ({ idbKey: _idbKey, url: _url, name: _name, caption: _caption }) => ({
        ...(_idbKey ? { idbKey: _idbKey } : {}),
        ...(_url ? { url: _url } : {}),
        ...(_name ? { name: _name } : {}),
        ...(_caption ? { caption: _caption } : {}),
      })
    )
  );

  const imagesFlatStrings: string[] = cardsOnly
    .flat()
    .map((f) => f.url)
    .filter(Boolean) as string[];

  const imageCardCounts = cardsOnly.map((card) => card.length);

  const verticalImagesStored: StoredMediaItem[] = fileItems.map(
    ({ idbKey: _idbKey, url: _url, name: _name, caption: _caption }) => ({
      ...(_idbKey ? { idbKey: _idbKey } : {}),
      ...(_url ? { url: _url } : {}),
      ...(_name ? { name: _name } : {}),
      ...(_caption ? { caption: _caption } : {}),
    })
  );

  const verticalImagesUI = fileItems
    .filter((f) => !!f.url)
    .map(({ idbKey: _idbKey, url: _url, name: _name, caption: _caption }) => ({
      url: _url as string,
      name: _name ?? "",
      ...(_caption ? { caption: _caption } : {}),
      ...(_idbKey ? { idbKey: _idbKey } : {}),
    }));

  return {
    imageFoldersStored,
    imageCardsUI,
    imageCardCounts,
    verticalImagesStored,
    verticalImagesUI,
    imageFoldersRaw,
    imageFolderTitles,
    fileItemsRaw,
    imagesFlatStrings,
  };
}
