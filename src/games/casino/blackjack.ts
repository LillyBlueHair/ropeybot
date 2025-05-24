import { API_Character } from "../../apiCharacter";
import { API_Connector } from "../../apiConnector";
import { BC_Server_ChatRoomMessage } from "../../logicEvent";
import { Casino, getItemsBlockingForfeit } from "../casino";
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

const TIME_UNTIL_DEAL_MS = 60000;
const BET_CANCEL_THRESHOLD_MS = 3000;

export interface BlackjackBet extends Bet {
    memberNumber: number;
    memberName: string;
    stake: number;
    stakeForfeit: string;
}

type Hand = Card[];

export class BlackjackGame implements Game {
    private casino: Casino;
    private deck: Card[] = [];
    private dealerHand: Hand = [];
    private playerHands: Hand[] = [];
    private willDealAt: number | undefined;
    private bets: BlackjackBet[] = [];
    private gameState: "waiting" | "betting" | "dealing" | "playing" =
        "waiting";
    private resetTimeout: NodeJS.Timeout | undefined;

    constructor(
        private conn: API_Connector,
        casino: Casino,
    ) {
        this.casino = casino;
    }

    endGame(): void {
        this.gameState = "waiting";
        this.bets = [];
        this.playerHands = [];
        this.dealerHand = [];
        this.deck = [];
    }

    parseBetCommand(
        senderCharacter: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ): BlackjackBet | undefined {
        if (args.length !== 2) {
            this.conn.reply(
                msg,
                "I couldn't understand that bet. Try, eg. /bot bet 10 or /bot bet boots",
            );
            return;
        }

        if (
            this.bets.find(
                (b) => b.memberNumber === senderCharacter.MemberNumber,
            )
        ) {
            this.conn.reply(
                msg,
                "You already placed a bet. Use !cancel to cancel it.",
            );
            return;
        }

        const stake = args[0];
        let stakeValue: number;
        let stakeForfeit: string;
        if (FORFEITS[stake] !== undefined) {
            stakeValue = FORFEITS[stake].value;
            stakeForfeit = stake;
        } else {
            if (!/^\d+$/.test(stake)) {
                this.conn.reply(msg, "Invalid stake.");
                return;
            }
            stakeValue = parseInt(stake, 10);
            if (isNaN(stakeValue) || stakeValue < 1) {
                this.conn.reply(msg, "Invalid stake.");
                return;
            }
        }
        return {
            memberNumber: senderCharacter.MemberNumber,
            memberName: senderCharacter.toString(),
            stake: stakeValue,
            stakeForfeit,
        };
    }

    placeBet(bet: BlackjackBet): void {
        this.bets.push(bet);
        if (bet.stakeForfeit) {
            this.conn.SendMessage(
                "Chat",
                `${bet.memberName} bets ${FORFEITS[bet.stakeForfeit].name} for ${bet.stake} chips`,
            );
        } else {
            this.conn.SendMessage(
                "Chat",
                `${bet.memberName} bets ${bet.stake} chips`,
            );
        }
    }

    getBets(): BlackjackBet[] {
        return this.bets;
    }
    public getBetsForPlayer(memberNumber: number): BlackjackBet[] {
        return this.bets.filter((b) => b.memberNumber === memberNumber);
    }

    public clearBetsForPlayer(memberNumber: number): undefined {
        this.bets = this.bets.filter((b) => b.memberNumber !== memberNumber);
    }
    onCommandBet = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (this.resetTimeout !== undefined) {
            this.conn.reply(msg, "The next game hasn't started yet");
            return;
        }

        const bet = this.parseBetCommand(sender, msg, args);
        if (bet === undefined) {
            return;
        }

        const player = await this.casino.store.getPlayer(sender.MemberNumber);

        if (bet.stakeForfeit === undefined) {
            if (player.credits - bet.stake < 0) {
                this.conn.reply(msg, `You don't have enough chips.`);
                return;
            }

            player.credits -= bet.stake;
            await this.casino.store.savePlayer(player);
        } else {
            const blockers = getItemsBlockingForfeit(
                sender,
                FORFEITS[bet.stakeForfeit].items(),
            );
            if (blockers.length > 0) {
                console.log(
                    `Blocked forfeit bet of ${bet.stakeForfeit} with blockers `,
                    blockers,
                );
                this.conn.reply(
                    msg,
                    `You can't bet that while you have: ${blockers.map((i) => i.Name).join(", ")}`,
                );
                return;
            }

            const canInteract = await sender.GetAllowItem();
            if (!canInteract) {
                this.conn.reply(
                    msg,
                    "You'll need to open up your permissions or whitelist the bot to bet restraints.",
                );
                return;
            }

            const needItems = [...FORFEITS[bet.stakeForfeit].items()];
            if (FORFEITS[bet.stakeForfeit].lock)
                needItems.push(FORFEITS[bet.stakeForfeit].lock);
            const blocked = needItems.filter(
                (i) => !sender.IsItemPermissionAccessible(i),
            );
            if (blocked.length > 0) {
                this.conn.reply(
                    msg,
                    `You can't bet that forfeit because you've blocked: ${blocked.map((i) => i.Name).join(", ")}.`,
                );
                return;
            }

            bet.stake *= this.casino.multiplier;
        }

        if (FORFEITS[bet.stakeForfeit]?.items().length === 1) {
            const forfeitItem = FORFEITS[bet.stakeForfeit].items()[0];
            if (
                Date.now() <
                this.casino.lockedItems
                    .get(sender.MemberNumber)
                    ?.get(forfeitItem.Group)
            ) {
                console.log(
                    `CHEATER DETECTED: ${sender} tried to bet ${bet.stakeForfeit} which should be locked`,
                );
                ++player.cheatStrikes;
                await this.casino.store.savePlayer(player);

                this.casino.cheatPunishment(sender, player);

                return;
            }
        }

        this.placeBet(bet);

        if (this.willDealAt === undefined) {
            if (this.resetTimeout !== undefined) {
                clearTimeout(this.resetTimeout);
                this.resetTimeout = undefined;
            }

            this.willDealAt = Date.now() + TIME_UNTIL_DEAL_MS;
            // this.spinTimeout = setInterval(() => {
            //     this.onSpinTimeout();
            // }, 1000);
        }
    };

    onCommandCancel = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (this.getBetsForPlayer(sender.MemberNumber).length === 0) {
            this.conn.reply(msg, "You don't have a bet in play.");
            return;
        }

        const timeLeft = this.willDealAt - Date.now();
        if (timeLeft <= BET_CANCEL_THRESHOLD_MS) {
            this.conn.reply(msg, "You can't cancel your bet now.");
            return;
        }

        const player = await this.casino.store.getPlayer(sender.MemberNumber);
        this.getBetsForPlayer(sender.MemberNumber).forEach((b) => {
            player.credits += b.stake;
        });
        await this.casino.store.savePlayer(player);

        this.clearBetsForPlayer(sender.MemberNumber);
        this.conn.reply(msg, "Bet cancelled.");
    };

    getWinnings(playerHandValue: number, dealerHandValue, bet: BlackjackBet): number {
        if (playerHandValue > 21) {
            return;
        }
        if (dealerHandValue > 21) {
            return bet.stake * 2;
        }
        if (playerHandValue === 21) {
            return bet.stake * 2.5;
        }
        if (playerHandValue > dealerHandValue) {
            return bet.stake * 2;
        }
        if (playerHandValue === dealerHandValue) {
            return bet.stake;
        }
    }

    clear(): void {
        this.bets = [];
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
