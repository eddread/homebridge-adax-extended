"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaxApiDummy = void 0;
class AdaxApiDummy {
    async getRoomsWithEnergy() {
        const defaultRooms = [
            { id: 1, name: 'Stue', temperature: 2150, targetTemperature: 2200, energyUsage: 500 },
            { id: 2, name: 'Soveværelse', temperature: 1900, targetTemperature: 2000, energyUsage: 250 },
        ];
        const platformConfig = globalThis.ADAX_CONFIG || {};
        const customNames = platformConfig.roomNames || {};
        const rooms = defaultRooms.map(room => ({
            ...room,
            name: customNames[room.id] || room.name,
        }));
        return { rooms };
    }
    async getRoomEnergyLog(_roomId) {
        return [
            { timestamp: Date.now() - 3600 * 1000, energy: 100 },
            { timestamp: Date.now(), energy: 150 },
        ];
    }
    async setRoomTemperature(roomId, temperature) {
        console.log(`[Dummy] Sat temperatur i rum ${roomId} til ${temperature / 100}°C`);
    }
}
exports.AdaxApiDummy = AdaxApiDummy;
//# sourceMappingURL=adaxApiDummy.js.map