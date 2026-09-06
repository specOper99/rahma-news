import { createHmac } from "node:crypto";

function secret() {
  return process.env.BETTER_AUTH_SECRET ?? "dev";
}

export function previewToken(articleId: string, locale: string): string {
  const exp = Date.now() + 2 * 60 * 60 * 1000;
  const sig = createHmac("sha256", secret()).update(`${articleId}:${locale}:${exp}`).digest("hex");
  return `${exp}.${sig}`;
}

export function verifyPreview(token: string | undefined, articleId: string, locale: string): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!exp || !sig || Date.now() > exp) return false;
  const expect = createHmac("sha256", secret()).update(`${articleId}:${locale}:${exp}`).digest("hex");
  return sig === expect;
}
