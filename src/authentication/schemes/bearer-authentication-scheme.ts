import { RequestHandler } from 'express';
import { AuthenticationScheme } from '../authentication-scheme';
import { SecuritySchemeObject } from 'auto-oas/oas/v3.1';
import {
	bearerAuthenticationMiddleware,
	BearerAuthenticationMiddlewareOptions,
} from '../middleware/bearer-authentication';

export interface BearerAuthenticationSchemeOptions
	extends BearerAuthenticationMiddlewareOptions {
	/**
	 * The name of the security scheme in OpenAPI
	 * @default 'BearerAuth'
	 */
	schemeName?: string;

	/**
	 * Format of the bearer token (e.g., 'JWT')
	 * This is informational and appears in the OpenAPI spec
	 * @default 'JWT'
	 */
	bearerFormat?: string;

	/**
	 * Description of the authentication scheme
	 * Appears in the OpenAPI documentation
	 */
	description?: string;
}

/**
 * Bearer token authentication scheme
 * Validates the Authorization header with Bearer token
 * Automatically generates OpenAPI security scheme documentation
 */
export class BearerAuthenticationScheme extends AuthenticationScheme {
	public readonly type = 'http' as const;
	public readonly schemeName: string;

	private readonly bearerFormat: string;
	private readonly description?: string;
	private readonly middlewareOptions: BearerAuthenticationMiddlewareOptions;

	constructor(options: BearerAuthenticationSchemeOptions) {
		super();
		this.schemeName = options.schemeName || 'BearerAuth';
		this.bearerFormat = options.bearerFormat || 'JWT';
		this.description = options.description;
		this.middlewareOptions = {
			checkToken: options.checkToken,
			log: options.log,
		};
	}

	public getSecurityScheme(): SecuritySchemeObject {
		const scheme: SecuritySchemeObject = {
			type: 'http',
			scheme: 'bearer',
			bearerFormat: this.bearerFormat,
		};

		if (this.description) {
			scheme.description = this.description;
		}

		return scheme;
	}

	public getMiddleware(): RequestHandler {
		return bearerAuthenticationMiddleware(this.middlewareOptions);
	}
}
