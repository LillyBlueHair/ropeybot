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
    sortCards,
} from "./pokerCards";
import {
    API_Character,
    API_Connector,
    BC_Server_ChatRoomMessage,
    API_AppearanceItem,
    AssetGet,
} from "bc-bot";

//TODO
const TEXASHOLDEMCOMMANDS = `Three Card Poker commands:



/bot chips - Show your current chip balance.
/bot give <name or member number> <amount> - Give chips to another player.
/bot help - Show this help
/bot commands - Show all available commands.
/bot forfeits - Show available forfeits.
/bot checkforfeits - Shows all forfeits currently applied to you.
/bot score - Show your current score.
/bot color <color or Default> - Change the color of your forfeits. 
`;

//TODO
const TEXASHOLDEMHELP = `

Hand rankings from highest to lowest:
- Straight Flush (five cards in sequence of the same suit)
- Three of a Kind
- Straight (five cards in sequence)
- Flush (five cards of the same suit)
- Pair
- High Card`;

const TEXASHOLDEMHELPCOMMAND = `
${TEXASHOLDEMHELP}

For more information on commands or forfeits, use the following commands:
/bot commands - Show all available commands.
/bot forfeits - Show available forfeits.
`;

const TEXASHOLDEMEXAMPLES = `
/bot bet 10
    bets 10 chips
/bot bet leg binder
    bets the 'leg binder' forfeit (worth 7 chips)
`;
const FULLTEXASHOLDEMHELP = `${TEXASHOLDEMHELP}

${TEXASHOLDEMCOMMANDS}
`;

const TIME_UNTIL_DEAL_MS = 35000;
const BET_CANCEL_THRESHOLD_MS = 1000;
const AUTO_FOLD_TIMEOUT_MS = 45000;
const RESET_TIMEOUT_MS = 10000; // Time after a game ends before a new game can start

const MAX_PLAYERS = 6;

export interface TexasHoldemPlayer {
    memberNumber: number;
    memberName: string;
    bet: TexasHoldemBet;
}

export interface TexasHoldemBet extends Bet {
    stake: number;
    status: "pending" | "folded" | "waiting";
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

export class TexasHoldemGame implements Game {
    private casino: Casino;
    private deck: Card[] = [];
    private dealerHand: Hand = [];
    private playerHands: Map<TexasHoldemBet, Hand> = new Map();
    private willDealAt: number | undefined;
    private willFoldAt: number | undefined;
    private players: TexasHoldemPlayer[] = [];
    private resetTimeout: NodeJS.Timeout | undefined; // after finishing a game
    private dealTimeout: NodeJS.Timeout | undefined; // after first bet until the deal
    private autoFoldTimeout: NodeJS.Timeout; // after the deal until all players stand

    public HELPMESSAGE = FULLTEXASHOLDEMHELP;
    public EXAMPLES = TEXASHOLDEMEXAMPLES;
    public HELPCOMMANDMESSAGE = TEXASHOLDEMHELPCOMMAND;
    public COMMANDSMESSAGE = TEXASHOLDEMCOMMANDS;

    constructor(
        private conn: API_Connector,
        casino: Casino,
    ) {
        this.casino = casino;
        this.casino.commandParser.register("raise", this.onCommandRaise);
        this.casino.commandParser.register("check", this.onCommandCheck);
        this.casino.commandParser.register("fold", this.onCommandFold);
        this.casino.commandParser.register("sign", (sender, msg, args) => {
            const sign = this.casino.getSign();

            sign.setProperty("OverridePriority", { Text: 63 });
            sign.setProperty("Text", "Playing");
            sign.setProperty("Text2", "Poker");
            this.casino.setSignColor(["#202020", "Default", "#ffffff"]);
        });

        setTimeout(() => {
            this.getPole();
            const sign = this.casino.getSign();

            sign.setProperty("OverridePriority", { Text: 63 });
            sign.setProperty("Text", "Playing");
            sign.setProperty("Text2", "Poker");
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
    placeBet(bet: Bet): void {
        throw new Error("Method not implemented.");
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

    getGameSign(): API_AppearanceItem {
        let sign = this.conn.Player.Appearance.InventoryGet("ItemMisc");
        if (!sign) {
            sign = this.conn.Player.Appearance.AddItem(
                AssetGet("ItemMisc", "WoodenSign"),
            );
            sign.setProperty("Text", "");
            sign.setProperty("Text2", "");
        }
        return sign;
    }

    async endGame(): Promise<void> {
        await waitForCondition(() => this.willDealAt === undefined);
        // await wait(2000);

        this.casino.commandParser.unregister("raise");
        this.casino.commandParser.unregister("check");
        this.casino.commandParser.unregister("fold");
        this.casino.commandParser.unregister("sign");
        this.clear();
        resolve();
    }

    parseRaiseCommand(
        senderCharacter: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ): TexasHoldemBet | undefined {
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
                "I couldn't understand that raise. Try, eg. /bot raise 10",
                senderCharacter.MemberNumber,
            );
            return;
        }

        const stake = args[0];
        let stakeValue: number;

        if (!/^\d+$/.test(stake)) {
            this.conn.SendMessage(
                "Whisper",
                "Invalid stake",
                senderCharacter.MemberNumber,
            );
            return;
        }
        stakeValue = parseInt(stake, 10);
        if (isNaN(stakeValue) || stakeValue < 1) {
            this.conn.SendMessage(
                "Whisper",
                "Invalid stake",
                senderCharacter.MemberNumber,
            );
            return;
        }

        return {
            memberNumber: senderCharacter.MemberNumber,
            memberName: senderCharacter.toString(),
            stake: stakeValue,
            stakeForfeit: undefined,
            status: "waiting",
        };
    }

    private async resolveGame(): Promise<void> {
        //TODO
    }

    getBets(): TexasHoldemBet[] {
        return this.players.map((b) => b.bet);
    }

    public getBetsForPlayer(memberNumber: number): TexasHoldemBet[] {
        return this.players
            .filter((b) => b.memberNumber === memberNumber)
            .flatMap((b) => b.bet);
    }

    public clearBetsForPlayer(memberNumber: number): undefined {
        this.players = this.players.filter(
            (b) => b.memberNumber !== memberNumber,
        );
    }

    onCommandRaise = async (
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

        const raise = this.parseRaiseCommand(sender, msg, args);
        if (raise === undefined) {
            return;
        }

        const player = await this.casino.store.getPlayer(sender.MemberNumber);
        if (raise.stakeForfeit === undefined) {
            if (player.credits - raise.stake < 0) {
                this.conn.SendMessage(
                    "Whisper",
                    `You don't have enough chips.`,
                    sender.MemberNumber,
                );
                return;
            }
            player.credits -= raise.stake;
            await this.casino.store.savePlayer(player);
        }
    };

    onCommandCheck = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (this.autoFoldTimeout === undefined) {
            this.conn.SendMessage(
                "Whisper",
                "You can't check right now.",
                sender.MemberNumber,
            );
            return;
        }
        const player = this.players.find(
            (p) => p.memberNumber === sender.MemberNumber,
        );
        const bet = player.bet;
        if (bet.status === "folded") {
            this.conn.SendMessage(
                "Whisper",
                "You already folded.",
                sender.MemberNumber,
            );
            return;
        } else if (bet.status === "waiting") {
            this.conn.SendMessage(
                "Whisper",
                "It is not your turn.",
                sender.MemberNumber,
            );
            return;
        }

        //TODO check if you can check

        bet.status = "waiting";

        this.conn.SendMessage(
            "Chat",
            `${player.memberName} checks.`,
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
                "You can't fold right now.",
                sender.MemberNumber,
            );
            return;
        }

        const player = this.players.find(
            (p) => p.memberNumber === sender.MemberNumber,
        );

        const bet = player.bet;
        if (bet.status === "waiting") {
            this.conn.SendMessage(
                "Whisper",
                "It is not your turn.",
                sender.MemberNumber,
            );
            return;
        } else if(bet.status === "folded") {
            this.conn.SendMessage(
                "Whisper",
                "You already folded.",
                sender.MemberNumber,
            );
            return;
        }

        bet.status = "folded";

        this.conn.SendMessage(
            "Chat",
            `${player.memberName} folds.`,
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
            sign.setProperty("Text", "Texas Holdem");
            sign.setProperty("Text2", `${Math.ceil(timeLeft / 1000)}`);
        }
    }

    private allPlayersDone(): boolean {
        //TODO
        return false;
    }

    clear(): void {
        this.players = [];
        this.playerHands.clear();
    }

    private async initialDeal(): Promise<void> {
        this.deck = createDeck();
        shuffleDeck(this.deck);

        for (const player of this.players) {
            this.playerHands.set(
                player.bet,
                sortCards([
                    this.deck.pop()!,
                    this.deck.pop()!,
                ]),
            );
        }
        //TODO send players their cards
    }

    private evaluteHand(hand: Hand): { rank: HandRank; rankedCards: number[] } {
        //TODO evaluate with board
        return { rank: undefined, rankedCards: undefined}
    }

    private async showHands(): Promise<void> {
        const handString = await this.buildHandString();
        this.conn.SendMessage("Chat", handString);
    }

    private async buildHandString(
        requestingPlayer: TexasHoldemPlayer | undefined = undefined,
    ): Promise<string> {
        return ""
    }

    private handToString(
        hand: Hand,
        calculated: boolean = false,
        signFriendly: boolean = false,
    ): string {
        if (!hand || hand.length === 0) {
            return "";
        }
        if (calculated) {
            let rank = "";
            switch (this.evaluteHand(hand).rank) {
                case HandRank.StraightFlush:
                    rank = "Straight Flush";
                    break;
                case HandRank.ThreeOfAKind:
                    rank = "Three of a Kind";
                    break;
                case HandRank.Flush:
                    rank = "Flush";
                    break;
                case HandRank.Straight:
                    rank = "Straight";
                    break;
                case HandRank.Pair:
                    rank = "Pair";
                    break;
                case HandRank.HighCard:
                    rank = "High Card";
                    break;
                default:
                    break;
            }
            return (
                hand.map((card) => `[${getCardString(card)}]`).join(", ") +
                ` (${rank})`
            );
        }
        if (signFriendly) {
            return hand
                .map((card) => `${getCardString(card, signFriendly)}`)
                .join(" ");
        }
        return hand.map((card) => `[${getCardString(card)}]`).join(", ");
    }
}
