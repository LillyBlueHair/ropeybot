const SUITS = ["Hearts", "Clubs", "Diamonds", "Spades"];
const VALUES = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
];

export type Card = { suit: string; value: string };

export function createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value });
        }
    }
    return deck;
}

export function sortCards(cards: Card[]): Card[] {
    return cards.sort((a, b) => {
        const aNum = getNumericCardValue(a);
        const bNum = getNumericCardValue(b);
        return aNum - bNum || SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
    });
}

export function getNumericCardValue(card: Card): number {
    switch (card.value) {
        case "J":
            return 11;
        case "Q":
            return 12;
        case "K":
            return 13;
        case "A":
            return 14;
        default:
            return parseInt(card.value);
    }
}

export function shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function getCardString(
    card: Card,
    signFriendly: boolean = false,
): string {
    if (card.suit === "Spades") {
        return `${card.value}` + (signFriendly ? "s" : "♠");
    } else if (card.suit === "Hearts") {
        return `${card.value}` + (signFriendly ? "h" : "♥");
    } else if (card.suit === "Diamonds") {
        return `${card.value}` + (signFriendly ? "d" : "♦");
    } else if (card.suit === "Clubs") {
        return `${card.value}` + (signFriendly ? "c" : "♣");
    }
    return `${card.value}?`;
}
