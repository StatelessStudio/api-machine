import express from 'express';
import cors from 'cors';
import http from 'http';

import { defaultRestServerOptions, RestServerOptions } from './server-options';
import { ApiRouter } from '../router';

import { LogInterface } from '../log';

export abstract class RestServer {
	public readonly port: number;
	public readonly maxPayloadSizeMB: number;
	public readonly maxUrlEncodedSizeMB: number;

	protected app: express.Express;
	protected listener: http.Server;
	protected log: LogInterface;

	constructor(options: Partial<RestServerOptions>) {
		options = { ...defaultRestServerOptions, ...options };

		this.port = options.port!;
		this.maxPayloadSizeMB = options.maxPayloadSizeMB!;
		this.maxUrlEncodedSizeMB = options.maxUrlEncodedSizeMB!;
		this.log = options.log!;
	}

	public async start() {
		await this.setupExpress();
		await this.registerRoutes();
		await this.setup404Handler();
		await this.setupErrorHandler();
		await this.startListening();
	}

	public async stop(): Promise<void> {
		if (this.listener) {
			this.listener.close();
		}
	}

	protected async registerRoutes(): Promise<void> {
		const routes = await this.routes();

		await Promise.all(
			routes.map(async (route) => new route().register(this.app))
		);
	}

	protected abstract routes(): Promise<ApiRouter[]>;

	protected async setupExpress(): Promise<void> {
		this.app = express();
		await this.setupExpressCors();
		await this.setupExpressJson();
		await this.setupExpressUrlEncoded();
	}

	protected async setupExpressCors(): Promise<void> {
		this.app.use(cors());
	}

	protected async setupExpressJson(): Promise<void> {
		this.app.use(express.json({ limit: `${this.maxPayloadSizeMB}mb` }));
	}

	protected async setupExpressUrlEncoded(): Promise<void> {
		this.app.use(
			express.urlencoded({
				extended: true,
				limit: `${this.maxUrlEncodedSizeMB}mb`,
			})
		);
	}

	protected async setup404Handler(): Promise<void> {
		this.app.use((request: express.Request, response: express.Response) => {
			response.status(404).json({
				error: 'Endpoint not found',
				code: 'NOT_FOUND',
				timestamp: new Date().toISOString(),
			});
		});
	}

	protected async setupErrorHandler(): Promise<void> {
		this.app.use(
			(
				error: string | Error,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				request: express.Request,
				response: express.Response,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				next: express.NextFunction
			) => {
				this.log?.error('Unhandled error:', error);

				response.status(500).json({
					error: 'Internal server error',
					code: 'INTERNAL_ERROR',
					timestamp: new Date().toISOString(),
				});
			}
		);
	}

	protected async startListening(): Promise<void> {
		await new Promise<void>((accept, reject) => {
			this.listener = this.app.listen(this.port, (error?: Error) => {
				if (error) {
					reject(error);
					return;
				}

				accept();
			});
		});
	}
}
