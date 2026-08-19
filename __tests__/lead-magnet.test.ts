import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractEmailAddress,
  getLeadMagnetConfig,
  sendLeadMagnetEmail,
} from "../lib/email/lead-magnet";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("lead magnet email delivery", () => {
  it("extracts and normalizes an email from a conversational reply", () => {
    expect(
      extractEmailAddress("My email is Trader.Name+book@Example.com thanks")
    ).toBe("trader.name+book@example.com");
    expect(extractEmailAddress("not an email")).toBeNull();
    expect(extractEmailAddress("name@example")).toBeNull();
  });

  it("stays disabled until every required deployment value is valid", () => {
    vi.stubEnv("LEAD_MAGNET_KEYWORD", "BOOK");
    vi.stubEnv("LEAD_MAGNET_EBOOK_URL", "javascript:alert(1)");
    vi.stubEnv("LEAD_MAGNET_EMAIL_FROM", "ebook@example.com");
    vi.stubEnv("RESEND_API_KEY", "re_test");

    expect(getLeadMagnetConfig()).toBeNull();
  });

  it("escapes operator copy and the ebook URL in HTML email", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
    });
    vi.stubGlobal("fetch", fetchMock);

    await sendLeadMagnetEmail({
      idempotencyScope: "dm_source_1",
      to: "reader@example.com",
      config: {
        keyword: "BOOK",
        ebookUrl: "https://example.com/ebook?a=1&b=2",
        from: "ebook@example.com",
        subject: "Your Futures Ebook",
        emailIntro: "Thanks <trader>",
        confirmationMessage: "Sent",
        replyWindowHours: 168,
        resendApiKey: "re_test",
      },
    });

    const request = fetchMock.mock.calls[0]?.[1] as { body: string };
    const body = JSON.parse(request.body) as { html: string };
    expect(body.html).toContain("Thanks &lt;trader&gt;");
    expect(body.html).toContain("a=1&amp;b=2");
  });
});
