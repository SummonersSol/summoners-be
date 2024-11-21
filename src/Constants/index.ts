import { isProduction } from "../../utils";

export const VERIFY_MESSAGE = `This message is to prove that you're the owner of this address!`;

//Token addresses
export const USDC_TOKEN_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_DECIMALS = 1000000;
export const SAMO_TOKEN_ADDRESS = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
export const SAMO_DECIMALS = 1_000_000_000;
export const SOL_TOKEN_ADDRESS = 'So11111111111111111111111111111111111111112';
export const SOL_DECIMALS = 1_000_000_000;
export const MSOL_TOKEN_ADDRESS = 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So';
export const MSOL_DECIMALS = 1_000_000_000;
export const USDT_TOKEN_ADDRESS = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
export const USDT_DECIMALS = 1_000_000;
export const BONK_TOKEN_ADDRESS = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
export const BONK_DECIMALS = 100_000;
export const POPCAT_TOKEN_ADDRESS = '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr';
export const POPCAT_DECIMALS = 1_000_000_000;

export const supportedTokens: {
    [key: string]: {
        address: string;
        decimals: number;
        roomType: number;
    }
} = {
    SOL: {
        address: SOL_TOKEN_ADDRESS,
        decimals: SOL_DECIMALS,
        roomType: 0,
    },
    POPCAT: {
        address: POPCAT_TOKEN_ADDRESS,
        decimals: POPCAT_DECIMALS,
        roomType: 1,
    },
    BONK: {
        address: BONK_TOKEN_ADDRESS,
        decimals: BONK_DECIMALS,
        roomType: 2,
    },
}

export const stagingSupportedTokens: {
    [key: string]: {
        address: string;
        decimals: number;
        roomType: number;
    }
} = {
    SOL: {
        address: SOL_TOKEN_ADDRESS,
        decimals: SOL_DECIMALS,
        roomType: 0,
    },
    POPCAT: {
        address: "dogg2nZTVUfhVqGseXWbVuAL9EkuLdf8E8et2nRwPBQ",
        decimals: 1e6,
        roomType: 1,
    },
    BONK: {
        address: BONK_TOKEN_ADDRESS,
        decimals: BONK_DECIMALS,
        roomType: 2,
    },
}

export const getSupportedTokens = () => {
    if(!isProduction()) {
        return stagingSupportedTokens;
    }

    return supportedTokens;
}