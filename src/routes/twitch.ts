import { Router, Request, Response } from "express";
import tApi from "../lib/apiConnection"
import { twitchGlobalBadges } from "../lib/badges"
import { IUserBadge, Badge } from "../models/badges";
import { collections } from "../lib/dbConnection";
import { ObjectId } from "mongodb";

const router = Router();
const  corsHeader = new Headers()
corsHeader.append('Access-Control-Allow-Origin', 'http://localhost:3000');


router.get('/userpfp', (req: Request, res: Response) => {
    const paramName = 'username';

    if (!!req.query && undefined !== req.query[paramName]) {
        console.log(req.query[paramName]);
        tApi.apiConnection.users.getUserByName(req.query[paramName] as string)
        .then(user => {
            res.status(200).json({
                userName:user?.displayName,
                pfpUrl:user?.profilePictureUrl
            });
        })
        .catch(e => {
            console.error(e);
            res.status(500).send('Internal Server Error')
        })
    }
    else {
        res.status(400).send("Bad Request");
    }
});



router.post('/userbadge', async (req: Request, res: Response) => {
    const data = req.body;
    var resolvedBadges: IUserBadge[] = [];
    const ge = await twitchGlobalBadges;

    for (let i = 0; i < data.length; i++) {
        const badge = data[i] as IUserBadge;
        for (let j = 0; j < ge.length; j++) {
            const item = ge[j];
            if (item.id === badge.name) {
                try {
                    const version = await item.getVersion(badge.version);
                    const url = await version?.getImageUrl(1);
                    badge.imgUrl = url;
                    resolvedBadges.push(badge);
                    break;
                }
                catch (error) {
                    res.status(500).send('Badge API calls failed');
                }
            }
        }
    }

    if (resolvedBadges.length > 0) {
        res.status(200).json(resolvedBadges);
    }
    else {
        res.status(201).send('No Data');
    }
});

router.post('/pop', async (req: Request, res: Response) => {
    const badges = await twitchGlobalBadges;

    for (let i = 0; i < badges.length; i++) {
        const badge = badges[i];
        for (let j = 0; j < badge.versions.length; j++) {
            try {
                const version = badge.versions[j];
                const url = await version.getImageUrl(1);
                const myBadge: Badge = new Badge(badge.id, version.id as string, url)
                const result = await collections.badges?.insertOne(myBadge)
            }
            catch (error) {
                console.error('Failed to get badges', error)
            }
        }
    }

    res.status(200).send('guess what')
});

export default router;