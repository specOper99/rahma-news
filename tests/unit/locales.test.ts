import { describe, expect, it } from "vitest";
import { hreflangOf, dirOf, detectDir } from "@/lib/locales";
import { adminCopyFor, interpolate, resolveDeskLocale } from "@/lib/admin-copy";
import { hreflangMap } from "@/lib/seo";
import { draftSlug, isPlaceholderSlug, isValidSlug, slugify, uploadBasename } from "@/lib/slug";
import { walkRejectsXss, emptyDoc, collectMediaIds } from "@/lib/tiptap/schema";

describe("locales", () => {
  it("emits ku-Arab for ckb hreflang", () => {
    expect(hreflangOf("ckb")).toBe("ku-Arab");
  });
  it("rtl for ar and ckb", () => {
    expect(dirOf("en")).toBe("ltr");
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("ckb")).toBe("rtl");
  });
  it("detects script even when locale fallback disagrees", () => {
    expect(detectDir("Baghdad heat and the power grid", "rtl")).toBe("ltr");
    expect(detectDir("حر بغداد وشبكة الكهرباء", "ltr")).toBe("rtl");
    expect(detectDir("", "rtl")).toBe("rtl");
  });
});

describe("desk locale", () => {
  it("prefers explicit desk cookie over NEXT_LOCALE", () => {
    expect(resolveDeskLocale("ckb", "ar")).toBe("ckb");
    expect(resolveDeskLocale(undefined, "ar")).toBe("ar");
    expect(resolveDeskLocale("nope", "xx")).toBe("en");
  });
  it("loads Arabic and Sorani admin chrome", () => {
    expect(adminCopyFor("ar").dashboard).toBe("مكتب التحرير");
    expect(adminCopyFor("ckb").login).toBe("چوونەژوورەوە");
    expect(adminCopyFor("en").login).toBe("Sign in");
    expect(interpolate(adminCopyFor("ar").breakingLive, { n: 2 })).toBe("عاجل: 2");
  });
});

describe("hreflang map", () => {
  it("never includes ckb as a key", () => {
    const map = hreflangMap([
      { locale: "en", url: "https://x/en" },
      { locale: "ar", url: "https://x/ar" },
      { locale: "ckb", url: "https://x/ckb" },
    ]);
    expect(map.ckb).toBeUndefined();
    expect(map["ku-Arab"]).toBe("https://x/ckb");
    expect(map["x-default"]).toBe("https://x/ar");
  });
});

describe("slug", () => {
  it("ascii for english", () => {
    expect(slugify("Baghdad Heat!", "en")).toBe("baghdad-heat");
    expect(isValidSlug("baghdad-heat", "en")).toBe(true);
    expect(isValidSlug("admin", "en")).toBe(false);
  });
  it("draft slugs stay human, never a uuid", () => {
    expect(draftSlug("en")).toMatch(/^untitled-[a-z0-9]+$/);
    expect(draftSlug("en")).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
    expect(isPlaceholderSlug("untitled-mabc12")).toBe(true);
    expect(isPlaceholderSlug("draft-01932abc")).toBe(true);
    expect(isPlaceholderSlug("baghdad-heat")).toBe(false);
  });
  it("upload basename from original filename", () => {
    expect(uploadBasename("Tigris Crossing.JPG")).toBe("tigris-crossing");
    expect(uploadBasename("../../../etc/passwd")).toBe("passwd");
  });
});

describe("tiptap xss", () => {
  it("accepts empty doc", () => {
    expect(walkRejectsXss(emptyDoc())).toBeNull();
  });
  it("rejects javascript links", () => {
    const node = {
      type: "doc" as const,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    };
    expect(walkRejectsXss(node)).toBe("bad-link");
  });
  it("rejects evil iframe provider", () => {
    const node = {
      type: "doc" as const,
      content: [{ type: "embed", attrs: { provider: "evil.com", videoId: "abc" } }],
    };
    expect(walkRejectsXss(node)).toBe("bad-embed");
  });
  it("collects image media ids", () => {
    const doc = {
      type: "doc" as const,
      content: [{ type: "image", attrs: { mediaId: "abc" } }],
    };
    expect([...collectMediaIds(doc)]).toEqual(["abc"]);
  });
});
