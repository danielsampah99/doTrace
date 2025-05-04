import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import cors from '@elysiajs/cors';
import { userRouter } from './routes/users';
import { envVars } from '../config/environment';
import { twilioRouter } from './routes/whatsapp';
import { businessRouter } from './routes/business';
import { geofenceRouter } from './routes/geofence';
import { recommendationRouter } from './routes/recommendation';

const app = new Elysia({ prefix: '/api/v1' })
	.use(swagger())
	.use(cors())
	.use(twilioRouter)
	.use(businessRouter)
	.use(userRouter)
	.use(geofenceRouter)
	.use(recommendationRouter)
	.get('/', () => 'Welcome to the doTrace API')
	.get('/health', () => ({ status: 'OK' }))
	.listen(envVars.PORT, (server) =>
		console.log(
			`Server is running at ${server.hostname}:${server.port} with url "${server.url}"`,
		),
	);

export type App = typeof app;
