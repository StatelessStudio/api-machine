import { RestServer } from '../../src/index';
import { MyRouter } from './router';

/**
 * Quick Start Example - Server
 *
 * This is the main server class that defines which routers to use.
 */
export class MyApiServer extends RestServer {
	override router = MyRouter;
}
