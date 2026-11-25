const GLYPH_SIZE = 8;
const PIXEL_SCALE = 8;
const CELL_SIZE = GLYPH_SIZE * PIXEL_SCALE;

const { instance } = await WebAssembly.instantiateStreaming(
    fetch("../zig-out/bin/gly.wasm"),
);
const {
    memory, cells_ptr, grid_width, grid_height, set_cell, glyphs_ptr, glyph_count,
} = instance.exports;

const width = grid_width();
const height = grid_height();
const cells = new Uint8Array(memory.buffer, cells_ptr(), width * height);
const glyphBase = glyphs_ptr();
const glyphs = Array.from({ length: glyph_count() }, (_, id) =>
    new Uint8Array(memory.buffer, glyphBase + id * GLYPH_SIZE, GLYPH_SIZE),
);

const board = document.querySelector("#output");
const palette = document.querySelector("#palette");
const boardContext = board.getContext("2d");
let selectedGlyphId = 0;

function drawGlyph(context, rows, left, top) {
    for (const [y, bits] of rows.entries()) {
        for (let x = 0; x < GLYPH_SIZE; x++) {
            if (bits & (0x80 >>> x)) {
                context.fillRect(
                    left + x * PIXEL_SCALE, top + y * PIXEL_SCALE,
                    PIXEL_SCALE, PIXEL_SCALE,
                );
            }
        }
    }
}

board.width = width * CELL_SIZE;
board.height = height * CELL_SIZE;

function renderBoard() {
    boardContext.clearRect(0, 0, board.width, board.height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const rows = glyphs[cells[y * width + x]];
            if (rows) drawGlyph(boardContext, rows, x * CELL_SIZE, y * CELL_SIZE);
        }
    }
}

const PALETTE_COLUMNS = 8;
const paletteRows = Math.ceil(glyphs.length / PALETTE_COLUMNS);
const paletteContext = palette.getContext("2d");

palette.width = PALETTE_COLUMNS * CELL_SIZE;
palette.height = paletteRows * CELL_SIZE;

function renderPalette() {
    paletteContext.clearRect(0, 0, palette.width, palette.height);

    for (const [id, glyph] of glyphs.entries()) {
        const col = id % PALETTE_COLUMNS;
        const row = Math.floor(id / PALETTE_COLUMNS);
        drawGlyph(paletteContext, glyph, col * CELL_SIZE, row * CELL_SIZE);
    }

    const selectedCol = selectedGlyphId % PALETTE_COLUMNS;
    const selectedRow = Math.floor(selectedGlyphId / PALETTE_COLUMNS);

    paletteContext.strokeStyle = "#1680ff";
    paletteContext.strokeRect(
        selectedCol * CELL_SIZE + 0.5,
        selectedRow * CELL_SIZE + 0.5,
        CELL_SIZE - 1,
        CELL_SIZE - 1,
    );
}

function cellAt(clientX, clientY, rect, columns, rows) {
    return {
        x: Math.floor((clientX - rect.left) * columns / rect.width),
        y: Math.floor((clientY - rect.top) * rows / rect.height),
    };
}

board.addEventListener("click", (event) => {
    const { x, y } = cellAt(
        event.clientX, event.clientY, board.getBoundingClientRect(), width, height,
    );
    if (set_cell(x, y, selectedGlyphId)) renderBoard();
});

palette.addEventListener("click", (event) => {
    const { x, y } = cellAt(
        event.clientX, event.clientY, palette.getBoundingClientRect(),
        PALETTE_COLUMNS, paletteRows,
    );
    if (x < 0 || x >= PALETTE_COLUMNS || y < 0 || y >= paletteRows) return;

    const id = y * PALETTE_COLUMNS + x;
    if (id >= glyphs.length) return;

    selectedGlyphId = id;
    renderPalette();
});

renderPalette();
renderBoard();
