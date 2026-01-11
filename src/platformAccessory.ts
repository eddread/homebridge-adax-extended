import type { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import type { ADAXHomebridgePlatform } from './platform';
import type { AdaxRoom, AdaxContentResponse } from './adaxApi';

export class ADAXPlatformAccessory {
  private service: Service;
  private updateInterval: NodeJS.Timeout;

  constructor(
    private readonly platform: ADAXHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly roomId: number,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'ADAX')
      .setCharacteristic(this.platform.Characteristic.Model, 'WiFi Heater')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.roomId.toString());

    this.service =
      this.accessory.getService(this.platform.Service.Thermostat) ||
      this.accessory.addService(this.platform.Service.Thermostat);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
    this.service.setCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits, 0);
    this.service.setCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, 0);
    this.service.setCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, 1);

    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .setProps({
        minValue: 5,
        maxValue: 35,
        minStep: 0.5,
      })
      .onSet(this.handleTargetTemperatureSet.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onSet(this.handleTargetStateSet.bind(this));

    // Initial update
    this.updateValues();

    // Periodic updates every 30 seconds to keep HomeKit in sync
    this.updateInterval = setInterval(() => this.updateValues(), 30000);
  }

  async handleTargetTemperatureSet(value: CharacteristicValue): Promise<void> {
    const temperature = value as number;
    const tempCentidegrees = temperature * 100;
    this.platform.log.info(`[ADAX] Sat temperatur i rum ${this.roomId} til ${temperature}°C`);

    // Record pending temperature immediately to avoid showing stale API values
    this.platform.setPendingTemperature(this.roomId, tempCentidegrees);

    try {
      await this.platform.client.setRoomTemperature(this.roomId, tempCentidegrees);
    } catch (error) {
      this.platform.log.warn(`[ADAX] Kunne ikke opdatere temperatur i rum ${this.roomId}: ${error}`);
    }
  }

  async handleTargetStateSet(value: CharacteristicValue): Promise<void> {
    const state = value as number;
    this.platform.log.info(`[ADAX] Sat rum ${this.roomId} til tilstand: ${state === 1 ? 'Varme' : 'Slukket'}`);
  }

  async updateValues(): Promise<void> {
    try {
      const data = (await this.platform.pollRooms()) as AdaxContentResponse | null;
      const room = data?.rooms.find((r: AdaxRoom) => r.id === this.roomId);

      if (!room) {
        return;
      }

      const currentTemp = room.temperature ? room.temperature / 100 : 0;
      const targetTemp = room.targetTemperature ? room.targetTemperature / 100 : 0;

      this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, currentTemp);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetTemperature, targetTemp);

      const heatingState = targetTemp > currentTemp ? 1 : 0;
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, heatingState);
    } catch (error) {
      this.platform.log.error(`[ADAX] Fejl under opdatering af rum ${this.roomId}: ${error}`);
    }
  }
}