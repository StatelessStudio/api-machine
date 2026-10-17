import { BaseApiRouter, RestServer } from '../../../src';
import { LogInterface } from '../../../src/log';
import {
	BearerAuthRouter,
} from '../../../examples/complete-example/auth/inline-auth';
import {
	oauth2Scheme,
	OAuth2Router,
} from '../../../examples/complete-example/auth/session-auth';

describe('Complete authentication example contracts', () => {
	let server: RestServer;
	let url: string;
	let policyFailure: boolean;
	let evaluated: jasmine.Spy;

	class ProtectedRouter extends BearerAuthRouter {
		override authorization = { action: 'read', resource: 'demo' };
	}

	class Router extends BaseApiRouter {
		async routes() {
			return [ProtectedRouter, OAuth2Router];
		}
	}

	class Server extends RestServer {
		override router = Router;
		get url(): string {
			const address = this.listener.address();
			if (!address || typeof address === 'string') {
				throw new Error('Expected TCP listener');
			}
			return `http://127.0.0.1:${address.port}`;
		}
	}

	beforeEach(async () => {
		policyFailure = false;
		evaluated = jasmine
			.createSpy('evaluate')
			.and.callFake(
				async ({ principal }: { principal: { id: string } }) => {
					if (policyFailure) {
						throw new Error('Private policy backend failure');
					}

					return { allowed: principal.id === 'demo-user' };
				}
			);

		const instance = new Server({
			port: 0,
			authorizer: { evaluate: evaluated },
			log: jasmine.createSpyObj<LogInterface>('log', [
				'fatal',
				'error',
				'warn',
				'info',
				'debug',
			]),
		});

		server = instance;
		await server.start();
		url = instance.url;
	});

	afterEach(async () => {
		await server.stop();
	});

	async function bearer(token?: string) {
		return fetch(`${url}/bearer/protected`, {
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		});
	}

	it('passes the trusted principal into the example policy', async () => {
		const response = await bearer('demo-token');

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(
			jasmine.objectContaining({
				principal: { id: 'demo-user' },
			})
		);
		expect(evaluated).toHaveBeenCalledOnceWith(
			jasmine.objectContaining({
				principal: { id: 'demo-user' },
				action: 'read',
				resource: 'demo',
			})
		);
	});

	it('distinguishes missing credentials and denied principals', async () => {
		expect((await bearer()).status).toBe(401);
		expect(evaluated).not.toHaveBeenCalled();
		expect((await bearer('user-token')).status).toBe(403);
	});

	it('rejects invalid credentials without evaluating policy', async () => {
		expect((await bearer('invalid')).status).toBe(401);
		expect(evaluated).not.toHaveBeenCalled();
	});

	it('documents the OAuth2 session scheme metadata', () => {
		expect(oauth2Scheme.getSecurityScheme()).toEqual(
			jasmine.objectContaining({
				type: 'oauth2',
				flows: jasmine.objectContaining({
					authorizationCode: jasmine.objectContaining({
						authorizationUrl:
							'http://localhost:3000/oauth/authorize',
						tokenUrl: 'http://localhost:3000/oauth/token',
						scopes: { 'read:data': 'Read data' },
					}),
				}),
			})
		);
	});

	it(
		'rejects incomplete and invalid OAuth2 authorization payloads',
		async () => {
			const missingFields = await fetch(`${url}/oauth/authorize`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: 'demo',
					password: 'demo',
				}),
			});
			expect(missingFields.status).toBe(401);

			const invalidChallenge = await fetch(`${url}/oauth/authorize`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: 'demo',
					password: 'demo',
					challenge: 'missing-challenge',
				}),
			});
			expect(invalidChallenge.status).toBe(401);

			const challengeResponse = await fetch(`${url}/oauth/challenge`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});
			expect(challengeResponse.status).toBe(200);
			const challengeValue = (
			(await challengeResponse.json()) as Record<string, string>
			)['challenge'];

			jasmine.clock().install();
			try {
				jasmine.clock().mockDate(new Date(Date.now() + 6 * 60 * 1000));
				const stale = await fetch(`${url}/oauth/authorize`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						username: 'demo',
						password: 'demo',
						challenge: challengeValue,
					}),
				});
				expect(stale.status).toBe(401);
			}
			finally {
				jasmine.clock().uninstall();
			}

			const secondChallengeResponse = await fetch(
				`${url}/oauth/challenge`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({}),
				}
			);
			expect(secondChallengeResponse.status).toBe(200);

			const secondChallengeValue = (
			(await secondChallengeResponse.json()) as Record<string, string>
			)['challenge'];

			const invalidCredentials = await fetch(`${url}/oauth/authorize`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: 'demo',
					password: 'wrong',
					challenge: secondChallengeValue,
				}),
			});
			expect(invalidCredentials.status).toBe(401);
		});

	it(
		'rejects invalid or expired OAuth2 authorization codes',
		async () => {
			const challenge = await fetch(`${url}/oauth/challenge`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});
			expect(challenge.status).toBe(200);
			const challengeValue = (
			(await challenge.json()) as Record<string, string>
			)['challenge'];

			const missingCode = await fetch(`${url}/oauth/token`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});
			expect(missingCode.status).toBe(401);

			const invalidCode = await fetch(`${url}/oauth/token`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: 'missing-code' }),
			});
			expect(invalidCode.status).toBe(401);

			const authorize = await fetch(`${url}/oauth/authorize`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: 'demo',
					password: 'demo',
					challenge: challengeValue,
				}),
			});
			expect(authorize.status).toBe(200);
			const code = ((await authorize.json()) as Record<string, string>)[
				'code'
			];

			jasmine.clock().install();
			try {
				jasmine.clock().mockDate(new Date(Date.now() + 61 * 1000));
				const expiredCode = await fetch(`${url}/oauth/token`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ code }),
				});
				expect(expiredCode.status).toBe(401);
			}
			finally {
				jasmine.clock().uninstall();
			}
		});

	it('clears both inherited requirements on the public example', async () => {
		const response = await fetch(`${url}/bearer/public`);
		expect(response.status).toBe(200);
		expect(evaluated).not.toHaveBeenCalled();
	});

	it('does not expose operational policy failure details', async () => {
		policyFailure = true;
		const response = await bearer('demo-token');
		expect(response.status).toBe(500);
		expect(await response.text()).not.toContain('Private policy backend');
	});

	it('creates a principal-bearing session through the flow', async () => {
		async function post(step: string, body: Record<string, string>) {
			const response = await fetch(`${url}/oauth/${step}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			expect(response.status).toBe(200);
			return response.json() as Promise<Record<string, string>>;
		}

		const challenge = await post('challenge', {});
		const code = await post('authorize', {
			username: 'demo',
			password: 'demo',
			challenge: challenge['challenge'],
		});
		const session = await post('token', { code: code['code'] });
		const response = await fetch(`${url}/oauth/protected`, {
			headers: {
				Cookie: `sessionId=${encodeURIComponent(session['sessionId'])}`,
			},
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(
			jasmine.objectContaining({
				principal: { id: 'demo' },
			})
		);
	});
});
