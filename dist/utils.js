"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToBinanceWebSocketStream = exports.send = exports.id = void 0;
const ws_1 = __importDefault(require("ws"));
exports.id = 1;
let send = (_obj) => { };
exports.send = send;
function connectToBinanceWebSocketStream(handler, symbol) {
    let webSocketUrl = `wss://stream.binance.com:9443/ws/${symbol}@ticker`;
    const webSocket = new ws_1.default(webSocketUrl);
    exports.send = (obj) => {
        const sendData = Buffer.from(JSON.stringify({ e: obj.d }));
        console.log(sendData);
        webSocket.send(sendData);
        exports.id = obj.d.id + 1;
    };
    webSocket.on("open", () => {
        console.log("Connected to Binance WebSocket Stream API");
        Object.keys(handler).map((h) => {
            webSocket.on(h, (e) => handler[h]({ d: e }, exports.send));
        });
    });
    webSocket.on("error", (error) => {
        console.error("Error connecting to Binance WebSocket Stream API ", error.message);
    });
    webSocket.on("close", () => {
        console.log("Disconnected from Binance WebSocket Stream API");
    });
}
exports.connectToBinanceWebSocketStream = connectToBinanceWebSocketStream;
//# sourceMappingURL=utils.js.map