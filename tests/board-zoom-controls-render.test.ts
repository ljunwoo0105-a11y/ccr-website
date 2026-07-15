import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as ReactRuntime from "react";
import { renderToStaticMarkup } from "react-dom/server";

interface RenderedButton {
  readonly label: string;
  readonly disabled: boolean;
  readonly text: string;
}

Object.assign(globalThis, { React: ReactRuntime });

function parseButtons(markup: string): readonly RenderedButton[] {
  return Array.from(markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)).map(
    (match) => {
      const attrs = match[1] ?? "";
      const body = match[2] ?? "";
      const bareAttrs = attrs.replace(/"[^"]*"/g, "\"\"");
      const label = attrs.match(/\baria-label="([^"]+)"/)?.[1] ?? "";
      const text = body.replace(/<[^>]+>/g, "").trim();
      return {
        label,
        disabled: /\sdisabled(?:=""|="disabled")?(?=\s|$)/.test(bareAttrs),
        text,
      };
    },
  );
}

async function renderZoomControls(zoomPct: number, canZoomIn: boolean, canZoomOut: boolean) {
  const { BoardZoomControls } = await import("../src/components/bay/BoardZoomControls");
  return parseButtons(
    renderToStaticMarkup(
      ReactRuntime.createElement(BoardZoomControls, {
        zoomPct,
        canZoomIn,
        canZoomOut,
        onZoomIn: () => undefined,
        onZoomOut: () => undefined,
        onResetZoom: () => undefined,
      }),
    ),
  );
}

test("board zoom controls render accessible equivalent controls", async () => {
  // Given: board-level controls rendered by React server rendering.
  const mid = await renderZoomControls(100, true, true);
  const min = await renderZoomControls(70, true, false);
  const max = await renderZoomControls(160, false, true);

  // When: the rendered button semantics are inspected.
  // Then: zoom out, reset, and zoom in are accessible and expose clamp states.
  assert.deepEqual(
    mid.map((button) => button.label),
    ["Zoom out board-level diagram", "Reset board diagram zoom", "Zoom in board-level diagram"],
  );
  assert.deepEqual(
    mid.map((button) => button.disabled),
    [false, false, false],
  );
  assert.equal(mid[1]?.text, "100%");
  assert.deepEqual(
    min.map((button) => button.disabled),
    [true, false, false],
  );
  assert.deepEqual(
    max.map((button) => button.disabled),
    [false, false, true],
  );
});

test("board label reserves mobile space for zoom controls", () => {
  // Given: the board label shares its top row with the zoom controls.
  const boardSource = readFileSync("src/components/bay/SchematicBoard.tsx", "utf8");

  // When: the responsive label markup is inspected.
  // Then: the secondary text is hidden on mobile and restored from the sm breakpoint.
  assert.match(
    boardSource,
    /BOARD-LEVEL\s*<span className="hidden sm:inline">[\s\S]*?LIVE NETS[\s\S]*?<\/span>/,
  );
});
