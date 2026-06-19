import { XMLParser } from "fast-xml-parser";

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {

    const parser = new XMLParser({
        processEntities: false
    });

    const response = await fetch(feedURL, {
        headers: {
            "User-Agent": "gator"
        }
    })
    
    if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }
    
    const res = await response.text();
    const resObj = parser.parse(res);

    if (!("rss" in resObj) || !("channel" in resObj.rss)){
        throw new Error("Feed does not have channel!");
    }

    const channel = resObj.rss.channel;
    if (!hasRSSFields(channel)){
        throw new Error("Channel has missing fields!");
    }
    
    const title = channel.title;
    const link = channel.link;
    const description= channel.description;
    const items = []

    const itemArray = Array.isArray(channel.item) ? channel.item : [channel.item];
    for (const itemObj of itemArray){
        if (!hasRSSFields(itemObj)){
            throw new Error("Item has missing fields!");
        }
        const item = {...itemObj};
        items.push(item);
    }

    return {
        channel: {
            title: title,
            link: link,
            description: description,
            item: items
        }
    }
}

function hasRSSFields(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.title === "string" &&
    typeof obj.link === "string" &&
    typeof obj.description === "string"
  );
}