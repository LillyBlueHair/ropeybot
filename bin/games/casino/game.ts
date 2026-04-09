import { API_Character, BC_Server_ChatRoomMessage } from "bc-bot";

export interface Game {
    HELPMESSAGE: string;
    HELPCOMMANDMESSAGE: string;
    COMMANDSMESSAGE: string;
    EXAMPLES: string;

    parseRaiseCommand(
        senderCharacter: API_Character,
        msg: BC_Server_ChatRoomMessage,
        args: string[],
    ): Bet | undefined;

    placeBet(bet: Bet): void;

    getBets(): Bet[];

    getBetsForPlayer(memberNumber: number): Bet[];

    clearBetsForPlayer(memberNumber: number): undefined;

    endGame(): Promise<void>;

    clear(): void;
}

export interface Bet {
    memberNumber: number;
    memberName: string;
    stake: number;
    stakeForfeit: string;
}
