/**
 * Canonical Anki note-type (model) + deck JSON for the legacy collection.anki2
 * schema (ver 11). Kept minimal but with the fields Anki desktop expects on import.
 *
 * Two models: Basic (type 0, fields Front/Back) and Cloze (type 1, fields Text/Back
 * Extra). Fixed model ids so notes can reference them.
 */
export const BASIC_MID = 1700000000001;
export const CLOZE_MID = 1700000000002;
export const DECK_ID = 1700000000010;

const CARD_CSS =
	".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }";

export function buildModelsJson(): string {
	const basic = {
		id: BASIC_MID,
		name: "Basic",
		type: 0,
		mod: 0,
		usn: 0,
		sortf: 0,
		did: DECK_ID,
		tmpls: [
			{
				name: "Card 1",
				ord: 0,
				qfmt: "{{Front}}",
				afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
				bqfmt: "",
				bafmt: "",
				did: null,
				bfont: "",
				bsize: 0,
			},
		],
		flds: [
			{ name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
			{ name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
		],
		css: CARD_CSS,
		latexPre: "",
		latexPost: "",
		req: [[0, "any", [0]]],
		vers: [],
		tags: [],
	};

	const cloze = {
		id: CLOZE_MID,
		name: "Cloze",
		type: 1,
		mod: 0,
		usn: 0,
		sortf: 0,
		did: DECK_ID,
		tmpls: [
			{
				name: "Cloze",
				ord: 0,
				qfmt: "{{cloze:Text}}",
				afmt: "{{cloze:Text}}<br>\n{{Back Extra}}",
				bqfmt: "",
				bafmt: "",
				did: null,
				bfont: "",
				bsize: 0,
			},
		],
		flds: [
			{ name: "Text", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
			{
				name: "Back Extra",
				ord: 1,
				sticky: false,
				rtl: false,
				font: "Arial",
				size: 20,
				media: [],
			},
		],
		css: CARD_CSS,
		latexPre: "",
		latexPost: "",
		req: [[0, "any", [0]]],
		vers: [],
		tags: [],
	};

	return JSON.stringify({ [BASIC_MID]: basic, [CLOZE_MID]: cloze });
}

export function buildDecksJson(deckName: string): string {
	const defaultDeck = {
		id: 1,
		name: "Default",
		mod: 0,
		usn: 0,
		collapsed: false,
		desc: "",
		dyn: 0,
		conf: 1,
		extendNew: 0,
		extendRev: 0,
		newToday: [0, 0],
		revToday: [0, 0],
		lrnToday: [0, 0],
		timeToday: [0, 0],
	};
	const deck = { ...defaultDeck, id: DECK_ID, name: deckName };
	return JSON.stringify({ 1: defaultDeck, [DECK_ID]: deck });
}

export const DEFAULT_DCONF = JSON.stringify({
	1: {
		id: 1,
		name: "Default",
		mod: 0,
		usn: 0,
		maxTaken: 60,
		autoplay: true,
		timer: 0,
		replayq: true,
		new: {
			bury: true,
			delays: [1, 10],
			initialFactor: 2500,
			ints: [1, 4, 7],
			order: 1,
			perDay: 20,
		},
		rev: { bury: true, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
		lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 },
		dyn: false,
	},
});

export const DEFAULT_CONF = JSON.stringify({
	nextPos: 1,
	estTimes: true,
	activeDecks: [1],
	sortType: "noteFld",
	timeLim: 0,
	sortBackwards: false,
	addToCur: true,
	curDeck: DECK_ID,
	newBury: true,
	newSpread: 0,
	dueCounts: true,
	curModel: BASIC_MID,
	collapseTime: 1200,
});
