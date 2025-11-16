import { BaseApiRouter } from '../../../src';
// eslint-disable-next-line max-len
import { QueryParamsEndpoint } from '../../../examples/complete-example/express-features/query-params-endpoint';

export class QueryParamsRouter extends BaseApiRouter {
	override path = '/query-params';

	override async routes() {
		return [QueryParamsEndpoint];
	}
}
