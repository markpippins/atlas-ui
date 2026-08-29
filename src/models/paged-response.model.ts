export interface PagedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}
