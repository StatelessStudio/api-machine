import { ApiRequest, ApiResponse } from '../router';

/**
 * Represents a single step in an authentication flow
 * Can be used for inline schemes (as middleware)
 *  or session schemes (as endpoint)
 */
export interface AuthStep {
	/**
	 * Human-readable description
	 */
	description?: string;

	/**
	 * Execute this authentication step
	 * Called when processing requests for this step
	 *
	 * @param request - The incoming request
	 * @returns Result indicating success/failure
	 * @throws HTTPError for authentication failures
	 */
	handle(
		request: ApiRequest,
		response: ApiResponse
	): Promise<Record<string, unknown>>;
}
