/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Db } from "mongodb";
import { API_Connector } from "../apiConnector";
import { CommandParser } from "../commandParser";
import { RouletteGame } from "./casino/roulette";
import { API_Character, ItemPermissionLevel } from "../apiCharacter";
import { BC_Server_ChatRoomMessage, TBeepType } from "../logicEvent";
import { CasinoStore, Player } from "./casino/casinostore";
import { API_AppearanceItem, AssetGet, BC_AppearanceItem } from "../item";
import { remainingTimeString } from "../util/time";
import { importBundle } from "../appearance";
import {
    FORFEITS,
    forfeitsString,
    restraintsRemoveString,
    SERVICES,
    servicesString,
} from "./casino/forfeits";
import { Cocktail, COCKTAILS } from "./casino/cocktails";
import { generatePassword } from "../util/string";
import { Bet, Game } from "./casino/game";
import { BlackjackGame } from "./casino/blackjack";

const FREE_CHIPS = 20;

export function getItemsBlockingForfeit(
    char: API_Character,
    items: BC_AppearanceItem[],
): API_AppearanceItem[] {
    const slots = new Set(items.map((i) => i.Group));

    return char.Appearance.Appearance.filter((i) => slots.has(i.Group));
}

export const makeBio = (
    leaderBoard: string,
    exampleString: string,
    helpString: string,
) => `🎰🎰🎰 Welcome to the Casino! 🎰🎰🎰

All visitors will automatically ber awarded ${FREE_CHIPS} chips every day!
You can bet with either chips or forefeits. If you win when betting with a forfeit, you gain the corresponding
amount of chips in the forfeits table. If you lose, the forfeit is applied. You bet forfeits by
using the keyword in the table instead of a chip amount.

Examples:
${exampleString}

ℹ️ How To Play
==============
${helpString}
🪢 Forfeit Table
================
Restraints are for 20 minutes, unless otherwise stated.

${forfeitsString()}

🛒 Shop
=======
Restraint removal: /bot remove <name> (eg. /bot remove gag):
${restraintsRemoveString()}

Other:
${servicesString()}

(All services are subject to limits of the people involved, obviously)

🏆 Leaderboard
==============
${leaderBoard}

🍀🍀🍀 Good luck! 🍀🍀🍀

This bot is made with ropeybot, fixes and improvements welcome!
https://github.com/FriendsOfBC/ropeybot
`;

export interface CasinoConfig {
    cocktail: string;
}

export class Casino {
    private game: Game;
    public commandParser: CommandParser;
    public store: CasinoStore;
    private cocktailOfTheDay: Cocktail | undefined;
    public multiplier = 1;
    public lockedItems: Map<number, Map<AssetGroupName, number>> = new Map();

    private currentGame: "Roulette" | "Blackjack" = "Roulette";

    public constructor(
        private conn: API_Connector,
        db: Db,
        config?: CasinoConfig,
    ) {
        // The default game is roulette
        this.store = new CasinoStore(db);
        this.commandParser = new CommandParser(conn);
        this.game = new RouletteGame(conn, this);

        if (config?.cocktail) {
            this.cocktailOfTheDay = COCKTAILS[config.cocktail];
            if (this.cocktailOfTheDay === undefined) {
                throw new Error(`Unknown cocktail: ${config.cocktail}`);
            }
        }

        conn.on("CharacterEntered", this.onCharacterEntered);
        conn.on("Beep", this.onBeep);

        this.commandParser.register("bet", this.onCommandBet);
        this.commandParser.register("cancel", this.onCommandCancel);
        this.commandParser.register("help", this.onCommandHelp);
        this.commandParser.register("chips", this.onCommandChips);
        this.commandParser.register("addfriend", this.onCommandAddFriend);
        this.commandParser.register("remove", this.onCommandRemove);
        this.commandParser.register("buy", this.onCommandBuy);
        this.commandParser.register("vouchers", this.onCommandVouchers);
        this.commandParser.register("give", this.onCommandGive);
        this.commandParser.register("bonus", this.onCommandBonusRound);
        this.commandParser.register("game", this.onCommandGame);

        this.conn.setItemPermission(ItemPermissionLevel.OwnerOnly);
    }

    private onCharacterEntered = async (character: API_Character) => {
        const player = await this.store.getPlayer(character.MemberNumber);
        player.name = character.toString();

        const nextFreeCreditsAt = player.lastFreeCredits + 20 * 60 * 60 * 1000;
        if (nextFreeCreditsAt < Date.now()) {
            player.credits += FREE_CHIPS;
            player.lastFreeCredits = Date.now();
            await this.store.savePlayer(player);
            character.Tell(
                "Whisper",
                `Welcome to the Casino, ${character}! Here are your ${FREE_CHIPS} free chips for today. See my bio for how to play. Good luck!`,
            );
        } else {
            character.Tell(
                "Whisper",
                `Welcome back, ${character}. ${remainingTimeString(nextFreeCreditsAt)} until your next free chips. See my bio for how to play.`,
            );
        }
    };

    private onBeep = (beep: TBeepType) => {
        try {
            if (beep.Message?.startsWith("outfit add")) {
                const parts = beep.Message.split(" ");
                if (parts.length < 4) {
                    this.conn.AccountBeep(
                        beep.MemberNumber,
                        null,
                        "Usage: outfit add <name> <code>",
                    );
                    return;
                }
                const code = parts[parts.length - 1];
                const name = parts.slice(2, parts.length - 1).join(" ");

                try {
                    const outfit = importBundle(code);
                    this.store.saveOutfit({
                        name,
                        addedBy: beep.MemberNumber,
                        addedByName: beep.MemberName,
                        items: outfit,
                    });
                    this.conn.AccountBeep(
                        beep.MemberNumber,
                        null,
                        `Outfit ${name} added, thank you!`,
                    );
                } catch (e) {
                    this.conn.AccountBeep(
                        beep.MemberNumber,
                        null,
                        "Invalid outfit code",
                    );
                    return;
                }
            } else {
                this.conn.AccountBeep(
                    beep.MemberNumber,
                    null,
                    "Unknown command",
                );
            }
        } catch (e) {
            console.error("Failed to process beep", e);
        }
    };

    private onCommandBet = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        this.game.onCommandBet(sender, msg, args);
    };

    private onCommandCancel = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        this.game.onCommandCancel(sender, msg, args);
    };

    private onCommandHelp = (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        this.conn.reply(msg, this.game.HELPMESSAGE);
    };

    private onCommandChips = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (args.length > 0) {
            if (!sender.IsRoomAdmin()) {
                this.conn.reply(
                    msg,
                    "Only admins can see other people's balances.",
                );
                return;
            }

            const target = this.conn.chatRoom.findCharacter(args[0]);
            if (!target) {
                this.conn.reply(msg, "I can't find that person.");
                return;
            }
            const player = await this.store.getPlayer(target.MemberNumber);
            this.conn.reply(msg, `${target} has ${player.credits} chips.`);
        } else {
            const player = await this.store.getPlayer(sender.MemberNumber);
            this.conn.reply(
                msg,
                `${sender}, you have ${player.credits} chips.`,
            );
        }
    };

    public async setBio(): Promise<void> {
        const topPlayers = await this.store.getTopPlayers(50);
        const unredeemed = await this.store.getUnredeemedPurchases();

        this.conn.setBotDescription(
            makeBio(
                topPlayers
                    .map((player, idx) => {
                        return `${idx + 1}. ${player.name} (${player.memberNumber}): ${player.score} chips won`;
                    })
                    .join("\n"),
                this.game.EXAMPLES,
                this.game.HELPMESSAGE,
            ),
        );
    }

    private onCommandAddFriend = (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (!sender.IsRoomAdmin()) {
            this.conn.reply(msg, "Sorry, you need to be an admin");
            return;
        }

        if (args.length < 1) {
            this.conn.reply(msg, "Please specify a member number.");
            return;
        }

        const toAdd = this.conn.chatRoom.findCharacter(args[0]);
        if (!toAdd) {
            this.conn.reply(msg, "I can't find that person");
            return;
        }

        this.conn.Player.FriendListAdd(toAdd.MemberNumber);

        this.conn.reply(msg, `I am now friends with ${toAdd}! I like friends!`);
    };

    private onCommandRemove = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (args.length < 1) {
            this.conn.reply(msg, "Usage: /bot remove <restraint>");
            return;
        }

        const restraintName = args[0].toLowerCase();
        const restraint = FORFEITS[restraintName];
        if (!restraint) {
            this.conn.reply(msg, "Unknown restraint.");
            return;
        }

        const player = await this.store.getPlayer(sender.MemberNumber);
        if (player.credits < restraint.value * 4) {
            this.conn.reply(msg, "You don't have enough chips.");
            return;
        }

        if (!sender.Appearance.InventoryGet(restraint.items()[0].Group)) {
            this.conn.reply(
                msg,
                `It doesn't look like you're wearing ${restraint.name}.`,
            );
            return;
        }

        player.credits -= restraint.value * 4;
        await this.store.savePlayer(player);

        sender.Appearance.RemoveItem(restraint.items()[0].Group);

        this.lockedItems
            .get(sender.MemberNumber)
            ?.delete(restraint.items()[0].Group);

        this.conn.SendMessage(
            "Chat",
            `${sender} paid to remove their ${restraint.name}. Enjoy your freedom, while it lasts.`,
        );
    };

    private onCommandBuy = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (args.length < 1) {
            this.conn.reply(msg, "Usage: buy <service>");
            return;
        }

        const serviceName = args[0].toLowerCase();
        const service = SERVICES[serviceName];
        if (service === undefined) {
            this.conn.reply(msg, "Unknown service.");
            return;
        }

        let target: API_Character | undefined;
        if (serviceName === "player") {
            if (args.length < 2) {
                this.conn.reply(
                    msg,
                    "Usage: buy player <name or member number>",
                );
                return;
            }
            target = this.conn.chatRoom.findCharacter(args[1]);
            if (!target) {
                this.conn.reply(msg, "I can't find that person.");
                return;
            }

            if (target.MemberNumber === sender.MemberNumber) {
                this.conn.reply(msg, "You can't buy yourself.");
                return;
            }

            if (
                target.Appearance.InventoryGet("ItemDevices")?.Name !== "Kennel"
            ) {
                this.conn.reply(
                    msg,
                    "Sorry, that player is not for sale (yet...)",
                );
                return;
            }
        }

        const player = await this.store.getPlayer(sender.MemberNumber);
        if (player.credits < service.value) {
            this.conn.reply(msg, "You don't have enough chips.");
            return;
        }

        player.credits -= service.value;
        await this.store.savePlayer(player);

        if (serviceName === "player") {
            target.Appearance.RemoveItem("ItemDevices");
            if (!target.Appearance.InventoryGet("ItemNeck")) {
                target.Appearance.AddItem(
                    AssetGet("ItemNeck", "LeatherCollar"),
                );
            }
            target.Appearance.AddItem(
                AssetGet("ItemNeckRestraints", "CollarLeash"),
            );
            const sign = target.Appearance.AddItem(
                AssetGet("ItemMisc", "WoodenSign"),
            );
            sign.setProperty("Text", "Property of");
            sign.setProperty("Text2", sender.toString());

            this.conn.SendMessage(
                "Chat",
                `${sender} has bought ${target} and is now the proud owner of an unfortunate gambler.`,
            );
        } else if (serviceName === "cocktail") {
            const cocktail =
                this.cocktailOfTheDay ??
                COCKTAILS[
                    Math.floor(Math.random() * Object.keys(COCKTAILS).length)
                ];

            const cocktailItem = sender.Appearance.AddItem(
                AssetGet("ItemHandheld", "GlassFilled"),
            );
            cocktailItem.SetColor(cocktail.colour);
            cocktailItem.SetCraft({
                Name: cocktail.name,
                Description: cocktail.description,
                MemberName: this.conn.Player.toString(),
                MemberNumber: this.conn.Player.MemberNumber,
            });

            this.conn.SendMessage(
                "Chat",
                `Please enjoy your cocktail, ${sender}.`,
            );
        } else {
            await this.store.addPurchase({
                memberNumber: sender.MemberNumber,
                memberName: sender.toString(),
                time: Date.now(),
                service: serviceName,
                redeemed: false,
            });

            this.conn.SendMessage(
                "Chat",
                `${sender} has bought a voucher for ${service.name}! Please contact Ellie to redeem your service.`,
            );
        }
    };

    private onCommandVouchers = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (!sender.IsRoomAdmin()) {
            this.conn.reply(msg, "Sorry, you need to be an admin");
            return;
        }

        const purchases = await this.store.getUnredeemedPurchases();
        if (purchases.length === 0) {
            this.conn.reply(msg, "No vouchers outstanding");
            return;
        }

        this.conn.reply(
            msg,
            purchases
                .map(
                    (p) =>
                        `${p.memberName} (${p.memberNumber}): ${SERVICES[p.service].name}`,
                )
                .join("\n"),
        );
    };

    private onCommandGive = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (args.length < 2) {
            this.conn.reply(
                msg,
                "Usage: give <name or member number> <amount>",
            );
            return;
        }

        const amount = parseInt(args[1], 10);
        if (isNaN(amount) || amount < 1) {
            this.conn.reply(msg, "Invalid amount.");
            return;
        }

        const target = this.conn.chatRoom.findCharacter(args[0]);
        if (!target) {
            this.conn.reply(msg, "I can't find that person.");
            return;
        }

        const sourcePlayer = await this.store.getPlayer(sender.MemberNumber);
        if (sourcePlayer.credits < amount) {
            this.conn.reply(msg, "You don't have enough chips.");
            return;
        }

        const targetPlayer = await this.store.getPlayer(target.MemberNumber);

        sourcePlayer.credits -= amount;
        await this.store.savePlayer(sourcePlayer);
        targetPlayer.credits += amount;
        await this.store.savePlayer(targetPlayer);

        this.conn.SendMessage(
            "Chat",
            `${sender} gave ${amount} chips to ${target}`,
        );
    };

    private onCommandBonusRound = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (!sender.IsRoomAdmin()) {
            this.conn.reply(msg, "Sorry, you need to be an admin");
            return;
        }

        if (this.game.getBets().length > 0) {
            this.conn.reply(msg, "There are already bets placed.");
            return;
        }

        if (args.length > 0) {
            const multiplier = parseInt(args[0], 10);
            if (isNaN(multiplier) || multiplier < 1) {
                this.conn.reply(msg, "Invalid multiplier.");
                return;
            }
            this.multiplier = multiplier;
        } else {
            this.multiplier = 2;
        }

        this.conn.SendMessage(
            "Chat",
            `⭐️⭐️⭐️ Bonus round! ⭐️⭐️⭐️ All forfeit bets are worth ${this.multiplier}x their normal value!`,
        );
    };

    public getSign(): API_AppearanceItem {
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

    public setTextColor(color: string): void {
        this.getSign().SetColor(["Default", "Default", color]);
    }

    public applyForfeit(bet: Bet): void {
        const char = this.conn.chatRoom.findMember(bet.memberNumber);
        if (!char) return;

        const applyFn = FORFEITS[bet.stakeForfeit].applyItems;
        const items = FORFEITS[bet.stakeForfeit].items();

        if (items.length === 1) {
            const lockTime = FORFEITS[bet.stakeForfeit].lockTimeMs;
            if (lockTime) {
                this.lockedItems.set(
                    bet.memberNumber,
                    this.lockedItems.get(bet.memberNumber) ?? new Map(),
                );
                this.lockedItems
                    .get(bet.memberNumber)
                    ?.set(items[0].Group, Date.now() + lockTime);
            }
        }

        if (applyFn) {
            applyFn(char, this.conn.Player.MemberNumber);
        } else if (items.length === 1) {
            const characterHairColor =
                char.Appearance.InventoryGet("HairFront").GetColor();

            const added = char.Appearance.AddItem(items[0]);
            added.SetColor(characterHairColor);
            added.SetDifficulty(20);
            added.SetCraft({
                Name: `Pixie Casino ${FORFEITS[bet.stakeForfeit].name}`,
                Description:
                    "This item is property of Pixie Casino. Better luck next time!",
                MemberName: this.conn.Player.toString(),
                MemberNumber: this.conn.Player.MemberNumber,
            });
            if (FORFEITS[bet.stakeForfeit].lockTimeMs) {
                added.lock(
                    "TimerPasswordPadlock",
                    this.conn.Player.MemberNumber,
                    {
                        Password: generatePassword(),
                        Hint: "Better luck next time!",
                        RemoveItem: true,
                        RemoveTimer:
                            Date.now() + FORFEITS[bet.stakeForfeit].lockTimeMs,
                        ShowTimer: true,
                        LockSet: true,
                    },
                );
            }
        } else {
            char.Appearance.slowlyApplyBundle(items);
        }
    }

    public cheatPunishment(char: API_Character, player: Player): void {
        if (player.cheatStrikes === 1) {
            char.Tell("Whisper", "Cheating in the casino, hmm?");
        } else if (player.cheatStrikes === 2) {
            char.Tell("Whisper", `Still trying to cheat, ${char}?`);
        } else {
            const dunceHat = char.Appearance.AddItem(
                AssetGet("Hat", "CollegeDunce"),
            );
            dunceHat.SetColor("#741010");
            const sign = char.Appearance.AddItem(
                AssetGet("ItemMisc", "WoodenSign"),
            );
            sign.setProperty("Text", "Cheater");
            sign.setProperty("Text2", "");
        }
    }

    private onCommandGame = async (
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ) => {
        if (!sender.IsRoomAdmin()) {
            this.conn.reply(msg, "Sorry, you need to be an admin");
            return;
        }
        if (args.length < 1) {
            this.conn.reply(msg, "Usage: /bot game <game>");
            return;
        }
        const game = args[0].toLowerCase();
        if (game === "roulette" && this.currentGame !== "Roulette") {
            await this.game.endGame();
            this.game = new RouletteGame(this.conn, this);
            this.currentGame = "Roulette";
            this.conn.reply(msg, "Switched to roulette.");
        } else if (game === "blackjack" && this.currentGame !== "Blackjack") {
            await this.game.endGame();
            this.game = new BlackjackGame(this.conn, this);
            this.currentGame = "Blackjack";
            this.conn.reply(msg, "Switched to blackjack.");
        } else {
            this.conn.reply(msg, `Unknown game: ${game}`);
            return;
        }
        this.setBio();
    };
}
