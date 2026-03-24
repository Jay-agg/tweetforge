import { TwitterApi } from "twitter-api-v2";

let client: TwitterApi | null = null;

export function getTwitterClient(): TwitterApi {
  if (client) return client;

  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error(
      "Missing Twitter API credentials. Set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_SECRET in .env.local"
    );
  }

  client = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret,
  });

  return client;
}

export async function postTweetWithRetry(text: string, maxRetries = 3): Promise<any> {
  const twitter = getTwitterClient();
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await twitter.v2.tweet(text);
      return result;
    } catch (error: any) {
      attempt++;
      
      // Check if it's a 5xx error or rate limit
      const isTransient = 
        error?.code >= 500 || 
        error?.code === 429 || 
        error?.data?.status >= 500;

      if (!isTransient || attempt >= maxRetries) {
        throw error;
      }

      // Exponential backoff: 2s, 4s, 8s
      const delayMs = Math.pow(2, attempt) * 1000;
      console.warn(`[Twitter API] Attempt ${attempt} failed with ${error?.code || 'unknown'}. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

