/* eslint-disable @typescript-eslint/no-explicit-any */
export interface LogInterface {
	fatal: (...args: any[]) => void;
	error: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	info: (...args: any[]) => void;
	debug: (...args: any[]) => void;
}
