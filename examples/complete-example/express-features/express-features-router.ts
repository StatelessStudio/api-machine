import { BaseApiRouter } from '../../../src/index';
import { HeadersEndpoint } from './headers-endpoint';
import { QueryParamsEndpoint } from './query-params-endpoint';

/**
 * Express Features Router
 *
 * Groups endpoints demonstrating Express integration:
 * - Request/response headers
 * - Query parameter parsing
 */
export class ExpressFeaturesRouter extends BaseApiRouter {
	override path = '/express';

	async routes() {
		return [HeadersEndpoint, QueryParamsEndpoint];
	}
}
