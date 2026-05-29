import { describe, expect, it } from "vitest";
import { escapeXml } from "../src/infrastructure/xml/xml-escape";

describe("escapeXml", () => {
  it("escapes XML-sensitive characters", () => {
    expect(escapeXml("A&B <C> \"D\" 'E'")).toBe(
      "A&amp;B &lt;C&gt; &quot;D&quot; &apos;E&apos;",
    );
  });
});
