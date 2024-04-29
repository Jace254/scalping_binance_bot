import WebSocket from "ws";
import { HandlerMap, OutgoingMessage, OutgoingMessageDataMap } from "./types";

export let id = 1;

export let send = <Key extends keyof OutgoingMessageDataMap>(
  _obj: OutgoingMessage<Key>
) => {};

export function connectToBinanceWebSocketStream(handler: HandlerMap, symbol: string) {
  let webSocketUrl = `wss://stream.binance.com:9443/ws/${symbol}@ticker`;

  const webSocket = new WebSocket(webSocketUrl);

  send = <Key extends keyof OutgoingMessageDataMap>(
    obj: OutgoingMessage<Key>
  ) => {
    const sendData = Buffer.from(JSON.stringify({ e: obj.d }));
    console.log(sendData);
    webSocket.send(sendData);
    id = obj.d.id + 1;
  };

  webSocket.on("open", () => {
    console.log("Connected to Binance WebSocket Stream API");
    Object.keys(handler).map((h) => {
      webSocket.on(h, (e) => handler[h as keyof HandlerMap]({ d: e }, send));
    });
  });

  webSocket.on("error", (error) => {
    console.error(
      "Error connecting to Binance WebSocket Stream API ",
      error.message
    );
  });

  webSocket.on("close", () => {
    console.log("Disconnected from Binance WebSocket Stream API");
  });
}
