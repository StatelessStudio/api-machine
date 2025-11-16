import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

export interface ProxyAuthenticationRequiredErrorOptions
	extends HttpErrorOptions {
	realm?: string;
}

/**
 * 407 Proxy Authentication Required
 * Authentication is required by a proxy server
 */
export class ProxyAuthenticationRequiredError extends HTTPError {
	constructor(
		message = 'Proxy Authentication Required',
		options: ProxyAuthenticationRequiredErrorOptions = {}
	) {
		const realm = options.realm || 'Proxy';
		const headers = {
			'Proxy-Authenticate': `Basic realm="${realm}"`,
			...options.headers,
		};
		super(message, { ...options, headers });
	}

	public override getStatusCode(): number {
		return 407;
	}
}
