import 'fastify';

declare module 'fastify' {
  interface FastifySchema {
    description?: string;
    summary?: string;
    tags?: string[];
    consumes?: string[];
    produces?: string[];
    security?: Array<{ [key: string]: string[] }>;
    deprecated?: boolean;
    hide?: boolean;
    externalDocs?: {
      description?: string;
      url: string;
    };
  }
}
