// Things we don't really need, but Female3DCGExtended references

// From Common.js
/**
 * An enum encapsulating possible chatroom message substitution tags. Character name substitution tags are interpreted
 * in chatrooms as follows (assuming the character name is Ben987):
 * SOURCE_CHAR: "Ben987"
 * DEST_CHAR: "Ben987's" (if character is not self), "her" (if character is self)
 * DEST_CHAR_NAME: "Ben987's"
 * TARGET_CHAR: "Ben987" (if character is not self), "herself" (if character is self)
 * TARGET_CHAR_NAME: "Ben987"
 * Additionally, sending the following tags will ensure that asset names in messages are correctly translated by
 * recipients:
 * ASSET_NAME: (substituted with the localized name of the asset, if available)
 * @type {Record<"SOURCE_CHAR"|"DEST_CHAR"|"DEST_CHAR_NAME"|"TARGET_CHAR"|"TARGET_CHAR_NAME"|"ASSET_NAME"|"AUTOMATIC", CommonChatTags>}
 */
export const CommonChatTags = {
	SOURCE_CHAR: "SourceCharacter",
	DEST_CHAR: "DestinationCharacter",
	DEST_CHAR_NAME: "DestinationCharacterName",
	TARGET_CHAR: "TargetCharacter",
	TARGET_CHAR_NAME: "TargetCharacterName",
	ASSET_NAME: "AssetName",
	AUTOMATIC: "Automatic",
};

// From ModularItem.js
/**
 * An enum encapsulating the possible chatroom message settings for modular items
 * - PER_MODULE - The item has one chatroom message per module (messages for individual options within a module are all
 * the same)
 * - PER_OPTION - The item has one chatroom message per option (for finer granularity - each individual option within a
 * module can have its own chatroom message)
 * @type {Record<"PER_MODULE"|"PER_OPTION", ModularItemChatSetting>}
 */
export const ModularItemChatSetting = {
	PER_OPTION: "default",
	PER_MODULE: "perModule",
};

// dummy definitions for Hooks
export const AssetsClothAccessoryBibAfterDrawHook = undefined;
export const AssetsClothCheerleaderTopAfterDrawHook = undefined;
export const AssetsItemDevicesDollBoxAfterDrawHook = undefined;
export const AssetsItemDevicesFuckMachineBeforeDrawHook = undefined;
export const AssetsItemDevicesFuckMachineScriptDrawHook = undefined;
export const AssetsItemDevicesFuturisticCrateScriptDrawHook = undefined;
export const AssetsItemDevicesKabeshiriWallAfterDrawHook = undefined;
export const AssetsItemDevicesPetBowlAfterDrawHook = undefined;
export const AssetsItemDevicesWoodenBoxAfterDrawHook = undefined;
export const AssetsItemHeadDroneMaskAfterDrawHook = undefined;
export const ItemHeadDroneMaskValidateHook = undefined;
export const AssetsItemHoodCanvasHoodAfterDrawHook = undefined;
export const AssetsItemMiscWoodenSignAfterDrawHook = undefined;
export const AssetsItemMouthFuturisticPanelGagBeforeDrawHook = undefined;
export const AssetsItemMouthFuturisticPanelGagScriptDrawHook = undefined;
export const AssetsFaceMarkingsFaceWritingsAfterDrawHook = undefined;
export const InventoryItemMouthFuturisticPanelGagSetOptionHook = undefined;
export const AssetsItemNeckAccessoriesCustomCollarTagAfterDrawHook = undefined;
export const AssetsItemNeckAccessoriesElectronicTagAfterDrawHook = undefined;
export const AssetsItemNeckRestraintsPetPostAfterDrawHook = undefined;
export const AssetsItemPelvisObedienceBeltAfterDrawHook = undefined;
export const AssetsItemVulvaFuturisticVibratorScriptDrawHook = undefined;
export const InventoryItemArmsFullLatexSuitClickHook = undefined;
export const InventoryItemArmsFullLatexSuitDrawHook = undefined;
export const InventoryItemArmsPrisonLockdownSuitClickHook = undefined;
export const InventoryItemArmsPrisonLockdownSuitDrawHook = undefined;
export const InventoryItemArmsTransportJacketDrawHook = undefined;
export const InventoryItemArmsTransportJacketExitHook = undefined;
export const InventoryItemArmsTransportJacketLoadHook = undefined;
export const InventoryItemArmsTransportJacketPublishActionHook = undefined;
export const InventoryItemBreastFuturisticBraDrawHook = undefined;
export const InventoryItemButtAnalBeads2PublishActionHook = undefined;
export const InventoryItemButtInflVibeButtPlugDrawHook = undefined;
export const InventoryItemDevicesKabeshiriWallDrawHook = undefined;
export const InventoryItemDevicesKabeshiriWallExitHook = undefined;
export const InventoryItemDevicesKabeshiriWallLoadHook = undefined;
export const InventoryItemDevicesKabeshiriWallPublishActionHook = undefined;
export const InventoryItemDevicesLuckyWheelClickHook = undefined;
export const InventoryItemDevicesLuckyWheelDrawHook = undefined;
export const InventoryItemDevicesLuckyWheelInitHook = undefined;
export const InventoryItemDevicesVacBedDeluxeDrawHook = undefined;
export const InventoryItemDevicesWoodenBoxDrawHook = undefined;
export const InventoryItemDevicesWoodenBoxExitHook = undefined;
export const InventoryItemDevicesWoodenBoxLoadHook = undefined;
export const InventoryItemDevicesWoodenBoxPublishActionHook = undefined;
export const InventoryItemMouthFuturisticPanelGagClickHook = undefined;
export const InventoryItemMouthFuturisticPanelGagDrawHook = undefined;
export const InventoryItemNeckAccessoriesCollarNameTagPublishActionHook = undefined;
export const InventoryItemNeckAccessoriesCollarShockUnitClickHook = undefined;
export const InventoryItemNeckAccessoriesCollarShockUnitDrawHook = undefined;
export const InventoryItemNeckAccessoriesCollarAutoShockUnitBeforeDrawHook = undefined;
export const InventoryItemPelvisFuturisticTrainingBeltClickHook = undefined;
export const InventoryItemPelvisFuturisticTrainingBeltDrawHook = undefined;
export const InventoryItemPelvisFuturisticTrainingBeltExitHook = undefined;
export const InventoryItemPelvisFuturisticTrainingBeltLoadHook = undefined;
export const InventoryItemPelvisLoveChastityBeltSetOptionHook = undefined;
export const InventoryItemPelvisSciFiPleasurePantiesClickHook = undefined;
export const InventoryItemPelvisSciFiPleasurePantiesDrawHook = undefined;
export const InventoryItemTorsoFuturisticHarnessClickHook = undefined;
export const InventoryItemTorsoFuturisticHarnessDrawHook = undefined;
export const InventoryItemVulvaClitAndDildoVibratorbeltDrawHook = undefined;
export const InventoryItemVulvaClitAndDildoVibratorbeltSetOptionHook = undefined;
export const InventoryItemVulvaFuturisticVibratorClickHook = undefined;
export const InventoryItemVulvaFuturisticVibratorDrawHook = undefined;
export const InventoryItemVulvaFuturisticVibratorExitHook = undefined;
export const InventoryItemVulvaFuturisticVibratorLoadHook = undefined;
export const InventoryItemVulvaLoversVibratorDrawHook = undefined;
export const InventoryItemNeckAccessoriesCollarAutoShockUnitDraw = undefined;
export const InventoryItemNeckAccessoriesCollarAutoShockUnitClick = undefined;
export const InventoryItemNeckAccessoriesCollarAutoShockUnitDrawHook = undefined;
export const InventoryItemNeckAccessoriesCollarAutoShockUnitClickHook = undefined;
export const AssetsItemNeckAccessoriesCollarAutoShockUnitBeforeDrawHook = undefined;
export const AssetsItemNeckAccessoriesCollarAutoShockUnitScriptDrawHook = undefined;

export const InventoryItemMiscIntricatePadlockDrawHook = undefined;
export const InventoryItemMiscHighSecurityPadlockInitHook = undefined;
export const InventoryItemMiscHighSecurityPadlockLoadHook = undefined;
export const InventoryItemMiscHighSecurityPadlockDrawHook = undefined;
export const InventoryItemMiscHighSecurityPadlockClickHook = undefined;
export const InventoryItemMiscHighSecurityPadlockExitHook = undefined;
export const InventoryItemMiscSafewordPadlockLoadHook = undefined;
export const InventoryItemMiscSafewordPadlockDrawHook = undefined;
export const InventoryItemMiscSafewordPadlockClickHook = undefined;
export const InventoryItemMiscPasswordPadlockExitHook = undefined;
export const InventoryItemMiscTimerPadlockDrawHook = undefined;
export const InventoryItemMiscTimerPadlockClickHook = undefined;
export const InventoryItemMiscMistressPadlockDrawHook = undefined;
export const InventoryItemMiscOwnerTimerPadlockDrawHook = undefined;
export const InventoryItemMiscOwnerTimerPadlockClickHook = undefined;
export const InventoryItemMiscLoversTimerPadlockValidator = undefined;
export const InventoryItemMiscPasswordPadlockLoadHook = undefined;
export const InventoryItemMiscPasswordPadlockDrawHook = undefined;
export const InventoryItemMiscPasswordPadlockClickHook = undefined;
export const InventoryItemMiscOwnerPadlockDrawHook = undefined;
export const InventoryItemMiscMistressTimerPadlockDrawHook = undefined;
export const InventoryItemMiscMistressTimerPadlockClickHook = undefined;
export const InventoryItemMiscFamilyPadlockDrawHook = undefined;
export const InventoryItemMiscExclusivePadlockDrawHook = undefined;
export const InventoryItemMiscCombinationPadlockLoadHook = undefined;
export const InventoryItemMiscCombinationPadlockDrawHook = undefined;
export const InventoryItemMiscCombinationPadlockClickHook = undefined;
export const InventoryItemMiscCombinationPadlockExitHook = undefined;
export const InventoryItemMiscTimerPasswordPadlockLoadHook = undefined;
export const InventoryItemMiscTimerPasswordPadlockDrawHook = undefined;
export const InventoryItemMiscTimerPasswordPadlockClickHook = undefined;

export const InventoryItemPelvisLoveChastityBeltDraw = undefined;
export const InventoryItemPelvisLoveChastityBeltValidate = undefined;
export const AssetsItemPelvisFuturisticTrainingBeltScriptDraw = undefined;
export const InventoryItemPelvisObedienceBelts1DrawHook = undefined;
export const InventoryItemPelvisObedienceBelts1ClickHook = undefined;
export const PortalLinkRecieverLoadHook = undefined;
export const PortalLinkRecieverDrawHook = undefined;
export const PortalLinkRecieverClickHook = undefined;
export const PortalLinkRecieverExitHook = undefined;
export const InventoryItemPelvisModularChastityBeltClickHook = undefined;
export const InventoryItemPelvisModularChastityBeltDrawHook = undefined;
export const InventoryItemPelvisModularChastityBeltExitHook = undefined;
export const InventoryItemPelvisModularChastityBeltScriptDrawHook = undefined;
export const InventoryItemPelvisModularChastityBeltVoiceTriggers = undefined;
export const InventorySuitLatexCatsuitLoadHook = undefined;
export const InventorySuitLatexCatsuitDrawHook = undefined;
export const InventorySuitLatexCatsuitExitHook = undefined;
export const InventorySuitLatexCatsuitPublishActionHook = undefined;
export const PortalLinkTransmitterLoadHook = undefined;
export const PortalLinkTransmitterDrawHook = undefined;
export const PortalLinkTransmitterClickHook = undefined;
export const PortalLinkTransmitterExitHook = undefined;

export const FuturisticAccessLoad = undefined;
export const FuturisticAccessClick = undefined;
export const FuturisticAccessDraw = undefined;
export const FuturisticAccessExit = undefined;
export const FuturisticAccessValidate = undefined;

export const PropertyOpacityInit = undefined;
export const PropertyOpacityLoad = undefined;
export const PropertyOpacityDraw = undefined;
export const PropertyOpacityExit = undefined;
export const PropertyOpacityValidate = undefined;


// from ExtendedItem.js (we don't care about the values, but the array needs to be the right size)
/**
 * The X & Y co-ordinates of each option's button, based on the number to be displayed per page.
 * @type {[number, number][][]}
 */
export const ExtendedXY = [
	[], //0 placeholder
	[[1385, 500]], //1 option per page
	[[1185, 500], [1590, 500]], //2 options per page
	[[1080, 500], [1385, 500], [1695, 500]], //3 options per page
	[[1185, 400], [1590, 400], [1185, 700], [1590, 700]], //4 options per page
	[[1080, 400], [1385, 400], [1695, 400], [1185, 700], [1590, 700]], //5 options per page
	[[1080, 400], [1385, 400], [1695, 400], [1080, 700], [1385, 700], [1695, 700]], //6 options per page
	[[1020, 400], [1265, 400], [1510, 400], [1755, 400], [1080, 700], [1385, 700], [1695, 700]], //7 options per page
	[[1020, 400], [1265, 400], [1510, 400], [1755, 400], [1020, 700], [1265, 700], [1510, 700], [1755, 700]], //8 options per page
];

/**
 * The X & Y co-ordinates of each option's button, based on the number to be displayed per page.
 * @type {[number, number][][]}
 */
export const ExtendedXYWithoutImages = [
    [], //0 placeholder
    [[1385, 450]], //1 option per page
    [[1260, 450], [1510, 450]], //2 options per page
    [[1135, 450], [1385, 450], [1635, 450]], //3 options per page
    [[1260, 450], [1510, 450], [1260, 525], [1510, 525]], //4 options per page
    [[1135, 450], [1385, 450], [1635, 450], [1260, 525], [1510, 525]], //5 options per page
    [[1135, 450], [1385, 450], [1635, 450], [1135, 525], [1385, 525], [1635, 525]], //6 options per page
    [[1010, 450], [1260, 450], [1510, 450], [1760, 450], [1135, 525], [1385, 525], [1635, 525]], //7 options per page
    [[1010, 450], [1260, 450], [1510, 450], [1760, 450], [1010, 525], [1260, 525], [1510, 525], [1760, 525]], //8 options per page
    [[1135, 450], [1385, 450], [1635, 450], [1135, 525], [1385, 525], [1635, 525], [1135, 600], [1385, 600], [1635, 600]], //9 options per page
];

// from TypedItem.js
/**
 * An enum encapsulating the possible chatroom message settings for typed items
 * - TO_ONLY - The item has one chatroom message per type (indicating that the type has been selected)
 * - FROM_TO - The item has a chatroom message for from/to type pairing
 * - SILENT - The item doesn't publish an action when a type is selected.
 * @type {Record<"TO_ONLY"|"FROM_TO"|"SILENT", TypedItemChatSetting>}
 */
export const TypedItemChatSetting = {
	TO_ONLY: "default",
	FROM_TO: "fromTo",
	SILENT: "silent",
};

export function InventoryItemNeckAccessoriesCollarNameTagGetDrawData(x) { return null; };

export const DialogFocusItem = null;

// from VibratorMode.js (stubbed)
/**
 * An enum for the vibrator configuration sets that a vibrator can have
 * @type {{STANDARD: "Standard", ADVANCED: "Advanced"}}
 */
export const VibratorModeSet = {
	STANDARD: "Standard",
	ADVANCED: "Advanced",
};


/**
 * Parse the passed typed item draw data as passed via the extended item config
 * @param {readonly VibratorModeSet[]} modeSet - The vibrator mode sets for the item
 * @param {ExtendedItemConfigDrawData<{ drawImage?: false }> | undefined} drawData - The to-be parsed draw data
 * @param {number} y - The y-coordinate at which to start drawing the controls
 * @return {ExtendedItemDrawData<ElementMetaData.Vibrating>} - The parsed draw data
 */
export function VibratorModeGetDrawData(modeSet, drawData, y=450) { return null; }

export function CommonConvertArrayToString(x) { return ""; }
export const ItemVulvaFuturisticVibratorTriggers = undefined;
export const InventoryItemPelvisSciFiPleasurePantiesChatPrefix = undefined;
export const AssetsBodyMarkingsBodyWritingsAfterDrawHook = undefined;
export const InventoryItemBreastForbiddenChastityBraDrawHook = undefined;
export const InventoryItemBreastForbiddenChastityBraClickHook = undefined;
export const AssetsItemNeckAccessoriesCollarShockUnitBeforeDrawHook = undefined;
export const AssetsItemNeckAccessoriesCollarShockUnitScriptDrawHook = undefined;
export const AssetsItemBreastForbiddenChastityBraScriptDrawHook = undefined;
export const InventoryItemNeckPetSuitShockCollars1DrawHook = undefined;
export const InventoryItemNeckPetSuitShockCollars1ClickHook = undefined;
export const InventoryItemNeckFuturisticCollarLoadHook = undefined;
export const InventoryItemNeckFuturisticCollarDrawHook = undefined;
export const InventoryItemNeckFuturisticCollarClickHook = undefined;
export const InventoryItemNeckFuturisticCollarExitHook = undefined;
export const InventoryItemNeckSlaveCollarLoadHook = undefined;
export const InventoryItemNeckSlaveCollarDrawHook = undefined;
export const InventoryItemNeckSlaveCollarClickHook = undefined;
export const InventoryItemDevicesLuckyWheelg0LoadHook = undefined;
export const InventoryItemDevicesLuckyWheelg0DrawHook = undefined;
export const InventoryItemDevicesLuckyWheelg0ClickHook = undefined;
export const InventoryItemDevicesLuckyWheelg0ExitHook = undefined;
export const InventoryItemDevicesWheelFortuneLoadHook = undefined;
export const CommonNoop = undefined;
export const CommonTime = () => 0;

export const PoseAllKneeling = Object.freeze(["Kneel", "KneelingSpread"]);
export const PoseAllStanding = Object.freeze(["BaseLower", "LegsOpen", "LegsClosed", "Spread"]);

export const InterfaceTextGet = (x: string) => undefined;



// from TextItem.js (stubbed)
export const TextItem = undefined;

// from Time.js I believe. exists in Timer.js as well(stubbed) 
export const CurrentTime = undefined;

// from ChatRoomMapView.js (stubbed)
export const ChatRoomMapViewGetObjectAtPos = undefined;