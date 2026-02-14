export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export interface PaginationMeta {
  page: number;
  totalPages: number;
  totalCount: number;
}

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: PaginationMeta;
};
