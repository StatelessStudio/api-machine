import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 403 Forbidden
 * The client does not have access rights to the content
 */
export class ForbiddenError extends HTTPError {
	constructor(message = 'Forbidden', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 403;
	}
}
