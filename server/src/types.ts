export enum Operations {
  SUBSCRIBE = "SUBSCRIBE",
  UNSUBSCRIBE = "UNSUBSCRIBE",
}

export interface HandlerDataMap {
  message: { d: string };
}

export type HandlerMap = {
  [Key in keyof HandlerDataMap]: (
    d: HandlerDataMap[Key],
    send: <Key extends keyof OutgoingMessageDataMap>(
      obj: OutgoingMessage<Key>
    ) => void
  ) => void;
};

export type OutgoingMessageDataMap = {
  ping: {
    pong: string;
    id: number;
  };
  subscribe: {
    method: Operations.SUBSCRIBE;
    params: string[];
    id: number;
  };
  error: {
    response: string;
    id: number;
  };
};

export type OutgoingMessage<Key extends keyof OutgoingMessageDataMap> = {
  op: Key;
  d: OutgoingMessageDataMap[Key];
};
