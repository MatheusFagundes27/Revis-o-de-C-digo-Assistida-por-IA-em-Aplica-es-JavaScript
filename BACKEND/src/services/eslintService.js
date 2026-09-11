import { ESLint } from "eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export async function analyzeWithESLint({ code, filename, environment }) {
  const eslint = createESLint(environment);

  const results = await eslint.lintText(code, {
    filePath: filename,
  });

  const result = results[0];

  const alerts = result.messages.map((message) => ({
    ruleId:
      message.ruleId ?? (message.fatal ? "parser-error" : "eslint-warning"),

    message: message.message,

    line: message.line ?? null,
    column: message.column ?? null,

    endLine: message.endLine ?? null,
    endColumn: message.endColumn ?? null,

    severity: normalizeSeverity(message.severity),
  }));

  return {
    errorCount: result.errorCount,
    warningCount: result.warningCount,
    alerts,
  };
}

function createESLint(environment) {
  const isReact = environment === "react";

  const environmentGlobals = isReact
    ? {
        ...globals.browser,
        ...globals.es2021,
      }
    : {
        ...globals.node,
        ...globals.es2021,
      };

  const supportedFiles = isReact
    ? ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"]
    : ["**/*.js", "**/*.mjs", "**/*.cjs"];

  return new ESLint({
    overrideConfigFile: true,

    overrideConfig: [
      {
        files: supportedFiles,

        languageOptions: {
          ecmaVersion: "latest",
          sourceType: "module",

          parserOptions: isReact
            ? {
                ecmaFeatures: {
                  jsx: true,
                },
              }
            : {},

          globals: environmentGlobals,
        },

        plugins: isReact
          ? {
              "react-hooks": reactHooks,
            }
          : {},

        rules: {
          // Regras gerais
          "no-unused-vars": "warn",
          "no-undef": "error",
          "no-unreachable": "error",
          eqeqeq: "warn",
          "no-constant-condition": "warn",

          // Regras específicas de React
          ...(isReact
            ? {
                "react-hooks/rules-of-hooks": "error",
                "react-hooks/exhaustive-deps": "warn",
              }
            : {}),
        },
      },
    ],
  });
}

function normalizeSeverity(severity) {
  if (severity === 2) {
    return "error";
  }

  if (severity === 1) {
    return "warning";
  }

  return "info";
}
