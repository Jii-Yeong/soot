local output = app.params["output"]

if not output or output == "" then
  error("Pass --script-param output=<client/public/assets/portals/room-portal.png>")
end


local FRAME_WIDTH = 64
local FRAME_HEIGHT = 128
local FRAME_COUNT = 6
local rgba = app.pixelColor.rgba

local sprite = Sprite(FRAME_WIDTH * FRAME_COUNT, FRAME_HEIGHT, ColorMode.RGB)
local image = sprite.cels[1].image
image:clear()

local function pixel(frame, x, y, gray, alpha)
  if x < 0 or x >= FRAME_WIDTH or y < 0 or y >= FRAME_HEIGHT then
    return
  end

  image:putPixel(
    frame * FRAME_WIDTH + x,
    y,
    rgba(gray, gray, gray, alpha or 255)
  )
end

local function block(frame, x, y, width, height, gray, alpha)
  for py = y, y + height - 1 do
    for px = x, x + width - 1 do
      pixel(frame, px, py, gray, alpha)
    end
  end
end

local sparks = {
  { 17, 25 },
  { 46, 37 },
  { 20, 55 },
  { 43, 72 },
  { 24, 91 },
  { 39, 104 },
}

for frame = 0, FRAME_COUNT - 1 do
  -- 기계식 문턱. 포탈이 공중에 떠도 방향과 진입면을 읽게 한다.
  block(frame, 10, 118, 44, 5, 104, 255)
  block(frame, 14, 115, 36, 3, 184, 255)
  block(frame, 18, 112, 28, 3, 244, 255)
  block(frame, 6, 123, 52, 3, 48, 255)
  block(frame, 14, 126, 36, 2, 24, 255)
  block(frame, 8, 120, 4, 3, 230, 255)
  block(frame, 52, 120, 4, 3, 230, 255)

  -- 2px 격자로 양자화한 타원. 확대되어도 가장자리가 흐려지지 않는다.
  for y = 8, 116, 2 do
    for x = 4, 58, 2 do
      local dx = (x + 1 - 32) / 27
      local dy = (y + 1 - 62) / 54
      local outer = dx * dx + dy * dy <= 1
      local innerDx = (x + 1 - 32) / 19
      local innerDy = (y + 1 - 62) / 46
      local inner = innerDx * innerDx + innerDy * innerDy <= 1

      if outer and not inner then
        local segment = (math.floor((x + y) / 6) + frame) % 6
        local gray = segment == 0 and 255 or (segment <= 2 and 196 or 112)
        block(frame, x, y, 2, 2, gray, 255)
      elseif inner then
        local scanline = (math.floor(y / 2) + frame) % 5
        if scanline == 0 then
          block(frame, x, y, 2, 1, 224, 44)
        elseif scanline == 3 and (math.floor(x / 2) + frame) % 4 == 0 then
          block(frame, x, y, 2, 2, 176, 28)
        end
      end
    end
  end

  -- 회전하는 내부 파편. 프레임마다 다음 지점으로 이동한다.
  for index, spark in ipairs(sparks) do
    local target = sparks[((index + frame - 1) % #sparks) + 1]
    block(frame, target[1], target[2], 3, 3, 255, 230)
    pixel(frame, target[1] - 2, target[2] + 1, 176, 150)
  end

  -- 좌우 안정기와 상태등.
  block(frame, 5, 49, 5, 28, 64, 255)
  block(frame, 54, 49, 5, 28, 64, 255)
  block(frame, 6, 54, 3, 8, 208, 255)
  block(frame, 55, 65, 3, 8, 208, 255)
  pixel(frame, 7, 47 + (frame % 3) * 3, 255, 255)
  pixel(frame, 56, 74 - (frame % 3) * 3, 255, 255)
end

sprite:saveAs(output)
sprite:close()
