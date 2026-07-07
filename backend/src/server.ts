import app from './index';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'production'} mode`);
});
