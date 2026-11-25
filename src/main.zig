const Glyph = [8]u8;
const blank: Glyph = .{
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
};
const top_half: Glyph = .{
    0b11111111,
    0b11111111,
    0b11111111,
    0b11111111,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
};
const glyphs = [_]Glyph{
    blank,
    top_half,
};

const width = 16;
const height = 8;
var cells: [height][width]u8 = @splat(@splat(0));

export fn glyphs_ptr() usize {
    return @intFromPtr(&glyphs[0][0]);
}

export fn glyph_count() usize {
    return glyphs.len;
}

export fn grid_width() usize {
    return width;
}

export fn grid_height() usize {
    return height;
}

export fn cells_ptr() usize {
    return @intFromPtr(&cells[0][0]);
}

export fn set_cell(x: usize, y: usize, glyph: u8) bool {
    if (x >= width or y >= height or glyph >= glyphs.len) return false;
    cells[y][x] = glyph;
    return true;
}
