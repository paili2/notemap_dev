export const filesSignature = (files: File[] | FileList) =>
  Array.from(files as File[])
    .map((f) => `${f.name}:${f.size}:${(f as any).lastModified ?? ""}`)
    .join("|");
