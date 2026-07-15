export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 1800;
// Feature size (px) of the terrain biome noise — shared by buildTerrain (ground
// tiles) and scatterTrees (density bias) so tree density visually tracks biome.
// Needs to be large relative to the 4 biome bands it gets sliced into: in the
// steepest spots a single noise lattice cell can span the full 0..1 range, so a
// band can be as narrow as scale/4 px — too small here and most tiles end up
// within one tile of a boundary instead of having real biome interior.
export const TERRAIN_NOISE_SCALE = 520;
// A second, differently-scaled noise field sampled at a large coordinate offset
// (see scatterRocks) so rocky outcrops cluster independently of vegetation.
export const ROCKINESS_NOISE_SCALE = 180;
export const ROCKINESS_NOISE_OFFSET = 9000;
export const SHOP_ITEMS_PER_PAGE = 7;
export const SHOP_PRICES = {
  twig: 1, pebble: 1, wood: 3, stone_chunk: 4, string: 5, arrow_item: 2,
  iron_ore: 8, iron_ingot: 15, bone: 4, obsidian: 25,
  campfire: 12, log_seat: 10, furnace: 25, crafting_table: 30,
  wall: 8, door: 10, roof: 10, chair: 8, table: 12, steps: 8,
  axe: 20, pickaxe: 25, sword: 30, bow: 35,
  ak47: 150, famas: 175, glock17: 100,
  iron_helmet: 45, iron_chestplate: 60, iron_arm_piece: 40,
  iron_gauntlet: 40, iron_leggings: 55, iron_armor_set: 200,
  bucket: 20, bucket_water: 30, bucket_lava: 50
};

// The four biome base colors keyed to noise thresholds. biomeColorAt lerps
// between adjacent stops so the base color field is fully continuous — the
// gradient blend the terrain reads as. The same thresholds drive which detail
// features (below) fade in at a given noise value.
export const GROUND_COLOR_STOPS = [
  { t: 0.00, rgb: [0x4a, 0x3a, 0x26] }, // dirt
  { t: 0.32, rgb: [0x5c, 0x6b, 0x34] }, // dry grass
  { t: 0.55, rgb: [0x2f, 0x5d, 0x3a] }, // grass
  { t: 0.78, rgb: [0x24, 0x52, 0x2e] }  // lush
];
