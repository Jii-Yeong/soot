local output = app.params["output"]

if not output or output == "" then
  error("Pass --script-param output=<client/public/assets/ui>")
end

local rgba = app.pixelColor.rgba

local function pixel(image, x, y, color)
  image:putPixel(x, y, rgba(color[1], color[2], color[3], color[4] or 255))
end

local function fill(image, x0, y0, x1, y1, color)
  for y = y0, y1 do
    for x = x0, x1 do
      pixel(image, x, y, color)
    end
  end
end

local function save(path, width, height, draw)
  local sprite = Sprite(width, height, ColorMode.RGB)
  local image = sprite.cels[1].image
  image:clear()
  draw(image)
  sprite:saveAs(app.fs.joinPath(output, path))
  sprite:close()
end

local transparent = { 0, 0, 0, 0 }
local panelFill = { 7, 10, 11, 238 }
local panelFillActive = { 12, 31, 27, 242 }
local panelFillDanger = { 31, 11, 14, 242 }
local darkEdge = { 20, 29, 33, 255 }
local midEdge = { 51, 66, 74, 255 }
local lightEdge = { 95, 113, 120, 255 }
local mint = { 182, 255, 228, 255 }
local mintShadow = { 71, 141, 110, 255 }
local playerAccent = { 111, 214, 166, 255 }
local red = { 255, 113, 128, 255 }
local redShadow = { 125, 47, 57, 255 }
local overload = { 255, 155, 69, 255 }

local function drawCutFrame(image, fillColor, edgeColor, cornerColor)
  fill(image, 0, 0, 23, 23, transparent)
  fill(image, 4, 0, 19, 23, darkEdge)
  fill(image, 0, 4, 23, 19, darkEdge)
  fill(image, 4, 1, 19, 22, edgeColor)
  fill(image, 1, 4, 22, 19, edgeColor)
  fill(image, 5, 3, 18, 20, fillColor)
  fill(image, 3, 5, 20, 18, fillColor)

  fill(image, 6, 3, 17, 3, lightEdge)
  fill(image, 3, 6, 3, 17, lightEdge)
  fill(image, 6, 20, 17, 20, darkEdge)
  fill(image, 20, 6, 20, 17, darkEdge)

  pixel(image, 4, 4, cornerColor)
  pixel(image, 19, 4, cornerColor)
  pixel(image, 4, 19, cornerColor)
  pixel(image, 19, 19, cornerColor)
end

local function drawHudFrame(image, accent)
  drawCutFrame(image, panelFill, midEdge, accent)
  fill(image, 4, 4, 5, 8, accent)
  fill(image, 18, 15, 19, 19, accent)
  pixel(image, 7, 4, accent)
  pixel(image, 16, 19, accent)
end

save("panels/panel-frame.png", 24, 24, function(image)
  drawCutFrame(image, panelFill, midEdge, mintShadow)
  pixel(image, 7, 4, mint)
  pixel(image, 16, 19, mint)
end)

save("panels/panel-frame-danger.png", 24, 24, function(image)
  drawCutFrame(image, panelFillDanger, redShadow, red)
  fill(image, 7, 4, 16, 4, red)
  fill(image, 7, 19, 16, 19, redShadow)
end)

save("panels/panel-frame-victory.png", 24, 24, function(image)
  drawCutFrame(image, panelFill, { 126, 101, 55, 255 }, { 255, 225, 168, 255 })
  fill(image, 7, 4, 16, 4, { 255, 225, 168, 255 })
end)

save("controls/button-frame-neutral.png", 24, 24, function(image)
  drawCutFrame(image, panelFill, midEdge, lightEdge)
end)

save("controls/button-frame-active.png", 24, 24, function(image)
  drawCutFrame(image, panelFillActive, mintShadow, mint)
  fill(image, 7, 3, 16, 3, mint)
end)

save("controls/button-frame-danger.png", 24, 24, function(image)
  drawCutFrame(image, panelFillDanger, redShadow, red)
  fill(image, 7, 20, 16, 20, red)
end)

save("inventory/slot-frame-neutral.png", 24, 24, function(image)
  drawCutFrame(image, panelFill, midEdge, lightEdge)
  pixel(image, 7, 4, midEdge)
  pixel(image, 16, 19, midEdge)
end)

save("inventory/slot-frame-active.png", 24, 24, function(image)
  drawCutFrame(image, panelFillActive, mintShadow, mint)
  fill(image, 7, 3, 16, 3, mint)
  fill(image, 7, 20, 16, 20, mintShadow)
end)

save("inventory/slot-frame-empty.png", 24, 24, function(image)
  drawCutFrame(image, { 9, 11, 12, 230 }, darkEdge, midEdge)
  pixel(image, 7, 4, darkEdge)
  pixel(image, 16, 19, darkEdge)
end)

save("hud/hud-frame-player.png", 24, 24, function(image)
  drawHudFrame(image, playerAccent)
end)

save("hud/hud-frame-enemy.png", 24, 24, function(image)
  drawHudFrame(image, red)
end)

save("hud/hud-frame-overload.png", 24, 24, function(image)
  drawHudFrame(image, overload)
  pixel(image, 8, 4, red)
  pixel(image, 15, 19, red)
end)

save("hud/meter-track.png", 8, 8, function(image)
  fill(image, 0, 0, 7, 7, { 14, 18, 20, 255 })
  fill(image, 0, 0, 7, 0, { 38, 47, 51, 255 })
  fill(image, 0, 7, 7, 7, { 5, 7, 8, 255 })
  pixel(image, 1, 3, { 29, 36, 39, 255 })
  pixel(image, 5, 3, { 29, 36, 39, 255 })
end)

local function drawMeterFill(image, base, highlight, shadow)
  fill(image, 0, 0, 7, 7, base)
  fill(image, 0, 0, 7, 1, highlight)
  fill(image, 0, 6, 7, 7, shadow)
  pixel(image, 1, 3, highlight)
  pixel(image, 5, 3, highlight)
  pixel(image, 2, 4, shadow)
  pixel(image, 6, 4, shadow)
end

save("hud/meter-fill-player.png", 8, 8, function(image)
  drawMeterFill(image, { 182, 255, 228, 255 }, { 226, 255, 245, 255 }, { 77, 166, 132, 255 })
end)

save("hud/meter-fill-enemy.png", 8, 8, function(image)
  drawMeterFill(image, { 255, 113, 128, 255 }, { 255, 184, 191, 255 }, { 151, 48, 62, 255 })
end)

save("hud/meter-fill-overload.png", 8, 8, function(image)
  drawMeterFill(image, { 255, 124, 55, 255 }, { 255, 190, 96, 255 }, { 160, 48, 31, 255 })
end)
