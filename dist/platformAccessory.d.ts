import type { PlatformAccessory, CharacteristicValue } from 'homebridge';
import type { ADAXHomebridgePlatform } from './platform';
export declare class ADAXPlatformAccessory {
    private readonly platform;
    private readonly accessory;
    private readonly roomId;
    private service;
    private updateInterval;
    constructor(platform: ADAXHomebridgePlatform, accessory: PlatformAccessory, roomId: number);
    handleTargetTemperatureSet(value: CharacteristicValue): Promise<void>;
    handleTargetStateSet(value: CharacteristicValue): Promise<void>;
    updateValues(): Promise<void>;
}
