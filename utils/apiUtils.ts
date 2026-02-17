
/**
 * Utility to retry async functions with exponential backoff.
 * Targets transient errors, rate limits, and quota issues.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message || "";
    // Determine if the error is transient and worth retrying
    const isRetryable = 
      error.status === 429 || 
      error.status === 500 ||
      error.status === 503 ||
      errorMsg.includes('429') || 
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('quota') ||
      errorMsg.includes('deadline') ||
      errorMsg.includes('timeout');

    if (retries > 0 && isRetryable) {
      console.warn(`[API Retry] Attempt failed. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      // Increase delay for next retry (exponential backoff)
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    
    throw error;
  }
}
