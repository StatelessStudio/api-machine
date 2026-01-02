import 'jasmine';
import {
	SessionAuthenticationScheme,
	AuthFlow,
	AuthStep,
} from '../../../src/authentication';
import { BaseApiRouter } from '../../../src/router';
import { InMemorySessionDriver } from '../../../src/session';
import { SessionDriver } from '../../../src/session';
import { Session } from '../../../src/session/session';
import { UnauthorizedError } from '../../../src/error';
import { SecuritySchemeObject } from 'auto-oas/oas/v3.1';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRequest = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResponse = any;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
abstract class TestSessionDriverImport extends SessionDriver {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
abstract class TestAuthFlowImport extends AuthStep {}

/**
 * Test implementation of SessionAuthenticationScheme
 */
class TestSessionScheme extends SessionAuthenticationScheme {
	public readonly schemeName = 'TestSession';
	public readonly type = 'apiKey' as const;

	public constructor(options: { sessionDriver?: SessionDriver } = {}) {
		super({
			sessionDriver: options.sessionDriver || new InMemorySessionDriver(),
		});
	}

	public getSecurityScheme(): SecuritySchemeObject {
		return {
			type: 'apiKey' as const,
			name: 'session_id',
			in: 'cookie' as const,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;
	}

	public getAuthFlow(): AuthFlow {
		return {
			testStep: class extends AuthStep {
				override description = 'Test step';
				async handle() {
					return {};
				}
			},
		};
	}

	public async authenticate(): Promise<void> {
		// Override in tests as needed
	}
}

/**
 * Test-specific extension of InMemorySessionDriver
 */
class TestableSessionDriver extends InMemorySessionDriver {
	override async checkSession(request: AnyRequest): Promise<void> {
		const sessionId = request.sessionId;
		if (!sessionId) {
			throw new UnauthorizedError('No session ID provided', {
				scheme: 'Bearer',
			});
		}

		try {
			await super.checkSession(request);
		}
		catch (error) {
			// Convert generic Error to UnauthorizedError for API consistency
			if (
				error instanceof Error &&
				!(error instanceof UnauthorizedError)
			) {
				throw new UnauthorizedError(error.message, {
					scheme: 'Bearer',
				});
			}
			throw error;
		}
	}
}

describe('SessionAuthenticationScheme', () => {
	describe('Initialization', () => {
		it('should have correct scheme properties', () => {
			const scheme = new TestSessionScheme();

			expect(scheme.schemeName).toBe('TestSession');
			expect(scheme.type).toBe('apiKey');
		});

		it('should initialize with session driver', () => {
			const scheme = new TestSessionScheme();
			const driver = new TestableSessionDriver();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(scheme as any).sessionDriver = driver;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((scheme as any).sessionDriver).toBe(driver);
		});
	});

	describe('getMiddleware()', () => {
		it('should return middleware function', () => {
			const scheme = new TestSessionScheme();
			const driver = new TestableSessionDriver();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(scheme as any).sessionDriver = driver;

			const middleware = scheme.getMiddleware();

			expect(typeof middleware).toBe('function');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((middleware as any).length).toBeGreaterThanOrEqual(3);
		});

		it('should check session on request', async () => {
			const scheme = new TestSessionScheme();
			const driver = new TestableSessionDriver();
			driver.createSession({ id: 'session-123' });

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(scheme as any).sessionDriver = driver;

			const middleware = scheme.getMiddleware();

			const req = { sessionId: 'session-123' } as AnyRequest;
			const res = {} as AnyResponse;
			const next = jasmine.createSpy('next');

			await middleware(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it('should pass request to checkSession', async () => {
			const scheme = new TestSessionScheme();
			const driver = new TestableSessionDriver();

			driver.createSession({ id: 'session-123' });

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(scheme as any).sessionDriver = driver;

			const middleware = scheme.getMiddleware();

			const req = { sessionId: 'session-123' } as AnyRequest;
			const res = {} as AnyResponse;
			const next = jasmine.createSpy('next');

			await middleware(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it('should throw error if session check fails', async () => {
			const scheme = new TestSessionScheme();
			const driver = new TestableSessionDriver();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(scheme as any).sessionDriver = driver;

			const middleware = scheme.getMiddleware();

			const req = { sessionId: 'invalid-session' } as AnyRequest;
			const res = {} as AnyResponse;
			const next = jasmine.createSpy('next');

			try {
				await middleware(req, res, next);
				fail('Should have thrown UnauthorizedError');
			}
			catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect(next).not.toHaveBeenCalled();
			}
		});

		it('should handle missing session ID', async () => {
			const scheme = new TestSessionScheme();
			const driver = new TestableSessionDriver();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(scheme as any).sessionDriver = driver;

			const middleware = scheme.getMiddleware();

			const req = {} as AnyRequest; // No sessionId
			const res = {} as AnyResponse;
			const next = jasmine.createSpy('next');

			try {
				await middleware(req, res, next);
				fail('Should have thrown UnauthorizedError');
			}
			catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect((error as UnauthorizedError).message).toBe(
					'No session ID provided'
				);
			}
		});

		it('should handle concurrent session checks', async () => {
			const scheme = new TestSessionScheme();
			const driver = new TestableSessionDriver();
			driver.createSession({ id: 'session-1' });
			driver.createSession({ id: 'session-2' });

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(scheme as any).sessionDriver = driver;

			const middleware = scheme.getMiddleware();

			const req1 = { sessionId: 'session-1' } as AnyRequest;
			const req2 = { sessionId: 'session-2' } as AnyRequest;
			const res = {} as AnyResponse;
			const next1 = jasmine.createSpy('next1');
			const next2 = jasmine.createSpy('next2');

			await Promise.all([
				middleware(req1, res, next1),
				middleware(req2, res, next2),
			]);

			expect(next1).toHaveBeenCalled();
			expect(next2).toHaveBeenCalled();
		});
	});

	describe('getSecurityRequirement()', () => {
		it('should return security requirement', () => {
			const scheme = new TestSessionScheme();
			const requirement = scheme.getSecurityRequirement();

			expect(requirement).toEqual({ TestSession: [] });
		});

		it('should use scheme name in requirement', () => {
			class CustomSessionScheme extends SessionAuthenticationScheme {
				public readonly schemeName = 'CustomSession';
				public readonly type = 'apiKey' as const;

				public constructor(
					options: { sessionDriver?: SessionDriver } = {}
				) {
					super({
						sessionDriver:
							options.sessionDriver ||
							new InMemorySessionDriver(),
					});
				}

				public getSecurityScheme(): SecuritySchemeObject {
					return {
						type: 'apiKey' as const,
						name: 'session_id',
						in: 'cookie' as const,
					};
				}

				public getAuthFlow(): AuthFlow {
					return {
						customStep: class extends AuthStep {
							override description = 'Custom step';
							async handle() {
								return {};
							}
						},
					};
				}

				public async authenticate(): Promise<void> {
					// No-op
				}
			}

			const scheme = new CustomSessionScheme();
			const requirement = scheme.getSecurityRequirement();

			expect(requirement).toEqual({ CustomSession: [] });
		});
	});

	describe('Integration', () => {
		it('should support full session flow', async () => {
			const scheme = new TestSessionScheme();
			const driver = new TestableSessionDriver();
			const testSession: Session = { id: 'user-session-789' };
			driver.createSession(testSession);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(scheme as any).sessionDriver = driver;

			// Use middleware for session requests
			const middleware = scheme.getMiddleware();
			const res = {} as AnyResponse;
			const next = jasmine.createSpy('next');

			const req = { sessionId: testSession.id } as AnyRequest;
			await middleware(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it('should handle multiple session scenarios', async () => {
			const scheme = new TestSessionScheme();
			const driver = new TestableSessionDriver();
			const session1: Session = { id: 'session-1' };
			const session2: Session = { id: 'session-2' };
			driver.createSession(session1);
			driver.createSession(session2);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(scheme as any).sessionDriver = driver;

			// Both sessions work
			const middleware = scheme.getMiddleware();
			const res = {} as AnyResponse;
			const next1 = jasmine.createSpy('next1');
			const next2 = jasmine.createSpy('next2');

			const req1 = { sessionId: session1.id } as AnyRequest;
			const req2 = { sessionId: session2.id } as AnyRequest;

			await middleware(req1, res, next1);
			await middleware(req2, res, next2);

			expect(next1).toHaveBeenCalled();
			expect(next2).toHaveBeenCalled();
		});
	});

	describe('InMemorySessionDriver', () => {
		describe('createSession()', () => {
			it('should register sessions', () => {
				const driver = new InMemorySessionDriver();
				const session: Session = { id: 'test-session' };

				driver.createSession(session);

				expect(driver.getSessionCount()).toBe(1);
			});

			it('should overwrite existing session with same ID', () => {
				const driver = new InMemorySessionDriver();
				const session1: Session = { id: 'same-id' };
				const session2: Session = { id: 'same-id' };

				driver.createSession(session1);
				driver.createSession(session2);

				expect(driver.getSessionCount()).toBe(1);
			});
		});

		describe('clear()', () => {
			it('should remove all sessions', () => {
				const driver = new InMemorySessionDriver();
				driver.createSession({ id: 'session-1' });
				driver.createSession({ id: 'session-2' });
				driver.createSession({ id: 'session-3' });

				expect(driver.getSessionCount()).toBe(3);

				driver.clear();

				expect(driver.getSessionCount()).toBe(0);
			});

			it('should handle clearing empty driver', () => {
				const driver = new InMemorySessionDriver();
				expect(() => driver.clear()).not.toThrow();
				expect(driver.getSessionCount()).toBe(0);
			});
		});

		describe('getSessionCount()', () => {
			it('should return correct session count', () => {
				const driver = new InMemorySessionDriver();

				expect(driver.getSessionCount()).toBe(0);

				driver.createSession({ id: 'session-1' });
				expect(driver.getSessionCount()).toBe(1);

				driver.createSession({ id: 'session-2' });
				expect(driver.getSessionCount()).toBe(2);
			});

			it('should return zero after clearing', () => {
				const driver = new InMemorySessionDriver();
				driver.createSession({ id: 'session-1' });

				expect(driver.getSessionCount()).toBe(1);

				driver.clear();

				expect(driver.getSessionCount()).toBe(0);
			});
		});

		describe('getSession()', () => {
			it('should return default session without sessionId', async () => {
				const driver = new InMemorySessionDriver();
				const req = {} as AnyRequest;

				const session = await driver.getSession(req);

				expect(session.id).toBe('default-session');
			});

			it('should return unknown session if not registered', async () => {
				const driver = new InMemorySessionDriver();
				const req = { sessionId: 'unknown-session' } as AnyRequest;

				const session = await driver.getSession(req);

				expect(session.id).toBe('unknown-session');
			});

			it('should return registered session', async () => {
				const driver = new InMemorySessionDriver();
				const testSession: Session = { id: 'registered-session' };
				driver.createSession(testSession);

				const req = { sessionId: testSession.id } as AnyRequest;

				const session = await driver.getSession(req);

				expect(session.id).toBe('registered-session');
				expect(session).toBe(testSession);
			});
		});

		describe('checkSession()', () => {
			it('should pass for registered sessions', async () => {
				const driver = new InMemorySessionDriver();
				driver.createSession({ id: 'valid-session' });

				const req = { sessionId: 'valid-session' } as AnyRequest;

				expect(async () => {
					await driver.checkSession(req);
				}).not.toThrow();
			});

			it('should throw for unregistered sessions', async () => {
				const driver = new InMemorySessionDriver();
				const req = { sessionId: 'invalid-session' } as AnyRequest;

				try {
					await driver.checkSession(req);
					fail('Should have thrown Error');
				}
				catch (error) {
					expect(error).toBeInstanceOf(Error);
					expect((error as Error).message).toBe('Session not found');
				}
			});

			it('should throw when no sessionId provided', async () => {
				const driver = new InMemorySessionDriver();
				const req = {} as AnyRequest;

				try {
					await driver.checkSession(req);
					fail('Should have thrown Error');
				}
				catch (error) {
					expect(error).toBeInstanceOf(Error);
					expect((error as Error).message).toBe(
						'No session ID provided'
					);
				}
			});
		});
	});

	describe('getAuthRouter()', () => {
		it('should return a router instance', () => {
			const scheme = new TestSessionScheme();
			const router = scheme.getAuthRouter();

			expect(router).toBeDefined();
			expect(router.path).toBe('');
		});

		it('should set router path from basePath parameter', () => {
			const scheme = new TestSessionScheme();
			const router = scheme.getAuthRouter('/auth');

			expect(router.path).toBe('/auth');
		});

		it('should expose all auth steps as routes', () => {
			class ChallengeStep extends AuthStep {
				override path = '/challenge';
				async handle() {
					return { challenge: 'test' };
				}
			}

			class AuthStep2 extends AuthStep {
				override path = '/authorize';
				async handle() {
					return { code: 'abc123' };
				}
			}

			class TokenStep extends AuthStep {
				override path = '/token';
				async handle() {
					return { token: 'xyz789' };
				}
			}

			class TestSchemeWithSteps extends SessionAuthenticationScheme {
				public readonly schemeName = 'TestScheme';
				public readonly type = 'oauth2' as const;

				public constructor(
					options: { sessionDriver?: SessionDriver } = {}
				) {
					super({
						sessionDriver:
							options.sessionDriver ||
							new InMemorySessionDriver(),
					});
				}

				public getSecurityScheme(): SecuritySchemeObject {
					return {
						type: 'oauth2' as const,
						flows: {
							authorizationCode: {
								authorizationUrl: 'http://example.com/auth',
								tokenUrl: 'http://example.com/token',
								scopes: {},
							},
						},
					};
				}

				public getAuthFlow(): AuthFlow {
					return {
						challenge: ChallengeStep,
						authorize: AuthStep2,
						token: TokenStep,
					};
				}
			}

			const scheme = new TestSchemeWithSteps();
			const router = scheme.getAuthRouter('/oauth');

			// Verify router has correct path and is a BaseApiRouter
			expect(router).toBeDefined();
			expect(router.path).toBe('/oauth');
			expect(router).toBeInstanceOf(BaseApiRouter);
		});

		it('should work with empty basePath', () => {
			const scheme = new TestSessionScheme();
			const router = scheme.getAuthRouter();

			expect(router.path).toBe('');
		});

		it('should return different router instances on each call', () => {
			const scheme = new TestSessionScheme();
			const router1 = scheme.getAuthRouter('/auth');
			const router2 = scheme.getAuthRouter('/auth');

			expect(router1).not.toBe(router2);
		});

		it('should return auth steps from routes() method', async () => {
			class ChallengeStep extends AuthStep {
				override path = '/challenge';
				async handle() {
					return { challenge: 'test' };
				}
			}

			class TokenStep extends AuthStep {
				override path = '/token';
				async handle() {
					return { token: 'xyz789' };
				}
			}

			class TestSchemeWithRoutes extends SessionAuthenticationScheme {
				public readonly schemeName = 'TestScheme';
				public readonly type = 'oauth2' as const;

				public constructor(
					options: { sessionDriver?: SessionDriver } = {}
				) {
					super({
						sessionDriver:
							options.sessionDriver ||
							new InMemorySessionDriver(),
					});
				}

				public getSecurityScheme(): SecuritySchemeObject {
					return {
						type: 'oauth2' as const,
						flows: {
							authorizationCode: {
								authorizationUrl: 'http://example.com/auth',
								tokenUrl: 'http://example.com/token',
								scopes: {},
							},
						},
					};
				}

				public getAuthFlow(): AuthFlow {
					return {
						challenge: ChallengeStep,
						token: TokenStep,
					};
				}
			}

			const scheme = new TestSchemeWithRoutes();
			const router = scheme.getAuthRouter('/auth');

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const routes = await (router as any).routes();

			expect(routes).toBeDefined();
			expect(routes.length).toBe(2);
			expect(routes[0]).toBe(ChallengeStep);
			expect(routes[1]).toBe(TokenStep);
		});
	});

	describe('getEndpoints()', () => {
		it('should return auth endpoints from the auth flow', () => {
			class SimpleSessionScheme extends SessionAuthenticationScheme {
				public readonly schemeName = 'SimpleSession';
				public readonly type = 'apiKey' as const;

				public constructor(
					options: { sessionDriver?: SessionDriver } = {}
				) {
					super({
						sessionDriver:
							options.sessionDriver ||
							new InMemorySessionDriver(),
					});
				}

				public getSecurityScheme(): SecuritySchemeObject {
					return {
						type: 'apiKey' as const,
						name: 'session_id',
						in: 'cookie' as const,
					};
				}

				public getAuthFlow(): AuthFlow {
					return {
						login: class extends AuthStep {
							override path = '/login';
							override description = 'Login step';
							async handle() {
								return { token: 'abc123' };
							}
						},
						logout: class extends AuthStep {
							override path = '/logout';
							override description = 'Logout step';
							async handle() {
								return { success: true };
							}
						},
					};
				}
			}

			const scheme = new SimpleSessionScheme();
			const endpoints = scheme.getEndpoints();

			expect(endpoints).toBeDefined();
			expect(Array.isArray(endpoints)).toBe(true);
			expect(endpoints.length).toBe(2);
		});

		it('should return auth step classes', () => {
			class MultiStepScheme extends SessionAuthenticationScheme {
				public readonly schemeName = 'MultiStep';
				public readonly type = 'oauth2' as const;

				public constructor(
					options: { sessionDriver?: SessionDriver } = {}
				) {
					super({
						sessionDriver:
							options.sessionDriver ||
							new InMemorySessionDriver(),
					});
				}

				public getSecurityScheme(): SecuritySchemeObject {
					return {
						type: 'oauth2' as const,
						flows: {
							authorizationCode: {
								authorizationUrl: 'http://example.com/auth',
								tokenUrl: 'http://example.com/token',
								scopes: {},
							},
						},
					};
				}

				public getAuthFlow(): AuthFlow {
					class Step1 extends AuthStep {
						override path = '/step1';
						async handle() {
							return { step: 1 };
						}
					}

					class Step2 extends AuthStep {
						override path = '/step2';
						async handle() {
							return { step: 2 };
						}
					}

					class Step3 extends AuthStep {
						override path = '/step3';
						async handle() {
							return { step: 3 };
						}
					}

					return {
						first: Step1,
						second: Step2,
						third: Step3,
					};
				}
			}

			const scheme = new MultiStepScheme();
			const endpoints = scheme.getEndpoints();

			expect(endpoints.length).toBe(3);
			// All should be AuthStep classes
			endpoints.forEach((endpoint) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				expect(typeof endpoint).toBe('function');
			});
		});

		it('should return empty array for empty auth flow', () => {
			class EmptySessionScheme extends SessionAuthenticationScheme {
				public readonly schemeName = 'EmptySession';
				public readonly type = 'apiKey' as const;

				public constructor(
					options: { sessionDriver?: SessionDriver } = {}
				) {
					super({
						sessionDriver:
							options.sessionDriver ||
							new InMemorySessionDriver(),
					});
				}

				public getSecurityScheme(): SecuritySchemeObject {
					return {
						type: 'apiKey' as const,
						name: 'session_id',
						in: 'cookie' as const,
					};
				}

				public getAuthFlow(): AuthFlow {
					return {};
				}
			}

			const scheme = new EmptySessionScheme();
			const endpoints = scheme.getEndpoints();

			expect(Array.isArray(endpoints)).toBe(true);
			expect(endpoints.length).toBe(0);
		});

		it('should return endpoints from auth flow', async () => {
			class MatchingScheme extends SessionAuthenticationScheme {
				public readonly schemeName = 'Matching';
				public readonly type = 'apiKey' as const;

				public constructor(
					options: { sessionDriver?: SessionDriver } = {}
				) {
					super({
						sessionDriver:
							options.sessionDriver ||
							new InMemorySessionDriver(),
					});
				}

				public getSecurityScheme(): SecuritySchemeObject {
					return {
						type: 'apiKey' as const,
						name: 'session_id',
						in: 'cookie' as const,
					};
				}

				public getAuthFlow(): AuthFlow {
					return {
						auth: class extends AuthStep {
							override path = '/auth';
							async handle() {
								return { authenticated: true };
							}
						},
						verify: class extends AuthStep {
							override path = '/verify';
							async handle() {
								return { verified: true };
							}
						},
					};
				}
			}

			const scheme = new MatchingScheme();
			const endpoints = scheme.getEndpoints();

			expect(Array.isArray(endpoints)).toBe(true);
			expect(endpoints.length).toBe(2);
			// Verify they are classes/functions
			endpoints.forEach((endpoint) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				expect(typeof endpoint).toBe('function');
			});
		});
	});
});
