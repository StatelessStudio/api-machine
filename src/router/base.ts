import { Router as ExpressRouter, RequestHandler } from 'express';

export abstract class BaseApiRoute {
	public path: string;

	/**
	 * Optional array of Express middleware to apply
	 */
	public middleware: RequestHandler[] = [];

	public abstract register(parentRouter: ExpressRouter): Promise<void>;

	public registerRoutePath(): void {
		if (!this.path) {
			this.path = '/';
		}
		else if (!this.path.startsWith('/')) {
			this.path = '/' + this.path;
		}
	}
}

export type ApiRoute = { new (): BaseApiRoute };
