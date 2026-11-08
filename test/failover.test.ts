import assert from "node:assert/strict";
import { chooseProvider, buildFollowUp, type Provider } from "../src/failover_service.js";

const fake = (name: string) => ({ name, client: {} as Provider["client"] });
const providers = [fake("primary"), fake("secondary")];
assert.equal(chooseProvider(providers, new Set(["primary"])).name, "secondary");
assert.throws(() => chooseProvider(providers, new Set(["primary", "secondary"])), /exhausted/);
const result = buildFollowUp({ matterId: "m1", clientName: "A", facts: "f", signedDocumentUrl: "https://x.test/s", deadline: "2030-01-02T10:00:00.000Z" });
assert.equal(result.followUpAt, "2030-01-01T10:00:00.000Z");
console.log("failover and deadline decisions pass");
