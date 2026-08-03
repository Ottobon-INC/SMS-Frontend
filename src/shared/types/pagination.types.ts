export type PaginationQuery = {
  page?: number;
  pageSize?: number;
};

export type PaginatedResult<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
};
