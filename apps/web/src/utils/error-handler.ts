/**
 * Standard error handler for API responses
 */
export function handleApiError(error: unknown, defaultMessage: string) {
  if (error instanceof Error) {
    return { error: error.message };
  }

  if (typeof error === "string") {
    return { error };
  }

  return { error: defaultMessage };
}
