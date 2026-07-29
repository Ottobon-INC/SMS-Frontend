export type ApiError = {
  error: {
    code: string;
    message: string;
    correlationId?: string;
    details?: unknown;
  };
};
