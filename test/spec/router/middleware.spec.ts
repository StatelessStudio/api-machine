import 'jasmine';
import { env } from '../../env';
import { callOrder } from './middleware.server';
import { ErrorResponse } from '../../../src';

describe('Router and Endpoint Middleware (Jasmine)', function () {
	const baseUrl = env.API_URL + '/middleware-test';

	it('should call router middleware before endpoint', async function () {
		const response = await fetch(baseUrl + '/router', {
			headers: { test_id: 'middleware-first' },
		});

		expect(response.status).toBe(200);

		const data = (await response.json()) as { ok: boolean };

		expect(data.ok).toBe(true);
		expect(callOrder['middleware-first']).toEqual([
			'router-mw',
			'endpoint',
		]);
	});

	it('should call endpoint middleware before handler', async function () {
		const response = await fetch(baseUrl + '/endpoint', {
			headers: { test_id: 'endpoint-mw' },
		});
		expect(response.status).toBe(200);

		const data = (await response.json()) as { ok: boolean };

		expect(data.ok).toBe(true);
		expect(callOrder['endpoint-mw']).toEqual([
			'router-mw',
			'endpoint-mw',
			'endpoint',
		]);
	});

	it('should call all middleware in order', async function () {
		const response = await fetch(baseUrl + '/both', {
			headers: { test_id: 'both' },
		});
		expect(response.status).toBe(200);

		const data = (await response.json()) as { ok: boolean };

		expect(data.ok).toBe(true);
		expect(callOrder['both']).toEqual([
			'router-mw',
			'endpoint-mw',
			'endpoint',
		]);
	});

	const authUrl = baseUrl + '/auth';

	it('blocks unauthorized and does not call endpoint', async function () {
		const response = await fetch(authUrl, {
			headers: { test_id: 'unauthorized' },
		});

		expect(response.status).toBe(401);

		const data = (await response.json()) as ErrorResponse;

		expect(data.error).toBe('UnauthorizedError');
		expect(data.message).toBe('Invalid token');
		expect(callOrder['unauthorized']).toEqual(['router-mw', 'auth-mw']);
	});

	it('allows authorized requests, calls endpoint', async function () {
		const response = await fetch(authUrl, {
			headers: {
				Authorization: 'Bearer validtoken',
				test_id: 'authorized',
			},
		});

		expect(response.status).toBe(200);
		const data = (await response.json()) as { ok: boolean };

		expect(data.ok).toBe(true);
		expect(callOrder['authorized']).toEqual([
			'router-mw',
			'auth-mw',
			'auth-handle',
		]);
	});
});
