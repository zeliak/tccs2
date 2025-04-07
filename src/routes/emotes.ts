import { Router, Request, Response } from "express";
import tApi from "../lib/apiConnection"
import { Emote } from "../models/emotes";
import { HelixEmote, HelixEmoteFormat, HelixEmoteImageScale, HelixUser } from "@twurple/api";
import { collections } from "../lib/dbConnection";

const emoteRouter = Router();

async function getSevenTvEmotes(streamer: HelixUser): Promise<Emote[] | void> {
    const baseUrl = 'https://7tv.io/v3/';
    const userUrl = baseUrl + 'users/twitch/' + streamer.id;
    var sTvEmotes: Emote[] = [];
    const userResponse = await fetch(userUrl, {
        method: 'GET'
    });
    const sTvUser = await userResponse.json();

    if (undefined !== sTvUser && undefined !== sTvUser.emote_set && undefined !== sTvUser.emote_set.emotes) {
        for (let i = 0; i < sTvUser.emote_set.emotes.length; i++) {
            const emote = sTvUser.emote_set.emotes[i];

            if (!!emote.id && !!emote.name && !!emote.data && !!emote.data.host && !!emote.data.host.url && !!emote.data.host.files) {
                const emoteUrl = 'https:' + emote.data.host.url + '/' + emote.data.host.files[0].name;
                const myEmote = new Emote(emote.name, emoteUrl, emote.id);

                if (!!myEmote) {
                    sTvEmotes.push(myEmote);
                }
            }
        }
    }

    if (sTvEmotes.length > 0) {
        return sTvEmotes;
    }
    else {
        console.error('Could not get 7TV emotes')
    }
}

async function updateDB(emotes: HelixEmote[] | Emote[]): Promise<void> {
    const searchOptions = {
        projection: { _id: 0, 
            name: 1,
            version: 2,
            imgUrl: 3
        }
    };

    if (!!emotes) {
        for (let i = 0; i < emotes.length; i++) {
            const emote = emotes[i];
            var url: string | null;
            var myEmote: Emote;

            if (emote instanceof HelixEmote) {
                var format: HelixEmoteFormat = 'static'
                
                emote.formats.forEach(emoteFormat => {
                    if ('animated' === emoteFormat) {
                        format = emoteFormat;
                    }
                });
                
                url = await emote.getFormattedImageUrl('1.0', format, 'dark');
                myEmote = new Emote(emote.name, url, emote.id);
            }
            else {
                myEmote = emote;
            }

            const searchQuery = {
                name: myEmote.name
            }

            const searchResult = await collections.emotes?.findOne(searchQuery, searchOptions) as Emote;

            if (searchResult && searchResult.imgUrl === myEmote.imgUrl) {
                console.debug(emote.name + ' is up to date');
            }
            else if (searchResult && searchResult.imgUrl !== myEmote.imgUrl) {
                const updateDoc = {
                    $set: {
                        imgUrl: myEmote.imgUrl
                    },
                };

                try {
                    const updateResult = collections.emotes?.updateOne(searchQuery, updateDoc);
                    console.debug(emote.name + ' was updated');
                } catch (error) {
                    console.error('Could not update emote ' + emote.name);
                }
            }
            else if (null !== myEmote.imgUrl) {
                collections.emotes?.insertOne(myEmote);
            }
            else {
                console.warn('URL was unresolved, skipping');
            }
        }
    }
}

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

    if (!!streamer) {
        const sTvEmotes = await getSevenTvEmotes(streamer)

        if (!!sTvEmotes) {
            await updateDB(sTvEmotes);
        }
    }

    const searchOptions = {
        projection: { _id: 0, 
            name: 1,
            version: 2,
            imgUrl: 3
        }
    };

    await updateDB(emotes);

    res.status(200).send('Updated emotes');
});

emoteRouter.get('/fetchone', async (req: Request, res: Response) => {
    const name = req.query.name as string;
    const twitchId = req.query.id as string;
    var url: string = "https://static-cdn.jtvnw.net/emoticons/v2/";

    if (!!twitchId && !!name) {
        const dbSearch = {
            twitchId:twitchId
        }

        const dbResult = await collections.emotes?.findOne(dbSearch)
        if (!!dbResult) {
            console.debug('Emote was found in the DB')
            res.status(200).json(dbResult);
        }
        else {
            var format: HelixEmoteFormat = 'animated';
            const animatedUrl = url + twitchId + '/' + format + '/dark/1.0';
            const response = await fetch(animatedUrl)
                .then(result => {
                    return result;
                })
                .catch(e => {
                    console.error(e);
                })
            
            if (!response?.ok || response === null) {
                console.debug('No animated format');
                format = 'static';
                url += twitchId + '/' + format + '/dark/1.0';
            }
            else {
                url = animatedUrl;
            }
    
            const myEmote = new Emote(name, url, twitchId);
            collections.emotes?.insertOne(myEmote);
            res.status(200).json(myEmote);
        }
    }
    else {
        res.status(401).send('Bad Request, ID must be present');
    }
});

emoteRouter.get('/getallnames', async (req: Request, res: Response) => {
    const searchProjection = {
        name: 1
    }

    const names = await collections.emotes?.find({}).project(searchProjection).toArray();

    res.status(200).json(names);
});

emoteRouter.get('/getone', async (req: Request, res: Response) => {
    const name = req.query.name
    if (!!name && typeof name === 'string') {
        const searchQuery = {
            name: name
        };

        const dbResult = await collections.emotes?.findOne(searchQuery) as Emote | null;

        if (null !== dbResult) {
            res.status(200).json(dbResult);
        }
        else{
            res.status(500).send("Getting emote from the db failed");
        }
    }
});

export default emoteRouter;