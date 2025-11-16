import { ApiRequest, ApiResponse, BaseApiEndpoint } from '../../../src/index';

/**
 * Complete Example - Headers Endpoint
 *
 * Demonstrates accessing request headers and setting response headers.
 * Accessible at GET /api/express/headers
 *
 * Note: X-Powered-By is disabled globally by default for security.
 * Setting it here demonstrates how to override with a custom value.
 */
export class HeadersEndpoint extends BaseApiEndpoint {
	override path = '/headers';

	async handle(request: ApiRequest, response: ApiResponse) {
		// Access request headers
		const userAgent = request.headers['user-agent'];
		const contentType = request.headers['content-type'];
		const customHeader = request.headers['x-custom-header'];

		// Set response headers
		response.setHeader('X-Custom-Header', 'custom-value');
		response.setHeader('X-Powered-By', 'api-machine');

		return {
			receivedHeaders: {
				userAgent,
				contentType,
				customHeader,
			},
			timestamp: new Date().toISOString(),
		};
	}
}
