import express from 'express';
import next from 'next';
import path from 'path';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = parseInt(process.env.PORT || '3000', 10);

app
  .prepare()
  .then(() => {
    const server = express();

    // Example API route via Express
    server.get('/api/hello', (_req, res) => {
      res.json({ message: 'Hello from Express API' });
    });

    // Serve static files from /public if needed
    server.use('/public', express.static(path.join(process.cwd(), 'public')));

    // Let Next.js handle all other routes
    server.all('*', (req, res) => handle(req, res));

    server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`> Ready on http://localhost:${port} (dev=${dev})`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
