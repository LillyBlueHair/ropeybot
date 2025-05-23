import { API_Character } from "../../apiCharacter";
import { API_Connector } from "../../apiConnector";
import { BC_Server_ChatRoomMessage } from "../../logicEvent";
import { FORFEITS } from "./forfeits";
import { Bet, Game } from "./game";
import { Card, createDeck, shuffleDeck } from "./pokerCards";

export const BLACKJACKHELP = `
Blackjack is a card game where the goal is to get as close to 21 as possible without going over.
Each player is dealt two cards, and can choose to "hit" (take another card) or "stand" (keep their current hand).
The dealer also has a hand, and must hit until they reach 17 or higher.
Blackjack (21 with two cards) pays 3:2.

Blackjack bets:
/bot bet <amount> - Bet on the current hand. Odds: 1:1.
/bot hit - Take another card from the deck.
/bot stand - Keep your current hand
/bot cancel - Cancel your bet. Only available before any cards are dealt.
/bot chips - Show your current chip balance.
/bot give <name or member number> <amount> - Give chips to another player.
/bot help - Show this help
`;

export interface BlackjackBet extends Bet {
    memberNumber: number;
    memberName: string;
    stake: number;
    stakeForfeit: string;
}

type Hand = Card[];

export class BlackjackGame implements Game {
    private deck: Card[] = [];
    private dealerHand: Hand = [];
    private playerHands: Hand[] = [];
    private bets: BlackjackBet[] = [];
    private gameState: "waiting" | "betting" | "dealing" | "playing" =
        "waiting";

    constructor(private conn: API_Connector) {}
    parseBetCommand(senderCharacter: API_Character, msg: BC_Server_ChatRoomMessage, args: string[]): Bet | undefined {
        throw new Error("Method not implemented.");
    }
    placeBet(bet: Bet): void {
        throw new Error("Method not implemented.");
    }
    textForBet(bet: Bet): string {
        throw new Error("Method not implemented.");
    }
    getBets(): Bet[] {
        throw new Error("Method not implemented.");
    }
    getBetsForPlayer(memberNumber: number): Bet[] {
        throw new Error("Method not implemented.");
    }
    clearBetsForPlayer(memberNumber: number): undefined {
        throw new Error("Method not implemented.");
    }
    onCommandBet(sender: API_Character, msg: BC_Server_ChatRoomMessage, args: string[]) {
        throw new Error("Method not implemented.");
    }
    onCommandCancel(sender: API_Character, msg: BC_Server_ChatRoomMessage, args: string[]) {
        throw new Error("Method not implemented.");
    }
    getWinnings(winningNumber: number, bet: Bet): number {
        throw new Error("Method not implemented.");
    }
    clear(): void {
        throw new Error("Method not implemented.");
    }

    private calculateHandValue(hand: Hand): number {
        let value = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.value === "A") {
                aces++;
                value += 11;
            } else if (["J", "Q", "K"].includes(card.value)) {
                value += 10;
            } else {
                value += parseInt(card.value);
            }
        }

        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    }
}
