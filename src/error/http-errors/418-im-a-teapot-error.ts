import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 418 I'm a teapot
 * The server refuses to brew coffee because it is a teapot (RFC 2324)
 */
export class ImATeapotError extends HTTPError {
	constructor(message = 'I\'m a teapot', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 418;
	}
}
