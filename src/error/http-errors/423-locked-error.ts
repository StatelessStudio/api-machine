import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 423 Locked
 * The resource being accessed is locked
 */
export class LockedError extends HTTPError {
	constructor(message = 'Locked', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 423;
	}
}
