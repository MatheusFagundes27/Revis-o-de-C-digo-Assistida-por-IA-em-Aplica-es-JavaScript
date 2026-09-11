export const LLM_ONLY_OUTPUT_CONTRACT = Object.freeze({
  type: "object",

  required: ["reviews"],

  properties: {
    reviews: {
      type: "array",

      items: {
        type: "object",

        required: [
          "reviewId",
          "category",
          "description",
          "justification",
          "suggestion",
          "criticality",
          "line",
          "references",
        ],

        properties: {
          reviewId: {
            type: "string",
          },

          category: {
            type: "object",

            required: ["id", "label"],

            properties: {
              id: {
                type: "string",
                enum: [
                  "readability",
                  "maintainability",
                  "error_handling",
                  "best_practices",
                ],
              },

              label: {
                type: "string",
              },
            },
          },

          description: {
            type: "string",
          },

          justification: {
            type: "string",
          },

          suggestion: {
            type: "string",
          },

          criticality: {
            type: "string",

            enum: ["low", "medium", "high"],
          },

          line: {
            anyOf: [
              {
                type: "number",
              },

              {
                type: "null",
              },
            ],
          },

          references: {
            type: "array",

            maxItems: 0,

            items: {
              type: "string",
            },
          },
        },
      },
    },
  },
});
