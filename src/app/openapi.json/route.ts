import { SITE_URL } from "@/lib/agent-readiness";

export const dynamic = "force-static";

const openapi = {
  openapi: "3.1.0",
  info: {
    title: "SF Tennis API",
    version: "1.0.0",
    description:
      "Public court availability and user-authorized match history automation for SF Tennis.",
    license: {
      name: "ISC",
    },
  },
  servers: [{ url: SITE_URL }],
  tags: [
    { name: "Availability" },
    { name: "Travel" },
    { name: "History" },
    { name: "Health" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Check service health.",
        responses: {
          "200": {
            description: "Service status.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/courts": {
      get: {
        tags: ["Availability"],
        summary: "List public court availability.",
        description:
          "Returns tennis or pickleball court availability for San Francisco or Mountain View. No authentication required.",
        parameters: [
          {
            name: "sport",
            in: "query",
            schema: { type: "string", enum: ["tennis", "pickleball"] },
            required: false,
          },
          {
            name: "city",
            in: "query",
            schema: { type: "string", enum: ["sf", "mountain-view"] },
            required: false,
          },
        ],
        responses: {
          "200": {
            description: "Court availability response.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CourtsResponse" },
              },
            },
          },
          "502": {
            description: "Upstream availability failed.",
          },
        },
      },
    },
    "/api/directions": {
      get: {
        tags: ["Travel"],
        summary: "Estimate travel times to court locations.",
        parameters: [
          {
            name: "origin",
            in: "query",
            description: "Origin coordinate as lat,lng. Defaults to the app city center.",
            schema: { type: "string", examples: ["37.7599,-122.4148"] },
          },
          {
            name: "locations",
            in: "query",
            required: true,
            description:
              "Pipe-delimited entries in the form id:lat,lng. The server caps fan-out at 50 locations.",
            schema: {
              type: "string",
              examples: ["dolores:37.7599,-122.4270|alice:37.7780,-122.4350"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Walking, driving, and transit URL estimates.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DirectionsResponse" },
              },
            },
          },
          "400": { description: "Missing or invalid locations parameter." },
          "500": { description: "Mapbox token is not configured." },
        },
      },
    },
    "/api/history/external": {
      get: {
        tags: ["History"],
        summary: "List user match history for authorized automations.",
        security: [{ bearerApiKey: [] }, { oauthClientCredentials: ["history:read"] }],
        responses: {
          "200": {
            description: "History and friend display names.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HistoryListResponse" },
              },
            },
          },
          "401": { description: "Invalid or missing API key." },
        },
      },
      post: {
        tags: ["History"],
        summary: "Create a match history entry.",
        security: [{ bearerApiKey: [] }, { oauthClientCredentials: ["history:write"] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HistoryMutation" },
            },
          },
        },
        responses: {
          "200": {
            description: "Created entry id.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MutationResponse" },
              },
            },
          },
          "400": { description: "Invalid body." },
          "401": { description: "Invalid or missing API key." },
        },
      },
      put: {
        tags: ["History"],
        summary: "Update a match history entry.",
        security: [{ bearerApiKey: [] }, { oauthClientCredentials: ["history:write"] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { type: "object", required: ["id"], properties: { id: { type: "string" } } },
                  { $ref: "#/components/schemas/HistoryMutation" },
                ],
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated entry." },
          "400": { description: "Invalid body." },
          "401": { description: "Invalid or missing API key." },
          "404": { description: "Entry not found." },
        },
      },
      delete: {
        tags: ["History"],
        summary: "Delete a match history entry.",
        security: [{ bearerApiKey: [] }, { oauthClientCredentials: ["history:write"] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id"],
                properties: { id: { type: "string", maxLength: 100 } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Deleted entry." },
          "400": { description: "Invalid body." },
          "401": { description: "Invalid or missing API key." },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerApiKey: {
        type: "http",
        scheme: "bearer",
        description: "User-owned API key configured as API_KEY on the server.",
      },
      oauthClientCredentials: {
        type: "oauth2",
        flows: {
          clientCredentials: {
            tokenUrl: `${SITE_URL}/oauth/token`,
            scopes: {
              "history:read": "Read user match history.",
              "history:write": "Create, update, and delete user match history.",
            },
          },
        },
      },
    },
    schemas: {
      HealthResponse: {
        type: "object",
        properties: { ok: { type: "boolean" } },
      },
      CourtsResponse: {
        type: "object",
        properties: {
          sport: { type: "string", enum: ["tennis", "pickleball"] },
          city: { type: "string", enum: ["sf", "mountain-view"] },
          fetchedAt: { type: "string", format: "date-time" },
          courts: {
            type: "array",
            items: { $ref: "#/components/schemas/Location" },
          },
        },
      },
      Location: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          lat: { type: "number" },
          lng: { type: "number" },
          address: { type: "string" },
          courts: {
            type: "array",
            items: { $ref: "#/components/schemas/Court" },
          },
          totalSlotsToday: { type: "number" },
          totalSlotsWeek: { type: "number" },
          availabilityStatus: {
            type: "string",
            enum: ["available", "later", "full"],
          },
        },
      },
      Court: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          sportId: { type: "string" },
          availableSlots: {
            type: "array",
            items: { $ref: "#/components/schemas/Slot" },
          },
        },
      },
      Slot: {
        type: "object",
        properties: {
          date: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          price: { type: "number" },
          weather: { type: "object", additionalProperties: true },
        },
      },
      DirectionsResponse: {
        type: "object",
        properties: {
          travelTimes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                locationId: { type: "string" },
                walking: { $ref: "#/components/schemas/TravelMode" },
                driving: { $ref: "#/components/schemas/TravelMode" },
                transitUrl: { type: "string", format: "uri" },
              },
            },
          },
        },
      },
      TravelMode: {
        type: ["object", "null"],
        properties: {
          durationMinutes: { type: "number" },
          distanceMeters: { type: "number" },
        },
      },
      HistoryListResponse: {
        type: "object",
        properties: {
          history: { type: "array", items: { type: "object", additionalProperties: true } },
          friends: { type: "array", items: { type: "object", additionalProperties: true } },
          courtsUrl: { type: "string" },
        },
      },
      HistoryMutation: {
        type: "object",
        required: ["locationId", "locationName", "date"],
        properties: {
          locationId: { type: "string", maxLength: 500 },
          locationName: { type: "string", maxLength: 500 },
          courtNumber: { type: "string", maxLength: 20 },
          date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          time: { type: "string", maxLength: 5 },
          friends: {
            type: "array",
            maxItems: 20,
            items: { type: "string", maxLength: 100 },
          },
          notes: { type: "string", maxLength: 1000 },
        },
      },
      MutationResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          id: { type: "string" },
        },
      },
    },
  },
};

export function GET() {
  return Response.json(openapi, {
    headers: {
      "Content-Type": "application/vnd.oai.openapi+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
