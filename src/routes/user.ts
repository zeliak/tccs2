import { Router, Request, Response } from "express";
import tApi from "../lib/apiConnection"
import { IUserBadge, Badge } from "../models/badges";
import { collections } from "../lib/dbConnection";

export const userRouter = Router();


userRouter.get('/pfp', (req: Request, res: Response) => {
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



userRouter.post('/badge', async (req: Request, res: Response) => {
    const data = req.body as IUserBadge[];
    var resolvedBadges: IUserBadge[] = [];
    const options = {
        projection: { 
            _id: 0, 
            name: 1,
            version: 2,
            imgUrl: 3
        }
    };

    for (let i = 0; i < data.length; i++) {
        const badge = data[i] as IUserBadge;
        const searchQuery = {
            name: badge.name,
            version: badge.version
        };

        const searchResult = await collections.badges?.findOne(searchQuery, options) as Badge;

        if (!!searchResult && searchResult.imgUrl !== undefined) {
            resolvedBadges.push(searchResult)
        }
    }

    if (resolvedBadges.length > 0) {
        res.status(200).json(resolvedBadges);
    }
    else {
        res.status(201).send('No Data');
    }
});

export default userRouter;