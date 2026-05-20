import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import type { DeviceInfo } from "../types";
import { feedbackTypeEnum } from "./enums";
import { users } from "./users";

/**
 * Beta feedback collection. `userId` is nullable + ON DELETE SET NULL because we
 * want to keep feedback even if a user account is removed (anti-survey-bias).
 */
export const feedback = pgTable(
	"feedback",
	{
		id: uuid()
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		userId: uuid().references(() => users.id, { onDelete: "set null" }),
		type: feedbackTypeEnum().notNull(),
		message: text().notNull(),
		pageUrl: text(),
		deviceInfo: jsonb().$type<DeviceInfo>(),
		resolved: boolean().notNull().default(false),
		createdAt: timestamp({ withTimezone: true, mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		index("idx_feedback_user_id").on(table.userId),
		index("idx_feedback_resolved").on(table.resolved),
	],
);

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
