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

import { ChatRoomMapViewGetObjectAtPos, CurrentTime } from "./defs.ts";

// dummy definitions so the below can be copied from BC as verbatim as possible
const Player = {
    MapData: {
        PrivateState: {
            HasKeyBronze: false,
            HasKeySilver: false,
            HasKeyGold: false,
        },
    },
    CanInteract: () => true,
};

const ChatRoomPlayerIsAdmin = () => false;

// Taken from BC (with just conversion into TS syntax)
export const ChatRoomMapViewTileList: ChatRoomMapTile[] = [
    { ID: 100, Type: "Floor", Style: "OakWood" },
    { ID: 110, Type: "Floor", Style: "Stone" },
    { ID: 115, Type: "Floor", Style: "Pavement" },
    { ID: 120, Type: "Floor", Style: "Ceramic" },
    { ID: 130, Type: "Floor", Style: "CarpetPink" },
    { ID: 131, Type: "Floor", Style: "CarpetBlue" },
    { ID: 132, Type: "Floor", Style: "CarpetRed" },
    { ID: 140, Type: "Floor", Style: "Padded" },

    { ID: 200, Type: "FloorExterior", Style: "Dirt" },
    { ID: 210, Type: "FloorExterior", Style: "Grass" },
    { ID: 215, Type: "FloorExterior", Style: "LongGrass" },
    { ID: 220, Type: "FloorExterior", Style: "Sand" },
    { ID: 230, Type: "FloorExterior", Style: "Gravel" },
    { ID: 235, Type: "FloorExterior", Style: "Asphalt" },
    { ID: 240, Type: "FloorExterior", Style: "Snow" },
    { ID: 250, Type: "FloorExterior", Style: "StoneSquareGray" },

    { ID: 1000, Type: "Wall", Style: "MixedWood", BlockVision: true },
    { ID: 1001, Type: "Wall", Style: "CedarWood", BlockVision: true },
    { ID: 1010, Type: "Wall", Style: "Log", BlockVision: true },
    { ID: 1020, Type: "Wall", Style: "Japanese", BlockVision: true },
    { ID: 1030, Type: "Wall", Style: "Stone", BlockVision: true },
    { ID: 1040, Type: "Wall", Style: "Brick", BlockVision: true },
    { ID: 1050, Type: "Wall", Style: "Dungeon", BlockVision: true },
    {
        ID: 1060,
        Type: "Wall",
        Style: "Square",
        BlockVision: true,
        BlockHearing: true,
    },
    {
        ID: 1070,
        Type: "Wall",
        Style: "Steel",
        BlockVision: true,
        BlockHearing: true,
    },
    {
        ID: 1080,
        Type: "Wall",
        Style: "Padded",
        BlockVision: true,
        BlockHearing: true,
    },

    {
        ID: 2000,
        Type: "Water",
        Style: "Pool",
        Transparency: 0.5,
        TransparencyCutoutHeight: 0.45,
    },
    {
        ID: 2010,
        Type: "Water",
        Style: "Sea",
        Transparency: 0.5,
        TransparencyCutoutHeight: 0.45,
    },
    {
        ID: 2020,
        Type: "Water",
        Style: "Ocean",
        Transparency: 0.5,
        TransparencyCutoutHeight: 0.3,
    },
    {
        ID: 2025,
        Type: "Water",
        Style: "OceanCyan",
        Transparency: 0.5,
        TransparencyCutoutHeight: 0.3,
    },
];

export const ChatRoomMapViewObjectList: ChatRoomMapObject[] = [
    { ID: 100, Type: "FloorDecoration", Style: "Blank" },
    {
        ID: 110,
        Type: "FloorDecoration",
        Style: "EntryFlag",
        Top: -0.125,
        Exit: true,
        Unique: true,
    },
    {
        ID: 115,
        Type: "FloorDecoration",
        Style: "ExitFlag",
        Top: -0.125,
        Exit: true,
    },
    { ID: 120, Type: "FloorDecoration", Style: "BedTeal", Top: -0.25 },
    { ID: 130, Type: "FloorDecoration", Style: "PillowPink" },
    { ID: 140, Type: "FloorDecoration", Style: "TableBrown" },
    {
        ID: 151,
        Type: "FloorDecoration",
        Style: "ChairWood",
        Top: -0.5,
        Height: 1.5,
    },
    {
        ID: 150,
        Type: "FloorDecoration",
        Style: "ThroneRed",
        Top: -1,
        Height: 2,
    },
    {
        ID: 160,
        Type: "FloorDecoration",
        Style: "KeyBronze",
        OnEnter: function () {
            Player.MapData.PrivateState.HasKeyBronze = true;
        },
        IsVisible: function () {
            return !Player.MapData.PrivateState.HasKeyBronze;
        },
    },
    {
        ID: 162,
        Type: "FloorDecoration",
        Style: "KeySilver",
        OnEnter: function () {
            Player.MapData.PrivateState.HasKeySilver = true;
        },
        IsVisible: function () {
            return !Player.MapData.PrivateState.HasKeySilver;
        },
    },
    {
        ID: 164,
        Type: "FloorDecoration",
        Style: "KeyGold",
        OnEnter: function () {
            Player.MapData.PrivateState.HasKeyGold = true;
        },
        IsVisible: function () {
            return !Player.MapData.PrivateState.HasKeyGold;
        },
    },

    { ID: 200, Type: "FloorDecorationThemed", Style: "Blank" },
    {
        ID: 210,
        Type: "FloorDecorationThemed",
        Style: "TeacherDesk",
        Top: -0.25,
    },
    { ID: 220, Type: "FloorDecorationThemed", Style: "StudentDesk", Top: -0.1 },
    { ID: 250, Type: "FloorDecorationThemed", Style: "SinkDishes", Top: -0.35 },
    {
        ID: 260,
        Type: "FloorDecorationThemed",
        Style: "LaundryMachine",
        Top: -0.55,
        Height: 1.25,
    },
    {
        ID: 270,
        Type: "FloorDecorationThemed",
        Style: "IroningBoard",
        Top: -0.35,
    },
    {
        ID: 300,
        Type: "FloorDecorationThemed",
        Style: "ShibariFrame",
        Top: -1,
        Height: 2,
    },
    {
        ID: 310,
        Type: "FloorDecorationThemed",
        Style: "JapaneseTable",
        Top: -0.1,
    },
    { ID: 320, Type: "FloorDecorationThemed", Style: "BanzaiTree", Top: -0.1 },
    {
        ID: 350,
        Type: "FloorDecorationThemed",
        Style: "MedicalDesk",
        Top: -0.15,
    },

    { ID: 500, Type: "FloorDecorationParty", Style: "Blank" },
    {
        ID: 510,
        Type: "FloorDecorationParty",
        Style: "BalloonFiveColor",
        Top: -0.6,
        Height: 1.5,
    },
    {
        ID: 511,
        Type: "FloorDecorationParty",
        Style: "BalloonTwoHeart",
        Top: -0.15,
    },
    {
        ID: 520,
        Type: "FloorDecorationParty",
        Style: "WeddingCake",
        Top: -1,
        Height: 2,
    },
    {
        ID: 521,
        Type: "FloorDecorationParty",
        Style: "WeddingArch",
        Top: -1,
        Height: 2,
    },
    {
        ID: 530,
        Type: "FloorDecorationParty",
        Style: "FlowerVasePink",
        Top: -0.33,
    },
    {
        ID: 560,
        Type: "FloorDecorationParty",
        Style: "BeachUmbrellaStripe",
        Top: -1.1,
        Height: 2,
    },
    { ID: 570, Type: "FloorDecorationParty", Style: "BeachTowelStripe" },

    { ID: 600, Type: "FloorDecorationCamping", Style: "Blank" },
    { ID: 610, Type: "FloorDecorationCamping", Style: "LogFire", Top: -0.35 },
    {
        ID: 611,
        Type: "FloorDecorationCamping",
        Style: "LogFireAnim0",
        Height: 1,
        Top: -0.5,
        BuildImageName: function (X, Y) {
            let Frame = (Math.floor(CurrentTime / 150) + X + Y * 3) % 10;
            return "LogFireAnim" + Frame.toString();
        },
    },
    { ID: 620, Type: "FloorDecorationCamping", Style: "LogSingle", Top: -0.2 },
    { ID: 630, Type: "FloorDecorationCamping", Style: "TentBlue", Top: -0.3 },
    { ID: 640, Type: "FloorDecorationCamping", Style: "SleepingBagBlue" },
    { ID: 650, Type: "FloorDecorationCamping", Style: "ChairRed", Top: -0.35 },
    { ID: 660, Type: "FloorDecorationCamping", Style: "Hurdle1" },
    { ID: 670, Type: "FloorDecorationCamping", Style: "Hurdle2" },
    { ID: 680, Type: "FloorDecorationCamping", Style: "Hurdle3" },

    { ID: 700, Type: "FloorDecorationExpanding", Style: "Blank" },
    {
        ID: 710,
        Type: "FloorDecorationExpanding",
        Style: "CouchPinkPreview",
        BuildImageName: function (X, Y) {
            let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
            let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
            if (
                LeftObject != null &&
                LeftObject.ID == this.ID &&
                RightObject != null &&
                RightObject.ID == this.ID
            )
                return "CouchPinkMiddle";
            if (LeftObject != null && LeftObject.ID == this.ID)
                return "CouchPinkRight";
            if (RightObject != null && RightObject.ID == this.ID)
                return "CouchPinkLeft";
            return "CouckPinkSmall";
        },
        Top: -0.35,
    },
    {
        ID: 720,
        Type: "FloorDecorationExpanding",
        Style: "BedBluePreview",
        BuildImageName: function (X, Y) {
            let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
            let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
            if (
                LeftObject != null &&
                LeftObject.ID == this.ID &&
                RightObject != null &&
                RightObject.ID == this.ID
            )
                return "BedBlueMiddle";
            if (LeftObject != null && LeftObject.ID == this.ID)
                return "BedBlueRight";
            if (RightObject != null && RightObject.ID == this.ID)
                return "BedBlueLeft";
            return "BedBlueSmall";
        },
        Top: -1,
        Height: 2,
    },
    {
        ID: 730,
        Type: "FloorDecorationExpanding",
        Style: "BallPitPreview",
        BuildImageName: function (X, Y) {
            let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
            let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
            if (
                LeftObject != null &&
                LeftObject.ID == this.ID &&
                RightObject != null &&
                RightObject.ID == this.ID
            )
                return "BallPitMiddle";
            if (LeftObject != null && LeftObject.ID == this.ID)
                return "BallPitRight";
            if (RightObject != null && RightObject.ID == this.ID)
                return "BallPitLeft";
            return "BallPitSmall";
        },
        Top: -0.25,
        Height: 1.25,
        Transparency: 1,
        TransparencyCutoutHeight: 0.96,
    },
    { ID: 800, Type: "FloorDecorationAnimal", Style: "Blank" },
    {
        ID: 810,
        Type: "FloorDecorationAnimal",
        Style: "CatCaramelHappy",
        Top: -0.2,
        BuildImageName: function (X, Y) {
            let Frame =
                (Math.floor((CurrentTime + X * 331 + Y * 197) / 2500) +
                    X * 331 +
                    Y * 197) %
                100;
            let Anim;
            if (Frame >= 25 && Frame <= 27) Anim = "Stretch";
            else if (Frame >= 28 && Frame <= 30) Anim = "Idle";
            else if (Frame >= 31 && Frame <= 33) Anim = "Happy";
            else if (Frame >= 34 && Frame <= 35) Anim = "Idle";
            else if (Frame >= 36 && Frame <= 38) Anim = "Meow";
            else if (Frame >= 39 && Frame <= 40) Anim = "Happy";
            else if (Frame >= 41 && Frame <= 42) Anim = "Idle";
            else if (Frame >= 43 && Frame <= 44) Anim = "Happy";
            else if (Frame >= 45 && Frame <= 49) Anim = "Play";
            else if (Frame >= 50 && Frame <= 51) Anim = "Meow";
            else if (Frame >= 52 && Frame <= 54) Anim = "Idle";
            else if (Frame >= 55 && Frame <= 60) Anim = "Sleep";
            else if (Frame >= 61 && Frame <= 62) Anim = "Idle";
            else if (Frame >= 63 && Frame <= 65) Anim = "Play";
            else if (Frame >= 66 && Frame <= 69) Anim = "Stretch";
            else if (Frame >= 70 && Frame <= 72) Anim = "Meow";
            else if (Frame >= 73 && Frame <= 74) Anim = "Idle";
            else if (Frame >= 75 && Frame <= 75) Anim = "Happy";
            else if (Frame >= 76 && Frame <= 76) Anim = "Idle";
            else if (Frame >= 77 && Frame <= 79) Anim = "Meow";
            else if (Frame >= 80 && Frame <= 81) Anim = "Stretch";
            else if (Frame >= 82 && Frame <= 85) Anim = "Play";
            else if (Frame >= 86 && Frame <= 87) Anim = "Meow";
            else if (Frame >= 88 && Frame <= 90) Anim = "Happy";
            else if (Frame >= 91 && Frame <= 94) Anim = "Idle";
            else if (Frame >= 95 && Frame <= 96) Anim = "Meow";
            else if (Frame >= 97 && Frame <= 100) Anim = "Stretch";
            else Anim = "Sleep";
            return "CatCaramel" + Anim;
        },
    },
    {
        ID: 820,
        Type: "FloorDecorationAnimal",
        Style: "DogBrownHappy",
        Top: -0.4,
        BuildImageName: function (X, Y) {
            let Frame =
                (Math.floor((CurrentTime + X * 347 + Y * 179) / 2000) +
                    X * 347 +
                    Y * 179) %
                100;
            let Anim;
            if (Frame >= 20 && Frame <= 22) Anim = "Roll";
            else if (Frame >= 23 && Frame <= 24) Anim = "Search";
            else if (Frame >= 25 && Frame <= 25) Anim = "Howl";
            else if (Frame >= 26 && Frame <= 27) Anim = "Crazy";
            else if (Frame >= 28 && Frame <= 30) Anim = "Happy";
            else if (Frame >= 31 && Frame <= 31) Anim = "Play";
            else if (Frame >= 32 && Frame <= 34) Anim = "Scratch";
            else if (Frame >= 35 && Frame <= 36) Anim = "Play";
            else if (Frame >= 37 && Frame <= 39) Anim = "Ball";
            else if (Frame >= 40 && Frame <= 41) Anim = "Crazy";
            else if (Frame >= 42 && Frame <= 44) Anim = "Search";
            else if (Frame >= 45 && Frame <= 46) Anim = "Howl";
            else if (Frame >= 47 && Frame <= 49) Anim = "Roll";
            else if (Frame >= 50 && Frame <= 50) Anim = "Search";
            else if (Frame >= 51 && Frame <= 52) Anim = "Scratch";
            else if (Frame >= 53 && Frame <= 64) Anim = "Happy";
            else if (Frame >= 55 && Frame <= 63) Anim = "Sleep";
            else if (Frame >= 64 && Frame <= 67) Anim = "Search";
            else if (Frame >= 68 && Frame <= 70) Anim = "Ball";
            else if (Frame >= 71 && Frame <= 72) Anim = "Crazy";
            else if (Frame >= 73 && Frame <= 73) Anim = "Howl";
            else if (Frame >= 74 && Frame <= 74) Anim = "Play";
            else if (Frame >= 75 && Frame <= 75) Anim = "Howl";
            else if (Frame >= 76 && Frame <= 78) Anim = "Scratch";
            else if (Frame >= 79 && Frame <= 82) Anim = "Roll";
            else if (Frame >= 83 && Frame <= 84) Anim = "Search";
            else if (Frame >= 85 && Frame <= 86) Anim = "Ball";
            else if (Frame >= 87 && Frame <= 89) Anim = "Crazy";
            else if (Frame >= 90 && Frame <= 91) Anim = "Happy";
            else if (Frame >= 92 && Frame <= 92) Anim = "Howl";
            else if (Frame >= 93 && Frame <= 94) Anim = "Search";
            else if (Frame >= 95 && Frame <= 97) Anim = "Scratch";
            else if (Frame >= 98 && Frame <= 100) Anim = "Roll";
            else Anim = "Sleep";
            return "DogBrown" + Anim;
        },
    },

    {
        ID: 830,
        Type: "FloorDecorationAnimal",
        Style: "RabbitBrownStand",
        Top: -0.3,
        BuildImageName: function (X, Y) {
            let Frame =
                (Math.floor((CurrentTime + X * 349 + Y * 193) / 1700) +
                    X * 347 +
                    Y * 193) %
                200;
            let Anim;
            let F = Frame % 100;
            if (F >= 2 && F <= 5) Anim = "Idle";
            else if (F >= 6 && F <= 7) Anim = "Watch";
            else if (F >= 8 && F <= 9) Anim = "Idle";
            else if (F >= 10 && F <= 13) Anim = "Wait";
            else if (F >= 14 && F <= 16) Anim = "Cute";
            else if (F >= 17 && F <= 21) Anim = "Stand";
            else if (F >= 22 && F <= 23) Anim = "Cute";
            else if (F >= 24 && F <= 27) Anim = "Wait";
            else if (F >= 28 && F <= 30) Anim = "Watch";
            else if (F >= 31 && F <= 34) Anim = "Idle";
            else if (F >= 35 && F <= 41) Anim = "Relax";
            else if (F >= 42 && F <= 44) Anim = "Wait";
            else if (F >= 45 && F <= 45) Anim = "Idle";
            else if (F >= 46 && F <= 49) Anim = "Wait";
            else if (F >= 50 && F <= 55) Anim = "Cute";
            else if (F >= 56 && F <= 59) Anim = "Stand";
            else if (F >= 60 && F <= 61) Anim = "Cute";
            else if (F >= 62 && F <= 64) Anim = "Relax";
            else if (F >= 65 && F <= 69) Anim = "Watch";
            else if (F >= 70 && F <= 74) Anim = "Wait";
            else if (F >= 75 && F <= 76) Anim = "Idle";
            else if (F >= 77 && F <= 82) Anim = "Relax";
            else if (F >= 83 && F <= 85) Anim = "Wait";
            else if (F >= 86 && F <= 89) Anim = "Watch";
            else if (F >= 90 && F <= 91) Anim = "Idle";
            else if (F >= 92 && F <= 94) Anim = "Relax";
            else if (F >= 95 && F <= 98) Anim = "Cute";
            else Anim = "Stand";
            return "RabbitBrown" + Anim + (Frame >= 100 ? "Right" : "");
        },
    },
    {
        ID: 840,
        Type: "FloorDecorationAnimal",
        Style: "ChickenBrownIdleLeft",
        Left: 0.25,
        Width: 0.5,
        Height: 0.5,
        BuildImageName: function (X, Y) {
            let Frame =
                (Math.floor((CurrentTime + X * 367 + Y * 173) / 1500) +
                    X * 367 +
                    Y * 173) %
                100;
            let Anim;
            if (Frame >= 14 && Frame <= 16) Anim = "IdleLeft";
            else if (Frame == 17) Anim = "EatLeft";
            else if (Frame == 18) Anim = "IdleLeft";
            else if (Frame == 19) Anim = "EatLeft";
            else if (Frame == 20) Anim = "IdleLeft";
            else if (Frame == 21) Anim = "EatLeft";
            else if (Frame >= 22 && Frame <= 24) Anim = "IdleLeft";
            else if (Frame == 25) Anim = "WalkLeft";
            else if (Frame == 26) Anim = "WalkRight";
            else if (Frame == 27) Anim = "WalkLeft";
            else if (Frame == 28) Anim = "WalkRight";
            else if (Frame == 30) Anim = "WalkLeft";
            else if (Frame == 31) Anim = "WalkRight";
            else if (Frame >= 32 && Frame <= 34) Anim = "IdleRight";
            else if (Frame >= 35 && Frame <= 39) Anim = "EatRight";
            else if (Frame >= 40 && Frame <= 41) Anim = "IdleRight";
            else if (Frame == 42) Anim = "WalkLeft";
            else if (Frame == 43) Anim = "WalkRight";
            else if (Frame == 44) Anim = "WalkLeft";
            else if (Frame == 45) Anim = "WalkRight";
            else if (Frame >= 46 && Frame <= 50) Anim = "IdleRight";
            else if (Frame >= 51 && Frame <= 67) Anim = "SleepRight";
            else if (Frame >= 67 && Frame <= 69) Anim = "IdleRight";
            else if (Frame >= 70 && Frame <= 71) Anim = "EatRight";
            else if (Frame == 72) Anim = "IdleRight";
            else if (Frame == 73) Anim = "EatRight";
            else if (Frame == 74) Anim = "IdleRight";
            else if (Frame == 75) Anim = "EatRight";
            else if (Frame >= 76 && Frame <= 84) Anim = "IdleRight";
            else if (Frame == 85) Anim = "WalkRight";
            else if (Frame == 86) Anim = "WalkLeft";
            else if (Frame == 87) Anim = "WalkRight";
            else if (Frame == 88) Anim = "WalkLeft";
            else if (Frame == 89) Anim = "WalkRight";
            else if (Frame == 90) Anim = "WalkLeft";
            else if (Frame >= 91 && Frame <= 92) Anim = "IdleLeft";
            else if (Frame >= 93 && Frame <= 97) Anim = "EatLeft";
            else if (Frame >= 98 && Frame <= 100) Anim = "IdleLeft";
            else Anim = "SleepLeft";
            return "ChickenBrown" + Anim;
        },
    },

    { ID: 1000, Type: "FloorItem", Style: "Blank" },
    {
        ID: 1010,
        Type: "FloorItem",
        Style: "Kennel",
        Top: -1,
        Height: 2,
        AssetName: "Kennel",
        AssetGroup: "ItemDevices",
    },
    {
        ID: 1020,
        Type: "FloorItem",
        Style: "X-Cross",
        Top: -1,
        Height: 2,
        AssetName: "X-Cross",
        AssetGroup: "ItemDevices",
    },
    {
        ID: 1030,
        Type: "FloorItem",
        Style: "BondageBench",
        Top: -1,
        Height: 2,
        AssetName: "BondageBench",
        AssetGroup: "ItemDevices",
    },
    {
        ID: 1040,
        Type: "FloorItem",
        Style: "Trolley",
        Top: -1,
        Height: 2,
        AssetName: "Trolley",
        AssetGroup: "ItemDevices",
    },
    {
        ID: 1050,
        Type: "FloorItem",
        Style: "Locker",
        Top: -1,
        Height: 2,
        AssetName: "Locker",
        AssetGroup: "ItemDevices",
    },
    {
        ID: 1060,
        Type: "FloorItem",
        Style: "WoodenBox",
        Top: -1,
        Height: 2,
        AssetName: "WoodenBox",
        AssetGroup: "ItemDevices",
    },
    {
        ID: 1070,
        Type: "FloorItem",
        Style: "Coffin",
        Top: -1.2,
        Height: 1.85,
        AssetName: "Coffin",
        AssetGroup: "ItemDevices",
    },
    {
        ID: 1080,
        Type: "FloorItem",
        Style: "TheDisplayFrame",
        Top: -1,
        Height: 2,
        AssetName: "TheDisplayFrame",
        AssetGroup: "ItemDevices",
    },

    { ID: 2000, Type: "FloorObstacle", Style: "Blank" },
    {
        ID: 2005,
        Type: "FloorObstacle",
        Style: "Rocks",
        Top: -0.125,
        Height: 1.125,
    },
    { ID: 2010, Type: "FloorObstacle", Style: "Statue", Top: -1, Height: 2 },
    {
        ID: 2020,
        Type: "FloorObstacle",
        Style: "Barrel",
        Top: -0.5,
        Height: 1.5,
    },
    { ID: 2030, Type: "FloorObstacle", Style: "IronBars", Top: -1, Height: 2 },
    { ID: 2031, Type: "FloorObstacle", Style: "BarbFence", Top: -1, Height: 2 },
    {
        ID: 2040,
        Type: "FloorObstacle",
        Style: "OakTree",
        Left: -0.25,
        Top: -1.5,
        Width: 1.5,
        Height: 2.5,
    },
    { ID: 2050, Type: "FloorObstacle", Style: "PineTree", Top: -1, Height: 2 },
    {
        ID: 2055,
        Type: "FloorObstacle",
        Style: "PalmTree",
        Left: -0.3,
        Top: -1.5,
        Width: 1.65,
        Height: 2.5,
    },
    {
        ID: 2060,
        Type: "FloorObstacle",
        Style: "ChristmasTree",
        Top: -1,
        Height: 2,
    },
    {
        ID: 2070,
        Type: "FloorObstacle",
        Style: "Window",
        Top: -0.5,
        Height: 1.5,
    },

    { ID: 3000, Type: "WallDecoration", Style: "Blank" },
    { ID: 3010, Type: "WallDecoration", Style: "Painting" },
    { ID: 3020, Type: "WallDecoration", Style: "Mirror" },
    {
        ID: 3030,
        Type: "WallDecoration",
        Style: "Candelabra0",
        BuildImageName: function (X, Y) {
            let Frame =
                (Math.floor((CurrentTime + X * 349 + Y * 193) / 150) +
                    X * 347 +
                    Y * 193) %
                17;
            if (Frame > 8) Frame = 16 - Frame;
            return "Candelabra" + Frame.toString();
        },
    },
    { ID: 3040, Type: "WallDecoration", Style: "Whip" },
    { ID: 3050, Type: "WallDecoration", Style: "Fireplace" },
    { ID: 3100, Type: "WallDecoration", Style: "SilverShield" },
    { ID: 3110, Type: "WallDecoration", Style: "CrossedSabers" },
    { ID: 3200, Type: "WallDecoration", Style: "SchoolBoard" },
    { ID: 3250, Type: "WallDecoration", Style: "FirstAidKit" },
    { ID: 3260, Type: "WallDecoration", Style: "EyeTest" },
    { ID: 3270, Type: "WallDecoration", Style: "Bookshelf" },

    {
        ID: 4000,
        Type: "WallPath",
        Style: "Blank",
        CanEnter: function () {
            return false;
        },
    },
    {
        ID: 4010,
        Type: "WallPath",
        Style: "WoodOpen",
        Top: -1,
        Height: 2,
        CanEnter: function () {
            return true;
        },
    },
    {
        ID: 4011,
        Type: "WallPath",
        Style: "WoodClosed",
        OccupiedStyle: "WoodOpen",
        Top: -1,
        Height: 2,
        CanEnter: function () {
            return Player.CanInteract();
        },
    },
    {
        ID: 4012,
        Type: "WallPath",
        Style: "WoodLocked",
        OccupiedStyle: "WoodOpen",
        Top: -1,
        Height: 2,
        CanEnter: function () {
            return Player.CanInteract() && ChatRoomPlayerIsAdmin();
        },
    },
    {
        ID: 4013,
        Type: "WallPath",
        Style: "WoodLockedBronze",
        OccupiedStyle: "WoodOpen",
        Top: -1,
        Height: 2,
        CanEnter: function () {
            return Player.MapData.PrivateState.HasKeyBronze == true;
        },
    },
    {
        ID: 4014,
        Type: "WallPath",
        Style: "WoodLockedSilver",
        OccupiedStyle: "WoodOpen",
        Top: -1,
        Height: 2,
        CanEnter: function () {
            return Player.MapData.PrivateState.HasKeySilver == true;
        },
    },
    {
        ID: 4015,
        Type: "WallPath",
        Style: "WoodLockedGold",
        OccupiedStyle: "WoodOpen",
        Top: -1,
        Height: 2,
        CanEnter: function () {
            return Player.MapData.PrivateState.HasKeyGold == true;
        },
    },
    {
        ID: 4020,
        Type: "WallPath",
        Style: "Metal",
        OccupiedStyle: "MetalOpen",
        Top: -1,
        Height: 2,
        CanEnter: function () {
            return true;
        },
    },
    {
        ID: 4021,
        Type: "WallPath",
        Style: "MetalUp",
        OccupiedStyle: "MetalOpen",
        Top: -1,
        Height: 2,
        CanEnter: function (Direction) {
            return Direction === "U" || Direction === "";
        },
    },
    {
        ID: 4022,
        Type: "WallPath",
        Style: "MetalDown",
        OccupiedStyle: "MetalOpen",
        Top: -1,
        Height: 2,
        CanEnter: function (Direction) {
            return Direction === "D" || Direction === "";
        },
    },
];
