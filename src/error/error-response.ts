import { HttpErrorOptions } from './error-options';

export interface ErrorResponse {
	error: string;
	message: string;
	timestamp: string;
	options: HttpErrorOptions;
}
