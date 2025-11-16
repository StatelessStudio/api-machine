import { UnauthorizedError } from '../../../src';
import {
	BaseApiEndpoint,
	EndpointMethod,
	ApiRequest,
	ApiResponse,
} from '../../../src/router/endpoint';
import { BaseApiRouter } from '../../../src/router/router';
import { RequestHandler } from 'express';

export const callOrder: { [key: string]: string[] } = {};

function getTestId(req: ApiRequest): string {
	return (req.headers['test_id' as const] as string) || 'unknown';
}

function pushCallOrder(req: ApiRequest, label: string) {
	const testId = getTestId(req);

	if (!callOrder[testId]) {
		callOrder[testId] = [];
	}

	callOrder[testId].push(label);
}

const routerMiddleware: RequestHandler = (req, res, next) => {
	pushCallOrder(req, 'router-mw');
	next();
};

const endpointMiddleware: RequestHandler = (req, res, next) => {
	pushCallOrder(req, 'endpoint-mw');
	next();
};

export class MiddlewareEndpoint1 extends BaseApiEndpoint {
	override path = '/router';
	override method = EndpointMethod.GET;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async handle(req: ApiRequest, res: ApiResponse) {
		pushCallOrder(req, 'endpoint');
		return { ok: true };
	}
}

export class MiddlewareEndpoint2 extends BaseApiEndpoint {
	override path = '/endpoint';
	override method = EndpointMethod.GET;
	override middleware = [endpointMiddleware];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async handle(_req: ApiRequest, _res: ApiResponse) {
		pushCallOrder(_req, 'endpoint');
		return { ok: true };
	}
}

export class MiddlewareEndpoint3 extends BaseApiEndpoint {
	override path = '/both';
	override method = EndpointMethod.GET;
	override middleware = [endpointMiddleware];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async handle(_req: ApiRequest, _res: ApiResponse) {
		pushCallOrder(_req, 'endpoint');
		return { ok: true };
	}
}

// Auth middleware for testing
export const authMiddleware: RequestHandler = (req, res, next) => {
	if (req.headers['authorization'] === 'Bearer validtoken') {
		pushCallOrder(req, 'auth-mw');
		next();
	}
	else {
		pushCallOrder(req, 'auth-mw');
		throw new UnauthorizedError('Invalid token');
	}
};

export class AuthEndpoint extends BaseApiEndpoint {
	override path = '/auth';
	override method = EndpointMethod.GET;
	override middleware = [authMiddleware];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async handle(req: ApiRequest, res: ApiResponse) {
		pushCallOrder(req, 'auth-handle');
		return { ok: true };
	}
}

export class MiddlewareRouter extends BaseApiRouter {
	override path = '/middleware-test';
	override middleware = [routerMiddleware];

	async routes() {
		return [
			MiddlewareEndpoint1,
			MiddlewareEndpoint2,
			MiddlewareEndpoint3,
			AuthEndpoint,
		];
	}
}
