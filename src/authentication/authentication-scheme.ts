import { RequestHandler } from 'express';
import {
	SecuritySchemeObject,
	SecurityRequirementObject,
} from 'auto-oas/oas/v3.1';

/**
 * Abstract base class for authentication schemes
 * Extend this class to create custom authentication schemes that integrate
 * with both Express middleware and OpenAPI specification generation
 */
export abstract class AuthenticationScheme {
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

	/**
	 * Generate the Express middleware that enforces this authentication
	 * The middleware should validate the authentication and throw appropriate
	 * HTTPError instances if authentication fails
	 * @returns Express RequestHandler middleware
	 */
	public abstract getMiddleware(): RequestHandler;
}
