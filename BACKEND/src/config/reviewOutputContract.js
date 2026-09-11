export const REVIEW_OUTPUT_CONTRACT = Object.freeze({
  type: "object",

  required: ["reviews"],

  properties: {
    reviews: {
      type: "array",

      items: {
        type: "object",

        required: [
          "alertId",
          "ruleId",
          "category",
          "description",
          "justification",
          "suggestion",
          "criticality",
          "line",
          "references",
        ],

        properties: {
          alertId: {
            type: "string",
          },

          ruleId: {
            type: "string",
          },

          category: {
            anyOf: [
              {
                type: "object",

                required: ["id", "label"],

                properties: {
                  id: {
                    type: "string",
                  },

                  label: {
                    type: "string",
                  },
                },
              },

              {
                type: "null",
              },
            ],
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

            items: {
              type: "string",
            },
          },
        },
      },
    },
  },
});
