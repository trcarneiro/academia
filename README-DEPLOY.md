# Deployment Guide

## Environment Variables

When deploying to a production environment (e.g., Render, Railway, DigitalOcean), ensure the following environment variables are set:

### Required
- `DATABASE_URL`: Connection string for your PostgreSQL database.
- `JWT_SECRET`: A strong secret key for signing JWT tokens.
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.

### Server Configuration
- `PORT`: The port the server should listen on (usually provided by the hosting platform).
- `HOST`: Set to `0.0.0.0` to listen on all interfaces (default).
- `NODE_ENV`: Set to `production`.

### CORS
- `CORS_ORIGIN`: The URL of your deployed application (e.g., `https://my-app.onrender.com`).
  - If the frontend and backend are on the same domain, you can set this to the domain itself.
  - **Important**: If this is not set correctly, the frontend might fail to communicate with the backend if they are treated as different origins, or if strict CORS policies are enforced.

### AI Services (Optional but recommended)
- `GEMINI_API_KEY`: For AI features.
- `OPENAI_API_KEY`: Fallback AI provider.
- `CLAUDE_API_KEY`: Primary AI provider.

## Frontend

The frontend is built with Vanilla JS and served statically from the `public` directory by the Fastify backend.
No build step is required for the frontend code itself.

### Authentication
The authentication module (`public/js/modules/auth/index.js`) automatically detects the backend URL using `window.location.origin`.
Ensure your hosting platform supports HTTPS, as Supabase Auth requires it for secure cookies and redirects.

## Build & Start

1. **Build**: `npm run build` (Compiles TypeScript to JavaScript in `dist/`)
2. **Start**: `npm start` (Runs `node dist/server.js`)

## Troubleshooting

- **CORS Errors**: Check `CORS_ORIGIN` matches your browser's URL.
- **Auth Errors**: Check Supabase keys and ensure the redirect URL in Supabase dashboard matches your deployed URL.
