// Small helpers shared by the list endpoints (buyers, suppliers, shipments,
// hs-codes) so pagination/sorting parsing isn't copy-pasted four times.

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @param {URLSearchParams} searchParams
 * @returns {{page: number, limit: number, offset: number}}
 */
export function parsePagination(searchParams) {
  let page = parseInt(searchParams.get("page"), 10);
  let limit = parseInt(searchParams.get("limit"), 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Validates a `sort` query param (e.g. "createdAt:desc") against a
 * whitelist of { paramName: sqlColumn } so user input never ends up
 * directly interpolated into an ORDER BY clause.
 *
 * @param {URLSearchParams} searchParams
 * @param {Record<string,string>} allowedColumns  e.g. { createdAt: 'created_at' }
 * @param {string} defaultSort  e.g. "createdAt:desc"
 */
export function parseSort(searchParams, allowedColumns, defaultSort) {
  const raw = searchParams.get("sort") || defaultSort;
  const [field, dirRaw] = raw.split(":");
  const column = allowedColumns[field] || allowedColumns[defaultSort.split(":")[0]];
  const direction = dirRaw?.toLowerCase() === "asc" ? "ASC" : "DESC";
  return `${column} ${direction}`;
}

export function paginatedResponse({ rows, total, page, limit }) {
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
