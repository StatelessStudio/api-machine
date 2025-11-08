import { Router as ExpressRouter } from 'express';

export abstract class BaseApiRoute {
	public path: string;

	public abstract register(parentRouter: ExpressRouter): Promise<void>;
}

export type ApiRoute = { new (): BaseApiRoute };
