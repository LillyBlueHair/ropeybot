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

import { API_Chatroom } from "./apiChatroom";
import { API_Connector, CoordObject, TellType } from "./apiConnector";
import { AppearanceType } from "./appearance";
import { BC_AppearanceItem } from "./item";

interface PoseObject {
    Name: string;
}

export interface OnlineSharedSettingsType {
    GameVersion: string;
}

export interface API_Character_Data {
    ID: string;
    Name: string;
    Nickname: string;
    Description: string;
    Appearance: BC_AppearanceItem[];
    MemberNumber: number;
    ActivePose: AssetPoseName[];
    WhiteList: number[];
    OnlineSharedSettings: OnlineSharedSettingsType;
    ItemPermission: number;
    FriendList: number[];
    MapData?: CoordObject;
}

export function isNaked(character: API_Character): boolean {
    return (
        character.Appearance.InventoryGet("Cloth") === null &&
        character.Appearance.InventoryGet("ClothAccessory") === null &&
        character.Appearance.InventoryGet("ClothLower") === null &&
        character.Appearance.InventoryGet("Suit") === null &&
        character.Appearance.InventoryGet("SuitLower") === null &&
        character.Appearance.InventoryGet("Bra") === null &&
        character.Appearance.InventoryGet("Corset") === null &&
        character.Appearance.InventoryGet("Panties") === null &&
        character.Appearance.InventoryGet("Socks") === null &&
        character.Appearance.InventoryGet("Shoes") === null &&
        character.Appearance.InventoryGet("Gloves") === null
    );
}

export class API_Character {
    private _appearance: AppearanceType;

    constructor(
        private readonly data: API_Character_Data,
        public readonly connection: API_Connector,
        private _chatRoom: API_Chatroom,
    ) {
        this._appearance = new AppearanceType(this, data);
    }

    public get Name(): string {
        return this.data.Name;
    }
    public get NickName(): string {
        return this.data.Nickname;
    }
    public get Appearance(): AppearanceType {
        return this._appearance;
    }
    public get MemberNumber(): number {
        return this.data.MemberNumber;
    }
    public get Pose(): PoseObject[] {
        return this.data.ActivePose.map((p) => {
            return { Name: p };
        });
    }
    public get WhiteList(): number[] {
        return this.data.WhiteList;
    }
    public get OnlineSharedSettings(): OnlineSharedSettingsType {
        return this.data.OnlineSharedSettings;
    }
    public get ItemPermission(): number {
        return this.data.ItemPermission;
    }
    public get ChatRoomPosition(): number {
        return 0; /* TODO */
    }

    public get chatRoom() {
        return this._chatRoom;
    }
    public set chatRoom(room: API_Chatroom) {
        this._chatRoom = room;
    }

    public get X(): number {
        return this.data.MapData?.X ?? 0;
    }
    public get Y(): number {
        return this.data.MapData?.Y ?? 0;
    }

    public get MapPos(): CoordObject {
        return this.data.MapData ?? { X: 0, Y: 0 };
    }

    public IsRoomAdmin(): boolean {
        return this.chatRoom.Admin.includes(this.MemberNumber);
    }

    public Tell(msgType: TellType, msg: string): void {
        this.connection.SendMessage(msgType, msg, this.data.MemberNumber);
    }

    public SetActivePose(pose: AssetPoseName[]): void {
        this.data.ActivePose = pose;
        this.connection.characterPoseUpdate(pose);
    }

    public IsItemPermissionAccessible(
        asset: BC_AppearanceItem,
        variant?: string,
    ): boolean {
        // TODO
        return true;
    }

    public hasPenis(): boolean {
        return this.Appearance.InventoryGet("Pussy").Name === "Penis";
    }

    public upperBodyStyle(): "male" | "female" {
        const upperBody = this.Appearance.InventoryGet("BodyUpper");
        return upperBody.Name.startsWith("Flat") ? "male" : "female";
    }

    public lowerBodyStyle(): "male" | "female" {
        const upperBody = this.Appearance.InventoryGet("Pussy");
        return upperBody.Name === "Penis" ? "male" : "female";
    }

    public async Kick(): Promise<void> {
        // TODO
    }

    public Ban(): void {}

    public Demote(): void {}

    public IsBot(): boolean {
        return this.data.MemberNumber === this.connection.Player.MemberNumber;
    }

    public IsLoverOf(char: API_Character): boolean {
        // TODO
        return false;
    }

    public IsOwnedBy(char: API_Character): boolean {
        // TODO
        return false;
    }

    public getCurseVersion(): unknown {
        return null;
    }

    public ProtectionAllowInteract(): boolean {
        // TODO
        return true;
    }

    public GetAllowItem(): Promise<boolean> {
        return this.connection.queryItemAllowed(this.MemberNumber);
    }

    public IsRestrained(): boolean {
        // In the real game this Freeze || Block || Prone effects
        // This isn't correct at all but rather than calculating effects,
        // this is good enough for kidnappers.
        return Boolean(this.Appearance.InventoryGet("ItemArms"));
    }

    public CanTalk(): boolean {
        // See above
        return !Boolean(
            this.Appearance.InventoryGet("ItemMouth") ||
                this.Appearance.InventoryGet("ItemMouth2") ||
                this.Appearance.InventoryGet("ItemMouth3"),
        );
    }

    public hasEffect(effect: EffectName): boolean {
        for (const item of this.Appearance.allItems()) {
            if (item.getEffects().includes(effect)) {
                return true;
            }
        }

        return false;
    }

    public SetHeightOverride(override: number | null): void {
        const emoticon = this.Appearance.InventoryGet("Emoticon");
        if (!emoticon) {
            console.warn("No emoticon found for height override");
            return;
        }

        emoticon.SetOverrideHeight(override);
    }

    public SetInvisible(invisible: boolean): void {
        // TODO
    }

    public FriendListAdd(memberNum: number): void {
        if (this.data.FriendList.includes(memberNum)) {
            return;
        }

        this.data.FriendList.push(memberNum);
        this.connection.accountUpdate({
            FriendList: this.data.FriendList,
        });
    }

    public FriendListRemove(memberNum: number): void {
        this.data.FriendList = this.data.FriendList.filter(
            (m) => m !== memberNum,
        );
        this.connection.accountUpdate({
            FriendList: this.data.FriendList,
        });
    }

    public MoveToPos(pos: number): void {
        this._chatRoom.moveCharacterToPos(this.data.MemberNumber, pos);
    }

    public SetExpression(
        group: ExpressionGroupName,
        expr: ExpressionName,
    ): void {
        this.Appearance.SetExpression(group, expr);
    }

    public toString(): string {
        return this.NickName || this.Name;
    }

    public sendItemUpdate(data: BC_AppearanceItem): void {
        this.connection.updateCharacterItem({
            Target: this.MemberNumber,
            ...data,
        });
    }

    public sendAppearanceUpdate(): void {
        this.connection.updateCharacter({
            ID: this.data.ID,
            Appearance: this.data.Appearance,
        });
    }

    public update(data: Partial<API_Character_Data>): void {
        Object.assign(this.data, data);
        this.rebuildAppearance();
    }

    public rebuildAppearance(): void {
        this._appearance = new AppearanceType(this, this.data);
    }
}