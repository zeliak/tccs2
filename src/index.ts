import express, { Request, Response } from 'express';
import twitchRoutes from './routes/twitch';


const app = express();
const port = process.env.PORT || 5000;
const clientID = process.env.CLIENT_ID || null;
const clientSecret = process.env.CLIENT_SECRET || null;

var statusCode: number = 200;
var statusMessage: string = "All system is green";

if (null === clientID) {
  statusCode = 500
  statusMessage = "No client ID was passed as env variable"
  console.error(statusMessage);
}

if (null === clientSecret) {
  statusCode = 500
  statusMessage = "No client secret was passed as env variable"
  console.warn(statusMessage)
}

app.use(express.json());
app.use('/twitch', twitchRoutes);

app.get('/status', (req: Request, res: Response) => {
  res.status(statusCode).json({
      "status":statusMessage
  })
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});