import { Router, Request, Response } from "express";
import { HelixChatBadgeSet } from "@twurple/api";
import tApi from "../lib/apiConnection"
import { Badge } from "../models/badges";
import { collections } from "../lib/dbConnection";

const badgeRouter = Router();

badgeRouter.get('/fetchall', async (req: Request, res: Response) => {
    const streamer = await tApi.apiConnection.users.getUserByName(req.query.streamer as string);
    var badges: HelixChatBadgeSet[] = [];

    if (streamer && streamer.id !== undefined) {
        const channelBadges = await tApi.apiConnection.chat.getChannelBadges(streamer?.id);

        if (!!channelBadges) {
           badges.push(...channelBadges);
        }
        else {
            console.warn('Channel emotes were empty');
        }
    }
    else {
        console.warn('Cannot identify the streamer');
    }

    
    const globalBadges = await tApi.apiConnection.chat.getGlobalBadges();
    if (!!globalBadges) {
        badges.push(...globalBadges);
    }
    else {
        console.warn('Global badges were empty');
    }

    const options = {
        projection: { _id: 0, 
            name: 1,
            version: 2,
            imgUrl: 3
        }
    };

    for (let i = 0; i < badges.length; i++) {
        const badge = badges[i];
        for (let j = 0; j < badge.versions.length; j++) {
            try {
                const version = badge.versions[j];
                const url = await version.getImageUrl(1);
                const myBadge: Badge = new Badge(badge.id, version.id as string, url);

                const query = { 
                    name: myBadge.name,
                    version: myBadge.version
                };

                const searchResult = await collections.badges?.findOne(query, options) as Badge;

                if (searchResult && searchResult.imgUrl !== myBadge.imgUrl) {
                    const updateDoc = {
                        $set: {
                            imgUrl: myBadge.imgUrl
                        },
                    };

                    try {
                        const updateResult = await collections.badges?.updateOne(query, updateDoc);
                        console.debug('updated badge ' + myBadge.name);
                    } catch (error) {
                        console.error('Could not update badge ' + myBadge.name, error);
                        throw error;
                    }
                }
                else if (searchResult && searchResult.imgUrl === myBadge.imgUrl) {
                    console.debug(myBadge.name + ' is up to date');
                }
                else {
                    try {
                        const result = await collections.badges?.insertOne(myBadge);
                        console.debug(myBadge.name + ' is added to the badge collection');
                    } catch (error) {
                        console.error('Could not add badge '+ myBadge.name, error);
                        throw error;
                    }
                }
            }
            catch (error) {
                console.error('Failed to get badges', error);
                res.status(500).json({
                    success: false,
                    message: 'Updating badges DB failed'
                });
            }
        }
    }

    res.status(200).json({
        succes: true,
        message: 'Badges DB was updated sucessfully'
    });
});

export default badgeRouter;