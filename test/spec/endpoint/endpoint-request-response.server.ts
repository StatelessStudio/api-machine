import {
	BaseApiRouter,
	ApiRequest,
	ApiResponse,
	GetEndpoint,
	PostEndpoint,
	DeleteEndpoint,
	BadRequestError,
} from '../../../src';

export class RequestResponseRouter extends BaseApiRouter {
	override path = '/request-response';

	override async routes() {
		return [
			// Echo endpoint for body parsing tests
			class extends PostEndpoint {
				override path = '/echo';

				override async handle(request: ApiRequest) {
					return { received: request.body };
				}
			},

			// Headers endpoint
			class extends GetEndpoint {
				override path = '/headers';

				override async handle(request: ApiRequest) {
					return { headers: request.headers };
				}
			},

			// Custom response headers
			class extends GetEndpoint {
				override path = '/custom-headers';

				override async handle(
					request: ApiRequest,
					response: ApiResponse
				) {
					response.setHeader('X-Custom-Response', 'test-value');
					response.setHeader('X-Powered-By', 'ts-rest');
					return { message: 'Headers set' };
				}
			},

			// Cacheable endpoint
			class extends GetEndpoint {
				override path = '/cacheable';

				override async handle(
					request: ApiRequest,
					response: ApiResponse
				) {
					response.setHeader('Cache-Control', 'max-age=3600');
					return { cached: true };
				}
			},

			// Created status (201)
			class extends PostEndpoint {
				override path = '/created';

				override async handle(
					request: ApiRequest,
					response: ApiResponse
				) {
					response.status(201);
					return { id: 1, name: request.body?.name };
				}
			},

			// No content (204)
			class extends DeleteEndpoint {
				override path = '/no-content';

				override async handle(
					request: ApiRequest,
					response: ApiResponse
				) {
					response.status(204);
					return {};
				}
			},

			// Validation error (400)
			class extends PostEndpoint {
				override path = '/validate';

				override async handle(): Promise<never> {
					throw new BadRequestError('Invalid data');
				}
			},

			// Request info
			class extends PostEndpoint {
				override path = '/request-info';

				override async handle(request: ApiRequest) {
					return {
						method: request.method,
						path: request.path,
					};
				}
			},

			// Request info (GET)
			class extends GetEndpoint {
				override path = '/request-info';

				override async handle(request: ApiRequest) {
					return {
						method: request.method,
						path: request.path,
					};
				}
			},
		];
	}
}
