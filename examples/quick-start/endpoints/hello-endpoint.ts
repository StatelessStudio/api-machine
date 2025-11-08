import { ApiRequest, ApiResponse, BaseApiEndpoint } from '../../../src/index';

/**
 * Quick Start Example - Hello Endpoint
 *
 * A simple endpoint that returns a greeting message.
 * Accessible at GET /api/hello
 */
export class HelloEndpoint extends BaseApiEndpoint {
	override path = '/hello';

	async handle(request: ApiRequest, response: ApiResponse) {
		return { message: 'Hello, World!' };
	}
}
