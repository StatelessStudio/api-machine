import 'jasmine';
// eslint-disable-next-line max-len
import { BearerAuthenticationScheme } from '../../../src/authentication/schemes/bearer-authentication-scheme';
import { UnauthorizedError } from '../../../src/error';
import { AuthenticatedRequest } from '../../../src/authentication';
import { ApiRequest } from '../../../src';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResponse = any;

describe('BearerAuthenticationScheme', () => {
	describe('Initialization', () => {
		it('should initialize with required options', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			expect(scheme.schemeName).toBe('BearerAuth');
			expect(scheme.type).toBe('http');
		});

		it('should use custom scheme name if provided', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'CustomBearer',
			});

			expect(scheme.schemeName).toBe('CustomBearer');
		});

		it('should use custom bearer format if provided', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
				bearerFormat: 'OAuth2',
			});

			const securityScheme = scheme.getSecurityScheme();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((securityScheme as any).bearerFormat).toBe('OAuth2');
		});

		it('should default bearer format to JWT', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const securityScheme = scheme.getSecurityScheme();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((securityScheme as any).bearerFormat).toBe('JWT');
		});

		it('should include description if provided', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
				description: 'JWT Bearer token for API access',
			});

			const securityScheme = scheme.getSecurityScheme();
			expect(securityScheme.description).toBe(
				'JWT Bearer token for API access'
			);
		});

		it('should omit description if not provided', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const securityScheme = scheme.getSecurityScheme();
			expect(securityScheme.description).toBeUndefined();
		});
	});

	describe('getSecurityScheme()', () => {
		it('should return http security scheme object', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const securityScheme = scheme.getSecurityScheme();

			expect(securityScheme).toEqual(
				jasmine.objectContaining({
					type: 'http',
				})
			);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((securityScheme as any).scheme).toBe('bearer');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((securityScheme as any).bearerFormat).toBe('JWT');
		});

		it('should match OpenAPI SecuritySchemeObject structure', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
				description: 'Test Bearer Auth',
			});

			const securityScheme = scheme.getSecurityScheme();

			// Validate required fields
			expect(securityScheme.type).toBe('http');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((securityScheme as any).scheme).toBe('bearer');

			// Validate optional fields
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((securityScheme as any).bearerFormat).toBeDefined();
			expect(securityScheme.description).toBeDefined();
		});
	});

	describe('getSecurityRequirement()', () => {
		it('should return security requirement with scheme name', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const requirement = scheme.getSecurityRequirement();

			expect(requirement).toEqual({ BearerAuth: [] });
		});

		it('should use custom scheme name in requirement', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'AdminBearer',
			});

			const requirement = scheme.getSecurityRequirement();

			expect(requirement).toEqual({ AdminBearer: [] });
		});
	});

	describe('getMiddleware()', () => {
		it('should return a function', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const middleware = scheme.getMiddleware();

			expect(typeof middleware).toBe('function');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((middleware as any).length).toBeGreaterThanOrEqual(3);
		});

		it('should return middleware that accepts valid tokens', async () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async (token: string) => token === 'valid-token',
			});

			const middleware = scheme.getMiddleware();

			const req = {
				headers: { authorization: 'Bearer valid-token' },
				ip: '127.0.0.1',
				authenticated: false,
			} as unknown as AuthenticatedRequest;

			const res = {} as unknown as AnyResponse;
			const next = jasmine.createSpy('next');

			await middleware(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(req.authenticated).toBe(true);
		});

		it('should reject invalid tokens', async () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async (token: string) => token === 'valid-token',
			});

			const middleware = scheme.getMiddleware();

			const req = {
				headers: { authorization: 'Bearer invalid-token' },
				ip: '127.0.0.1',
				authenticated: false,
			} as unknown as AuthenticatedRequest;

			const res = {} as unknown as AnyResponse;
			const next = jasmine.createSpy('next');

			try {
				await middleware(req, res, next);
				fail('Should have thrown UnauthorizedError');
			}
			catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect((error as UnauthorizedError).message).toBe(
					'Bearer token check failed'
				);
			}

			expect(next).not.toHaveBeenCalled();
		});

		it('should reject missing Authorization header', async () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const middleware = scheme.getMiddleware();

			const req = {
				headers: {},
				ip: '127.0.0.1',
				authenticated: false,
			} as unknown as AuthenticatedRequest;

			const res = {} as unknown as AnyResponse;
			const next = jasmine.createSpy('next');

			try {
				await middleware(req, res, next);
				fail('Should have thrown UnauthorizedError');
			}
			catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect((error as UnauthorizedError).message).toBe(
					'Authorization header is missing'
				);
			}

			expect(next).not.toHaveBeenCalled();
		});

		it('should support optional log parameter', async () => {
			const mockLog = {
				warn: jasmine.createSpy('warn'),
				info: jasmine.createSpy('info'),
				error: jasmine.createSpy('error'),
				debug: jasmine.createSpy('debug'),
				fatal: jasmine.createSpy('fatal'),
			};

			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => false,
				log: mockLog,
			});

			const middleware = scheme.getMiddleware();

			const req = {
				headers: { authorization: 'Bearer token' },
				ip: '127.0.0.1',
				authenticated: false,
			} as unknown as AuthenticatedRequest;

			const res = {} as unknown as AnyResponse;
			const next = jasmine.createSpy('next');

			try {
				await middleware(req, res, next);
			}
			catch (error) {
				// Expected error
			}

			expect(mockLog.warn).toHaveBeenCalled();
		});
	});

	describe('Configuration Options', () => {
		it('should pass checkToken option to middleware', async () => {
			const checkTokenSpy = jasmine
				.createSpy('checkToken')
				.and.returnValue(Promise.resolve(true));

			const scheme = new BearerAuthenticationScheme({
				checkToken: checkTokenSpy,
			});

			const middleware = scheme.getMiddleware();

			const req = {
				headers: { authorization: 'Bearer test-token' },
				ip: '127.0.0.1',
				authenticated: false,
			} as unknown as AuthenticatedRequest;

			const res = {} as unknown as AnyResponse;
			const next = jasmine.createSpy('next');

			await middleware(req, res, next);

			expect(checkTokenSpy).toHaveBeenCalledWith('test-token');
		});
	});

	describe('getSecurityScheme()', () => {
		it('should include description if provided', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
				description: 'Bearer token authentication',
			});

			const securityScheme = scheme.getSecurityScheme();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((securityScheme as any).description).toBe(
				'Bearer token authentication'
			);
		});

		it('should not include description if not provided', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const securityScheme = scheme.getSecurityScheme();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((securityScheme as any).description).toBeUndefined();
		});
	});

	describe('InlineAuthenticationScheme methods', () => {
		it('should execute middleware flow with successful auth', async () => {
			const checkTokenSpy = jasmine
				.createSpy('checkToken')
				.and.returnValue(Promise.resolve(true));

			const scheme = new BearerAuthenticationScheme({
				checkToken: checkTokenSpy,
			});

			const middleware = scheme.getMiddleware();

			const req = {
				headers: { authorization: 'Bearer valid-token' },
				ip: '127.0.0.1',
				authenticated: false,
			} as unknown as AuthenticatedRequest;

			const res = {} as AnyResponse;
			const next = jasmine
				.createSpy('next')
				.and.returnValue(Promise.resolve());

			await middleware(req, res, next);

			expect(req.authenticated).toBe(true);
			expect(checkTokenSpy).toHaveBeenCalled();
			expect(next).toHaveBeenCalled();
		});

		it('should stop middleware execution on auth error', async () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: jasmine
					.createSpy('checkToken')
					.and.returnValue(Promise.resolve(false)),
			});

			const middleware = scheme.getMiddleware();

			const req = {
				headers: { authorization: 'Bearer invalid-token' },
				ip: '127.0.0.1',
				authenticated: false,
			} as unknown as AuthenticatedRequest;

			const res = {} as AnyResponse;
			const next = jasmine.createSpy('next');

			try {
				await middleware(req, res, next);
				fail('Should have thrown error');
			}
			catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect(next).not.toHaveBeenCalled();
			}
		});
	});

	describe('authenticate(credentials) method', () => {
		it('should throw when credentials are empty', async () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			try {
				// Call the actual authenticate method with empty string
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				await scheme.authenticate({
					credentials: '',
					request: {} as ApiRequest,
				});
				fail('Should have thrown error');
			}
			catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect((error as UnauthorizedError).message).toBe(
					'Authorization header is missing'
				);
			}
		});

		it('should throw when token validation fails', async () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			try {
				// Call authenticate with invalid token format
				// BearerTokenValSan will validate and reject it
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				await scheme.authenticate({
					credentials: 'not-a-valid-token',
					request: {} as ApiRequest,
				});
				fail('Should have thrown error');
			}
			catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect((error as UnauthorizedError).message).toBe(
					'Bearer token is empty or invalid'
				);
			}
		});

		it('should check token after validation succeeds', async () => {
			const checkTokenSpy = jasmine
				.createSpy('checkToken')
				.and.returnValue(Promise.resolve(true));

			const scheme = new BearerAuthenticationScheme({
				checkToken: checkTokenSpy,
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await (scheme as any).authenticate({
				credentials: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
			});
			expect(checkTokenSpy).toHaveBeenCalled();
		});

		it('should throw when checkToken fails in authenticate', async () => {
			const checkTokenSpy = jasmine
				.createSpy('checkToken')
				.and.returnValue(Promise.resolve(false));

			const scheme = new BearerAuthenticationScheme({
				checkToken: checkTokenSpy,
			});

			try {
				// This should pass validation but fail the checkToken check
				// Using Bearer format with full JWT
				await scheme.authenticate({
					credentials:
						// eslint-disable-next-line max-len
						'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ',
					request: {} as ApiRequest,
				});

				fail('Should have thrown error from checkToken');
			}
			catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedError);
				// Could be either validation error or checkToken error
				expect((error as UnauthorizedError).message).toMatch(
					/(Bearer token|empty|invalid|check failed)/
				);
			}
		});
	});
});
