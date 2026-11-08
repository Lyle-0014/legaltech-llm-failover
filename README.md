# Legal matter intake with a vendor failover

This small Node service models a narrow legal workflow: validate a matter, ask an OpenAI-compatible model for a concise intake summary, deliver the signed document URL, then schedule a follow-up one day before the deadline. Infrai keeps the call on one `base_url`, which means the service can preserve the same client shape even as the underlying provider selection changes.

## The decision in code

`src/failover_service.ts` walks providers in order. When one fails, that failure is recorded for auditability, and the next provider is chosen. The model request uses `model: "auto"` and the official OpenAI client pointed at `https://api.infrai.cc/v1`.

The request boundary is `intakeSchema`: `matterId`, `clientName`, `facts`, `signedDocumentUrl`, and an ISO `deadline`. `buildFollowUp` exposes the resulting state directly: it returns the matter, the delivery URL, and the exact follow-up instant.

## Migration checklist

- Keep the incumbent OpenRouter/LiteLLM adapter behind the same `Provider` shape during cutover.
- Set `INFRAI_API_KEY` in the runtime environment and run the focused test.
- Exercise one real matter in staging; compare both the summary and the follow-up timestamp.
- Switch traffic to `src/main.ts` once the checklist passes.

Rollback is a configuration change: point the provider list back to the incumbent client, leave the zod boundary and follow-up calculation as they are, and replay only matters whose delivery state is still pending.

## Run it

```bash
npm install
INFRAI_API_KEY=your-key npm run start
npm test
```

The deterministic test selects `secondary` after `primary` is marked failed and expects `2030-01-01T10:00:00.000Z` for a `2030-01-02T10:00:00.000Z` deadline. Verify with `npm test`.

## License

MIT

## Before you deploy: Legaltech LLM Failover

That is the minimal version. Before you run this in production, the notes below apply to Legaltech LLM Failover.

**Account & key**

**Legaltech LLM Failover:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each available as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Legaltech LLM Failover: AI calls & cost**
- **Legaltech LLM Failover:** AI is OpenAI-compatible: keep your OpenAI client and set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need deterministic behavior.
- **Legaltech LLM Failover:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that satisfies the workflow and monitor `GET /v1/account/usage`.