import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { z } from "zod";

import {
  runAdminGuarded,
  runAdminGuardedBody,
} from "../src/lib/admin-data/guard-first";

type HandlerName = "GET" | "POST" | "PATCH" | "DELETE";
type WrapperName = "withAdmin" | "withAdminBody";
type HandlerContract = {
  readonly name: HandlerName;
  readonly wrapper: WrapperName;
};
type RouteContract = {
  readonly path: string;
  readonly handlers: readonly HandlerContract[];
};

const ROUTES = [
  { path: "src/app/api/admin/diagnoses/route.ts", handlers: [{ name: "GET", wrapper: "withAdmin" }, { name: "POST", wrapper: "withAdminBody" }] },
  { path: "src/app/api/admin/diagnoses/[id]/route.ts", handlers: [{ name: "PATCH", wrapper: "withAdmin" }, { name: "DELETE", wrapper: "withAdmin" }] },
  { path: "src/app/api/admin/policies/route.ts", handlers: [{ name: "GET", wrapper: "withAdmin" }, { name: "POST", wrapper: "withAdminBody" }] },
  { path: "src/app/api/admin/policies/[id]/route.ts", handlers: [{ name: "PATCH", wrapper: "withAdmin" }, { name: "DELETE", wrapper: "withAdmin" }] },
  { path: "src/app/api/admin/records/intakes/[id]/route.ts", handlers: [{ name: "PATCH", wrapper: "withAdmin" }, { name: "DELETE", wrapper: "withAdmin" }] },
  { path: "src/app/api/admin/records/repair-forms/[id]/route.ts", handlers: [{ name: "PATCH", wrapper: "withAdmin" }, { name: "DELETE", wrapper: "withAdmin" }] },
  { path: "src/app/api/admin/price-access/route.ts", handlers: [{ name: "GET", wrapper: "withAdmin" }] },
] as const;

function source(path: string): ts.SourceFile {
  return ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
}

async function text(response: Response): Promise<unknown> {
  return response.json();
}

function adminError(message: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "application/json",
      Vary: "Cookie",
    },
  });
}

function hasExport(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  return modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function exportedHandlers(file: ts.SourceFile): Map<string, ts.FunctionDeclaration> {
  const handlers = new Map<string, ts.FunctionDeclaration>();
  for (const statement of file.statements) {
    if (!ts.isFunctionDeclaration(statement) || !hasExport(statement)) continue;
    const name = statement.name?.text;
    if (name) handlers.set(name, statement);
  }
  return handlers;
}

function directReturnCall(functionNode: ts.FunctionDeclaration): string | null {
  for (const statement of functionNode.body?.statements ?? []) {
    if (
      ts.isReturnStatement(statement) &&
      statement.expression &&
      ts.isCallExpression(statement.expression) &&
      ts.isIdentifier(statement.expression.expression)
    ) {
      return statement.expression.expression.text;
    }
  }
  return null;
}

function calledIdentifiers(file: ts.SourceFile): Set<string> {
  const calls = new Set<string>();
  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      calls.add(node.expression.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return calls;
}

test("admin guard wrapper returns private 403 before parsing or service work", async () => {
  let parsed = false;
  let served = false;

  const response = await runAdminGuardedBody({
    req: new Request("https://example.test/admin", { method: "POST", body: "not json" }),
    schema: z.object({}),
    guard: async () => ({ error: new Response(null, { status: 403 }) }),
    forbidden: () => adminError("Forbidden", 403),
    parse: async () => {
      parsed = true;
      return { data: null, error: new Response(null, { status: 422 }) };
    },
    invalid: () => adminError("Invalid payload", 422),
    work: async () => {
      served = true;
      return new Response(null, { status: 200 });
    },
  });

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Vary"), "Cookie");
  assert.deepEqual(await text(response), { ok: false, error: "Forbidden" });
  assert.equal(parsed, false);
  assert.equal(served, false);
});

test("admin guard wrapper blocks non-body routes before work", async () => {
  let served = false;

  const response = await runAdminGuarded({
    guard: async () => ({ error: new Response(null, { status: 403 }) }),
    forbidden: () => adminError("Forbidden", 403),
    work: async () => {
      served = true;
      return new Response(null, { status: 200 });
    },
  });

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(served, false);
});

test("admin body wrapper returns 422 before service work on invalid payload", async () => {
  let served = false;

  const response = await runAdminGuardedBody({
    req: new Request("https://example.test/admin", { method: "POST", body: "{}" }),
    schema: z.object({}),
    guard: async () => ({ error: null }),
    forbidden: () => adminError("Forbidden", 403),
    parse: async () => ({ data: null, error: new Response(null, { status: 422 }) }),
    invalid: () => adminError("Invalid policy payload", 422),
    work: async () => {
      served = true;
      return new Response(null, { status: 200 });
    },
  });

  assert.equal(response.status, 422);
  assert.deepEqual(await text(response), { ok: false, error: "Invalid policy payload" });
  assert.equal(served, false);
});

test("admin data route handlers return through the expected guard wrapper", () => {
  for (const route of ROUTES satisfies readonly RouteContract[]) {
    const handlers = exportedHandlers(source(route.path));
    const expectedNames = route.handlers.map((handler) => handler.name).sort();

    assert.deepEqual([...handlers.keys()].sort(), expectedNames, route.path);
    for (const expected of route.handlers) {
      const handler = handlers.get(expected.name);
      assert.ok(handler, `${route.path}: missing ${expected.name}`);
      assert.equal(directReturnCall(handler), expected.wrapper, `${route.path}: ${expected.name}`);
    }
  }
});

test("admin data routes use private no-store responses that vary by Cookie", () => {
  const privateHelpers = new Set(["adminOk", "adminResult", "adminFail"]);

  for (const route of ROUTES) {
    const calls = calledIdentifiers(source(route.path));
    assert.equal(
      [...privateHelpers].some((helper) => calls.has(helper)),
      true,
      `${route.path}: missing admin private response helper`
    );
  }
});
