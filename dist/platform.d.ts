import type { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { AdaxApi } from './adaxApi';
import type { AdaxContentResponse } from './adaxApi';
import { AdaxApiDummy } from './adaxApiDummy';
export declare class ADAXHomebridgePlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: PlatformAccessory[];
    private apiClient;
    private cache;
    private lastUpdate;
    private pendingTemperatures;
    private readonly PENDING_TTL;
    constructor(log: Logger, config: PlatformConfig, api: API);
    pollRooms(): Promise<AdaxContentResponse | null>;
    private mergeWithPendingTemperatures;
    setPendingTemperature(roomId: number, temperature: number): void;
    discoverDevices(): Promise<void>;
    configureAccessory(accessory: PlatformAccessory): void;
    get client(): AdaxApi | AdaxApiDummy;
}
