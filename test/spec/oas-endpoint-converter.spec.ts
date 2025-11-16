import 'jasmine';
import { OasEndpointConverter } from '../../src/oas/oas-endpoint-converter';

describe('OasEndpointConverter', () => {
	it('uses fallback description when error message missing', () => {
		const converter = new OasEndpointConverter();

		const fakeEndpoint = {
			method: 'get',
			statusCode: 200,
			getName: () => 'testEndpoint',
			description: 'desc',
			getTag: () => 'tag',
			getErrors: () => ({
				missing_message: {
					getStatusCode: () => 400,
					// intentionally no message (undefined) to hit fallback
					message: undefined,
				},
			}),
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const path = converter.getOpenApiPath(fakeEndpoint as any);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const responses = (path as any)['get'].responses;

		expect(responses['400'].description).toBe('Error response');
	});
});
