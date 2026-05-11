import { AnnotationDocument, AnnotationShape } from "../types/annotations";

const PREFIX = "page-annotations:v1:";

function hashUrl(url: string): string {
  let hash = 2166136261;
  for (let index = 0; index < url.length; index += 1) {
    hash ^= url.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function currentUrlKey(): string {
  const url = `${location.origin}${location.pathname}${location.search}`;
  return `${PREFIX}${hashUrl(url)}`;
}

export function createDocument(shapes: AnnotationShape[]): AnnotationDocument {
  return {
    version: 1,
    url: `${location.origin}${location.pathname}${location.search}`,
    title: document.title,
    updatedAt: Date.now(),
    shapes
  };
}

export async function loadAnnotations(key: string): Promise<AnnotationDocument | null> {
  const chromeStorage = globalThis.chrome?.storage?.local;
  if (chromeStorage) {
    const result = await chromeStorage.get(key);
    return (result[key] as AnnotationDocument | undefined) ?? null;
  }

  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as AnnotationDocument) : null;
}

export async function saveAnnotations(key: string, documentValue: AnnotationDocument): Promise<void> {
  const chromeStorage = globalThis.chrome?.storage?.local;
  if (chromeStorage) {
    await chromeStorage.set({ [key]: documentValue });
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(documentValue));
}
