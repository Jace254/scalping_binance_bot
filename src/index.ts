import { connectToBinanceWebSocketStream } from "./utils";
import Binance, { OrderType, OrderStatus_LT, Order } from "binance-api-node";
import dotenv from "dotenv";
dotenv.config();

const client = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
});

const config = {
  profit: 1.002,
  stopLoss: 0.996,
  stopLimitProfit: 1.00199,
  stopLimit: 0.9961,
  baseCoin: 'ETHFI',
  quoteCoin: 'USDT',
  symbol: "ETHFIUSDT",
  streamSymbol: 'ethfiusdt',
  initialInvestment: 11,
  lotSize: 1,
  priceFilter: 3,

  baseAssetPrecision: 8
};


let currentPrice: number = 0;
let quantity: number;
let open = false;
let sold = false
let realCurrentPrice: number;

async function checkOrderStatus(
  symbol: string,
  orderId: number
): Promise<OrderStatus_LT | "error"> {
  try {
    const order = await client.getOrder({
      symbol,
      orderId,
    });

    return order.status;
  } catch (error) {
    console.error("Error checking order status:", error);
    return "error";
  }
}

async function processOrder(v: Order, action: string, currentPrice: number) {
  await checkOrderStatus(config.symbol, v.orderId)
    .then(async (status) => {
      if (status) {
        if (status === "error") {
        } else if (status === "FILLED") {
          sold = true
          console.log(
            `(${action})SOLD ${config.baseCoin} at $${v.price} worth $${
              quantity * Number(v.price)
            } with an amount of ${quantity}`,
            "color:" + action === 'profit' ? '#029c8e;' : '#ea5f40;' + 'font-weight: bold;'
          );
          quantity = Number((config.initialInvestment / currentPrice).toFixed(config.lotSize));
          //then buy instantly
          setTimeout(async () => {
            await client
            .order({
              symbol: config.symbol,
              side: "BUY",
              type: OrderType.MARKET,
              quantity: quantity.toFixed(config.baseAssetPrecision),
            })
            .then((v) => {
              open = false;
              sold = false;
              console.log(
                `BOUGHT ${config.baseCoin} worth $${config.initialInvestment} at $${currentPrice} with an amount of ${quantity}`
              );
            });
          }, 1000)
        } else if (status === "REJECTED") {
        }
      }
    })
    .then(() => {
      setTimeout(() => {
        if (open && !sold) {
          processOrder(v, action, realCurrentPrice);
        } else {

        }
      }, 200);
    });
}


connectToBinanceWebSocketStream({
  "message": async ({ d }, send) => {
    const data = JSON.parse(d);
    if (data.e === "24hrTicker") {
      realCurrentPrice = data.c;
      if (currentPrice === 0) {
        console.log(`price has been set ${data.c}`);
        currentPrice = data.c;
        // buy
        quantity = Number((config.initialInvestment / currentPrice).toFixed(config.lotSize));
        await client
          .order({
            symbol: config.symbol,
            side: "BUY",
            type: OrderType.MARKET,
            quantity: quantity.toFixed(config.baseAssetPrecision),
          })
          .then(() => {
            console.log(
              `BOUGHT ${config.baseCoin} worth $${config.initialInvestment} at $${currentPrice} with an amount of ${quantity}`
            );
          });
      }

      if (data.c >= currentPrice * config.stopLimitProfit) {
        //sell
        if (!open) {
          console.log(`profit ${currentPrice * config.profit}`);
          currentPrice = data.c;
          await client
            .order({
              symbol: config.symbol,
              side: "SELL",
              type: OrderType.LIMIT,
              price: (currentPrice * config.profit).toFixed(config.priceFilter),
              quantity: (quantity - 1/Number((1).toString().padEnd(config.lotSize + 1, '0')) ).toFixed(config.baseAssetPrecision),
            })
            .then(async (v) => {
              open = true;
              await processOrder(v, "profit", currentPrice);
              currentPrice = data.c
            });
        }
      }

      if (data.c <= currentPrice * config.stopLimit) {
        // sell
        if (!open) {
          console.log(`loss ${currentPrice * config.stopLoss}`);
          currentPrice = data.c;
          await client
            .order({
              symbol: config.symbol,
              side: "SELL",
              type: OrderType.LIMIT,
              price: (currentPrice * config.stopLoss).toFixed(config.priceFilter),
              quantity: (quantity - 1/Number((1).toString().padEnd(config.lotSize + 1, '0'))).toFixed(config.baseAssetPrecision),
            })
            .then(async (v) => {
              open = true;
              await processOrder(v, "loss", currentPrice);
              currentPrice = data.c
            });
        }
      }
    }
  },
}, config.streamSymbol);
