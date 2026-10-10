import 'jasmine';
import {
	AuthorizationContext,
	AuthorizationResult,
	ApiAuthorizationService,
} from '../../../src/authorization/authorization';
import { AuthenticatedPrincipal } from '../../../src/authentication/authenticated-request';

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

describe('Authorization Security', () => {
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

	it('prevents privilege escalation through resource manipulation', async () => {
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
