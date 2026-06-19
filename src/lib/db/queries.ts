import { and, eq, sql, desc } from "drizzle-orm";
import { db } from "./index.js";
import { users, feeds, feed_follows, posts } from "../../schema.js";

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}

export async function createFeed(name: string, url: string, user_id: string){
  const [result] = await db.insert(feeds).values({ name: name, url: url, user_id:user_id }).returning();
  return result;
}

export async function createFeedFollow(user_id: string, feed_id: string){
  const [feed_follow] = await db.insert(feed_follows).values({user_id:user_id, feed_id:feed_id}).returning();
  const [res] = await db.select({user_name: users.name, feed_name: feeds.name, feeds_follows: feed_follows}).from(feed_follows).where(eq(feed_follows.id, feed_follow.id)).innerJoin(feeds, eq(feed_follows.feed_id, feeds.id)).innerJoin(users,eq(feed_follows.user_id,users.id));
  return res;
}

export async function createPost(title: string, desc: string, url: string, feed_id: string, published_at: string){
  const [res] = await db.insert(posts).values({title: title, description:desc, url: url, feed_id:feed_id, publishedAt: new Date(published_at)}).returning();
  return res;
} 

export async function getPostsForUsers(user_id: string, limit: number = 2){
  const res = await db.select({post:posts}).from(feed_follows).where(eq(feed_follows.user_id,user_id)).innerJoin(posts,eq(feed_follows.feed_id,posts.feed_id)).orderBy(desc(posts.publishedAt)).limit(limit);
  return res;
}

export async function findUser(name: string){
  const [result] = await db.select().from(users).where(eq(users.name,name));
  return result;
}

export async function findUserById(id: string) {
  const [res] = await db.select().from(users).where(eq(users.id,id));
  return res;
}

export async function findFeedByUrl(url: string){
  const [res] = await db.select().from(feeds).where(eq(feeds.url,url));
  return res;
}

export async function deleteUsers() {
  const [result] = await db.delete(users);
  return result;
}

export async function deleteFeeds(){
  const [result] = await db.delete(feeds);
  return result;
}

export async function deletePosts(){
  const [result] = await db.delete(posts);
  return result;
}

export async function markFeedFetch(feed_id: string){
  const result = await db.update(feeds).set({ lastfetchedAt: sql`NOW()`}).where(eq(feeds.id, feed_id));
  return result;
}

export async function getNextFeedFetch(){
  const [result] = await db.select().from(feeds).orderBy(sql`${feeds.lastfetchedAt} asc nulls first`).limit(1);
  return result;
}

export async function deleteFollowing(user_id: string, feed_id: string){
  const res = await db.delete(feed_follows).where(and(eq(feed_follows.user_id,user_id),eq(feed_follows.feed_id, feed_id)));
  return res;
}

export async function deleteFollows(){
  const [result] = await db.delete(feed_follows);
  return result;
}

export async function getUsers(){
  const names = await db.select({name: users.name}).from(users);
  return names;
}

export async function getFeeds(){
  const result = await db.select().from(feeds);
  return result; 
}

export async function getFeedFollowsForUser(user_id: string){
  const results = await db.select({id: feeds.id, name: feeds.name, url: feeds.url}).from(feed_follows).where(eq(feed_follows.user_id, user_id)).innerJoin(feeds, eq(feed_follows.feed_id, feeds.id));
  return results;
}