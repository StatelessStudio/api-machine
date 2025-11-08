import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 413 Payload Too Large
 * The request entity is larger than limits defined by server
 */
export class PayloadTooLargeError extends HTTPError {
	constructor(message = 'Payload Too Large', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 413;
	}
}
