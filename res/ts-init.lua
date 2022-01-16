local function getInstallPath()
  local parts = {}
  for token in string.gmatch(debug.getinfo(1).source, "[^\\]+") do
    table.insert(parts, token)
  end

  local stopIndex = #parts - 1
  local result = nil
  for index, part in ipairs(parts) do
    if index > stopIndex then
      break
    end
    if result == nil then
      result = part
    else
      result = result .. "\\" .. part
    end
  end

  return result .. "\\"
end

local installPath = getInstallPath()
env.info("[dcs-ts] initializing mission environment from " .. installPath)
if not string.find(package.cpath, installPath) then
  package.cpath = package.cpath .. installPath .. [[?.dll;]]
end

local ts = require("dcs_ts")
_G.ts = ts

local isMissionEnv = DCS == nil
if isMissionEnv then
  env.info("[dcs-ts] mission env is initializing typescript runtime")
  local ok, result = pcall(function()
    ts.initialize(lfs.writedir())
  end)
  if not ok then
    env.info("[dcs-ts] initialization failed: " .. tostring(result))
  end
end
