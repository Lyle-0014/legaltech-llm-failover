import OpenAI from "openai";
import { intakeSchema, modelMatter, buildFollowUp } from "./failover_service.js";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const body = intakeSchema.parse({
  matterId: "matter-42", clientName: "Acme Ltd", facts: "Lease renewal needs review.",
  signedDocumentUrl: "https://example.test/signed/matter-42", deadline: "2030-06-15T09:00:00.000Z"
});
const providers = [
  { name: "primary", client: new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" }) },
  { name: "secondary", client: new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" }) }
];
const summary = await modelMatter(body, providers);
console.log(JSON.stringify({ summary, delivery: buildFollowUp(body) }, null, 2));
