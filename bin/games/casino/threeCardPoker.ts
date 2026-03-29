import { resolve } from "path";
import { waitForCondition } from "../../hub/utils";
import { Casino, getItemsBlockingForfeit } from "../casino";
import { FORFEITS } from "./forfeits";
import { Bet, Game } from "./game";
import {
    Card,
    createDeck,
    getCardString,
    getNumericCardValue,
    shuffleDeck,
} from "./pokerCards";
import {
    API_Character,
    API_Connector,
    BC_Server_ChatRoomMessage,
    API_AppearanceItem,
    AssetGet,
} from "bc-bot";
import { set } from "lodash";

const ThreeCardPokerCOMMANDS = `ThreeCardPoker commands:
/bot bet <amount> - Bet on the current hand. Odds: 1:1.
/bot cancel - Cancel your bet. Only available before any cards are dealt.
/bot chips - Show your current chip balance.
/bot give <name or member number> <amount> - Give chips to another player.
/bot help - Show this help
/bot commands - Show all available commands.
/bot forfeits - Show available forfeits.
/bot checkforfeits - Shows all forfeits currently applied to you.
/bot score - Show your current score.
`;

const ThreeCardPokerHELP = ``;

const ThreeCardPokerHELPCOMMAND = `
${ThreeCardPokerHELP}

For more information on commands or forfeits, use the following commands:
/bot commands - Show all available commands.
/bot forfeits - Show available forfeits.
`;

const ThreeCardPokerEXAMPLES = `
/bot bet 10
    bets 10 chips
/bot bet leg binder
    bets the 'leg binder' forfeit (worth 7 chips)
`;
const FULLThreeCardPokerHELP = `${ThreeCardPokerHELP}

${ThreeCardPokerCOMMANDS}
`;

const TIME_UNTIL_DEAL_MS = 35000;
// const TIME_UNTIL_DEAL_MS = 6000;
const BET_CANCEL_THRESHOLD_MS = 1000;
const AUTO_FOLD_TIMEOUT_MS = 45000;
// const AUTO_FOLD_TIMEOUT_MS = 10000;
const RESET_TIMEOUT_MS = 10000; // Time after a game ends before a new game can start

export interface ThreeCardPokerPlayer {
    memberNumber: number;
    memberName: string;
    bet: ThreeCardPokerBet;
}

export interface ThreeCardPokerBet extends Bet {
    stake: number;
    stakeForfeit: string;
    status: "pending" | "folded" | "playing";
}

type Hand = Card[];

enum HandRank {
    HighCard = 1,
    Pair,
    Flush,
    Straight,
    ThreeOfAKind,
    StraightFlush,
}

export class ThreeCardPokerGame implements Game {
    private casino: Casino;
    private deck: Card[] = [];
    private dealerHand: Hand = [];
    private playerHands: Map<ThreeCardPokerBet, Hand> = new Map();
    private willDealAt: number | undefined;
    private willFoldAt: number | undefined;
    private players: ThreeCardPokerPlayer[] = [];
    private resetTimeout: NodeJS.Timeout | undefined; // after finishing a game
    private dealTimeout: NodeJS.Timeout | undefined; // after first bet until the deal
    private autoFoldTimeout: NodeJS.Timeout; // after the deal until all players stand

    public HELPMESSAGE = FULLThreeCardPokerHELP;
    public EXAMPLES = ThreeCardPokerEXAMPLES;
    public HELPCOMMANDMESSAGE = ThreeCardPokerHELPCOMMAND;
    public COMMANDSMESSAGE = ThreeCardPokerCOMMANDS;

    constructor(
        private conn: API_Connector,
        casino: Casino,
    ) {
        this.casino = casino;
        this.casino.commandParser.register("cancel", this.onCommandCancel);
        this.casino.commandParser.register("bet", this.onCommandBet);
        this.casino.commandParser.register("play", this.onCommandPlay);
        this.casino.commandParser.register("fold", this.onCommandFold);
        this.casino.commandParser.register("sign", (sender, msg, args) => {
            const sign = this.casino.getSign();

            sign.setProperty("OverridePriority", { Text: 63 });
            sign.setProperty("Text", "Place bets!");
            sign.setProperty("Text2", " ");
            this.casino.setSignColor(["#202020", "Default", "#ffffff"]);
        });

        setTimeout(() => {
            this.getPole();
            const sign = this.casino.getSign();

            sign.setProperty("OverridePriority", { Text: 63 });
            sign.setProperty("Text", "Place bets!");
            sign.setProperty("Text2", " ");
            this.casino.setSignColor(["#202020", "Default", "#ffffff"]);

            this.casino.setBio().catch((e) => {
                console.error("Failed to set bio.", e);
            });

            this.conn.Player.setScriptPermissions(true, false);

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
                "Hat",
                "HairAccessory1",
                "HairAccessory2",
                "HairAccessory3",
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
        await waitForCondition(() => this.willDealAt === undefined);
        // await wait(2000);

        this.casino.commandParser.unregister("cancel");
        this.casino.commandParser.unregister("bet");
        this.casino.commandParser.unregister("fold");
        this.casino.commandParser.unregister("play");
        this.casino.commandParser.unregister("sign");
        this.clear();
        resolve();
    }

    parseBetCommand(
        senderCharacter: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ): ThreeCardPokerBet | undefined {
        if (this.resetTimeout !== undefined) {
            this.conn.SendMessage(
                "Whisper",
                "The next game hasn't started yet",
                senderCharacter.MemberNumber,
            );
            return;
        }

        if (args.length !== 1) {
            this.conn.SendMessage(
                "Whisper",
                "I couldn't understand that bet. Try, eg. /bot bet 10 or /bot bet boots",
                senderCharacter.MemberNumber,
            );
            return;
        }

        if (
            this.players.find(
                (b) => b.memberNumber === senderCharacter.MemberNumber,
            )
        ) {
            this.conn.SendMessage(
                "Whisper",
                "You already placed a bet. Use !cancel to cancel it.",
                senderCharacter.MemberNumber,
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
                this.conn.SendMessage(
                    "Whisper",
                    "Invalid stake.",
                    senderCharacter.MemberNumber,
                );
                return;
            }
            stakeValue = parseInt(stake, 10);
            if (isNaN(stakeValue) || stakeValue < 1) {
                this.conn.SendMessage(
                    "Whisper",
                    "Invalid stake.",
                    senderCharacter.MemberNumber,
                );
                return;
            }
        }
        return {
            memberNumber: senderCharacter.MemberNumber,
            memberName: senderCharacter.toString(),
            stake: stakeValue,
            stakeForfeit,
            status: "pending",
        };
    }

    private async resolveGame(): Promise<void> {
        clearTimeout(this.autoFoldTimeout);
        this.autoFoldTimeout = undefined;
        await this.showHands(false);

        let message = `Dealer has a hand of ${this.handToString(this.dealerHand)}\n`;

        const sign = this.casino.getSign();
        sign.setProperty("Text", "Dealer has");
        sign.setProperty("Text2", `${this.handToString(this.dealerHand)}`);
        this.casino.setTextColor("#ffffff");

        for (const player of this.players) {
            const playerHand = this.playerHands.get(player.bet);
            if (!playerHand) {
                console.error(
                    `No hand found for player ${player.memberName} (${player.memberNumber})`,
                );
                continue;
            }
            const winnings = this.getWinnings(playerHand, player.bet);

            if (winnings > 0) {
                const winnerMemberData = await this.casino.store.getPlayer(
                    player.memberNumber,
                );
                winnerMemberData.credits += winnings;
                winnerMemberData.score += winnings;
                await this.casino.store.savePlayer(winnerMemberData);
                message += `${player.memberName} wins ${winnings} credits\n`;
            } else if (player.bet.stakeForfeit && winnings !== -1) {
                this.casino.applyForfeit(
                    player.bet,
                    player.bet.status === "playing" ? 1 : 0.5,
                );
                let time =
                    FORFEITS[player.bet.stakeForfeit].lockTimeMs / 1000 / 60;
                time = player.bet.status === "playing" ? time : time / 2;
                message += `${player.memberName} lost and gets ${FORFEITS[player.bet.stakeForfeit].name} for ${time} Minutes!\n`;
            }
        }
        this.clear();
        this.willDealAt = undefined;
        this.casino.multiplier = 1;

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
        }, RESET_TIMEOUT_MS);

        this.conn.SendMessage("Chat", message);
    }

    placeBet(bet: ThreeCardPokerBet): void {
        this.players.push({
            memberNumber: bet.memberNumber,
            memberName: bet.memberName,
            bet,
        });
        if (bet.stakeForfeit) {
            this.conn.SendMessage(
                "Chat",
                `${bet.memberName} bets ${FORFEITS[bet.stakeForfeit].name} for ${bet.stake} credits`,
            );
        } else {
            this.conn.SendMessage(
                "Chat",
                `${bet.memberName} bets ${bet.stake} credits`,
            );
        }
    }

    getBets(): ThreeCardPokerBet[] {
        return this.players.map((b) => b.bet);
    }
    public getBetsForPlayer(memberNumber: number): ThreeCardPokerBet[] {
        return this.players
            .filter((b) => b.memberNumber === memberNumber)
            .flatMap((b) => b.bet);
    }

    public clearBetsForPlayer(memberNumber: number): undefined {
        this.players = this.players.filter(
            (b) => b.memberNumber !== memberNumber,
        );
    }

    onCommandBet = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (this.resetTimeout !== undefined) {
            this.conn.SendMessage(
                "Whisper",
                "The next game hasn't started yet",
                sender.MemberNumber,
            );
            return;
        }
        if (
            this.autoFoldTimeout !== undefined ||
            this.willDealAt - Date.now() < BET_CANCEL_THRESHOLD_MS
        ) {
            this.conn.SendMessage(
                "Whisper",
                "You can't bet right now.",
                sender.MemberNumber,
            );
            return;
        }

        const bet = this.parseBetCommand(sender, msg, args);
        if (bet === undefined) {
            return;
        }

        const player = await this.casino.store.getPlayer(sender.MemberNumber);
        if (bet.stakeForfeit === undefined) {
            if (player.credits - bet.stake * 2 < 0) {
                this.conn.SendMessage(
                    "Whisper",
                    `You don't have enough chips (Remember that you need double your bet so you can play).`,
                    sender.MemberNumber,
                );
                return;
            }
            player.credits -= bet.stake;
            await this.casino.store.savePlayer(player);
        } else {
            const blockers = getItemsBlockingForfeit(
                sender,
                FORFEITS[bet.stakeForfeit].items(sender),
            );
            if (blockers.length > 0) {
                console.log(
                    `Blocked forfeit bet of ${bet.stakeForfeit} with blockers `,
                    blockers,
                );
                this.conn.SendMessage(
                    "Whisper",
                    `You can't bet that while you have: ${blockers.map((i) => i.Name).join(", ")}`,
                    sender.MemberNumber,
                );
                return;
            }
            const canInteract = await sender.GetAllowItem();
            if (!canInteract) {
                this.conn.SendMessage(
                    "Whisper",
                    "You'll need to open up your permissions or whitelist the bot to bet restraints.",
                    sender.MemberNumber,
                );
                return;
            }

            const needItems = [...FORFEITS[bet.stakeForfeit].items(sender)];
            if (FORFEITS[bet.stakeForfeit].lock)
                needItems.push(FORFEITS[bet.stakeForfeit].lock);
            const blocked = needItems.filter(
                (i) => !sender.IsItemPermissionAccessible(i),
            );
            if (blocked.length > 0) {
                this.conn.SendMessage(
                    "Whisper",
                    `You can't bet that forfeit because you've blocked: ${blocked.map((i) => i.Name).join(", ")}.`,
                    player.memberNumber,
                );
                return;
            }

            bet.stake *= this.casino.multiplier;
        }

        if (FORFEITS[bet.stakeForfeit]?.items(sender).length === 1) {
            const forfeitItem = FORFEITS[bet.stakeForfeit].items(sender)[0];
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

    onCommandPlay = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (this.autoFoldTimeout === undefined) {
            this.conn.SendMessage(
                "Whisper",
                "You can't hit right now.",
                sender.MemberNumber,
            );
            return;
        }
        const player = this.players.find(
            (p) => p.memberNumber === sender.MemberNumber,
        );
        const bet = player.bet;
        if (!bet) {
            this.conn.SendMessage(
                "Whisper",
                "You don't have a bet in play.",
                sender.MemberNumber,
            );
            return;
        } else if (bet.status !== "pending") {
            this.conn.SendMessage(
                "Whisper",
                "You already did your action.",
                sender.MemberNumber,
            );
            return;
        }
        if (this.playerHands.get(bet) === undefined) {
            this.conn.SendMessage(
                "Whisper",
                "You don't have a hand in play.",
                sender.MemberNumber,
            );
            return;
        }

        const playerStore = await this.casino.store.getPlayer(
            sender.MemberNumber,
        );

        if (bet.stakeForfeit === undefined) {
            if (playerStore.credits < bet.stake) {
                this.conn.SendMessage(
                    "Whisper",
                    "You don't have enough credits.",
                    sender.MemberNumber,
                );
                return;
            }

            playerStore.credits -= bet.stake;
            await this.casino.store.savePlayer(playerStore);
        }

        bet.status = "playing";

        this.conn.SendMessage(
            "Whisper",
            "You are playing.",
            sender.MemberNumber,
        );

        if (this.allPlayersDone()) this.resolveGame();
    };

    onCommandFold = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (this.autoFoldTimeout === undefined) {
            this.conn.SendMessage(
                "Whisper",
                "You can't hit right now.",
                sender.MemberNumber,
            );
            return;
        }
        const player = this.players.find(
            (p) => p.memberNumber === sender.MemberNumber,
        );
        const bet = player.bet;
        if (!bet) {
            this.conn.SendMessage(
                "Whisper",
                "You don't have a bet in play.",
                sender.MemberNumber,
            );
            return;
        } else if (bet.status !== "pending") {
            this.conn.SendMessage(
                "Whisper",
                "You already did your action.",
                sender.MemberNumber,
            );
            return;
        }
        if (this.playerHands.get(bet) === undefined) {
            this.conn.SendMessage(
                "Whisper",
                "You don't have a hand in play.",
                sender.MemberNumber,
            );
            return;
        }

        bet.status = "folded";

        this.conn.SendMessage(
            "Whisper",
            "You are folding.",
            sender.MemberNumber,
        );

        if (this.allPlayersDone()) this.resolveGame();
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
    private onFoldTimeout(): void {
        if (!this.willFoldAt) return;

        const sign = this.casino.getSign();
        const timeLeft = this.willFoldAt - Date.now();
        if (timeLeft <= 0) {
            this.players.forEach((player) => {
                if (player.bet.status == "pending") {
                    player.bet.status = "folded";
                }
            });
            this.conn.SendMessage(
                "Chat",
                "All open bets have been automatically folded.",
            );
            clearInterval(this.autoFoldTimeout);
            this.resolveGame();
        } else {
            this.casino.setTextColor("#ffffff");
            sign.setProperty("Text", "Time left");
            sign.setProperty("Text2", `${Math.ceil(timeLeft / 1000)}`);
        }
    }

    private allPlayersDone(): boolean {
        return this.players.every((player) => player.bet.status !== "pending");
    }

    onCommandCancel = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (this.getBetsForPlayer(sender.MemberNumber).length === 0) {
            this.conn.SendMessage(
                "Whisper",
                "You don't have a bet in play.",
                sender.MemberNumber,
            );
            return;
        }

        const timeLeft = this.willDealAt - Date.now();
        if (timeLeft <= BET_CANCEL_THRESHOLD_MS) {
            this.conn.SendMessage(
                "Whisper",
                "You can't cancel your bet now.",
                sender.MemberNumber,
            );
            return;
        }

        if (!this.getBetsForPlayer(sender.MemberNumber)[0].stakeForfeit) {
            const player = await this.casino.store.getPlayer(
                sender.MemberNumber,
            );

            this.getBetsForPlayer(sender.MemberNumber).forEach((b) => {
                player.credits += b.stake;
            });
            await this.casino.store.savePlayer(player);
        }

        this.clearBetsForPlayer(sender.MemberNumber);
        this.conn.SendMessage("Whisper", "Bet cancelled.", sender.MemberNumber);
    };

    getWinnings(playerHand: Hand, bet: ThreeCardPokerBet): number {
        const { rank: playerRank, highCard: playerHighCard } =
            this.evaluteHand(playerHand);
        const { rank: dealerRank, highCard: dealerHighCard } = this.evaluteHand(
            this.dealerHand,
        );

        if (bet.stakeForfeit) {
            if (playerRank > dealerRank) {
                return bet.stake;
            } else if (playerRank < dealerRank) {
                return 0;
            } else {
                if (playerHighCard > dealerHighCard) {
                    return bet.stake;
                } else if (playerHighCard < dealerHighCard) {
                    return 0;
                } else {
                    return -100; // push for forfeits
                }
            }
        } else {
            if (playerRank > dealerRank) {
                return bet.stake * 2;
            } else if (playerRank < dealerRank) {
                return 0;
            } else {
                if (playerHighCard > dealerHighCard) {
                    return bet.stake;
                } else if (playerHighCard < dealerHighCard) {
                    return 0;
                } else {
                    return bet.stake;
                }
            }
        }
    }

    clear(): void {
        this.players = [];
        this.playerHands.clear();
    }

    private async initialDeal(): Promise<void> {
        this.deck = createDeck();
        shuffleDeck(this.deck);

        this.dealerHand = [
            this.deck.pop()!,
            this.deck.pop()!,
            this.deck.pop()!,
        ];

        for (const player of this.players) {
            this.playerHands.set(player.bet, [
                this.deck.pop()!,
                this.deck.pop()!,
                this.deck.pop()!,
            ]);
        }

        this.autoFoldTimeout = setInterval(() => {
            this.onFoldTimeout();
        }, AUTO_FOLD_TIMEOUT_MS);
    }

    private evaluteHand(hand: Hand): { rank: HandRank; highCard: number } {
        const values = hand.map((card) => getNumericCardValue(card)).sort();
        const suits = hand.map((card) => card.suit).sort();

        const uniqueValues = new Set(values);
        const isStraight =
            (values[1] == values[0] + 1 && values[2] == values[1] + 1) ||
            (values.includes(14) && values.includes(2) && values.includes(3));
        const isFlush = suits.every((suit) => suit === suits[0]);
        const highCard =
            isStraight && values.includes(14) && values.includes(2)
                ? 3
                : values[values.length - 1]; // On a wheel the high card is 3 since the Ace counts as 1

        if (isStraight && isFlush) {
            return { rank: HandRank.StraightFlush, highCard };
        } else if (uniqueValues.size === 1) {
            return { rank: HandRank.ThreeOfAKind, highCard };
        } else if (isFlush) {
            return { rank: HandRank.Flush, highCard };
        } else if (isStraight) {
            return { rank: HandRank.Straight, highCard };
        } else if (uniqueValues.size === 2) {
            return { rank: HandRank.Pair, highCard };
        } else {
            return { rank: HandRank.HighCard, highCard };
        }
    }

    private async showHands(dealerHidden: boolean): Promise<void> {
        const handString = await this.buildHandString(dealerHidden);
        this.conn.SendMessage("Chat", handString);
    }

    private async buildHandString(
        dealerHidden: boolean,
        requestingPlayer: ThreeCardPokerPlayer | undefined = undefined,
    ): Promise<string> {
        let outString = dealerHidden
            ? ".\n"
            : `Dealer's hand: ${this.handToString(this.dealerHand)}\n`;
        for (const player of this.players) {
            const bet = player.bet;
            const hand = this.playerHands.get(bet);
            const handString = this.handToString(hand!);
            if (
                requestingPlayer &&
                player.memberNumber === requestingPlayer.memberNumber
            ) {
                outString += `> ${player.memberName} (${bet.memberNumber}) hand: ${handString}\n`;
            } else {
                outString += `${player.memberName} (${bet.memberNumber}) hand: ${handString}\n`;
            }
        }
        return outString;
    }

    private handToString(hand: Hand): string {
        if (!hand || hand.length === 0) {
            return "";
        }
        return hand.map((card) => `[${getCardString(card)}]`).join(", ");
    }
}
