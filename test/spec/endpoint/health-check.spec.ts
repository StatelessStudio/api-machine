import 'jasmine';
import { env } from '../../env';

describe('HealthCheckEndpoint', function () {
	const baseUrl = env.API_URL + '/health-check';

	describe('GET /health', function () {
		it('should return health check response', async function () {
			const response = await fetch(`${baseUrl}/health`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				status: string;
				timestamp: string;
				uptime: number;
				environment: string;
			};

			expect(data.status).toBe('ok');
			expect(data.timestamp).toBeTruthy();
			expect(data.uptime).toBeTruthy();
			expect(data.environment).toBeTruthy();
		});

		it('should return valid timestamp in ISO format', async function () {
			const response = await fetch(`${baseUrl}/health`);
			const data = (await response.json()) as {
				status: string;
				timestamp: string;
				uptime: number;
				environment: string;
			};

			const timestamp = new Date(data.timestamp);
			expect(timestamp.toISOString()).toBe(data.timestamp);
		});

		it('should return numeric uptime', async function () {
			const response = await fetch(`${baseUrl}/health`);
			const data = (await response.json()) as {
				status: string;
				timestamp: string;
				uptime: number;
				environment: string;
			};

			expect(typeof data.uptime).toBe('number');
			expect(data.uptime).toBeGreaterThan(0);
		});

		it('should return environment value', async function () {
			const response = await fetch(`${baseUrl}/health`);
			const data = (await response.json()) as {
				status: string;
				timestamp: string;
				uptime: number;
				environment: string;
			};

			expect(typeof data.environment).toBe('string');
			expect(data.environment).toBeTruthy();
		});

		it('should default environment to development', async function () {
			const originalEnv = process.env['NODE_ENV'];
			delete process.env['NODE_ENV'];

			const response = await fetch(`${baseUrl}/health`);
			const data = (await response.json()) as {
				status: string;
				timestamp: string;
				uptime: number;
				environment: string;
			};

			expect(data.environment).toBe('development');

			// Restore original value
			if (originalEnv !== undefined) {
				process.env['NODE_ENV'] = originalEnv;
			}
		});
	});

	describe('Custom path', function () {
		it('should work with custom path override', async function () {
			const response = await fetch(`${baseUrl}/custom-health`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				status: string;
				timestamp: string;
				uptime: number;
				environment: string;
			};

			expect(data.status).toBe('ok');
		});
	});
});
