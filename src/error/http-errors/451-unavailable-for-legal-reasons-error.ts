import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 451 Unavailable For Legal Reasons
 * The user requested a resource that is not available due to legal reasons
 */
export class UnavailableForLegalReasonsError extends HTTPError {
	constructor(
		message = 'Unavailable For Legal Reasons',
		options: HttpErrorOptions = {}
	) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 451;
	}
}
