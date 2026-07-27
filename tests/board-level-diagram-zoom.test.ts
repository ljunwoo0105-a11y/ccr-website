import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const BOARD_FILE = "src/components/bay/SchematicBoard.tsx";
const TEARDOWN_FILE = "src/components/bay/DeviceBay.tsx";
const EXPECTED_ZOOM = {
  MIN_ZOOM_PCT: 70,
  MAX_ZOOM_PCT: 160,
  ZOOM_STEP_PCT: 15,
  DEFAULT_ZOOM_PCT: 100,
  // Scenes open and reset a touch zoomed out; 100% stays the camera-distance
  // reference for the zoom math.
  INITIAL_ZOOM_PCT: 70,
} as const;
const ZOOM_NAMES = [
  "MIN_ZOOM_PCT",
  "MAX_ZOOM_PCT",
  "ZOOM_STEP_PCT",
  "DEFAULT_ZOOM_PCT",
  "INITIAL_ZOOM_PCT",
] as const;

type ZoomConstantName = keyof typeof EXPECTED_ZOOM;

function sourceFile(fileName: string, source: string) {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function findVariable(file: ts.SourceFile, name: string): ts.VariableDeclaration | null {
  let found: ts.VariableDeclaration | null = null;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

function numericConstant(file: ts.SourceFile, name: ZoomConstantName): number {
  const declaration = findVariable(file, name);
  assert.ok(declaration?.initializer, `${file.fileName} should declare ${name}`);
  assert.ok(
    ts.isNumericLiteral(declaration.initializer),
    `${file.fileName} ${name} should be a numeric literal`,
  );
  return Number(declaration.initializer.text);
}

function functionBody(file: ts.SourceFile, name: string): ts.Block {
  let body: ts.Block | null = null;
  const visit = (node: ts.Node): void => {
    if (body) return;
    if (ts.isFunctionDeclaration(node) && node.name?.text === name && node.body) {
      body = node.body;
      return;
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name &&
      node.initializer &&
      ts.isArrowFunction(node.initializer) &&
      ts.isBlock(node.initializer.body)
    ) {
      body = node.initializer.body;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  assert.ok(body, `${file.fileName} should contain ${name}`);
  return body;
}

function hasCall(root: ts.Node, expected: string): boolean {
  let matched = false;
  const visit = (node: ts.Node): void => {
    if (matched) return;
    if (ts.isCallExpression(node) && node.getText() === expected) {
      matched = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return matched;
}

function assertCall(root: ts.Node, expected: string): void {
  assert.equal(hasCall(root, expected), true, `missing call: ${expected}`);
}

function jsxOpenings(file: ts.SourceFile, tagName: string): readonly ts.JsxOpeningLikeElement[] {
  const openings: ts.JsxOpeningLikeElement[] = [];
  const visit = (node: ts.Node): void => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      node.tagName.text === tagName
    ) {
      openings.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return openings;
}

function jsxAttrText(node: ts.JsxOpeningLikeElement, name: string): string | null {
  const attr = node.attributes.properties.find(
    (prop) => ts.isJsxAttribute(prop) && ts.isIdentifier(prop.name) && prop.name.text === name,
  );
  if (!attr || !ts.isJsxAttribute(attr) || !attr.initializer) return null;
  return attr.initializer.getText();
}

function assertFalseJsxAttr(node: ts.JsxOpeningLikeElement, name: string): void {
  assert.equal(jsxAttrText(node, name), "{false}", `${name} should be false`);
}

function assertNoDisabledOrbit(node: ts.JsxOpeningLikeElement): void {
  assert.notEqual(jsxAttrText(node, "enableRotate"), "{false}");
  assert.notEqual(jsxAttrText(node, "enabled"), "{false}");
}

function assertZoomContract(boardSource: string, teardownSource: string): void {
  const board = sourceFile(BOARD_FILE, boardSource);
  const teardown = sourceFile(TEARDOWN_FILE, teardownSource);

  for (const name of ZOOM_NAMES) {
    assert.equal(numericConstant(board, name), EXPECTED_ZOOM[name], `board ${name}`);
    assert.equal(numericConstant(teardown, name), EXPECTED_ZOOM[name], `teardown ${name}`);
  }

  const boardSetZoom = functionBody(board, "setZoom");
  assertCall(boardSetZoom, "setZoomPct(THREE.MathUtils.clamp(pct, MIN_ZOOM_PCT, MAX_ZOOM_PCT))");
  assertCall(boardSetZoom, "demand.wake()");

  const teardownSetZoom = functionBody(teardown, "setZoom");
  assertCall(teardownSetZoom, "setZoomPct(Math.min(MAX_ZOOM_PCT, Math.max(MIN_ZOOM_PCT, pct)))");
  assertCall(teardownSetZoom, "demand.wake()");

  const cameraZoom = functionBody(board, "BoardCameraZoom");
  assertCall(cameraZoom, "camera.position.clone().sub(controls.target)");
  assertCall(cameraZoom, "offset.lengthSq()");
  assertCall(cameraZoom, "offset.copy(BOARD_CAMERA_POSITION).sub(BOARD_CAMERA_TARGET)");
  assertCall(cameraZoom, "offset.setLength(BOARD_CAMERA_DISTANCE * (DEFAULT_ZOOM_PCT / zoomPct))");
  assertCall(cameraZoom, "camera.position.copy(controls.target).add(offset)");
  assertCall(cameraZoom, "camera.updateProjectionMatrix()");
  assertCall(cameraZoom, "controls.update()");
  assertCall(cameraZoom, "onInteract()");

  const boardOrbits = jsxOpenings(board, "OrbitControls");
  assert.equal(boardOrbits.length, 1);
  for (const orbit of boardOrbits) {
    assertFalseJsxAttr(orbit, "enableZoom");
    assertFalseJsxAttr(orbit, "enablePan");
    assertNoDisabledOrbit(orbit);
  }

  const boardZoom = jsxOpenings(board, "BoardCameraZoom")[0];
  assert.ok(boardZoom, "board should wire BoardCameraZoom");
  assert.equal(jsxAttrText(boardZoom, "onInteract"), "{demand.wake}");

  const controls = jsxOpenings(board, "BoardZoomControls")[0];
  assert.ok(controls, "board should render BoardZoomControls");
  assert.equal(jsxAttrText(controls, "canZoomIn"), "{zoomPct < MAX_ZOOM_PCT}");
  assert.equal(jsxAttrText(controls, "canZoomOut"), "{zoomPct > MIN_ZOOM_PCT}");
  assert.equal(jsxAttrText(controls, "onResetZoom"), "{() => setZoom(INITIAL_ZOOM_PCT)}");
  assert.equal(jsxAttrText(controls, "onZoomIn"), "{() => setZoom(zoomPct + ZOOM_STEP_PCT)}");
  assert.equal(jsxAttrText(controls, "onZoomOut"), "{() => setZoom(zoomPct - ZOOM_STEP_PCT)}");

  const teardownOrbits = jsxOpenings(teardown, "OrbitControls");
  assert.equal(teardownOrbits.length, 1);
  for (const orbit of teardownOrbits) {
    assertFalseJsxAttr(orbit, "enableZoom");
    assertFalseJsxAttr(orbit, "enablePan");
    assertNoDisabledOrbit(orbit);
  }
}

test("board camera zoom contract matches teardown and rejects critical mutations", () => {
  // Given: the current board and teardown sources.
  const boardSource = readFileSync(BOARD_FILE, "utf8");
  const teardownSource = readFileSync(TEARDOWN_FILE, "utf8");

  // When: the TypeScript AST contract checker inspects both files.
  assertZoomContract(boardSource, teardownSource);

  // Then: each critical in-memory mutation is detected by the same checker.
  const mutations = [
    {
      name: "min boundary drift",
      board: boardSource.replace("const MIN_ZOOM_PCT = 70;", "const MIN_ZOOM_PCT = 40;"),
      teardown: teardownSource,
    },
    {
      name: "step boundary drift",
      board: boardSource.replace("const ZOOM_STEP_PCT = 15;", "const ZOOM_STEP_PCT = 20;"),
      teardown: teardownSource,
    },
    {
      name: "unclamped board input",
      board: boardSource.replace(
        "setZoomPct(THREE.MathUtils.clamp(pct, MIN_ZOOM_PCT, MAX_ZOOM_PCT));",
        "setZoomPct(pct);",
      ),
      teardown: teardownSource,
    },
    {
      name: "stale initial camera vector",
      board: boardSource.replace(
        "camera.position.clone().sub(controls.target)",
        "BOARD_CAMERA_POSITION.clone().sub(BOARD_CAMERA_TARGET)",
      ),
      teardown: teardownSource,
    },
    {
      name: "fixed camera distance",
      board: boardSource.replace(
        "offset.setLength(BOARD_CAMERA_DISTANCE * (DEFAULT_ZOOM_PCT / zoomPct));",
        "offset.setLength(BOARD_CAMERA_DISTANCE);",
      ),
      teardown: teardownSource,
    },
    {
      name: "camera target not preserved",
      board: boardSource.replace(
        "camera.position.copy(controls.target).add(offset);",
        "camera.position.copy(offset);",
      ),
      teardown: teardownSource,
    },
    {
      name: "controls update skipped",
      board: boardSource.replace("controls.update();", "void controls;"),
      teardown: teardownSource,
    },
    {
      name: "orbit zoom enabled",
      board: boardSource.replace("enableZoom={false}", "enableZoom={true}"),
      teardown: teardownSource,
    },
    {
      name: "demand wake skipped",
      board: boardSource.replace("onInteract();", "void onInteract;"),
      teardown: teardownSource,
    },
    {
      name: "malformed boundary mutation",
      board: boardSource.replace("const MAX_ZOOM_PCT = 160;", "const MAX_ZOOM_PCT = zoom;"),
      teardown: teardownSource,
    },
  ] as const;

  for (const mutation of mutations) {
    assert.throws(
      () => assertZoomContract(mutation.board, mutation.teardown),
      (error: unknown) => error instanceof Error,
      `${mutation.name} should fail the zoom contract`,
    );
  }
});
