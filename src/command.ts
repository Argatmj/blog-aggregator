import { setUser, readConfig } from "./config.js";
import { createUser, findUser, deleteUsers, getUsers, createFeed, deleteFeeds, getFeeds, findUserById, createFeedFollow, getFeedFollowsForUser, findFeedByUrl, deleteFollows, deleteFollowing, getNextFeedFetch, markFeedFetch, createPost, getPostsForUsers, deletePosts } from "./lib/db/queries.js";
import { fetchFeed } from "./rss.js";
import { feeds, users } from "./schema.js";

type commandHandle = (cmdName: string, ...args: string[]) => void;
type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export type middlewareLoggedIn = (handler: UserCommandHandler) => commandHandle;
export type commandRegistry = Record<string, commandHandle>;

export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;

const handleError = (err: unknown) => {
        if (err instanceof Error){
            console.log(err.message);
        }else {
            console.log("Encountered Error.");
        }
}

export function registerCommand(registry: commandRegistry, cmdName: string, handler: commandHandle){
    registry[cmdName] = handler;
}

export async function runCommand(registry: commandRegistry, cmdName: string, ...args: string[]): Promise<void> {
    await registry[cmdName](cmdName, ...args);
}

export function middlewareLoggedIn(handler: UserCommandHandler): commandHandle {
    return (async (cmdName: string, ...args: string[]) => {
        const config = readConfig();
        
        if (!config.currentUserName) {
            throw new Error("You must be logged in to use this command");
        }
        
        const user = await findUser(config.currentUserName);
        
        if (!user) {
            throw new Error("User not found. Please log in again.");
        }
        
        await handler(cmdName, user, ...args);
    });
}

export async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length === 0){
        throw new Error("The login expects a username");
    }
    const username = args[0];
    const userexist = await findUser(username);

    if (userexist === undefined){
        throw new Error("Username must be registered!");
    }

    setUser(username);
    const config = readConfig();
    console.log(`User ${config.currentUserName} has been set!`);
    process.exit(0);
}

export async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length === 0){
        throw new Error("The register expects a username");
    }
    const username = args[0];
    const userexist = await findUser(username);

    if (userexist) {
        throw new Error("User already in database");
    }
    const user = await createUser(username);

    setUser(username);
    console.log(`${user.name} has been created!`);
    process.exit(0);
}

export async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
    const res = await deleteUsers();
    const fes = await deleteFeeds();
    const fos = await deleteFollows();
    const pos = await deletePosts();
    if (res === undefined && fes == undefined && fos == undefined && pos == undefined){
        console.log("Table users, feeds, posts, and follows has been successfully reset!")
    }
    process.exit(0);
}

export async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
    const config = readConfig();
    const users = await getUsers();
    for (let user of users){
        let str = `* ${user.name}`;
        if (user.name === config.currentUserName){
            str += " (current)";
        }
        console.log(str);
    }
    process.exit(0);
}

export async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
    const durationStr = args[0];
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);
    
    if (!match) {
        throw new Error("Invalid duration format. Use: 500ms, 30s, 5m, or 2h");
    }

    const num = parseInt(match[1]);
    const unitToMs = {ms: 1, s: 1000, m: 60000, h: 3600000};
    const unit = match[2]
    const delay = num * unitToMs[unit as keyof typeof unitToMs];

    console.log(`Collecting feeds every ${durationStr}`);
    scrapeFeeds().catch(handleError)

    const interval = setInterval(() => {
        scrapeFeeds().catch(handleError);
    }, delay);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(interval);
            resolve();
            process.exit(0);
    });

});
}

export async function handlerFeed(cmdName: string, user: User, ...args: string[]): Promise<void> {
    const name: string = args[0];
    const url: string = args[1];

    const feed = await createFeed(name, url, user.id);
    const follow = await createFeedFollow(user.id, feed.id);
    console.log(`Username:  ${follow.user_name}`);
    console.log(`Feed name: ${follow.feed_name}`);
    process.exit(0);
}

function printFeed(user: User, feed: Feed){
    console.log("User: ")
    for (let [key, value] of Object.entries(user)){
        console.log(`- ${key}: ${value}`)
    }
    console.log("Feed: ")
    for (let [key, value] of Object.entries(feed)){
        console.log(`- ${key}: ${value}`)
    }
}

export async function handlerFeeds(): Promise<void> {
    const feeds: Feed[] = await getFeeds();

    for (let idx in feeds){
        const currFeed = feeds[idx];
        const user = await findUserById(currFeed.user_id);
        console.log(`Name of the feed: ${currFeed.name}`);
        console.log(`URL of the feed: ${currFeed.url}`);
        console.log(`Username that added the feed: ${user.name}`);
    }
    process.exit(0);
}

export async function handlerFollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
    const url = args[0];
    const feed = await findFeedByUrl(url);

    const res = await createFeedFollow(user.id, feed.id);
    console.log(`Username:  ${res.user_name}`);
    console.log(`Feed name: ${res.feed_name}`);
    process.exit(0);
}

export async function handlerFollowing(cmdName: string, user: User): Promise<void>{
    const feeds = await getFeedFollowsForUser(user.id);
    console.log(`${user.name} currently follows: `);
    for (const idx in feeds){
        console.log(`- ${feeds[idx].name}`);
    }
    process.exit(0);
}

export async function handlerUnfollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
    const url = args[0];
    const feed = await findFeedByUrl(url);
    const res = await deleteFollowing(user.id,feed.id);
    console.log("Feed successfully unfollowed!");
    process.exit(0);
}

async function scrapeFeeds(){
    const currentFeed = await getNextFeedFetch();
    const feedObj = await fetchFeed(currentFeed.url);
    const res = await markFeedFetch(currentFeed.id);
    const items = feedObj.channel.item;

    for (const idx in items){
        const currPost = items[idx];
        const res = await createPost(currPost.title, currPost.description, currPost.link, currentFeed.id, currPost.pubDate);
    }
    console.log(`${currentFeed.url} successfully scraped!`);
}

export async function handlerBrowse(cmdName: string, user: User, ...args: string[]): Promise<void> {
    const lim: number = parseInt(args[0]);
    const posts = await getPostsForUsers(user.id, lim);
    if (posts.length === 0) {
        console.log("No posts to browse from your followed feeds!");
        process.exit(0);
    }

    console.log(`\nPosts from your followed feeds:\n`);

    for (const idx in posts) {
        const currPost = posts[idx].post;
        console.log(`Title: ${currPost.title}`);
        console.log(`URL: ${currPost.url}`);
        console.log(`Description: ${currPost.description}`);
        console.log(`Published: ${currPost.publishedAt}`);
        console.log("" + "─".repeat(60));
    }

    console.log(`\nTotal: ${posts.length} post(s)`);
    process.exit(0);

}