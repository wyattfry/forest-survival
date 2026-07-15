-- Generates an animated campfire sprite in Aseprite (batch mode).
-- Output: campfire.aseprite, campfire.png (horizontal sheet), campfire.gif (preview)

local W, H = 32, 32
local NFRAMES = 8
local BASE_Y = 24        -- row where flame meets the logs
local sin, cos, exp, floor = math.sin, math.cos, math.exp, math.floor

local function rgba(r, g, b, a) return app.pixelColor.rgba(r, g, b, a or 255) end

-- Flame colour ramp, coolest -> hottest
local C_OUTER = rgba(0xE2, 0x3A, 0x0E)   -- deep red-orange
local C_ORANGE = rgba(0xFF, 0x77, 0x1F)  -- orange
local C_AMBER = rgba(0xFF, 0xA9, 0x2B)   -- amber
local C_YELLOW = rgba(0xFF, 0xD9, 0x54)  -- yellow
local C_CORE = rgba(0xFF, 0xF4, 0xC2)    -- near-white hot core
local C_SPARK = rgba(0xFF, 0xD5, 0x4F)

-- Log colours
local C_LOG_DARK = rgba(0x5A, 0x38, 0x1E)
local C_LOG = rgba(0x74, 0x49, 0x27)
local C_LOG_LIT = rgba(0x9A, 0x63, 0x33)
local C_LOG_END = rgba(0xC9, 0x7A, 0x2E)   -- glowing cut end
local C_EMBER = rgba(0xFF, 0x8A, 0x2E)     -- glowing coals under flame

local spr = Sprite(W, H, ColorMode.RGB)
spr.filename = "campfire.aseprite"

-- ensure we have NFRAMES frames
while #spr.frames < NFRAMES do spr:newEmptyFrame() end
for _, fr in ipairs(spr.frames) do fr.duration = 0.09 end

local layer = spr.layers[1]

-- temperature of the flame at (x,y) for frame f (0-based). >0 means inside flame.
local function flameTemp(x, y, f)
  local phase = (f / NFRAMES) * math.pi * 2
  local dyUp = BASE_Y - y                 -- height above the coals
  if dyUp < 0 then return 0 end
  -- flickering tip height
  local tipH = 15.0 + 2.4 * sin(phase) + 1.3 * sin(phase * 2.0 + 1.0)
  local hy = dyUp / tipH
  if hy > 1.0 then return 0 end
  -- centreline sways more toward the tip
  local sway = 1.7 * sin(dyUp * 0.55 + phase * 1.15)
  local dxc = (x + 0.5) - (W / 2) - sway * (dyUp / 15.0)
  -- flame narrows as it rises
  local width = 5.4 * (1.0 - dyUp / 21.0)
  if width < 0.7 then width = 0.7 end
  local hx = (dxc * dxc) / (width * width)
  if hx > 1.0 then return 0 end
  local val = (1.0 - hx) * (1.0 - hy * hy)
  -- fine per-pixel flicker
  val = val + 0.05 * sin(x * 1.7 + y * 1.3 + phase * 3.0)
  return val
end

local function drawFlame(img, f)
  for y = 0, H - 1 do
    for x = 0, W - 1 do
      local t = flameTemp(x, y, f)
      if t > 0.02 then
        local c
        if t > 0.72 then c = C_CORE
        elseif t > 0.52 then c = C_YELLOW
        elseif t > 0.34 then c = C_AMBER
        elseif t > 0.17 then c = C_ORANGE
        else c = C_OUTER end
        img:drawPixel(x, y, c)
      end
    end
  end
end

local function drawLogs(img)
  -- glowing coal bed
  for x = 11, 20 do img:drawPixel(x, 24, C_EMBER) end
  for x = 12, 19 do img:drawPixel(x, 25, C_EMBER) end
  -- two crossed logs \  and  /
  local function log(x0, y0, x1, y1)
    local steps = math.max(math.abs(x1 - x0), math.abs(y1 - y0))
    for i = 0, steps do
      local t = i / steps
      local x = floor(x0 + (x1 - x0) * t + 0.5)
      local y = floor(y0 + (y1 - y0) * t + 0.5)
      -- 3px thick log body
      img:drawPixel(x, y - 1, C_LOG_LIT)
      img:drawPixel(x, y, C_LOG)
      img:drawPixel(x, y + 1, C_LOG_DARK)
    end
  end
  log(7, 27, 24, 24)   -- back-left to front-right
  log(24, 27, 7, 24)   -- back-right to front-left
  -- lit cut ends
  img:drawPixel(7, 26, C_LOG_END); img:drawPixel(8, 26, C_LOG_END)
  img:drawPixel(24, 26, C_LOG_END); img:drawPixel(23, 26, C_LOG_END)
end

local function drawSparks(img, f)
  -- a couple of embers drifting up, positions vary per frame
  local phase = (f / NFRAMES) * math.pi * 2
  local sx = floor(W / 2 + 3.0 * sin(phase * 1.3))
  local sy = floor(7 - (f % 4))
  if sy >= 0 then img:drawPixel(sx, sy, C_SPARK) end
  local sx2 = floor(W / 2 - 2.0 * sin(phase * 0.9 + 1.5))
  local sy2 = floor(9 - ((f + 2) % 5))
  if sy2 >= 0 then img:drawPixel(sx2, sy2, C_SPARK) end
end

for i, frame in ipairs(spr.frames) do
  local f = i - 1
  local img = Image(W, H, ColorMode.RGB)
  img:clear()
  drawFlame(img, f)
  drawLogs(img)       -- logs sit in front of the flame base
  drawSparks(img, f)
  spr:newCel(layer, frame, img, Point(0, 0))
end

spr:saveAs("campfire.aseprite")

-- horizontal spritesheet PNG for Phaser
app.command.ExportSpriteSheet{
  ui = false,
  type = SpriteSheetType.HORIZONTAL,
  textureFilename = "campfire.png",
}

-- animated GIF for quick visual review
spr:saveCopyAs("campfire.gif")

print("done: " .. #spr.frames .. " frames, " .. W .. "x" .. H)
