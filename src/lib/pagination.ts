export const ADMIN_LIST_PAGE = 1;
export const ADMIN_LIST_LIMIT = 20;

export type ListPageParams = {
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  nextPage?: number | null;
  prevPage?: number | null;
};

export type Paginated<T> = {
  items: T[];
  meta: PaginationMeta;
};

function asFiniteNumber(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function readItems<T>(value: Record<string, unknown>): T[] {
  if (Array.isArray(value.items)) return value.items as T[];
  if (Array.isArray(value.data)) return value.data as T[];
  if (Array.isArray(value.docs)) return value.docs as T[];
  if (Array.isArray(value.results)) return value.results as T[];
  return [];
}

/** Raw arrays are treated as a full unpaginated result (one page), not a 20-row slice. */
export function parsePaginatedResponse<T>(
  data: unknown,
  fallbackPage = ADMIN_LIST_PAGE,
  fallbackLimit = ADMIN_LIST_LIMIT,
): Paginated<T> {
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      meta: {
        page: 1,
        limit: data.length || fallbackLimit,
        total: data.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        nextPage: null,
        prevPage: null,
      },
    };
  }

  if (!isRecord(data)) {
    return {
      items: [],
      meta: {
        page: fallbackPage,
        limit: fallbackLimit,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        nextPage: null,
        prevPage: null,
      },
    };
  }

  const items = readItems<T>(data);
  const metaSource = isRecord(data.meta) ? data.meta : data;
  const page = Math.max(1, asFiniteNumber(metaSource.page, fallbackPage));
  const limit = Math.max(1, asFiniteNumber(metaSource.limit, fallbackLimit));
  const total = Math.max(0, asFiniteNumber(metaSource.total ?? metaSource.totalDocs, items.length));
  const totalPages = Math.max(
    1,
    asFiniteNumber(metaSource.totalPages, Math.max(1, Math.ceil(total / limit) || 1)),
  );

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: Boolean(metaSource.hasNext),
      hasPrev: Boolean(metaSource.hasPrev),
      nextPage: (metaSource.nextPage as number | null | undefined) ?? null,
      prevPage: (metaSource.prevPage as number | null | undefined) ?? null,
    },
  };
}

export function unwrapListItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  return parsePaginatedResponse<T>(data).items;
}

export function wantsPage(params?: ListPageParams) {
  return params?.page != null || params?.limit != null;
}

export function resolveListResult<T>(data: unknown, params?: ListPageParams): T[] | Paginated<T> {
  if (wantsPage(params)) {
    return parsePaginatedResponse<T>(data, params?.page ?? ADMIN_LIST_PAGE, params?.limit ?? ADMIN_LIST_LIMIT);
  }
  return unwrapListItems<T>(data);
}

export function listItems<T>(result: T[] | Paginated<T> | undefined | null): T[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  return Array.isArray(result.items) ? result.items : [];
}

export function listMeta(
  result: unknown,
  fallbackPage = ADMIN_LIST_PAGE,
  fallbackLimit = ADMIN_LIST_LIMIT,
): PaginationMeta {
  if (Array.isArray(result)) {
    return {
      page: 1,
      limit: result.length || fallbackLimit,
      total: result.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
      nextPage: null,
      prevPage: null,
    };
  }
  if (result && typeof result === "object" && "meta" in result) {
    return parsePaginatedResponse(result, fallbackPage, fallbackLimit).meta;
  }
  return parsePaginatedResponse(result, fallbackPage, fallbackLimit).meta;
}

export function pageQuery(params?: ListPageParams) {
  return {
    ...(params?.page != null ? { page: params.page } : {}),
    ...(params?.limit != null ? { limit: params.limit } : {}),
  };
}
