import { Router as ExpressRouter, RequestHandler } from 'express';

export abstract class BaseApiRoute {
	public path: string;

	/**
	 * Optional array of Express middleware to apply
	 */
	public middleware: RequestHandler[] = [];

	public abstract register(parentRouter: ExpressRouter): Promise<void>;
}

export type ApiRoute = { new (): BaseApiRoute };
