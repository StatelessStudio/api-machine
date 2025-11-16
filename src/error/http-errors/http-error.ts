import { HttpErrorOptions } from '../error-options';

/**
 * Base HTTP Error class
 * All HTTP errors extend from this class
 */
export abstract class HTTPError extends Error {
	public isApiMachineError = true;
	public readonly options: HttpErrorOptions = {};
	public readonly timestamp = new Date().toISOString();

	public get headers(): Record<string, string> {
		return this.options.headers || {};
	}

	public get details(): unknown {
		return this.options.details;
	}

	constructor(message: string, options: HttpErrorOptions = {}) {
		super(message);
		this.name = this.constructor.name;
		this.options = options;

		// Maintains proper stack trace for where our error was thrown
		Error.captureStackTrace(this, this.constructor);
	}

	/**
	 * Abstract method to get the status code for this error
	 * Must be implemented by subclasses
	 */
	public abstract getStatusCode(): number;

	/**
	 * Converts the error to a JSON-serializable object
	 */
	public getResponseJson() {
		return {
			error: this.name,
			message: this.message,
			timestamp: this.timestamp,
			options: this.options,
		};
	}
}
