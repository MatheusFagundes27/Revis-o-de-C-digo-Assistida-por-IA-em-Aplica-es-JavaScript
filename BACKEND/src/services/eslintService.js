import { ESLint } from "eslint";

const eslint = new ESLint({
  overrideConfigFile: true,

  overrideConfig: {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        console: "readonly",
      },
    },

    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-unreachable": "error",
      eqeqeq: "warn",
      "no-constant-condition": "warn",
    },
  },
});

export async function analyzeWithESLint(code, filename = "snippet.js") {
  const results = await eslint.lintText(code, {
    filePath: filename,
  });

  const result = results[0];

  const alerts = result.messages.map((message) => ({
    ruleId: message.ruleId ?? "parser-error",
    message: message.message,
    line: message.line,
    column: message.column,
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

function normalizeSeverity(severity) {
  if (severity === 2) {
    return "error";
  }

  if (severity === 1) {
    return "warning";
  }

  return "info";
}
