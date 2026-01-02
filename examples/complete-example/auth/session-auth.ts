/**
 * Session-Based (OAuth2-like) Authentication
 *
 * This module demonstrates stateful, multi-step authentication.
 * Implements a challenge-based flow similar to OAuth2 authorization code flow.
 */

import {
	BaseApiRouter,
	BaseApiEndpoint,
	SessionAuthenticationScheme,
	AuthFlow,
	InMemorySessionDriver,
	ApiRequest,
	ApiResponse,
	UnauthorizedError,
} from '../../../src/index';
import { EndpointMethod } from '../../../src/router/endpoint';
import { SecuritySchemeObject } from 'auto-oas/oas/v3.1';

// Simple in-memory storage for demonstration
const storedChallenges = new Map<string, { timestamp: number }>();
const storedAuthCodes = new Map<
	string,
	{ username: string; timestamp: number }
>();

/**
 * Session-based OAuth2-like authentication scheme
 */
class OAuth2Scheme extends SessionAuthenticationScheme {
	public readonly schemeName = 'OAuth2';
	public readonly type = 'oauth2' as const;

	constructor() {
		super({ sessionDriver: new InMemorySessionDriver() });
	}

	public getSecurityScheme(): SecuritySchemeObject {
		return {
			type: 'oauth2' as const,
			flows: {
				authorizationCode: {
					authorizationUrl: 'http://localhost:3000/oauth/authorize',
					tokenUrl: 'http://localhost:3000/oauth/token',
					scopes: { 'read:data': 'Read data' },
				},
			},
		};
	}

	public getAuthFlow(): AuthFlow {
		const sessionDriver = this.sessionDriver;

		/**
		 * Challenge step - generates a random challenge for CSRF prevention
		 */
		class ChallengeStep extends BaseApiEndpoint {
			override path = '/challenge';
			override method = EndpointMethod.POST;
			override description = 'Generate authentication challenge';

			async handle(request: ApiRequest, response: ApiResponse) {
				const challenge =
					Math.random().toString(36).substring(2, 15) +
					Math.random().toString(36).substring(2, 15);
				storedChallenges.set(challenge, { timestamp: Date.now() });
				return { challenge, expiresIn: 300 };
			}
		}

		/**
		 * Authorization step - validates credentials
		 */
		class AuthorizationStep extends BaseApiEndpoint {
			override path = '/authorize';
			override method = EndpointMethod.POST;
			override description = 'Authorize with username and password';

			async handle(request: ApiRequest, response: ApiResponse) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const { username, password, challenge } = request.body as any;

				if (!username || !password || !challenge) {
					throw new UnauthorizedError('Missing required fields');
				}

				const storedChallenge = storedChallenges.get(challenge);
				if (!storedChallenge) {
					throw new UnauthorizedError('Invalid or expired challenge');
				}

				if (Date.now() - storedChallenge.timestamp > 5 * 60 * 1000) {
					storedChallenges.delete(challenge);
					throw new UnauthorizedError('Challenge expired');
				}

				// Demo: accept demo/demo or admin/admin
				const validUsers = [
					{ username: 'demo', password: 'demo' },
					{ username: 'admin', password: 'admin' },
				];

				const user = validUsers.find(
					(u) => u.username === username && u.password === password
				);

				if (!user) {
					throw new UnauthorizedError('Invalid credentials');
				}

				const code =
					'code-' +
					Math.random().toString(36).substring(2, 15) +
					Math.random().toString(36).substring(2, 15);

				storedAuthCodes.set(code, {
					username: user.username,
					timestamp: Date.now(),
				});
				storedChallenges.delete(challenge);

				return { code, expiresIn: 60 };
			}
		}

		/**
		 * Token exchange step - exchanges code for session
		 */
		class TokenStep extends BaseApiEndpoint {
			override path = '/token';
			override method = EndpointMethod.POST;
			override description = 'Exchange authorization code for session';

			async handle(request: ApiRequest, response: ApiResponse) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const { code } = request.body as any;

				if (!code) {
					throw new UnauthorizedError('Missing authorization code');
				}

				const storedCode = storedAuthCodes.get(code);
				if (!storedCode) {
					throw new UnauthorizedError('Invalid or expired code');
				}

				if (Date.now() - storedCode.timestamp > 1 * 60 * 1000) {
					storedAuthCodes.delete(code);
					throw new UnauthorizedError('Code expired');
				}

				const sessionId =
					'session-' +
					Math.random().toString(36).substring(2, 15) +
					Math.random().toString(36).substring(2, 15);

				// Create session in the driver
				sessionDriver.createSession({
					id: sessionId,
					username: storedCode.username,
					createdAt: new Date(),
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
					// TODO: Fix session type
					// eslint-disable-next-line max-len
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} as any);

				response.cookie('sessionId', sessionId, {
					httpOnly: true,
					maxAge: 24 * 60 * 60 * 1000,
				});

				storedAuthCodes.delete(code);

				return {
					sessionId,
					username: storedCode.username,
					expiresIn: 86400,
				};
			}
		}

		return {
			challenge: ChallengeStep,
			authorize: AuthorizationStep,
			token: TokenStep,
		};
	}
}

/**
 * Session-based authentication scheme instance
 */
export const oauth2Scheme = new OAuth2Scheme();

/**
 * Protected endpoint requiring session authentication
 */
export class SessionProtectedEndpoint extends BaseApiEndpoint {
	override path = '/protected';
	override description = 'Protected resource requiring session';
	override authentication = oauth2Scheme;

	async handle(request: ApiRequest, response: ApiResponse) {
		return {
			message: 'You accessed a session-protected resource',
			timestamp: new Date().toISOString(),
		};
	}
}

/**
 * Router for session-based OAuth2 authentication
 */
export class OAuth2Router extends BaseApiRouter {
	override path = '/oauth';
	override description = 'OAuth2 session-based authentication';
	// Don't apply authentication to the auth steps themselves
	override authentication = null;

	async routes() {
		// Return both auth flow steps and protected endpoint
		const endpoints = oauth2Scheme.getEndpoints();

		// Protected endpoint requires oauth2 authentication
		class OAuth2ProtectedEndpoint extends SessionProtectedEndpoint {
			override authentication = oauth2Scheme;
		}

		return [...endpoints, OAuth2ProtectedEndpoint];
	}
}
