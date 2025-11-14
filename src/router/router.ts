import { Router as ExpressRouter } from 'express';
import { ApiRoute, BaseApiRoute } from './base';
import { BaseApiEndpoint, EndpointMethod } from './endpoint';

export abstract class BaseApiRouter extends BaseApiRoute {
	protected router: ExpressRouter;

	public registeredRoutes: BaseApiRoute[] = [];
	protected abstract routes(): Promise<ApiRoute[]>;

	public async register(
		parent: ExpressRouter,
		parentPath: string
	): Promise<void> {
		this.router = ExpressRouter();
		this.registerRoutePath(parentPath);

		// Register router-level middleware if any
		if (this.middleware && this.middleware.length > 0) {
			parent.use(this.path, ...this.middleware, this.router);
		}
		else {
			parent.use(this.path, this.router);
		}

		const routes = await this.routes();

		// Track which paths have which methods
		const pathMethods = new Map<string, Set<EndpointMethod>>();

		// First pass: register all endpoints and track their methods
		for (const route of routes) {
			const instance = new route();
			await instance.register(this.router, this.fullPath);

			// Track endpoint methods for 405 handling
			if (instance instanceof BaseApiEndpoint) {
				const path = instance.path;
				if (!pathMethods.has(path)) {
					pathMethods.set(path, new Set());
				}
				pathMethods.get(path)!.add(instance.method);
			}
		}

		// Second pass: add 405 handlers for unsupported methods
		const allMethods = Object.values(EndpointMethod);
		pathMethods.forEach((supportedMethods, path) => {
			allMethods.forEach((method) => {
				if (!supportedMethods.has(method)) {
					this.router[method](path, (req, res) => {
						res.status(405).send({
							error: 'Method Not Allowed',
							message: `Method ${req.method} not allowed`,
						});
					});
				}
			});
		});
	}
}

export type ApiRouter = { new (): BaseApiRouter };
