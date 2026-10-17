export type ErrorDetail = { path: string; message: string };

/** An error that is safe to send to the client as-is. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
