import {
	AuthenticationSchemeOptions,
	InlineAuthenticationScheme,
} from '../authentication-scheme';
import { SecuritySchemeObject } from 'auto-oas/oas/v3.1';
import { UnauthorizedError } from '../../error';
import { BearerTokenValSan } from 'valsan/primitives';
import { LogInterface } from '../../log';
import { ApiRequest } from '../../router';

export type CheckTokenFunction = (token: string) => Promise<boolean>;

// eslint-disable-next-line max-len
export interface BearerAuthenticationSchemeOptions extends AuthenticationSchemeOptions {
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

	/**
	 * Function to validate the bearer token
	 * Should return true if the token is valid, false otherwise
	 */
	checkToken: CheckTokenFunction;

	/**
	 * Optional logger for security events
	 */
	log?: LogInterface;
}

/**
 * Bearer token authentication scheme
 * Validates the Authorization header with Bearer token
 * Automatically generates OpenAPI security scheme documentation
 */
export class BearerAuthenticationScheme extends InlineAuthenticationScheme {
	public readonly schemeName: string;

	protected readonly bearerFormat: string;
	protected readonly description?: string;
	protected readonly checkToken: CheckTokenFunction;
	protected readonly log?: LogInterface;

	constructor(options: BearerAuthenticationSchemeOptions) {
		super(options);
		this.schemeName = options.schemeName || 'BearerAuth';
		this.bearerFormat = options.bearerFormat || 'JWT';
		this.description = options.description;
		this.checkToken = options.checkToken;
		this.log = options.log;
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

	public override getCredentials(request: ApiRequest): unknown {
		const authHeader =
			request.headers['authorization'] ||
			request.headers['Authorization'];

		if (!authHeader) {
			const msg =
				'Unauthorized access attempt from ' +
				request.ip +
				' - No token provided';
			this.log?.warn(msg);

			throw new UnauthorizedError('Authorization header is missing', {
				scheme: 'Bearer',
			});
		}

		return authHeader;
	}

	public override async authenticate(options: {
		credentials: string;
		request: ApiRequest;
	}): Promise<void> {
		const { credentials, request } = options;

		if (!credentials) {
			throw new UnauthorizedError('Authorization header is missing', {
				scheme: 'Bearer',
			});
		}

		const validationResult = await new BearerTokenValSan().run(credentials);

		if (!validationResult.success || !validationResult.data) {
			const msg =
				'Unauthorized access attempt from ' +
				request.ip +
				' - Invalid token format';
			const details = JSON.stringify(validationResult.errors, null, 2);
			this.log?.warn(msg, details);

			throw new UnauthorizedError('Bearer token is empty or invalid', {
				scheme: 'Bearer',
				details: validationResult.errors,
			});
		}

		if (!(await this.checkToken(validationResult.data))) {
			// eslint-disable-next-line max-len
			const msg =
				'Unauthorized access attempt from ' +
				request.ip +
				' - Check token failed';
			this.log?.warn(msg);

			throw new UnauthorizedError('Bearer token check failed', {
				scheme: 'Bearer',
			});
		}
	}
}
