import 'jasmine';
// eslint-disable-next-line max-len
import { OasEndpointComponentConverter } from '../../../src/oas/oas-endpoint-component-converter';
import { IntegerValidator, EmailValidator, ObjectValSan } from 'valsan';
import { GetEndpoint } from '../../../src/router/endpoints/get-endpoint';
import { PostEndpoint } from '../../../src/router/endpoints/post-endpoint';
import { ApiRequest, ApiResponse, ApiNextFunction } from '../../../src/router';

describe('OasEndpointComponentConverter - Response Schemas', () => {
	let converter: OasEndpointComponentConverter;

	beforeEach(() => {
		converter = new OasEndpointComponentConverter();
	});

	it('generates response schema from response sanitizer', () => {
		class TestEndpoint extends GetEndpoint {
			override response = new ObjectValSan({
				schema: {
					id: new IntegerValidator(),
					email: new EmailValidator(),
				},
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

		const schemas = converter.getSchemas(endpoint);
		const schema = schemas['TestEndpointResponse'];

		expect(schema).toBeDefined();
		expect(schema.type).toBe('object');
		expect(schema.properties).toBeDefined();
		expect(schema.properties?.['id']).toBeDefined();
		expect(schema.properties?.['email']).toBeDefined();
	});

	it('includes response example in schema', () => {
		class TestEndpoint extends GetEndpoint {
			override response = new ObjectValSan({
				schema: {
					id: new IntegerValidator(),
				},
			});

			override responseExample = {
				id: 123,
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

		const schemas = converter.getSchemas(endpoint);
		const schema = schemas['TestEndpointResponse'] as {
			example?: { id: number };
		};

		expect(schema.example).toBeDefined();
		expect(schema.example?.id).toBe(123);
	});

	it('does not include response schema when no response ' + 'defined', () => {
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

		const schemas = converter.getSchemas(endpoint);

		expect(schemas['TestEndpointResponse']).toBeUndefined();
	});

	it('includes both body and response schemas', () => {
		class TestEndpoint extends PostEndpoint {
			override body = new ObjectValSan({
				schema: {
					name: new IntegerValidator(),
				},
			});

			override bodyExample = {
				name: 'test',
			};

			override response = new ObjectValSan({
				schema: {
					id: new IntegerValidator(),
				},
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

		const schemas = converter.getSchemas(endpoint);

		expect(schemas['TestEndpointBody']).toBeDefined();
		expect(schemas['TestEndpointResponse']).toBeDefined();
		expect(Object.keys(schemas).length).toBe(2);
	});

	it('generates correct schema structure for complex ' + 'response', () => {
		class TestEndpoint extends GetEndpoint {
			override response = new ObjectValSan({
				schema: {
					id: new IntegerValidator(),
					email: new EmailValidator(),
					status: new IntegerValidator(),
				},
			});

			override responseExample = {
				id: 1,
				email: 'test@example.com',
				status: 200,
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

		const schemas = converter.getSchemas(endpoint);
		const schema = schemas['TestEndpointResponse'];
		const example = schema.example as {
			id: number;
			email: string;
			status: number;
		};

		expect(schema.type).toBe('object');
		expect(Object.keys(schema.properties ?? {}).length).toBe(3);
		expect(example?.id).toBe(1);
		expect(example?.email).toBe('test@example.com');
		expect(example?.status).toBe(200);
	});
});
