import { Router, Request, Response } from "express";
import { TwitchUser, Token } from "../models/twitch";
import { ClientRequest } from "http";

const router = Router();
var twitchToken: Token;

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

export default router;