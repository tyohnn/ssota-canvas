export type ActionSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ActionFailure<E = string> = {
  success: false;
  error: E;
  code?: string;
  issues?: unknown; // e.g., zod issues
  meta?: Record<string, unknown>;
};

export type ActionResult<T, E = string> = ActionSuccess<T> | ActionFailure<E>;

export function ok<T>(
  data: T,
  meta?: Record<string, unknown>
): ActionSuccess<T> {
  return { success: true, data, meta };
}

export function err<E = string>(
  error: E,
  options?: { code?: string; issues?: unknown; meta?: Record<string, unknown> }
): ActionFailure<E> {
  const { code, issues, meta } = options ?? {};
  return { success: false, error, code, issues, meta };
}

export function isSuccess<T, E = string>(
  result: ActionResult<T, E>
): result is ActionSuccess<T> {
  return result.success === true;
}

export function isFailure<T, E = string>(
  result: ActionResult<T, E>
): result is ActionFailure<E> {
  return result.success === false;
}

export function unwrap<T, E = string>(result: ActionResult<T, E>): T {
  if (isSuccess(result)) return result.data;
  // Convert error payload to a readable message if possible
  const message =
    typeof result.error === "string"
      ? result.error
      : ((result.error as any)?.message ?? "Unknown error");
  throw new Error(message);
}

// Helper to capture exceptions into ActionResult
export async function fromPromise<T, E = string>(
  promise: Promise<T>,
  onError?: (e: unknown) => E
): Promise<ActionResult<T, E>> {
  try {
    const data = await promise;
    return ok<T>(data);
  } catch (e) {
    const error = onError ? onError(e) : (normalizeError(e) as unknown as E);
    return err<E>(error);
  }
}

export function normalizeError(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const anyE = e as any;
    if (anyE?.message && typeof anyE.message === "string") return anyE.message;
    try {
      return JSON.stringify(anyE);
    } catch {
      return "Unknown error";
    }
  }
  return "Unknown error";
}
