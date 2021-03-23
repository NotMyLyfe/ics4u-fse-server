import * as express from 'express';

import indexRouter from './routes/index';

const app = express();

app.use(express.json());
app.use('/', indexRouter);

export default app;