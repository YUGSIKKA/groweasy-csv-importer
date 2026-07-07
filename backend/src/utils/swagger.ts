import { Express } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { logger } from './logger';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GrowEasy AI CSV Importer API Documentation',
      version: '1.0.0',
      description: 'API endpoint descriptions for the AI-Powered Universal CRM CSV Importer'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js', './src/index.ts', './dist/index.js']
};

const swaggerSpec = swaggerJSDoc(options);

/**
 * Attaches the Swagger UI documentation panel to the Express app.
 * Accessible at GET /docs
 */
export function setupSwagger(app: Express): void {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('Swagger API docs setup successfully at GET /docs');
}
