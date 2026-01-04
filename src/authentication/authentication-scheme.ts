import { RequestHandler } from 'express';
import {
	SecuritySchemeObject,
	SecurityRequirementObject,
} from 'auto-oas/oas/v3.1';
import {
	ApiNextFunction,
	ApiRequest,
	ApiResponse,
	BaseApiRouter,
} from '../router';
import { SessionDriver } from '../session/session-driver';
import { AuthenticatedRequest } from './authenticated-request';
import { AuthFlow } from './auth-flow';
import { ApiRoute } from '../router/base';

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

	/**
	 * Get the Express middleware for this authentication scheme
	 * For InlineAuthenticationScheme: runs endpoint
	 * For SessionAuthenticationScheme: verifies session
	 *
	 * @returns Express RequestHandler middleware
	 */
	public abstract getMiddleware(): RequestHandler;
}

export abstract class InlineAuthenticationScheme extends AuthenticationScheme {
	public abstract getCredentials(request: ApiRequest): unknown;
	public abstract authenticate(options: {
		credentials: unknown;
		request: ApiRequest;
	}): Promise<void>;

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
			const credentials = this.getCredentials(request);
			await this.authenticate({ credentials, request });

			request.authenticated = true;

			return next();
		};
	}
}

export abstract class SessionAuthenticationScheme extends AuthenticationScheme {
	protected sessionDriver: SessionDriver;

	public constructor(options: { sessionDriver: SessionDriver }) {
		super();
		this.sessionDriver = options.sessionDriver;
	}

	/**
	 * Get the authentication flow for this scheme
	 * An AuthFlow is a named collection of steps
	 * (e.g., { challenge, authorization, tokenExchange })
	 *
	 * @returns AuthFlow defining all steps in the authentication process
	 */
	public abstract getAuthFlow(): AuthFlow;

	/**
	 * Get all endpoints defined in the AuthFlow
	 *
	 * @returns ApiRoute array of all auth step endpoints
	 */
	public getEndpoints(): Array<ApiRoute> {
		const flow = this.getAuthFlow();
		return Object.values(flow);
	}

	/**
	 * Generate a router that exposes all auth steps as API endpoints
	 * Each step in the AuthFlow becomes a route in the router
	 *
	 * @param basePath - Optional base path for the router (default: empty)
	 * @returns Router with all auth steps as endpoints
	 */
	public getAuthRouter(basePath = ''): BaseApiRouter {
		const endpoints = this.getEndpoints();

		return new (class extends BaseApiRouter {
			override path = basePath;

			async routes() {
				return endpoints;
			}
		})();
	}

	public getMiddleware(): RequestHandler {
		return async (
			request: AuthenticatedRequest,
			response: ApiResponse,
			next: ApiNextFunction
		) => {
			await this.sessionDriver.checkSession({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				sessionId: (request as any).sessionId,
			});

			request.authenticated = true;
			return next();
		};
	}
}
