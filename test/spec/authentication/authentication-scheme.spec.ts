import 'jasmine';
import {
	AuthenticationScheme,
	BearerAuthenticationScheme,
} from '../../../src/authentication';
import { ApiNextFunction, ApiRequest, ApiResponse } from '../../../src';

describe('AuthenticationScheme (Base Class)', () => {
	describe('Interface Contract', () => {
		it('should have required abstract properties', () => {
			class TestScheme extends AuthenticationScheme {
				readonly schemeName = 'TestScheme';
				readonly type = 'http' as const;

				getSecurityScheme() {
					return { type: 'http' as const, scheme: 'test' };
				}

				getMiddleware() {
					return (
						request: ApiRequest,
						response: ApiResponse,
						next: ApiNextFunction
					) => next();
				}
			}

			const scheme = new TestScheme();
			expect(scheme.schemeName).toBe('TestScheme');
			expect(scheme.type).toBe('http');
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

			expect(scheme.type).toBe('http');
		});
	});
});
