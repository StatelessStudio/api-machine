import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 410 Gone
 * The requested resource is no longer available and will not be available again
 */
export class GoneError extends HTTPError {
	constructor(message = 'Gone', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 410;
	}
}
