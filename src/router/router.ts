import { Router as ExpressRouter } from 'express';
import { ApiRoute, BaseApiRoute } from './base';
import { BaseApiEndpoint, EndpointMethod } from './endpoint';

export abstract class BaseApiRouter extends BaseApiRoute {
	override routeType = 'router' as const;
	protected router: ExpressRouter;

	public registeredRoutes: BaseApiRoute[] = [];
	protected abstract routes(): Promise<ApiRoute[]>;
	protected routeInstances: { [key: string]: BaseApiRoute } = {};

	public getTag(): string {
		return this.name || this.constructor.name.replace(/Router$/, '');
	}

	public async register(
		parent: ExpressRouter,
		parentPath: string
	): Promise<void> {
		this.router = ExpressRouter();
		this.registerRoutePath(parentPath);

		// Collect non-authentication middleware
		// Authentication is handled at the endpoint level to allow overrides
		const middlewareWithoutAuth = [...this.middleware];

		// Register router with non-auth middleware if any
		if (middlewareWithoutAuth.length > 0) {
			parent.use(this.path, ...middlewareWithoutAuth, this.router);
		}
		else {
			parent.use(this.path, this.router);
		}

		const routes = await this.routes();

		// Track which paths have which methods
		const pathMethods = new Map<string, Set<EndpointMethod>>();
		const tag = this.getTag();

		// First pass: register all endpoints and track their methods
		for (const route of routes) {
			const instance = new route();

			// Set parent relationship for authentication cascading
			instance.parentRoute = this;

			if (instance.routeType === 'endpoint') {
				(instance as BaseApiEndpoint).tag = tag;
			}

			await this.registerInstance(instance);

			this.registeredRoutes.push(instance);

			// Track endpoint methods for 405 handling
			if (instance.routeType === 'endpoint') {
				const path = instance.path;

				if (!pathMethods.has(path)) {
					pathMethods.set(path, new Set());
				}

				pathMethods
					.get(path)!
					.add((instance as BaseApiEndpoint).method);
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

	protected async registerInstance(instance: BaseApiRoute): Promise<void> {
		await instance.register(this.router, this.fullPath);
	}
}

export type ApiRouter = { new (): BaseApiRouter };
