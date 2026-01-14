interface DummyRoom {
    id: number;
    name: string;
    temperature: number;
    targetTemperature: number;
    energyUsage: number;
}
interface DummyRoomsResponse {
    rooms: DummyRoom[];
}
interface DummyEnergyLog {
    timestamp: number;
    energy: number;
}
export declare class AdaxApiDummy {
    getRoomsWithEnergy(): Promise<DummyRoomsResponse>;
    getRoomEnergyLog(_roomId: number): Promise<DummyEnergyLog[]>;
    setRoomTemperature(roomId: number, temperature: number): Promise<void>;
}
export {};
