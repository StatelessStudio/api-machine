import { Router as ExpressRouter, RequestHandler } from 'express';

export abstract class BaseApiRoute {
	public path: string;
	public fullPath: string;

	/**
	 * Optional array of Express middleware to apply
	 */
	public middleware: RequestHandler[] = [];

	public abstract register(
		parentRouter: ExpressRouter,
		parentPath: string
	): Promise<void>;

	public registerRoutePath(parentPath: string): void {
		if (!this.path) {
			this.path = '';
		}
		else if (!this.path.startsWith('/')) {
			this.path = '/' + this.path;
		}

		if (parentPath.endsWith('/')) {
			parentPath = parentPath.slice(0, -1);
		}

		this.fullPath = parentPath + this.path;
	}
}

export type ApiRoute = { new (): BaseApiRoute };
