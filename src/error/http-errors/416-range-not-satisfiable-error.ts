import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

export interface RangeNotSatisfiableErrorOptions extends HttpErrorOptions {
	contentRange?: string;
}

/**
 * 416 Range Not Satisfiable
 * The range specified by the Range header field cannot be fulfilled
 */
export class RangeNotSatisfiableError extends HTTPError {
	constructor(
		message = 'Range Not Satisfiable',
		options: RangeNotSatisfiableErrorOptions = {}
	) {
		const headers: Record<string, string> = {};

		if (options.contentRange) {
			headers['Content-Range'] = options.contentRange;
		}

		super(message, {
			...options,
			headers: { ...headers, ...options.headers },
		});
	}

	public override getStatusCode(): number {
		return 416;
	}
}
