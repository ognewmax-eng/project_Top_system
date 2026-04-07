/** Элемент attachments в БД: JSON-массив объектов { key, label, path } или legacy — строки-пути */

export interface AttachmentItem {
  key: string;
  label: string;
  path: string;
}

export function parseAttachmentsJson(raw: string | undefined | null): AttachmentItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string" && item.length > 0) {
          return { key: "file", label: "Документ", path: item };
        }
        if (item && typeof item === "object" && typeof (item as { path?: string }).path === "string") {
          const o = item as { key?: string; label?: string; path: string };
          return {
            key: String(o.key ?? "file"),
            label: String(o.label ?? "Документ"),
            path: o.path,
          };
        }
        return null;
      })
      .filter((x): x is AttachmentItem => x !== null);
  } catch {
    return [];
  }
}
