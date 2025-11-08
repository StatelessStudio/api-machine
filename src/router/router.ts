import { Router as ExpressRouter } from 'express';
import { ApiRoute, BaseApiRoute } from './base';

export abstract class BaseApiRouter extends BaseApiRoute {
	protected router: ExpressRouter;

	public abstract routes(): Promise<ApiRoute[]>;

	public async register(parent: ExpressRouter): Promise<void> {
		this.router = ExpressRouter();
		parent.use(this.path, this.router);

		for (const route of await this.routes()) {
			await new route().register(this.router);
		}
	}
}

export type ApiRouter = { new (): BaseApiRouter };
