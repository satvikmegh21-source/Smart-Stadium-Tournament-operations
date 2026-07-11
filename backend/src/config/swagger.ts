const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Stadium & Tournament Operations API',
    version: '1.0.0',
    description: 'Enterprise-grade REST API endpoint configurations for sports leagues, ticketing gates, emergency dispatches, and stadium systems.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register user credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string', example: 'SPECTATOR' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Registration complete. Verification OTP sent.' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Authenticate credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'JWT Access and Refresh tokens successfully signed.' }
        }
      }
    },
    '/api/tournaments': {
      post: {
        summary: 'Create tournament bracket fixtures',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  format: { type: 'string', example: 'ROUND_ROBIN' },
                  teamIds: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Berger scheduling matchups mapped successfully.' }
        }
      }
    },
    '/api/payments/create-checkout-session': {
      post: {
        summary: 'Initialize Stripe checkouts',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  matchId: { type: 'string' },
                  seatZone: { type: 'string' },
                  seatNumber: { type: 'string' },
                  price: { type: 'number' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Gateway checkout URL returned.' }
        }
      }
    },
    '/api/notifications/stream': {
      get: {
        summary: 'SSE notifications channel',
        responses: {
          200: { description: 'Server-Sent Events active listener connection established.' }
        }
      }
    }
  }
};

export default swaggerSpec;
