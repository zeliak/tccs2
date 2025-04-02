import { Router, Request, Response } from "express";
import tApi from "../lib/apiConnection"
import { Emote } from "../models/emotes";
import { HelixEmote, HelixEmoteImageScale } from "@twurple/api";
import { tap } from "node:test/reporters";
import { rawDataSymbol } from "@twurple/common";
import { collections } from "../lib/dbConnection";

const emoteRouter = Router();

emoteRouter.get('/fetchall', async (req: Request, res: Response) => {
    const streamer = await tApi.apiConnection.users.getUserByName(req.query.streamer as string);
    const emotes: HelixEmote[] = [];

    if (!!streamer &&  undefined !== streamer.id) {
        const channelEmotes: HelixEmote[] = await tApi.apiConnection.chat.getChannelEmotes(streamer.id);

        if (!!channelEmotes) {
            emotes.push(...channelEmotes);
        }
        else {
            console.warn('Channel emotes were empty');
        }
    }
    else {
        console.warn('Could not fetch channel emotes');
    }

    const globalEmotes: HelixEmote[] = await tApi.apiConnection.chat.getGlobalEmotes();

    if (!!globalEmotes) {
        emotes.push(...globalEmotes);
    }
    else {
        console.warn('Global emotes were empty');
    }

    const searchOptions = {
        projection: { _id: 0, 
            name: 1,
            version: 2,
            imgUrl: 3
        }
    };

    if (!!emotes) {
        for (let i = 0; i < emotes.length; i++) {
            const emote = emotes[i] as HelixEmote;
            var isAnimated: boolean = false
            
            emote.formats.forEach(format => {
                if ('animated' === format) {
                    isAnimated = true;
                }
            });

            var url: string | null;


            if (isAnimated) {
                url = await emote.getAnimatedImageUrl('1.0', 'light');
            }
            else {
                url = await emote.getImageUrl(1.0);
            }

            const searchQuery = {
                name: emote.name
            }

            const searchResult = await collections.emotes?.findOne(searchQuery, searchOptions) as Emote;

            if (searchResult && searchResult.imgUrl === url) {
                console.debug(emote.name + ' is up to date');
            }
            else if (searchResult && searchResult.imgUrl !== url) {
                const updateDoc = {
                    $set: {
                        imgUrl: url
                    },
                };

                try {
                    const updateResult = collections.emotes?.updateOne(searchQuery, updateDoc);
                    console.debug(emote.name + ' was updated');
                } catch (error) {
                    console.error('Could not update emote ' + emote.name);
                }
            }
            else if (null !== url) {
                const myEmote = new Emote(emote.name, url);
                collections.emotes?.insertOne(myEmote);

            }
            else {
                console.warn('URL was unresolved, skipping');
            }
        }
    }

    res.status(200).send('Updated emotes');
});

export default emoteRouter;