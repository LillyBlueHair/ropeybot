import { API_Character } from "../../apiCharacter";
import { BC_Server_ChatRoomMessage } from "../../logicEvent";
import { CasinoStore } from "./casinostore";
import { RouletteBet } from "./roulette";

export interface Game {

    parseBetCommand(
        senderCharacter: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ): Bet | undefined;

    placeBet(bet: Bet): void;

    textForBet(bet: Bet): string;

    getBets(): Bet[];

    getBetsForPlayer(memberNumber: number): Bet[];

    clearBetsForPlayer(memberNumber: number): undefined;

    onCommandBet(
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    );

    onCommandCancel(
        sender: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    );

    getWinnings(winningNumber: number, bet: Bet): number;

    clear(): void;
}

export interface Bet {
    memberNumber: number;
    memberName: string;
    stake: number;
    stakeForfeit: string;
}