import { PgTable, timestamp, uuid, text, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    name: text("name").notNull().unique()
});

export const feeds = pgTable("feeds", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    name: text("name").notNull().unique(),
    url: text("url").notNull().unique(),
    user_id: uuid("user_id").notNull().references( () => users.id, {
        onDelete: "cascade"
    }),
    lastfetchedAt: timestamp("last_fecthed_at")
})

export const feed_follows = pgTable("feed_follows", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    user_id: uuid("user_id").notNull().references( () => users.id, {
        onDelete: "cascade"
    }),
    feed_id: uuid("feed_id").notNull().references( () => feeds.id, {
        onDelete: "cascade"
    }),
}, (table) => ({
    unique_user_feed: uniqueIndex("unique_user_feed").on(table.user_id, table.feed_id)
}))

export const posts = pgTable("posts", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    title: text("title").notNull(),
    url: text("url").notNull().unique(),
    description: text("description").notNull(),
    publishedAt: timestamp("published_at"),
    feed_id: uuid("feed_id").notNull().references( () => feeds.id, {
        onDelete: "cascade"
    }),
})