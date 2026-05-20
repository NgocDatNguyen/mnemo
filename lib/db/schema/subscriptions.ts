import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { billingCycleEnum, subscriptionStatusEnum, subscriptionTierEnum } from "./enums";
import { users } from "./users";

/**
 * V2-ready: table exists in schema during beta but contains no rows.
 * Lets V2 launch enable payments without a migration step.
 */
export const subscriptions = pgTable("subscriptions", {
	id: uuid()
		.primaryKey()
		.$defaultFn(() => uuidv7()),
	userId: uuid()
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: "cascade" }),
	tier: subscriptionTierEnum().notNull(),
	billingCycle: billingCycleEnum().notNull(),
	status: subscriptionStatusEnum().notNull(),
	stripeCustomerId: text(),
	stripeSubscriptionId: text(),
	currentPeriodEnd: timestamp({ withTimezone: true, mode: "date" }),
	createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
	updatedAt: timestamp({ withTimezone: true, mode: "date" })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
