import { Router, Request, Response } from "express";
import { TwitchUser, TwitchAPI } from "../models/twitch";

const router = Router();
const clientID = process.env.CLIENT_ID || "NA";
const clientSecret = process.env.CLIENT_SECRET || "NA";
const tApi = new TwitchAPI(clientID, clientSecret)

router.post('/', (req: Request, res: Response) => {
    let userName = req.query.userName || null;
    console.log('Username is: ' + userName)


    if (!!userName) {
        res.status(201).json({
            "userName":userName,
            "id":1234
        });
    }
    else {
        res.status(400).json({
            "err":"Request does not contain a username"
        });
    }
});

router.get('/', (req: Request, res: Response) => {
    res.json({
        "AppName":"TCCS2"
    });
});

router.get('/userpfp', (req: Request, res: Response) => {
    let header = new Headers()
    header.append('Access-Control-Allow-Origin', 'http://localhost:3000');

    const paramName = 'username';
    if (!!req.query && undefined !== req.query[paramName]) {
        console.log(req.query[paramName]);
        tApi.apiConnection.users.getUserByName(req.query[paramName] as string)
        .then(user => {
            res.status(200).setHeaders(header).json({
                userName:user?.displayName,
                pfpUrl:user?.profilePictureUrl
            });
        })
        .catch(e => {
            console.error(e);
            res.status(500).setHeaders(header).send('Internal Server Error')
        })
    }
    else {
        res.status(400).send("Bad Request")
    }
});

export default router;