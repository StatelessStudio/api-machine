import {
	ApiRequest,
	BaseApiRouter,
	GetEndpoint,
	PostEndpoint,
} from '../../../src/router';
import {
	ObjectSanitizer,
	EmailValidator,
	LengthValidator,
	StringToNumberValSan,
	MinValidator,
	ComposedValSan,
	TrimSanitizer,
} from 'valsan';
// eslint-disable-next-line max-len
import { NameValSan } from '../../../examples/complete-example/users/name-valsan';
import { ApiResponseData } from '../../../src/router/endpoint';

export class ValidationRouter extends BaseApiRouter {
	override path = '/validation';

	override async routes() {
		return [
			class TestHeadersEndpoint extends PostEndpoint {
				override path = '/headers';

				override headers = new ObjectSanitizer({
					'x-custom-header': new ComposedValSan([
						new TrimSanitizer(),
						new LengthValidator({ minLength: 5 }),
					]),
				});

				override async handle(
					request: ApiRequest
				): Promise<ApiResponseData> {
					return {
						received:
							request.headers['x-custom-header'] ||
							request.headers['X-Custom-Header'],
					};
				}
			},
			class TestQueryParamsEndpoint extends GetEndpoint {
				override path = '/query-params';

				override query = new ObjectSanitizer({
					search: new ComposedValSan([
						new TrimSanitizer(),
						new LengthValidator({ minLength: 3 }),
					]),
				});

				override async handle(
					request: ApiRequest
				): Promise<ApiResponseData> {
					return { received: request.query['search'] };
				}
			},
			class TestRouteParamsEndpoint extends PostEndpoint {
				override path = '/route-params/:itemId';

				override params = new ObjectSanitizer({
					itemId: new ComposedValSan([
						new StringToNumberValSan(),
						new MinValidator({ min: 1 }),
					]),
				});

				override async handle(
					request: ApiRequest
				): Promise<ApiResponseData> {
					return { received: request.params['itemId'] };
				}
			},
			class TestBodyEndpoint extends PostEndpoint {
				override path = '/body';

				override body = new ObjectSanitizer({
					name: new NameValSan(),
					email: new EmailValidator(),
				});

				override async handle(
					request: ApiRequest
				): Promise<ApiResponseData> {
					return {
						name: request.body.name,
						email: request.body.email,
					};
				}
			},
			class TestAllValidationEndpoint extends PostEndpoint {
				override path = '/all/:userId';

				override body = new ObjectSanitizer({
					name: new NameValSan(),
					email: new EmailValidator(),
				});

				override query = new ObjectSanitizer({
					age: new ComposedValSan([
						new StringToNumberValSan(),
						new MinValidator({ min: 0 }),
					]),
				});

				override params = new ObjectSanitizer({
					userId: new ComposedValSan([
						new StringToNumberValSan(),
						new MinValidator({ min: 1 }),
					]),
				});

				override headers = new ObjectSanitizer({
					'X-User-Token': new ComposedValSan([
						new TrimSanitizer(),
						new LengthValidator({ minLength: 10 }),
					]),
				});

				async handle(request: ApiRequest) {
					return {
						name: request.body.name,
						email: request.body.email,
						age: request.query['age'],
						userId: request.params['userId'],
						userToken:
							request.headers['x-user-token'] ||
							request.headers['X-User-Token'],
					};
				}
			},
		];
	}
}
