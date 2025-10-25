export function buildSearchQuery(params: Record<string, any>): string {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== "") {
          sp.append(key, String(v));
        }
      });
      return;
    }

    if (typeof value === "boolean") {
      sp.append(key, String(value));
      return;
    }

    sp.append(key, String(value));
  });

  return sp.toString();
}
