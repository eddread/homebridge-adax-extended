"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaxApi = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class AdaxApi {
    constructor(clientId, secret) {
        this.clientId = clientId;
        this.secret = secret;
        this.token = null;
        this.tokenExpiry = 0;
    }
    async authenticate() {
        if (this.token && Date.now() < this.tokenExpiry) {
            return;
        }
        const res = await (0, node_fetch_1.default)('https://api-1.adax.no/client-api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=password&username=${this.clientId}&password=${this.secret}`,
        });
        if (!res.ok) {
            throw new Error(`Auth failed: ${res.statusText}`);
        }
        const data = (await res.json());
        this.token = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    }
    async request(endpoint) {
        await this.authenticate();
        const res = await (0, node_fetch_1.default)(`https://api-1.adax.no/client-api/rest/v1/${endpoint}`, {
            headers: { Authorization: `Bearer ${this.token}` },
        });
        if (!res.ok) {
            throw new Error(`ADAX API error: ${res.statusText}`);
        }
        return (await res.json());
    }
    async getRoomsWithEnergy() {
        return this.request('content/?withEnergy=1');
    }
    async getRoomEnergyLog(roomId) {
        return this.request(`energy_log/${roomId}`);
    }
    async setRoomTemperature(roomId, temperature) {
        await this.authenticate();
        const res = await (0, node_fetch_1.default)('https://api-1.adax.no/client-api/rest/v1/control/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
            },
            body: JSON.stringify({
                rooms: [{ id: roomId, targetTemperature: temperature }],
            }),
        });
        if (!res.ok) {
            throw new Error(`Failed to set temperature: ${res.statusText}`);
        }
    }
}
exports.AdaxApi = AdaxApi;
//# sourceMappingURL=adaxApi.js.map