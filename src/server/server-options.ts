import { LogInterface } from '../log';

export interface RestServerOptions {
	port: number;
	maxPayloadSizeMB: number;
	maxUrlEncodedSizeMB: number;
	log: LogInterface;
}

export const defaultRestServerOptions: RestServerOptions = {
	port: 5000,
	maxPayloadSizeMB: 10,
	maxUrlEncodedSizeMB: 1,
	log: {
		...console,
		// eslint-disable-next-line no-console
		fatal: console.error,
		// eslint-disable-next-line no-console
		info: console.log,
	},
};
