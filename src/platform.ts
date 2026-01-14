import type {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { ADAXPlatformAccessory } from './platformAccessory';
import { AdaxApi } from './adaxApi';
import type { AdaxContentResponse } from './adaxApi';
import { AdaxApiDummy } from './adaxApiDummy';

export class ADAXHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly accessories: PlatformAccessory[] = [];
  private apiClient: AdaxApi | AdaxApiDummy;
  private cache: AdaxContentResponse | null = null;
  private lastUpdate = 0;
  // Track locally-set temperatures to avoid API cache issues (~60s delay)
  private pendingTemperatures: Map<number, { value: number; timestamp: number }> = new Map();
  private readonly PENDING_TTL = 90000; // 90 seconds to account for API cache

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    if (this.config.dummyMode) {
      this.config.clientId = 'dummy';
      this.config.secret = 'dummy';
      this.log.info('Dummy mode active: using credentials "dummy" / "dummy"');
    } else {
      this.config.clientId = this.config.clientId || '';
      this.config.secret = this.config.secret || '';
    }

    (globalThis as { ADAX_CONFIG?: PlatformConfig }).ADAX_CONFIG = this.config;

    if (this.config.dummyMode) {
      this.apiClient = new AdaxApiDummy();
      this.log.warn('ADAX plugin running in DUMMY MODE – no real heaters will be contacted.');
    } else {
      this.apiClient = new AdaxApi(this.config.clientId, this.config.secret);
      this.log.info('ADAX plugin running in LIVE mode – connecting to Adax Cloud API.');
    }

    this.api.on('didFinishLaunching', async () => {
      this.log.info('ADAX plugin finished launching');
      await this.discoverDevices();
    });
  }

  async pollRooms(): Promise<AdaxContentResponse | null> {
    const now = Date.now();
    const pollInterval = (this.config.maxPollInterval || 60) * 1000;

    if (!this.cache || now - this.lastUpdate > pollInterval) {
      try {
        this.cache = await this.apiClient.getRoomsWithEnergy();
        this.lastUpdate = now;
      } catch (error) {
        this.log.error('Failed to poll rooms:', error);
      }
    }

    // Merge pending temperatures into cache to avoid showing stale API values
    if (this.cache) {
      return this.mergeWithPendingTemperatures(this.cache);
    }

    return this.cache;
  }

  private mergeWithPendingTemperatures(data: AdaxContentResponse): AdaxContentResponse {
    const now = Date.now();
    const result = { ...data, rooms: [...data.rooms] };

    for (let i = 0; i < result.rooms.length; i++) {
      const room = result.rooms[i];
      const pending = this.pendingTemperatures.get(room.id);

      if (pending && now - pending.timestamp < this.PENDING_TTL) {
        // Use the locally-set temperature instead of stale API value
        result.rooms[i] = { ...room, targetTemperature: pending.value };
        this.log.debug(`Bruger afventende temperatur for rum ${room.id}: ${pending.value / 100}°C`);
      } else if (pending) {
        // Pending value has expired, remove it
        this.pendingTemperatures.delete(room.id);
      }
    }

    return result;
  }

  public setPendingTemperature(roomId: number, temperature: number): void {
    this.pendingTemperatures.set(roomId, { value: temperature, timestamp: Date.now() });
    this.log.debug(`Registreret afventende temperatur for rum ${roomId}: ${temperature / 100}°C`);
  }

  async discoverDevices(): Promise<void> {
    const data = await this.pollRooms();

    if (!data || !data.rooms) {
      this.log.warn('No rooms discovered (dummy or API returned nothing).');
      return;
    }

    const discoveredRoomIds = data.rooms.map(r => r.id.toString());

    // Add or update accessories
    for (const room of data.rooms) {
      const uuid = this.api.hap.uuid.generate(room.id.toString());
      let accessory = this.accessories.find(a => a.UUID === uuid);

      if (!accessory) {
        accessory = new this.api.platformAccessory(room.name || `Room ${room.id}`, uuid);
        accessory.context.roomId = room.id;
        new ADAXPlatformAccessory(this, accessory, room.id);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.log.info(`Tilføjet nyt rum: ${room.name || room.id}`);
      } else {
        // Restore handlers for cached accessory
        new ADAXPlatformAccessory(this, accessory, room.id);
        this.log.info(`Gendannet rum fra cache: ${room.name || room.id}`);
      }
    }

    // Remove old accessories that are not in current data
    const accessoriesToRemove = this.accessories.filter(
      acc => !discoveredRoomIds.includes(acc.context.roomId?.toString()),
    );

    for (const acc of accessoriesToRemove) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [acc]);
      this.log.info(`Removed outdated accessory: ${acc.displayName}`);
    }
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.push(accessory);
  }

  public get client(): AdaxApi | AdaxApiDummy {
    return this.apiClient;
  }
}
