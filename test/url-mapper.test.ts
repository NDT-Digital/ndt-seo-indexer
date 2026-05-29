import { describe, expect, it } from "vitest";
import type { SitemapConfig } from "../src/domain/types";
import { mapRowToSitemapUrl } from "../src/application/url-mapper";

describe("mapRowToSitemapUrl", () => {
  it("maps urlPattern tokens to an absolute URL", () => {
    const config = {
      name: "cnpjs",
      type: "json",
      urlPattern: "/cnpj/:cnpj",
      source: { file: "input.json" },
    } satisfies SitemapConfig;

    expect(
      mapRowToSitemapUrl("https://pjdados.com.br", config, {
        cnpj: "53969632000124",
      }),
    ).toMatchObject({
      loc: "https://pjdados.com.br/cnpj/53969632000124",
    });
  });
});
