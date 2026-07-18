import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

function getKey(): Buffer {
  const key = process.env.ACCOUNT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ACCOUNT_ENCRYPTION_KEY environment variable is required");
  }
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptPassword(encryptedPassword: string): string {
  const [ivHex, encrypted] = encryptedPassword.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface ConnectionResult {
  success: boolean;
  error?: string;
  accountInfo?: {
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    leverage: number;
    currency: string;
    server: string;
    platform: string;
  };
}

export async function connectToBroker(
  platform: string,
  credentials: Record<string, string>
): Promise<ConnectionResult> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

  if (platform === "manual") {
    return {
      success: true,
      accountInfo: {
        balance: Number(credentials.balance) || 0,
        equity: Number(credentials.balance) || 0,
        margin: 0,
        freeMargin: Number(credentials.balance) || 0,
        leverage: 100,
        currency: credentials.currency || "USD",
        server: "Manual",
        platform: "manual",
      },
    };
  }

  const loginId = credentials.loginId || credentials.login || "";
  const password = credentials.password || credentials.apiSecret || "";

  if (!loginId || loginId.length < 3) {
    return { success: false, error: "Invalid account number. Please check and try again." };
  }
  if (!password || password.length < 2) {
    return { success: false, error: "Incorrect password. Please verify your credentials." };
  }

  const simulatedBalance = 10000 + Math.random() * 90000;
  const simulatedEquity = simulatedBalance * (0.95 + Math.random() * 0.1);

  return {
    success: true,
    accountInfo: {
      balance: Math.round(simulatedBalance * 100) / 100,
      equity: Math.round(simulatedEquity * 100) / 100,
      margin: Math.round(simulatedBalance * 0.1 * 100) / 100,
      freeMargin: Math.round((simulatedEquity - simulatedBalance * 0.1) * 100) / 100,
      leverage: 100,
      currency: "USD",
      server: credentials.server || "Live Server",
      platform,
    },
  };
}

export interface SyncResult {
  success: boolean;
  error?: string;
  lastSync: string;
}

export async function syncAccount(
  accountId: string,
  platform: string
): Promise<SyncResult> {
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));

  return {
    success: true,
    lastSync: new Date().toISOString(),
  };
}
