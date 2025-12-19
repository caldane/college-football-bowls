import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRouter from './routers/api.router.js';

const app = express();
const PORT =  process.env.PORT || 5050;

app.use(cors());

app.use('/api', apiRouter);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

