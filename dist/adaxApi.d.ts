export interface AdaxRoom {
    id: number;
    name: string;
    temperature?: number;
    targetTemperature?: number;
    energyUsage?: number;
}
export interface AdaxContentResponse {
    rooms: AdaxRoom[];
    devices?: {
        id: number;
        name: string;
        energyWh: number;
        energyTime: number;
    }[];
}
export interface AdaxEnergyLogPoint {
    fromTime: number;
    toTime: number;
    energyWh: number;
}
export declare class AdaxApi {
    private clientId;
    private secret;
    private token;
    private tokenExpiry;
    constructor(clientId: string, secret: string);
    private authenticate;
    private request;
    getRoomsWithEnergy(): Promise<AdaxContentResponse>;
    getRoomEnergyLog(roomId: number): Promise<AdaxEnergyLogPoint[]>;
    setRoomTemperature(roomId: number, temperature: number): Promise<void>;
}
