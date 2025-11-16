import 'jasmine';
import { server } from './openapi-server';
import { OpenAPIObject } from 'auto-oas/oas/v3.1';
import { env } from '../../env';

describe('OpenAPI Spec', () => {
	beforeAll(async () => {
		await server.start();
	});

	afterAll(async () => {
		await server.stop();
	});

	it('should serve OpenAPI spec at /openapi.json', async () => {
		const url = `http://localhost:${server.port}/openapi.json`;
		const res = await fetch(url);
		expect(res.status).toBe(200);
		const body = (await res.json()) as OpenAPIObject;
		expect(body).toBeDefined();
		expect(body.openapi).toBe('3.1.0');
		expect(body.paths).toBeDefined();
		expect(body.components).toBeDefined();
		expect(Array.isArray(body.tags)).toBeTrue();
	});

	it('should include user endpoint in OpenAPI paths', async () => {
		const url = `http://localhost:${server.port}/openapi.json`;
		const res = await fetch(url);
		const body = (await res.json()) as OpenAPIObject;

		expect(Object.keys(body.paths ?? {})).toContain('/api/users');
	});

	it('should serve Swagger UI at /docs', async () => {
		const url = `http://localhost:${server.port}/docs`;
		const res = await fetch(url);
		expect(res.status).toBe(200);
		const body = await res.text();
		expect(body).toContain('Swagger UI');
	});

	describe('Security - Swagger disabled by default', () => {
		it('should return 404 for /docs', async () => {
			const url = env.API_URL.replace(/\/$/, '') + '/docs';
			const res = await fetch(url);
			expect(res.status).toBe(404);
		});

		it('should return 404 for /openapi.json', async () => {
			const url = env.API_URL.replace(/\/$/, '') + '/openapi.json';
			const res = await fetch(url);
			expect(res.status).toBe(404);
		});
	});
});
