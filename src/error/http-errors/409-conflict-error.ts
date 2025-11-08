import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 409 Conflict
 * The request conflicts with the current state of the server
 */
export class ConflictError extends HTTPError {
	constructor(message = 'Conflict', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 409;
	}
}
