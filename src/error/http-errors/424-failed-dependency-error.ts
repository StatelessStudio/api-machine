import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 424 Failed Dependency
 * The request failed due to failure of a previous request
 */
export class FailedDependencyError extends HTTPError {
	constructor(message = 'Failed Dependency', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 424;
	}
}
