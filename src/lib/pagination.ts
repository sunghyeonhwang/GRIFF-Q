type SearchParams = Record<string, string | string[] | undefined>;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function parsePaginationParams(
  searchParams: SearchParams,
  defaultPageSize = 20,
): PaginationParams {
  const rawPage = typeof searchParams.page === "string" ? searchParams.page : "1";
  const rawSize = typeof searchParams.pageSize === "string" ? searchParams.pageSize : String(defaultPageSize);

  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(rawSize, 10) || defaultPageSize));

  return { page, pageSize };
}

export function parseSortParams(
  searchParams: SearchParams,
  allowedColumns: string[],
  defaultSort?: string,
  defaultOrder: "asc" | "desc" = "desc",
): SortParams {
  const rawSort = typeof searchParams.sortBy === "string" ? searchParams.sortBy : "";
  const rawOrder = typeof searchParams.sortOrder === "string" ? searchParams.sortOrder : "";

  const sortBy = allowedColumns.includes(rawSort) ? rawSort : (defaultSort ?? allowedColumns[0] ?? "created_at");
  const sortOrder = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : defaultOrder;

  return { sortBy, sortOrder };
}

export function buildPaginationRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

export function buildSearchParamsString(
  current: SearchParams,
  updates: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(current)) {
    if (typeof val === "string") params.set(key, val);
  }
  for (const [key, val] of Object.entries(updates)) {
    if (val === undefined) params.delete(key);
    else params.set(key, val);
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}
