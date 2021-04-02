// expressRouting.ts
// Gordon Lin
// Express.js (Web framework) application for routing connections

// Importing express module
import * as express from 'express';

// Importing router for Express
import indexRouter from './routes/index';

// Intialize Express server
const app = express();

// Use JSON middleware for Express
app.use(express.json());
// Route '/' to indexRouter
app.use('/', indexRouter);

// Export Express server
export default app;
