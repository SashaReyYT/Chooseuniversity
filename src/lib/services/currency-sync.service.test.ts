import { describe, expect, it } from "vitest";
import { fetchEcbReferenceRates } from "./currency-sync.service";

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01">
  <gesmes:subject>Reference rates</gesmes:subject>
  <Cube>
    <Cube time="2026-08-19">
      <Cube currency='USD' rate='1.1573'/>
      <Cube currency='CZK' rate='24.180'/>
      <Cube currency='GBP' rate='0.85580'/>
    </Cube>
  </Cube>
</gesmes:Envelope>`;

describe("fetchEcbReferenceRates", () => {
  it("parses the ECB feed into rate_to_eur values (inverse of the feed's '1 EUR = X')", async () => {
    const rates = await fetchEcbReferenceRates(async () =>
      new Response(SAMPLE_XML, { status: 200 }),
    );

    expect(rates).toEqual([
      { currency: "USD", rateToEur: expect.closeTo(1 / 1.1573, 6) },
      { currency: "CZK", rateToEur: expect.closeTo(1 / 24.18, 6) },
      { currency: "GBP", rateToEur: expect.closeTo(1 / 0.8558, 6) },
    ]);
  });

  it("throws on a non-200 response", async () => {
    await expect(
      fetchEcbReferenceRates(async () => new Response("error", { status: 503 })),
    ).rejects.toThrow("HTTP 503");
  });

  it("throws when the response contains no rate rows", async () => {
    await expect(
      fetchEcbReferenceRates(async () =>
        new Response("<Cube><Cube time='2026-08-19'></Cube></Cube>", { status: 200 }),
      ),
    ).rejects.toThrow("no rate rows");
  });

  it("skips malformed rows instead of failing the whole parse", async () => {
    const xml = `<Cube><Cube time="2026-08-19">
      <Cube currency='USD' rate='1.15'/>
      <Cube currency='BAD' rate='not-a-number'/>
      <Cube currency='ZER' rate='0'/>
    </Cube></Cube>`;
    const rates = await fetchEcbReferenceRates(async () => new Response(xml, { status: 200 }));

    expect(rates).toEqual([{ currency: "USD", rateToEur: expect.closeTo(1 / 1.15, 6) }]);
  });
});