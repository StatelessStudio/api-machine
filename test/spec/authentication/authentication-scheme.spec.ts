import 'jasmine';
import {
	AuthenticationScheme,
	BearerAuthenticationScheme,
	InlineAuthenticationScheme,
} from '../../../src/authentication';
import {
	ApiNextFunction,
	ApiRequest,
	ApiResponse,
	AuthenticatedRequest,
} from '../../../src';
import { RequestHandler } from 'express';
import { UnauthorizedError } from '../../../src/error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResponse = any;

/**
 * Test implementation of InlineAuthenticationScheme
 */
class TestInlineScheme extends InlineAuthenticationScheme {
	readonly schemeName = 'TestInline';
	private throwError = false;

	public setThrowError(shouldThrow: boolean): void {
		this.throwError = shouldThrow;
	}

	getSecurityScheme() {
		return { type: 'http' as const, scheme: 'Bearer' };
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getCredentials(request: ApiRequest): unknown {
		return {};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async authenticate(options: {
		credentials: unknown;
		request: ApiRequest;
	}): Promise<void> {
		if (this.throwError) {
			throw new UnauthorizedError('Test auth failed', {
				scheme: 'Bearer',
			});
		}
	}
}

describe('AuthenticationScheme (Base Class)', () => {
	describe('Interface Contract', () => {
		it('should have required abstract properties', () => {
			class TestScheme extends AuthenticationScheme {
				readonly schemeName = 'TestScheme';

				getSecurityScheme() {
					return { type: 'http' as const, scheme: 'test' };
				}

				// eslint-disable-next-line
				async authenticate(request: any): Promise<void> {}
				override getMiddleware(): RequestHandler {
					return async (
						request: ApiRequest,
						response: ApiResponse,
						next: ApiNextFunction
					) => {
						await this.authenticate(request);
						return next();
					};
				}
			}

			const scheme = new TestScheme();
			expect(scheme.schemeName).toBe('TestScheme');
		});

		it('should have getSecurityRequirement method', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const requirement = scheme.getSecurityRequirement();
			expect(requirement).toEqual({ BearerAuth: [] });
		});
	});

	describe('Scheme Types', () => {
		it('should support http scheme type', () => {
			const scheme = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			expect(scheme.getSecurityScheme().type).toBe('http');
		});
	});

	describe('InlineAuthenticationScheme', () => {
		it('should execute getMiddleware with authentication', async () => {
			const scheme = new TestInlineScheme();
			const middleware = scheme.getMiddleware();

			const req = { authenticated: false } as AuthenticatedRequest;
			const res = {} as AnyResponse;
			const next = jasmine
				.createSpy('next')
				.and.returnValue(Promise.resolve());

			await middleware(req, res, next);

			expect(req.authenticated).toBe(true);
			expect(next).toHaveBeenCalled();
		});

		it('should propagate authentication errors', async () => {
			const scheme = new TestInlineScheme();
			scheme.setThrowError(true);

			const middleware = scheme.getMiddleware();

			const req = { authenticated: false } as AuthenticatedRequest;
			const res = {} as AnyResponse;
			const next = jasmine.createSpy('next');

			try {
				await middleware(req, res, next);
				fail('Should have thrown error');
			}
			catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedError);
				expect(next).not.toHaveBeenCalled();
				expect(req.authenticated).toBe(false);
			}
		});

		it('should call next() after authentication succeeds', async () => {
			const scheme = new TestInlineScheme();
			const middleware = scheme.getMiddleware();

			const req = { authenticated: false } as AuthenticatedRequest;
			const res = {} as AnyResponse;
			const next = jasmine
				.createSpy('next')
				.and.returnValue(Promise.resolve());

			await middleware(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(req.authenticated).toBe(true);
		});
	});
});
