import { RestServer } from '../../../src';
import { BaseApiEndpoint, BaseApiRouter } from '../../../src/router';
import { env } from '../../env';

export class TestRouter extends BaseApiRouter {
	override path = '/test';

	override async routes() {
		return [
			class extends BaseApiEndpoint {
				override async handle() {
					return { works: true };
				}
			},
			class extends BaseApiEndpoint {
				override path = '/error-test';

				override async handle() {
					throw new Error('Test error');

					return {};
				}
			},
		];
	}
}

export class TestServer extends RestServer {
	override async routes() {
		return [TestRouter];
	}
}

export const server = new TestServer({
	port: env.API_PORT,
});
