import { RequestHandler } from 'express';
import {
	SecuritySchemeObject,
	SecurityRequirementObject,
} from 'auto-oas/oas/v3.1';
import { ApiNextFunction, ApiRequest, ApiResponse } from '../router';
import { SessionDriver } from '../session/session-driver';
import { Session } from '../session/session';
import { AuthenticatedRequest } from './authenticated-request';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthenticationSchemeOptions {}

/**
 * Abstract base class for authentication schemes
 * Extend this class to create custom authentication schemes that integrate
 * with both Express middleware and OpenAPI specification generation
 */
export abstract class AuthenticationScheme {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public constructor(options: AuthenticationSchemeOptions = {}) {}

	/**
	 * Unique name for this authentication scheme
	 * This will be used as the key in OpenAPI securitySchemes
	 */
	public abstract readonly schemeName: string;

	/**
	 * The type of security scheme as defined by OpenAPI
	 */
	public abstract readonly type:
		| 'http'
		| 'apiKey'
		| 'oauth2'
		| 'openIdConnect';

	/**
	 * Generate the OpenAPI security scheme object
	 * This will be added to components.securitySchemes in the OpenAPI spec
	 * @returns SecuritySchemeObject compliant with OpenAPI 3.1
	 */
	public abstract getSecurityScheme(): SecuritySchemeObject;

	/**
	 * Generate the OpenAPI security requirement
	 * This defines which security scheme is required for an operation
	 * Can be overridden for schemes that require specific scopes (OAuth2)
	 * @returns SecurityRequirementObject compliant with OpenAPI 3.1
	 */
	public getSecurityRequirement(): SecurityRequirementObject {
		return { [this.schemeName]: [] };
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public abstract authenticate(request: any): Promise<void>;
	public abstract getMiddleware(): RequestHandler;
}

export abstract class InlineAuthenticationScheme extends AuthenticationScheme {
	/**
	 * Generate the Express middleware that enforces this authentication
	 * The middleware should validate the authentication and throw appropriate
	 * HTTPError instances if authentication fails
	 * @returns Express RequestHandler middleware
	 */
	public getMiddleware(): RequestHandler {
		return async (
			request: AuthenticatedRequest,
			response: ApiResponse,
			next: ApiNextFunction
		) => {
			await this.authenticate(request);
			request.authenticated = true;

			return next();
		};
	}
}

export abstract class SessionAuthenticationScheme extends AuthenticationScheme {
	protected sessionDriver: SessionDriver;

	public async getSession(request: ApiRequest): Promise<Session> {
		await this.authenticate(request);
		return this.sessionDriver.getSession({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			sessionId: (request as any).sessionId,
		});
	}

	public getMiddleware(): RequestHandler {
		return async (
			request: ApiRequest,
			response: ApiResponse,
			next: ApiNextFunction
		) => {
			await this.sessionDriver.checkSession({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				sessionId: (request as any).sessionId,
			});

			return next();
		};
	}
}
