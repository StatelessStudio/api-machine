import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 414 URI Too Long
 * The URI provided was too long for the server to process
 */
export class URITooLongError extends HTTPError {
	constructor(message = 'URI Too Long', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 414;
	}
}
