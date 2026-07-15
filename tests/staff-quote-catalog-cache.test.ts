import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import ts from "typescript";

const ROUTE_PATH = "src/app/api/staff/quote/catalog/route.ts";
const API_HELPER_PATH = "src/lib/api.ts";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

function identifiersCalledByGet(): string[] {
  const file = ts.createSourceFile(
    ROUTE_PATH,
    source(ROUTE_PATH),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const calls: string[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      calls.push(node.expression.text);
    }
    ts.forEachChild(node, visit);
  }

  const getHandler = file.statements.find(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === "GET"
  );
  assert.ok(getHandler?.body, "GET handler should exist");
  visit(getHandler.body);
  return calls;
}

function assertPrivateHeaders(response: Response): void {
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Vary"), "Cookie");
}

test("staff quote catalog handler routes all JSON responses through private helpers", () => {
  const calls = identifiersCalledByGet();

  assert.equal(calls.filter((name) => name === "privateOk").length, 5);
  assert.equal(calls.filter((name) => name === "privateFail").length, 1);
  assert.equal(calls.includes("ok"), false);
  assert.equal(calls.includes("fail"), false);
});

test("private API helpers set no-store and Cookie-vary headers", () => {
  const helperSource = source(API_HELPER_PATH);

  assert.match(helperSource, /PRIVATE_CACHE_CONTROL = "private, no-store"/);
  assert.match(helperSource, /headers\.set\("Cache-Control", PRIVATE_CACHE_CONTROL\)/);
  assert.match(helperSource, /headers\.set\("Vary", "Cookie"\)/);
  assert.match(helperSource, /function privateOk[\s\S]*withPrivateCacheHeaders/);
  assert.match(helperSource, /function privateFail[\s\S]*withPrivateCacheHeaders/);
  assertPrivateHeaders(
    new Response(null, {
      headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
    })
  );
});
