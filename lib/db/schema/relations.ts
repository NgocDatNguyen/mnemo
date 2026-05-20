import { relations } from "drizzle-orm";
import { cards } from "./cards";
import { cohortMembers } from "./cohort-members";
import { cohorts } from "./cohorts";
import { decks } from "./decks";
import { feedback } from "./feedback";
import { mockTests } from "./mock-tests";
import { reviewLogs } from "./review-logs";
import { reviews } from "./reviews";
import { subscriptions } from "./subscriptions";
import { usageCredits } from "./usage-credits";
import { users } from "./users";

export const usersRelations = relations(users, ({ many, one }) => ({
	decks: many(decks),
	reviews: many(reviews),
	mockTests: many(mockTests),
	cohortsAsTutor: many(cohorts),
	cohortMemberships: many(cohortMembers),
	usageCredits: many(usageCredits),
	subscription: one(subscriptions),
	feedback: many(feedback),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
	owner: one(users, { fields: [decks.ownerId], references: [users.id] }),
	cohort: one(cohorts, { fields: [decks.cohortId], references: [cohorts.id] }),
	sourceMockTest: one(mockTests, {
		fields: [decks.sourceMockTestId],
		references: [mockTests.id],
		relationName: "deckSourceMockTest",
	}),
	cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
	deck: one(decks, { fields: [cards.deckId], references: [decks.id] }),
	reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
	user: one(users, { fields: [reviews.userId], references: [users.id] }),
	card: one(cards, { fields: [reviews.cardId], references: [cards.id] }),
	logs: many(reviewLogs),
}));

export const reviewLogsRelations = relations(reviewLogs, ({ one }) => ({
	review: one(reviews, { fields: [reviewLogs.reviewId], references: [reviews.id] }),
}));

export const mockTestsRelations = relations(mockTests, ({ one }) => ({
	user: one(users, { fields: [mockTests.userId], references: [users.id] }),
	generatedDeck: one(decks, {
		fields: [mockTests.generatedDeckId],
		references: [decks.id],
		relationName: "mockTestGeneratedDeck",
	}),
}));

export const cohortsRelations = relations(cohorts, ({ one, many }) => ({
	tutor: one(users, { fields: [cohorts.tutorId], references: [users.id] }),
	members: many(cohortMembers),
	decks: many(decks),
}));

export const cohortMembersRelations = relations(cohortMembers, ({ one }) => ({
	cohort: one(cohorts, { fields: [cohortMembers.cohortId], references: [cohorts.id] }),
	user: one(users, { fields: [cohortMembers.userId], references: [users.id] }),
}));

export const usageCreditsRelations = relations(usageCredits, ({ one }) => ({
	user: one(users, { fields: [usageCredits.userId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
	user: one(users, { fields: [feedback.userId], references: [users.id] }),
}));
