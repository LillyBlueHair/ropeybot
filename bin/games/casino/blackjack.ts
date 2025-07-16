import { resolve } from "path";
import { wait, waitForCondition } from "../../hub/utils";
import { Casino, getItemsBlockingForfeit } from "../casino";
import { FORFEITS } from "./forfeits";
import { Bet, Game } from "./game";
import { Card, createDeck, getCardString, shuffleDeck } from "./pokerCards";
import {
    API_Character,
    API_Connector,
    BC_Server_ChatRoomMessage,
    API_AppearanceItem,
    AssetGet,
} from "bc-bot";

const BLACKJACKHELP = `
Blackjack is a card game where the goal is to get as close to 21 as possible without going over.
Each player is dealt two cards, and can choose to "hit" (take another card) or "stand" (keep their current hand).
The dealer also has a hand, and must hit until they reach 17 or higher.
Blackjack (21 with two cards) pays 3:2 rounding down to the nearest whole number.

Every card has a value:
- Number cards (2-10) are worth their face value.
- Jacks, Queens, and Kings are worth 10.
- Aces can be worth 1 or 11, depending on what is more beneficial for the hand.

Blackjack bets:
/bot bet <amount> - Bet on the current hand. Odds: 1:1.
/bot hit - Take another card from the deck.
/bot stand - Keep your current hand
/bot double - Double your bet and take one more card. Only available on your first two cards.
/bot cancel - Cancel your bet. Only available before any cards are dealt.
/bot chips - Show your current chip balance.
/bot give <name or member number> <amount> - Give chips to another player.
/bot help - Show this help
`;

const ROULETTEEXAMPLES = `
/bot bet 10
    bets 10 chips
/bot bet 15
    bets the 'leg binder' forfeit (worth 7 chips)
`;

// const TIME_UNTIL_DEAL_MS = 30000;
const TIME_UNTIL_DEAL_MS = 6000;
const BET_CANCEL_THRESHOLD_MS = 3000;
// const AUTO_STAND_TIMEOUT_MS = 45000;
const AUTO_STAND_TIMEOUT_MS = 10000;

export interface BlackjackBet extends Bet {
    memberNumber: number;
    memberName: string;
    stake: number;
    stakeForfeit: string;
    standing: boolean;
}

type Hand = Card[];

export class BlackjackGame implements Game {
    private casino: Casino;
    private deck: Card[] = [];
    private dealerHand: Hand = [];
    private playerHands: Map<number, Hand> = new Map();
    private willDealAt: number | undefined;
    private willStandAt: number | undefined;
    private bets: BlackjackBet[] = [];
    private resetTimeout: NodeJS.Timeout | undefined; // after finishing a game
    private dealTimeout: NodeJS.Timeout | undefined; // after first bet until the deal
    private autoStandTimeout: NodeJS.Timeout; // after the deal until all players stand

    public HELPMESSAGE = BLACKJACKHELP;
    public EXAMPLES = ROULETTEEXAMPLES;

    constructor(
        private conn: API_Connector,
        casino: Casino,
    ) {
        this.casino = casino;
        this.casino.commandParser.register("hit", this.onCommandHit);
        this.casino.commandParser.register("stand", this.onCommandStand);
        this.casino.commandParser.register("double", this.onCommandDouble);
        this.casino.commandParser.register("sign", (sender, msg, args) => {
            const sign = this.casino.getSign();

            sign.setProperty("OverridePriority", { Text: 63 });
            sign.setProperty("Text", "Place bets!");
            sign.setProperty("Text2", " ");
            this.casino.setTextColor("#ffffff");
        });

        setTimeout(() => {
            this.getPole();
            this.casino.getSign();
            this.casino.setSignColor(["#0e0e0e", "#ffffff", "#CCCCCC"]);

            this.casino.setBio().catch((e) => {
                console.error("Failed to set bio.", e);
            });

            this.conn.setScriptPermissions(true, false);

            const scriptItem = this.conn.Player.Appearance.AddItem(
                AssetGet("ItemScript", "Script"),
            );
            scriptItem.setProperty("Hide", [
                "Height",
                "BodyUpper",
                "ArmsLeft",
                "ArmsRight",
                "HandsLeft",
                "HandsRight",
                "BodyLower",
                "HairFront",
                "HairBack",
                "Eyebrows",
                "Eyes",
                "Eyes2",
                "Mouth",
                "Nipples",
                "Pussy",
                "Pronouns",
                "Head",
                "Blush",
                "Fluids",
                "Emoticon",
                "ItemNeck",
                "ItemHead",
                "Cloth",
                "Bra",
                "Socks",
                "Shoes",
                "ClothAccessory",
                "Necklace",
                "ClothLower",
                "Panties",
                "Suit",
                "Gloves",
            ]);
        }, 500);
    }

    getPole(): API_AppearanceItem {
        let pole = this.conn.Player.Appearance.InventoryGet("ItemDevices");
        if (pole && pole.Name === "Pole") {
            // console.log("Pole already exists in inventory", pole);
            return pole;
        }

        /*this.conn.Player.Appearance.RemoveItem("ItemDevices");
        pole = this.conn.Player.Appearance.AddItem(
            AssetGet("ItemDevices", "Pole"),
        );
        console.log("Adding pole to appearance"); 
        pole.SetColor(["#AC9A85"]);
/**/
        console.log("Adding pole to inventory");
        let newPole = AssetGet("ItemDevices", "Pole");
        newPole.Color = ["#AC9A85"];
        this.conn.Player.Appearance.AddItem(newPole);
        return this.conn.Player.Appearance.InventoryGet("ItemDevices");
    }

    async endGame(): Promise<void> {
        await waitForCondition(() => this.resetTimeout !== undefined);
        await wait(2000);
        this.casino.commandParser.unregister("hit");
        this.casino.commandParser.unregister("stand");
        this.casino.commandParser.unregister("double");
        this.clear();
        resolve();
    }

    parseBetCommand(
        senderCharacter: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ): BlackjackBet | undefined {
        if (this.resetTimeout !== undefined) {
            this.conn.reply(msg, "The next game hasn't started yet");
            return;
        }

        if (args.length !== 1) {
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
            standing: false,
        };
    }

    private onCommandHit = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (this.autoStandTimeout === undefined) {
            this.conn.reply(msg, "You can't hit right now.");
            return;
        }
        const bet = this.getBetsForPlayer(sender.MemberNumber)[0];
        if (!bet) {
            this.conn.reply(msg, "You don't have a bet in play.");
            return;
        }
        if (bet.standing) {
            this.conn.reply(msg, "You can't hit, you're standing.");
            return;
        } else if (this.playerHands.get(sender.MemberNumber) === undefined) {
            this.conn.reply(msg, "You don't have a hand to hit.");
            return;
        }
        const hand = this.playerHands.get(sender.MemberNumber);
        hand.push(this.deck.pop());
        const playerValue = this.calculateHandValue(hand);
        if (playerValue > 21) {
            bet.standing = true; // Player automatically stands after busting
        }
        const handString = await this.buildHandString(true);
        this.conn.reply(
            msg,
            `You hit and got a ${getCardString(hand[hand.length - 1])}.\n${handString}`,
        );
        if (this.allPlayersDone()) {
            this.resolveGame();
        }
    };

    private onCommandDouble = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (this.autoStandTimeout === undefined) {
            this.conn.reply(msg, "You can't double down right now.");
            return;
        }
        const bet = this.getBetsForPlayer(sender.MemberNumber)[0];
        if (!bet) {
            this.conn.reply(msg, "You don't have a bet in play.");
            return;
        } else if (bet.standing) {
            this.conn.reply(msg, "You are already standing.");
            return;
        } else if (this.playerHands.get(sender.MemberNumber) === undefined) {
            this.conn.reply(msg, "You don't have a hand to double down on.");
            return;
        } else if (bet.stakeForfeit) {
            this.conn.reply(msg, "You can't double down on a forfeit bet.");
            return;
        }
        const hand = this.playerHands.get(sender.MemberNumber);
        if (hand.length !== 2) {
            this.conn.reply(
                msg,
                "You can only double down on your initial two cards.",
            );
            return;
        }
        const player = await this.casino.store.getPlayer(sender.MemberNumber);
        if (player.credits < bet.stake) {
            this.conn.reply(msg, "You don't have enough chips to double down.");
            return;
        }

        player.credits -= bet.stake;
        await this.casino.store.savePlayer(player);
        bet.stake *= 2; // Double the stake
        hand.push(this.deck.pop());
        const playerValue = this.calculateHandValue(hand);
        bet.standing = true;
        const handString = await this.buildHandString(true);
        this.conn.reply(
            msg,
            `You doubled down and got a ${getCardString(hand[hand.length - 1])}.\n${handString}`,
        );
        if (this.allPlayersDone()) {
            this.resolveGame();
        }
    };

    private async resolveGame(): Promise<void> {
        clearTimeout(this.autoStandTimeout);
        this.autoStandTimeout = undefined;
        while (this.calculateHandValue(this.dealerHand) < 17) {
            this.dealerHand.push(this.deck.pop());
        }
        await this.showHands(false);
        let message = `Dealer has a hand of ${this.calculateHandValue(this.dealerHand)}\n`;
        const sign = this.casino.getSign();
        sign.setProperty("Text", "Dealer has");
        sign.setProperty("Text2", `${this.calculateHandValue(this.dealerHand)}`);
        this.casino.setTextColor("#ffffff");

        for (const bet of this.bets) {
            const playerHand = this.playerHands.get(bet.memberNumber);
            if (!playerHand) {
                console.error(
                    `No hand found for player ${bet.memberName} (${bet.memberNumber})`,
                );
                continue;
            }
            const winnings = this.getWinnings(playerHand, bet);
            if (winnings > 0) {
                const winnerMemberData = await this.casino.store.getPlayer(
                    bet.memberNumber,
                );
                winnerMemberData.credits += winnings;
                winnerMemberData.score += winnings;
                await this.casino.store.savePlayer(winnerMemberData);
                message += `${bet.memberName} wins ${winnings} chips! \n`;
            } else if (bet.stakeForfeit) {
                this.casino.applyForfeit(bet);
                message += `${bet.memberName} lost and gets ${FORFEITS[bet.stakeForfeit].name}! `;
            }
        }
        this.clear();
        this.willDealAt = undefined;
        if (this.dealTimeout) {
            clearInterval(this.dealTimeout);
            this.dealTimeout = undefined;
        }
        this.resetTimeout = setTimeout(() => {
            this.resetTimeout = undefined;
            const sign = this.casino.getSign();
            sign.setProperty("Text", "Place bets!");
            sign.setProperty("Text2", " ");
            this.casino.setTextColor("#ffffff");
        }, 10000);

        this.conn.SendMessage("Chat", message);
    }

    private onCommandStand = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (this.autoStandTimeout === undefined) {
            this.conn.reply(msg, "You can't stand right now.");
            return;
        }
        const bet = this.getBetsForPlayer(sender.MemberNumber)[0];
        if (!bet) {
            this.conn.reply(msg, "You don't have a bet in play.");
            return;
        } else if (bet.standing) {
            this.conn.reply(msg, "You are already standing.");
            return;
        }
        bet.standing = true;
        const handString = await this.buildHandString(true);
        this.conn.reply(msg, `You are standing. \n${handString}`);
        if (this.allPlayersDone()) {
            this.resolveGame();
        }
    };

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
        if (this.autoStandTimeout !== undefined) {
            this.conn.reply(msg, "You can't bet right now.");
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
            this.dealTimeout = setInterval(() => {
                this.onDealTimeout();
            }, 1000);
        }
    };

    private onDealTimeout(): void {
        if (!this.willDealAt) return;

        const sign = this.casino.getSign();

        const timeLeft = this.willDealAt - Date.now();
        if (timeLeft <= 0) {
            sign.Extended.SetText("");
            sign.setProperty("Text2", "");

            clearInterval(this.dealTimeout);
            this.initialDeal();
        } else {
            this.casino.setTextColor("#ffffff");
            sign.setProperty("Text", "Place bets!");
            sign.setProperty("Text2", `${Math.ceil(timeLeft / 1000)}`);
        }
    }

    private onStandTimeout(): void {
        if (!this.willStandAt) return;

        const sign = this.casino.getSign();
        const timeLeft = this.willStandAt - Date.now();
        if (timeLeft <= 0) {
            this.bets.forEach((bet) => {
                bet.standing = true;
            });
            this.conn.SendMessage(
                "Chat",
                "All open bets have been automatically stood.",
            );
            clearInterval(this.autoStandTimeout);
            this.resolveGame();
        } else {
            this.casino.setTextColor("#ffffff");
            sign.setProperty("Text", "Time left");
            sign.setProperty("Text2", `${Math.ceil(timeLeft / 1000)}`);
        }
    }

    private allPlayersDone(): boolean {
        return this.bets.every((b) => b.standing);
    }

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

    getWinnings(playerHand: Hand, bet: BlackjackBet): number {
        let playerHandValue: number = this.calculateHandValue(playerHand);
        let dealerHandValue: number = this.calculateHandValue(this.dealerHand);
        console.log(playerHand, playerHandValue, dealerHandValue);
        if (playerHandValue > 21) {
            return 0;
        }
        if (dealerHandValue > 21) {
            return bet.stake * 2;
        }
        if (playerHandValue === dealerHandValue) {
            if (bet.stakeForfeit) {
                return 0;
            }
            return bet.stake;
        }
        if (playerHandValue === 21 && playerHand.length === 2) {
            return Math.floor(bet.stake * 2.5);
        }
        if (playerHandValue > dealerHandValue) {
            return bet.stake * 2;
        }
        return 0;
    }

    clear(): void {
        this.bets = [];
        this.playerHands.clear();
    }

    private createShoe(): void {
        this.deck = shuffleDeck(createDeck());
    }

    private initialDeal(): void {
        if (this.deck.length < this.bets.length * 5 + 5) {
            this.conn.SendMessage(
                "Chat",
                "The deck is running low, shuffling a new deck.",
            );
            this.createShoe();
        }
        this.dealerHand = [this.deck.pop(), this.deck.pop()];
        for (const bet of this.bets) {
            this.playerHands.set(bet.memberNumber, [
                this.deck.pop(),
                this.deck.pop(),
            ]);
        }

        this.willStandAt = Date.now() + AUTO_STAND_TIMEOUT_MS;
        this.autoStandTimeout = setInterval(() => {
            this.onStandTimeout();
        }, 1000);

        this.showHands(true);
    }

    private async showHands(dealerHidden: boolean): Promise<void> {
        const handString = await this.buildHandString(dealerHidden);
        this.conn.SendMessage("Chat", handString);
    }

    private async buildHandString(dealerHidden: boolean): Promise<string> {
        const dealerValue = this.calculateHandValue(this.dealerHand);
        const dealerHandString = dealerHidden
            ? `[${getCardString(this.dealerHand[0])}] [???]`
            : this.handToString(this.dealerHand);
        let string = `Dealer's hand: ${dealerHandString} (${dealerHidden ? "???" : dealerValue})\n`;
        for (const [memberNumber, hand] of this.playerHands) {
            const playerHandString = this.handToString(hand);
            const playerValue = this.calculateHandValue(hand);
            const player = await this.casino.store.getPlayer(memberNumber);
            string += `${player.name} (${memberNumber}) hand: ${playerHandString} (${playerValue})\n`;
        }
        return string;
    }

    private handToString(hand: Hand): string {
        return hand.map((card) => `[${getCardString(card)}]`).join(", ");
    }

    private calculateHandValue(hand: Hand): number {
        let value = 0;
        let aces = 0;
        if (hand.length === 0) {
            return 0; // No cards, value is 0
        }

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
