import express, { Request, Response } from 'express';
import twitchRoutes from './routes/twitch';
import { Token } from './models/twitch';


const app = express();
const port = process.env.PORT || 5000;
const clientID = process.env.CLIENT_ID || null;
const clientSecret = process.env.CLIENT_SECRET || null;

function authTwitch() {
    let clientID = process.env.CLIENT_ID || "";
    let clientSecret = process.env.CLIENT_SECRET || "";

    const headers = new Headers();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const data = new URLSearchParams({
        client_id: clientID,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
    }).toString();
}
interface Fact {
  fact: string;
  length: number;
}

async function getAPICall(): Promise<Fact> {
  return await fetch('https://catfact.ninja/fact')
    .then(res => res.json())
    .then(res => {
      console.log(res.fact)
      return res as Fact
    })
}

if (null === clientID) {
  console.error("No client ID was passed as env variable");
}

if (null === clientSecret) {
  console.warn("No client secret was passed as env variable")
}

app.use(express.json());
app.use('/twitch', twitchRoutes);

app.get('/status', (req: Request, res: Response) => {
  res.status(200).json({
      "status":"running"
  })
});

app.get('/fact', (req: Request, res: Response) => {
  res.send(getAPICall().then(fact => {
    return fact
  }));
});


app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});