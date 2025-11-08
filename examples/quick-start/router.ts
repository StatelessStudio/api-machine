import { BaseApiRouter } from '../../src/index';
import { HelloEndpoint } from './endpoints/hello-endpoint';
import { UsersEndpoint } from './endpoints/users-endpoint';

/**
 * Quick Start Example - Router
 *
 * This router groups related endpoints under the /api path.
 */
export class MyRouter extends BaseApiRouter {
	override path = '/api';

	async routes() {
		return [HelloEndpoint, UsersEndpoint];
	}
}
