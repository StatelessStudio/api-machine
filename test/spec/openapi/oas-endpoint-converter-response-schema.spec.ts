import 'jasmine';
import { OasEndpointConverter } from '../../../src/oas/oas-endpoint-converter';
import { ObjectSanitizer, IntegerValidator, EmailValidator } from 'valsan';
import { GetEndpoint } from '../../../src/router/endpoints/get-endpoint';
import { PostEndpoint } from '../../../src/router/endpoints/post-endpoint';
import { ApiRequest, ApiResponse, ApiNextFunction } from '../../../src/router';
import { ResponseObject } from 'auto-oas';

describe('OasEndpointConverter - Response Schemas', () => {
	let converter: OasEndpointConverter;

	beforeEach(() => {
		converter = new OasEndpointConverter();
	});

	it(
		'generates response schema reference when ' +
			'response sanitizer is defined',
		() => {
			class TestEndpoint extends GetEndpoint {
				override response = new ObjectSanitizer({
					id: new IntegerValidator(),
					email: new EmailValidator(),
				});

				override responseExample = {
					id: 1,
					email: 'test@example.com',
				};

				async handle(
					request: ApiRequest,
					response: ApiResponse,
					next: ApiNextFunction
				) {
					request;
					response;
					next;
					return {};
				}
			}

			const endpoint = new TestEndpoint();
			endpoint.name = 'TestEndpoint';

			const path = converter.getOpenApiPath(endpoint);
			const resp = path.get?.responses['200'] as ResponseObject;

			expect(resp?.description).toBe('Success');
			expect(resp?.content).toBeDefined();
			expect(resp?.content?.['application/json']).toBeDefined();
			expect(resp?.content?.['application/json']?.schema?.$ref).toBe(
				'#/components/schemas/TestEndpointResponse'
			);
		}
	);

	it(
		'uses generic description when no response ' + 'sanitizer defined',
		() => {
			class TestEndpoint extends GetEndpoint {
				async handle(
					request: ApiRequest,
					response: ApiResponse,
					next: ApiNextFunction
				) {
					request;
					response;
					next;
					return {};
				}
			}

			const endpoint = new TestEndpoint();
			endpoint.name = 'TestEndpoint';

			const path = converter.getOpenApiPath(endpoint);
			const resp = path.get?.responses['200'] as ResponseObject;

			expect(resp.description).toBe('Success');
			expect(resp.content).toBeUndefined();
		}
	);

	it('respects custom status codes with response ' + 'schemas', () => {
		class TestEndpoint extends PostEndpoint {
			override response = new ObjectSanitizer({
				id: new IntegerValidator(),
			});

			override responseExample = {
				id: 1,
			};

			async handle(
				request: ApiRequest,
				response: ApiResponse,
				next: ApiNextFunction
			) {
				request;
				response;
				next;
				return {};
			}
		}

		const endpoint = new TestEndpoint();
		endpoint.name = 'TestEndpoint';

		const path = converter.getOpenApiPath(endpoint);
		const responses = path.post?.responses;

		// PostEndpoint defaults to 201
		expect(responses?.['201']).toBeDefined();
		expect(
			(responses?.['201'] as ResponseObject)?.content?.[
				'application/json'
			]?.schema?.$ref
		).toBe('#/components/schemas/TestEndpointResponse');
	});

	it('generates both error and success responses', () => {
		class TestEndpoint extends GetEndpoint {
			override response = new ObjectSanitizer({
				id: new IntegerValidator(),
			});

			override responseExample = {
				id: 1,
			};

			async handle(
				request: ApiRequest,
				response: ApiResponse,
				next: ApiNextFunction
			) {
				request;
				response;
				next;
				return {};
			}
		}

		const endpoint = new TestEndpoint();
		endpoint.name = 'TestEndpoint';

		const path = converter.getOpenApiPath(endpoint);
		const responses = path.get?.responses;

		expect(responses?.['200']).toBeDefined();
		expect(responses?.['400']).toBeDefined();
		expect(responses?.['422']).toBeDefined();
	});

	it(
		'only includes response schema name without response ' + 'sanitizer',
		() => {
			class TestEndpoint extends GetEndpoint {
				override responseExample = {
					id: 1,
					email: 'test@example.com',
				};

				async handle(
					request: ApiRequest,
					response: ApiResponse,
					next: ApiNextFunction
				) {
					request;
					response;
					next;
					return {};
				}
			}

			const endpoint = new TestEndpoint();
			endpoint.name = 'TestEndpoint';

			const path = converter.getOpenApiPath(endpoint);
			const resp = path.get?.responses['200'] as ResponseObject;

			expect(resp.description).toBe('Success');
			expect(resp.content).toBeUndefined();
		}
	);

	it('handles endpoint names with special characters', () => {
		class MySpecialEndpoint extends GetEndpoint {
			override response = new ObjectSanitizer({
				id: new IntegerValidator(),
			});

			override responseExample = {
				id: 1,
			};

			async handle(
				request: ApiRequest,
				response: ApiResponse,
				next: ApiNextFunction
			) {
				request;
				response;
				next;
				return {};
			}
		}

		const endpoint = new MySpecialEndpoint();
		endpoint.name = 'MySpecialEndpoint';

		const path = converter.getOpenApiPath(endpoint);
		const resp = path.get?.responses['200'] as ResponseObject;

		expect(resp.content?.['application/json']?.schema?.$ref).toBe(
			'#/components/schemas/MySpecialEndpointResponse'
		);
	});

	it('preserves error responses when response schema ' + 'is defined', () => {
		class TestEndpoint extends GetEndpoint {
			override response = new ObjectSanitizer({
				id: new IntegerValidator(),
			});

			override responseExample = {
				id: 1,
			};

			async handle(
				request: ApiRequest,
				response: ApiResponse,
				next: ApiNextFunction
			) {
				request;
				response;
				next;
				return {};
			}
		}

		const endpoint = new TestEndpoint();
		endpoint.name = 'TestEndpoint';

		const path = converter.getOpenApiPath(endpoint);
		const responses = path.get?.responses as Record<string, ResponseObject>;

		// Check that error responses are still present
		const errorStatuses = Object.keys(responses).filter(
			(status) => status !== '200'
		);
		expect(errorStatuses.length).toBeGreaterThan(0);

		// Verify error response format
		for (const status of errorStatuses) {
			expect(responses[status].description).toBeDefined();
		}
	});
});
