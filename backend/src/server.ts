import app from './index';
import { pino } from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'production'} mode`);
});
