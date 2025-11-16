import { ApiRequest, ApiResponse, GetEndpoint } from '../../../src/index';

/**
 * Complete Example - Query Parameters Endpoint
 *
 * Demonstrates accessing and parsing query parameters.
 * Accessible at GET /api/express/search?q=test&page=1&limit=20
 */
export class QueryParamsEndpoint extends GetEndpoint {
	override path = '/search';

	async handle(request: ApiRequest, response: ApiResponse) {
		// Access query parameters
		const queryParams = request.query;
		const page = request.query['page'] || 1;
		const limit = request.query['limit'] || 10;
		const search = request.query['q'] || '';

		return {
			query: {
				page: parseInt(page as string, 10),
				limit: parseInt(limit as string, 10),
				search,
			},
			allParams: queryParams,
			results: [
				{ id: 1, title: 'Result 1' },
				{ id: 2, title: 'Result 2' },
			],
		};
	}
}
