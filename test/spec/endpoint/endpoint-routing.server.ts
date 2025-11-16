import {
	BaseApiRouter,
	GetEndpoint,
	ApiRequest,
	RestServer,
} from '../../../src';

export class RoutingRouter extends BaseApiRouter {
	override path = '/routing';

	override async routes() {
		return [
			// Single path parameter
			class extends GetEndpoint {
				override path = '/items/:id';

				override async handle(request: ApiRequest) {
					const id = parseInt(request.params['id'], 10);
					return { id };
				}
			},

			// Multiple path parameters
			class extends GetEndpoint {
				override path = '/users/:userId/posts/:postId';

				override async handle(request: ApiRequest) {
					const userId = parseInt(request.params['userId'], 10);
					const postId = parseInt(request.params['postId'], 10);
					return { userId, postId };
				}
			},

			// Slug parameter
			class extends GetEndpoint {
				override path = '/slug/:slug';

				override async handle(request: ApiRequest) {
					return { slug: request.params['slug'] };
				}
			},

			// Encoded parameter
			class extends GetEndpoint {
				override path = '/encoded/:value';

				override async handle(request: ApiRequest) {
					return { value: request.params['value'] };
				}
			},

			// Query parameters
			class extends GetEndpoint {
				override path = '/search';

				override async handle(request: ApiRequest) {
					return { query: request.query };
				}
			},

			// Combined path and query params
			class extends GetEndpoint {
				override path = '/users/:userId/activity';

				override async handle(request: ApiRequest) {
					const userId = parseInt(request.params['userId'], 10);
					return { userId, query: request.query };
				}
			},

			// Exact path matching
			class extends GetEndpoint {
				override path = '/exact';

				override async handle() {
					return { matched: 'exact' };
				}
			},
		];
	}
}

export class NoPathEndpoint extends GetEndpoint {
	// No path defined here
	override async handle() {
		return { message: 'No path defined' };
	}
}

export class NoPathRouter extends BaseApiRouter {
	// No path defined here
	override async routes() {
		return [NoPathEndpoint];
	}
}

export class NoPathServer extends RestServer {
	override router = NoPathRouter;
}
