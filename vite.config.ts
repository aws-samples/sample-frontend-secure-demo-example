import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 5173 matches the callback URL configured on the Cognito app client in the CDK stack.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
