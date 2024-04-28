"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const binance_api_node_1 = __importDefault(require("binance-api-node"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = (0, binance_api_node_1.default)({
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
let currentPrice = 0;
let quantity;
let open = false;
let sold = false;
let realCurrentPrice;
async function checkOrderStatus(symbol, orderId) {
    try {
        const order = await client.getOrder({
            symbol,
            orderId,
        });
        return order.status;
    }
    catch (error) {
        console.error("Error checking order status:", error);
        return "error";
    }
}
async function processOrder(v, action, currentPrice) {
    await checkOrderStatus(config.symbol, v.orderId)
        .then(async (status) => {
        if (status) {
            if (status === "error") {
            }
            else if (status === "FILLED") {
                sold = true;
                console.log(`(${action})SOLD ${config.baseCoin} at $${v.price} worth $${quantity * Number(v.price)} with an amount of ${quantity}`, "color:" + action === 'profit' ? '#029c8e;' : '#ea5f40;' + 'font-weight: bold;');
                quantity = Number((config.initialInvestment / currentPrice).toFixed(config.lotSize));
                setTimeout(async () => {
                    await client
                        .order({
                        symbol: config.symbol,
                        side: "BUY",
                        type: "MARKET",
                        quantity: quantity.toFixed(config.baseAssetPrecision),
                    })
                        .then((v) => {
                        open = false;
                        sold = false;
                        console.log(`BOUGHT ${config.baseCoin} worth $${config.initialInvestment} at $${currentPrice} with an amount of ${quantity}`);
                    });
                }, 1000);
            }
            else if (status === "REJECTED") {
            }
        }
    })
        .then(() => {
        setTimeout(() => {
            if (open && !sold) {
                processOrder(v, action, realCurrentPrice);
            }
            else {
            }
        }, 200);
    });
}
(0, utils_1.connectToBinanceWebSocketStream)({
    "message": async ({ d }, send) => {
        const data = JSON.parse(d);
        if (data.e === "24hrTicker") {
            realCurrentPrice = data.c;
            if (currentPrice === 0) {
                console.log(`price has been set ${data.c}`);
                currentPrice = data.c;
                quantity = Number((config.initialInvestment / currentPrice).toFixed(config.lotSize));
                await client
                    .order({
                    symbol: config.symbol,
                    side: "BUY",
                    type: "MARKET",
                    quantity: quantity.toFixed(config.baseAssetPrecision),
                })
                    .then(() => {
                    console.log(`BOUGHT ${config.baseCoin} worth $${config.initialInvestment} at $${currentPrice} with an amount of ${quantity}`);
                });
            }
            if (data.c >= currentPrice * config.stopLimitProfit) {
                if (!open) {
                    console.log(`profit ${currentPrice * config.profit}`);
                    currentPrice = data.c;
                    await client
                        .order({
                        symbol: config.symbol,
                        side: "SELL",
                        type: "LIMIT",
                        price: (currentPrice * config.profit).toFixed(config.priceFilter),
                        quantity: (quantity - 1 / Number((1).toString().padEnd(config.lotSize + 1, '0'))).toFixed(config.baseAssetPrecision),
                    })
                        .then(async (v) => {
                        open = true;
                        await processOrder(v, "profit", currentPrice);
                        currentPrice = data.c;
                    });
                }
            }
            if (data.c <= currentPrice * config.stopLimit) {
                if (!open) {
                    console.log(`loss ${currentPrice * config.stopLoss}`);
                    currentPrice = data.c;
                    await client
                        .order({
                        symbol: config.symbol,
                        side: "SELL",
                        type: "LIMIT",
                        price: (currentPrice * config.stopLoss).toFixed(config.priceFilter),
                        quantity: (quantity - 1 / Number((1).toString().padEnd(config.lotSize + 1, '0'))).toFixed(config.baseAssetPrecision),
                    })
                        .then(async (v) => {
                        open = true;
                        await processOrder(v, "loss", currentPrice);
                        currentPrice = data.c;
                    });
                }
            }
        }
    },
}, config.streamSymbol);
//# sourceMappingURL=index.js.map