import { AppConfig, configure } from 'ts-appconfig';

export class TestEnv extends AppConfig {
	readonly API_PORT: number = 4000;
	readonly API_URL: string = 'http://localhost:${API_PORT}';
}

export const env: TestEnv = configure(TestEnv);
