# Toy Store App

Full-stack toy store with an Express/Prisma API, Expo customer app, and Vite admin dashboard.

## Backend

1. Copy `backend/.env.example` to `backend/.env` and set production values.
2. Create a PostgreSQL database.
3. Run `cd backend && npm install && npm run db:migrate && npm run seed && npm start`.

Required environment variables: `DATABASE_URL`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Set `CORS_ORIGINS` to comma-separated dashboard origins.

The health check is `GET /api/health`.

## Admin dashboard

Run `cd admin-dashboard && npm install && npm run dev`. Use `npm run build` for a deployable `dist/` directory. Set `VITE_API_URL` if the API is not served from the same origin; the dashboard currently expects `http://localhost:5000/api` during local development.

## Mobile app

Run `cd mobile-app && npm install && npx expo start`. Set the API host in `src/api/client.js` for a physical device or configure `EXPO_PUBLIC_API_URL` and update the client to consume it.
