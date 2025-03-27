
import { TwitchAPI } from '../models/twitch';

const tApi = setTwitchApiClient()

function setTwitchApiClient():TwitchAPI {
  const clientID = process.env.CLIENT_ID || "NA"
  const clientSecret = process.env.CLIENT_SECRET || "NA"
  var tApi
  try {
    if ("NA" === clientID || "NA" === clientSecret) {
      throw new Error("Missing credentials!");
    }
  } catch (error) {
    console.error(error);
  }
  finally {
    tApi = new TwitchAPI(clientID, clientSecret);
  }

  return tApi
}

export default tApi