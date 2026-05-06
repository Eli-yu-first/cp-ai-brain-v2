export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Support BUILT_IN_FORGE_API_KEY (Manus platform) or OPENAI_API_KEY (custom) as AI API key
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? process.env.OPENAI_API_BASE_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  wecomBotWebhookUrl: process.env.WECOM_BOT_WEBHOOK_URL ?? "",
  wecomMentionedMobiles: process.env.WECOM_MENTIONED_MOBILES ?? "",
  smsApiUrl: process.env.SMS_API_URL ?? "",
  smsApiKey: process.env.SMS_API_KEY ?? "",
  smsTargets: process.env.SMS_TARGETS ?? "",
};
