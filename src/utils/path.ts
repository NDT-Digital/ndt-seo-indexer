export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function normalizeWebPath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = trimTrailingSlash(baseUrl);
  const normalizedPath = normalizeWebPath(path);

  if (normalizedPath === "/") {
    return normalizedBase;
  }

  return `${normalizedBase}${normalizedPath}`;
}

export function normalizeRelativeFilePath(path: string): string {
  return path.replace(/^\/+/, "").replace(/\\/g, "/");
}
