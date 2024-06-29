import { parseFeed } from "@mikaelporttila/rss";

export async function fetchFeed(url: string) {
    const response = await fetch(url);
    const text = await response.text();
    return parseFeed(text);
}
