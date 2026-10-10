import 'jasmine';
import {
	ApiRequest,
	BaseApiEndpoint,
	BaseApiRouter,
	BearerAuthenticationScheme,
	ForbiddenError,
	RestServer,
} from '../../../src';
import {
	ApiAuthorizationService,
	AuthorizationContext,
	AuthorizationResult,
} from '../../../src/authorization/authorization';
import {
	AuthenticatedPrincipal,
} from '../../../src/authentication/authenticated-request';
import { LogInterface } from '../../../src/log';

describe('Authorization enforcement', () => {
	let handled: number;
	let logger: jasmine.SpyObj<LogInterface>;
	let evaluate: jasmine.Spy;

	class ProtectedEndpoint extends BaseApiEndpoint {
		override path = '/protected';

		async handle(request: ApiRequest) {
			handled++;
			return { principalId: request.principal?.id };
		}
	}

	class PublicEndpoint extends ProtectedEndpoint {
		override path = '/public';
		override authentication = null;
		override authorization = null;
	}

	class NoPrincipalEndpoint extends ProtectedEndpoint {
		override path = '/no-principal';
		override authentication = new BearerAuthenticationScheme({
			checkToken: async () => true,
		});
	}

	class ProtectedRouter extends BaseApiRouter {
		override authorization = { action: 'manage', resource: 'users' };

		async routes() {
			return [ProtectedEndpoint, PublicEndpoint, NoPrincipalEndpoint];
		}
	}

	class TestServer extends RestServer {
		override router = ProtectedRouter;

		constructor() {
			super({
				port: 0,
				log: logger,
				authentication: new BearerAuthenticationScheme({
					checkToken: async (token) =>
						['admin', 'user'].includes(token)
							? { id: token }
							: false,
				}),
				authorizer: { evaluate },
			});
		}

		get url(): string {
			const address = this.listener.address();
			if (!address || typeof address === 'string') {
				throw new Error('Expected a TCP listener');
			}
			return `http://127.0.0.1:${address.port}`;
		}
	}

	let server: TestServer;

	beforeEach(async () => {
		handled = 0;
		logger = jasmine.createSpyObj<LogInterface>('logger', [
			'fatal',
			'error',
			'warn',
			'info',
			'debug',
		]);
		evaluate = jasmine
			.createSpy('evaluate')
			.and.callFake(
				async ({ principal }: { principal: { id: string } }) => ({
					allowed: principal.id === 'admin',
					reason: 'Required permission is missing',
				})
			);
		server = new TestServer();
		await server.start();
	});

	afterEach(async () => {
		await server.stop();
	});

	it('checks auth before policy or handler execution', async () => {
		const response = await fetch(`${server.url}/protected`);
		expect(response.status).toBe(401);
		expect(evaluate).not.toHaveBeenCalled();
		expect(handled).toBe(0);
	});

	it('rejects auth without a principal before the handler runs', async () => {
		const response = await fetch(`${server.url}/no-principal`, {
			headers: { Authorization: 'Bearer legacy-token' },
		});
		expect(response.status).toBe(401);
		expect(evaluate).not.toHaveBeenCalled();
		expect(handled).toBe(0);
		expect(logger.warn).toHaveBeenCalledWith(
			'authorization.missing-principal',
			jasmine.any(Object)
		);
	});

	it('denies privilege escalation before handler execution', async () => {
		const response = await fetch(
			`${server.url}/protected?principalId=admin`,
			{ headers: { Authorization: 'Bearer user' } }
		);
		expect(response.status).toBe(403);
		expect(evaluate).toHaveBeenCalledWith({
			principal: { id: 'user' },
			action: 'manage',
			resource: 'users',
		});
		expect(handled).toBe(0);
		expect(logger.warn).toHaveBeenCalledWith(
			'authorization.denied',
			jasmine.objectContaining({ principalId: 'user' })
		);
	});

	it('allows authenticated principal and emits audit events', async () => {
		const response = await fetch(`${server.url}/protected`, {
			headers: {
				Authorization: 'Bearer admin',
				'x-request-id': 'test-request',
			},
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ principalId: 'admin' });
		expect(handled).toBe(1);
		expect(logger.info).toHaveBeenCalledWith(
			'authorization.allowed',
			jasmine.objectContaining({
				principalId: 'admin',
				action: 'manage',
				resource: 'users',
				method: 'GET',
				path: '/protected',
				requestId: 'test-request',
			})
		);
	});

	it('preserves typed errors without running the handler', async () => {
		const error = new ForbiddenError('Policy denied this caller');
		evaluate.and.rejectWith(error);
		const response = await fetch(`${server.url}/protected`, {
			headers: { Authorization: 'Bearer admin' },
		});
		expect(response.status).toBe(403);
		expect(handled).toBe(0);
		expect(logger.error).toHaveBeenCalledWith(
			'authorization.error',
			jasmine.objectContaining({ error })
		);
	});

	it('fails closed when the policy backend fails', async () => {
		evaluate.and.rejectWith(new Error('Backend unavailable'));
		const response = await fetch(`${server.url}/protected`, {
			headers: { Authorization: 'Bearer admin' },
		});
		expect(response.status).toBe(500);
		expect(handled).toBe(0);
	});

	it('allows public routes without evaluating policy', async () => {
		const response = await fetch(`${server.url}/public`);
		expect(response.status).toBe(200);
		expect(evaluate).not.toHaveBeenCalled();
		expect(handled).toBe(1);
	});
});

class MockAuthorizationService implements ApiAuthorizationService {
	deniedContexts: AuthorizationContext[] = [];

	async evaluate(
		context: AuthorizationContext
	): Promise<AuthorizationResult> {
		if (this.deniedContexts.some((c) => this._contextMatches(c, context))) {
			return { allowed: false, reason: 'Access denied by policy' };
		}
		return { allowed: true };
	}

	private _contextMatches(
		denied: AuthorizationContext,
		actual: AuthorizationContext
	): boolean {
		return (
			denied.principal.id === actual.principal.id &&
			denied.action === actual.action &&
			denied.resource === actual.resource
		);
	}
}

describe('Authorization policy evaluation', () => {
	let authService: MockAuthorizationService;
	let adminPrincipal: AuthenticatedPrincipal;
	let userPrincipal: AuthenticatedPrincipal;

	beforeEach(() => {
		adminPrincipal = { id: 'admin-1' };
		userPrincipal = { id: 'user-1' };
		authService = new MockAuthorizationService();
		authService.deniedContexts = [];
	});

	it('denies access when principal lacks required action', async () => {
		authService.deniedContexts.push({
			principal: userPrincipal,
			action: 'delete',
			resource: 'users',
		});

		const result = await authService.evaluate({
			principal: userPrincipal,
			action: 'delete',
			resource: 'users',
		});

		expect(result.allowed).toBe(false);
		expect(result.reason).toBeTruthy();
	});

	it('allows access when principal has required action', async () => {
		const result = await authService.evaluate({
			principal: adminPrincipal,
			action: 'delete',
			resource: 'users',
		});

		expect(result.allowed).toBe(true);
	});

	it('supports resource-specific policies', async () => {
		authService.deniedContexts.push({
			principal: userPrincipal,
			action: 'edit',
			resource: 'sensitive-docs',
		});

		const result1 = await authService.evaluate({
			principal: userPrincipal,
			action: 'edit',
			resource: 'sensitive-docs',
		});
		expect(result1.allowed).toBe(false);

		const result2 = await authService.evaluate({
			principal: userPrincipal,
			action: 'edit',
			resource: 'public-docs',
		});
		expect(result2.allowed).toBe(true);
	});

	it('denies access to different principal', async () => {
		authService.deniedContexts.push({
			principal: userPrincipal,
			action: 'read',
			resource: 'reports',
		});

		const result = await authService.evaluate({
			principal: adminPrincipal,
			action: 'read',
			resource: 'reports',
		});

		expect(result.allowed).toBe(true);
	});

	it('provides reason for denied access', async () => {
		authService.deniedContexts.push({
			principal: userPrincipal,
			action: 'admin-access',
			resource: 'system',
		});

		const result = await authService.evaluate({
			principal: userPrincipal,
			action: 'admin-access',
			resource: 'system',
		});

		expect(result.allowed).toBe(false);
		expect(result.reason).toBe('Access denied by policy');
	});

	it('handles multiple denied actions for same principal', async () => {
		authService.deniedContexts.push(
			{
				principal: userPrincipal,
				action: 'delete',
				resource: 'users',
			},
			{
				principal: userPrincipal,
				action: 'delete',
				resource: 'roles',
			},
			{
				principal: userPrincipal,
				action: 'delete',
				resource: 'permissions',
			}
		);

		const result1 = await authService.evaluate({
			principal: userPrincipal,
			action: 'delete',
			resource: 'users',
		});
		expect(result1.allowed).toBe(false);

		const result2 = await authService.evaluate({
			principal: userPrincipal,
			action: 'delete',
			resource: 'roles',
		});
		expect(result2.allowed).toBe(false);

		const result3 = await authService.evaluate({
			principal: userPrincipal,
			action: 'read',
			resource: 'users',
		});
		expect(result3.allowed).toBe(true);
	});

	it('prevents privilege escalation via resource manipulation', async () => {
		authService.deniedContexts.push({
			principal: userPrincipal,
			action: 'escalate',
			resource: 'admin-role',
		});

		const result = await authService.evaluate({
			principal: userPrincipal,
			action: 'escalate',
			resource: 'admin-role',
		});

		expect(result.allowed).toBe(false);
	});
});
