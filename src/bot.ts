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

import { KidnappersGameRoom } from "./hub/logic/kidnappersGameRoom";
import { API_Connector } from "./apiConnector";
import { RoleplaychallengeGameRoom } from "./hub/logic/roleplaychallengeGameRoom";
import { Dare } from "./games/dare";
import { readFile } from "fs/promises";
import { ConfigFile } from "./config";
import { Db, MongoClient } from "mongodb";
import { PetSpa } from "./games/petspa";
import { Lillypad } from "./rooms/lillypad";

const SERVER_URL = {
    live: "https://bondage-club-server.herokuapp.com/",
    test: "https://bondage-club-server-test.herokuapp.com/",
};

export interface RopeyBot {
    connector: API_Connector;
    config: ConfigFile;
    db?: Db;
    game: string;
}



export async function startBot(): Promise<RopeyBot> {
    process.on("SIGINT", () => {
        console.log("SIGINT received, exiting");
        process.exit(0);
    });

    process.on("SIGTERM", () => {
        console.log("SIGTERM received, exiting");
        process.exit(0);
    });

    const cfgFile = process.argv[2] ?? "./config.json";

    const configString = await readFile(cfgFile, "utf-8");
    const config = JSON.parse(configString) as ConfigFile;

    const serverUrl = config.url ?? SERVER_URL[config.env];

    if (!serverUrl) {
        console.log("env must be live or test");
        process.exit(1);
    }

    let db;
    if (config.mongo_uri && config.mongo_db) {
        const mongoClient = new MongoClient(config.mongo_uri, {
            ssl: true,
            tls: true,
        });
        console.log("Connecting to mongo...");
        await mongoClient.connect();
        console.log("...connected!");
        db = mongoClient.db(config.mongo_db);
        await db.command({ ping: 1 });
        console.log("...ping successful!");
    }

    const connector = new API_Connector(
        serverUrl,
        config.user,
        config.password,
        config.env,
    );
    await connector.joinOrCreateRoom(config.room);

    switch (config.game) {
        case undefined:
            break;
        case "kidnappers":
            console.log("Starting game: Kidnappers");
            const kidnappersGame = new KidnappersGameRoom(connector, config);
            connector.accountUpdate({ Nickname: "Kidnappers Bot" });
            connector.setBotDescription(KidnappersGameRoom.description);
            connector.startBot(kidnappersGame);
            break;
        case "roleplay":
            console.log("Starting game: Roleplay challenge");
            const roleplayGame = new RoleplaychallengeGameRoom(
                connector,
                config,
            );
            connector.setBotDescription(RoleplaychallengeGameRoom.description);
            connector.startBot(roleplayGame);
            break;
        case "dare":
            console.log("Starting game: dare");
            new Dare(connector);
            connector.setBotDescription(Dare.description);
            break;
        case "petspa":
            console.log("Starting game: Pet Spa");
            const petSpaGame = new PetSpa(connector);
            await petSpaGame.init();
            connector.setBotDescription(PetSpa.description);
            break;
        case "lillypad":
            const lillypad = new Lillypad(connector, config);
            await lillypad.init();
            connector.setBotDescription(Lillypad.description);            
            console.log("Starting map: Lillypad");
            break;
        default:
            console.log("No such game");
            process.exit(1);
    }

    return {
        connector,
        config,
        db,
        game: config.game,
    };
}
