local fns = {}

function exportPosition(pos)
  local lat, lon, alt = coord.LOtoLL(pos)
  return {lat, lon, alt}
end

function exportVector(vec)
  return {
    x = vec.z,
    y = vec.y,
    z = vec.x
  }
end

function exportObject(object)
  if object == nil then
    return nil
  end

  local category = Object.getCategory(object)

  if category == Object.Category.BASE or object.className_ == 'Airbase' then
    return {
      airbase = exportAirbase(object)
    }
  elseif category == Object.Category.UNIT then
    return {
      unit = exportUnit(object)
    }
  elseif category == Object.Category.WEAPON then
    return {
      weapon = exportWeapon(object)
    }
  else
    local result = {}
    result[Object.getTypeName(object)] = {
      name = Object.getName(object)
    }
    return result
  end
end

function exportGroup(group)
  return {
    id = group:getID(),
    name = group:getName(),
    coalition = group:getCoalition(),
    category = group:getCategory()
  }
end

function exportWeapon(weapon)
  local launcher = exportUnit(weapon:getLauncher())
  local target = exportObject(weapon:getTarget())
  return {
    id = tonumber(weapon:getName()),
    type = weapon:getTypeName(),
    position = exportPosition(weapon:getPoint()),
    launcher = launcher,
    target = target
  }
end

function exportUnit(unit)
  if unit == nil then
    return nil
  end

  local vector = unit:getVelocity()

  local heading = math.deg(math.atan2(vector.z, vector.x))
  if heading < 0 then
    heading = heading + 360
  end

  local speed = math.sqrt((vector.x) ^ 2 + (vector.z) ^ 2)

  return {
    id = tonumber(unit:getID()),
    name = unit:getName(),
    callsign = unit:getCallsign(),
    coalition = unit:getCoalition(),
    type = unit:getTypeName(),
    position = exportPosition(unit:getPoint()),
    playerName = Unit.getPlayerName(unit),
    groupName = Unit.getGroup(unit):getName(),
    numberInGroup = unit:getNumber(),
    heading = heading,
    speed = speed,
    category = unit:getGroup():getCategory()
  }
end

function exportAirbase(airbase)
  if airbase == nil then
    return airbase
  end

  local obj = {
    name = airbase:getName(),
    callsign = airbase:getCallsign(),
    coalition = airbase:getCoalition(),
    category = airbase:getDesc()['category'],
    displayName = airbase:getDesc()['displayName'],
    position = exportPosition(airbase:getPoint())
  }

  if airbase:getUnit() then
    obj.id = airbase:getUnit():getID()
  end

  return obj
end

function exportSpot(spot)
  if spot == nil then
    return spot
  end

  return {
    id = spot.id_,
    type = Spot.getCategory(spot),
    target = exportPosition(Spot.getPoint(spot)),
    code = Spot.getCode(spot)
  }
end

function ensureUnit(unitName)
  local unit = Unit.getByName(unitName)
  if unit == nil then
    error("unit not found: " .. unitName)
  end
  return unit
end

function ensureGroup(groupName)
  local group = Group.getByName(groupName)
  if group == nil then
    error("group not found: " .. groupName)
  end
  return group
end

fns.triggerActionOutText = function(args)
  if args.target == nil then
    trigger.action.outText(args.text, args.displayTime, args.clearView)
  elseif args.target.group ~= nil then
    trigger.action.outTextForGroup(ensureGroup(args.target.group):getID(), args.text, args.displayTime, args.clearView)
  elseif args.target.coalition ~= nil then
    trigger.action.outTextForCoalition(args.target.coalition, args.text, args.displayTime, args.clearView)
  elseif args.target.country ~= nil then
    trigger.action.outTextForCountry(args.target.country, args.text, args.displayTime, args.clearView)
  else
    error("invalid outText target")
  end
end

fns.triggerActionMarkToAll = function(args)
  local pos = coord.LLtoLO(args.position[1], args.position[2], args.position[3])
  if args.target == nil then
    trigger.action.markToAll(args.id, args.text, pos, args.readOnly, args.message)
  elseif args.target.group ~= nil then
    trigger.action.markToGroup(args.id, args.text, pos, ensureGroup(args.target.group), args.readOnly, args.message)
  elseif args.target.coalition ~= nil then
    trigger.action.markToCoalition(args.id, args.text, pos, args.target.coalition, args.readOnly, args.message)
  else
    error("invalid mark target")
  end
end

fns.triggerActionRemoveMark = function(args)
  trigger.action.removeMark(args.id)
end

fns.getTime = function(args)
  return timer.getTime()
end

fns.getAbsTime = function(args)
  return timer.getAbsTime()
end

fns.getTime0 = function(args)
  return timer.getTime0()
end

fns.getWindAtPoint = function(args)
  local pos = coord.LLtoLO(args.position[1], args.position[2], args.position[3])
  return exportPosition(atmosphere.getWind(pos))
end

fns.getWindAtPointWithTurbulence = function(args)
  local pos = coord.LLtoLO(args.position[1], args.position[2], args.position[3])
  return exportPosition(atmosphere.getWindWithTurbulence(pos))
end

fns.getTemperatureAndPressure = function(args)
  local pos = coord.LLtoLO(args.position[1], args.position[2], args.position[3])
  local temp, pressure = atmosphere.getTemperatureAndPressure(pos)
  return {
    temperature = temp,
    pressure = pressure
  }
end

fns.coalitionAddGroup = function(args)
  if args.data.position ~= nil then
    local groupPos = coord.LLtoLO(args.data.position[1], args.data.position[2], args.data.position[3])
    args.data.x = groupPos.x
    args.data.y = groupPos.z
    args.data.position = nil
  end

  if args.data.route ~= nil and args.data.route.points ~= nil then
    for _, waypoint in ipairs(args.data.route.points) do
      local pos = coord.LLtoLO(waypoint.position[1], waypoint.position[2], waypoint.position[3])
      waypoint.x = pos.x
      waypoint.y = pos.z
      waypoint.alt = pos.y
      waypoint.position = nil
    end
  end

  for _, unit in ipairs(args.data.units) do
    if unit.position ~= nil then
      local pos = coord.LLtoLO(unit.position[1], unit.position[2], unit.position[3])
      unit.x = pos.x
      unit.y = pos.z
      unit.alt = pos.y
      unit.position = nil
    end
    if unit.callsign ~= nil then
      local oldCall = unit.callsign
      unit.callsign = {
        [1] = oldCall.id[1],
        [2] = oldCall.id[2],
        [3] = oldCall.id[3],
        name = oldCall.name
      }
    end
    if unit.payload ~= nil and unit.payload.pylons ~= nil then
      local pylons = {}
      for _, pylon in ipairs(unit.payload.pylons) do
        pylons[pylon.id] = {
          CLSID = pylon.clsid
        }
      end
      unit.payload.pylons = pylons
    end
  end

  return coalition.addGroup(args.country, args.category, args.data).id_
end

fns.coalitionGetPlayers = function(args)
  local result = {}
  for _, side in pairs(coalition.side) do
    if args.coalition == 3 or args.coalition == side then
      for index, unit in ipairs(coalition.getPlayers(side)) do
        table.insert(result, exportUnit(unit))
      end
    end
  end
  if #result == 0 then
    return nil
  end
  return result
end

fns.coalitionGetAirbases = function(args)
  local result = {}
  for _, side in pairs(coalition.side) do
    if args.coalition == 3 or args.coalition == side then
      for index, airbase in ipairs(coalition.getAirbases(side)) do
        table.insert(result, exportAirbase(airbase))
      end
    end
  end
  if #result == 0 then
    return nil
  end
  return result
end

fns.coalitionGetGroups = function(args)
  local result = {}
  for _, side in pairs(coalition.side) do
    if args.coalition == 3 or args.coalition == side then
      for index, group in ipairs(coalition.getGroups(side, args.category)) do
        table.insert(result, exportGroup(group))
      end
    end
  end
  if #result == 0 then
    return nil
  end
  return result
end

fns.coalitionGetUnits = function(args)
  local result = {}
  for _, side in pairs(coalition.side) do
    if args.coalition == 3 or args.coalition == side then
      for index, group in ipairs(coalition.getGroups(side, args.category)) do
        for index, unit in ipairs(group:getUnits()) do
          table.insert(result, exportUnit(unit))
        end
      end
    end
  end
  if #result == 0 then
    return nil
  end
  return result
end

fns.groupGetByName = function(args)
  return exportGroup(Group.getByName(args.name))
end

fns.groupGetUnits = function(args)
  local group = Group.getByName(args.name)
  local result = {}
  for _, unit in ipairs(group:getUnits()) do
    table.insert(result, exportUnit(unit))
  end
  return result
end

fns.unitGetByName = function(args)
  return exportUnit(Unit.getByName(args.name))
end

fns.unitGetIsActive = function(args)
  return ensureUnit(args.name):isActive()
end

fns.unitGetLife = function(args)
  local unit = ensureUnit(args.name)
  return {
    current = unit:getLife(),
    initial = unit:getLife0()
  }
end

fns.unitGetAmmo = function(args)
  return ensureUnit(args.name):getAmmo()
end

fns.unitGetSensors = function(args)
  local unit = ensureUnit(args.name)
  local sensors = unit:getSensors()
  local result = {}
  if sensors == nil then
    return result
  end
  for index, data in ipairs(sensors) do
    table.insert(result, data[1])
  end
  return result
end

fns.unitGetRadar = function(args)
  local unit = ensureUnit(args.name)

  local enabled, target = unit:getRadar()
  return {
    enabled = enabled,
    target = target
  }
end

fns.unitGetFuel = function(args)
  local unit = ensureUnit(args.name)
  return unit:getFuel()
end

fns.unitGetDrawArgumentValue = function(args)
  local unit = ensureUnit(args.name)
  return unit:getDrawArgumentValue(args.arg)
end

fns.unitSetEmission = function(args)
  local unit = ensureUnit(args.name)
  return unit:enableEmission(args.value)
end

fns.landGetHeight = function(args)
  local pos = coord.LLtoLO(args.pos.x, args.pos.y, 0)
  return land.getHeight({
    x = pos.x,
    y = pos.z
  })
end

fns.landGetSurfaceHeightWithSeabed = function(args)
  local pos = coord.LLtoLO(args.pos.x, args.pos.y, 0)
  local height, depth = land.getSurfaceHeightWithSeabed({
    x = pos.x,
    y = pos.z
  })
  return {
    height = height,
    depth = depth
  }
end

fns.landGetSurfaceType = function(args)
  local pos = coord.LLtoLO(args.pos.x, args.pos.y, 0)
  return land.getSurfaceType({
    x = pos.x,
    y = pos.z
  })
end

fns.landIsVisible = function(args)
  local origin = coord.LLtoLO(args.origin[1], args.origin[2], args.origin[3])
  local destination = coord.LLtoLO(args.destination[1], args.destination[2], args.destination[3])
  return land.isVisible(origin, destination)
end

fns.landGetIP = function(args)
  local origin = coord.LLtoLO(args.origin[1], args.origin[2], args.origin[3])
  return exportPosition(land.getIP(origin, args.direction, args.distance))
end

fns.landGetClosestPointOnRoads = function(args)
  local pos = coord.LLtoLO(args.pos.x, args.pos.y, 0)
  local x, y = land.getClosestPointOnRoads(args.roadType, pos.x, pos.z)
  return exportPosition({x, y, 0})
end

fns.landFindPathOnRoads = function(args)
  local origin = coord.LLtoLO(args.origin.x, args.origin.y, 0)
  local destination = coord.LLtoLO(args.destination.x, args.destination.y, 0)
  local path = land.findPathOnRoads(args.roadType, origin.x, origin.z, destination.x, destination.z)
  local result = {}
  for index, point in ipairs(path) do
    local lat, lng, alt = coord.LOtoLL({point[1], point[2], 0})
    table.insert(result, {lat, lng, 0})
  end
  return result
end

fns.worldGetAirbases = function(args)
  local airbases = world.getAirbases()
  local result = {}
  for index, airbase in ipairs(airbases) do
    table.insert(result, exportAirbase(airbase))
  end
  return result
end

fns.worldSearchObjects = function(args)
  local result = {}
  world.searchObjects(args.category, args.volume, function(item, data)
    table.insert(result, exportObject(item))
  end, nil)
  return result
end

fns.netSendChat = function(args)
  net.send_chat(args.message, args.all)
end

fns.netSendChatTo = function(args)
  net.send_chat_to(args.message, args.playerId, args.fromPlayerId)
end

fns.netLoadMission = function(args)
  return net.load_mission(args.path)
end

fns.netLoadNextMission = function(args)
  net.load_next_mission()
end

fns.netGetPlayerIds = function(args)
  return net.get_player_list()
end

fns.netGetPlayerList = function(args)
  local playerIds = net.get_player_list()
  local result = {}
  for index, playerId in ipairs(playerIds) do
    table.insert(result, net.get_player_info(playerId))
  end
  return result
end

fns.netKickPlayer = function(args)
  return net.kick(args.playerId, args.message)
end

fns.netGetStats = function(args)
  return net.get_stat(args.playerId)
end

fns.netGetSlot = function(args)
  return net.get_slot(args.playerId)
end

commandId = 1

fns.missionCommandsAddCommand = function(args)
  local id = commandId
  commandId = commandId + 1

  local path = {}
  if args.target == nil then
    path = missionCommands.addCommand(args.name, args.path, function()
      if not ts.channel_send(args.channel.id, {
        id = id
      }) then
        local path = args.path
        if path == nil then
          path = {}
        end
        table.insert(path, 1, args.name)
        missionCommands.removeItemForGroup(path)
      end
    end)
  elseif args.target.group ~= nil then
    local group = Group.getByName(args.target.group)
    if group == nil then
      error("no group found by name " .. args.target.group)
    end

    path = missionCommands.addCommandForGroup(group:getID(), args.name, args.path, function()
      if not ts.channel_send(args.channel.id, {
        id = id
      }) then
        local path = args.path
        if path == nil then
          path = {}
        end
        table.insert(path, 1, args.name)
        missionCommands.removeItemForGroup(group:getID(), path)
      end
    end)
  elseif args.target.coalition ~= nil then
    path = missionCommands.addCommandForCoalition(args.target.coalition, args.name, args.path, function()
      if not ts.channel_send(args.channel.id, {
        id = id
      }) then
        local path = args.path
        if path == nil then
          path = {}
        end
        table.insert(path, 1, args.name)
        missionCommands.removeItemForCoalition(args.target.coalition, path)
      end
    end)
  else
    error("invalid command target")
  end

  return {
    id = id,
    path = path,
    target = args.target
  }
end

fns.missionCommandsAddSubMenu = function(args)
  if args.target == nil then
    return {
      path = missionCommands.addSubMenu(args.name, args.path)
    }
  elseif args.target.group ~= nil then
    local group = Group.getByName(args.target.group)
    if group == nil then
      error("no group found by name " .. args.target.group)
    end
    return {
      path = missionCommands.addSubMenuForGroup(group:getID(), args.name, args.path),
      target = args.target
    }
  elseif args.target.coalition ~= nil then
    return {
      path = missionCommands.addCommandForCoalition(args.target.coalition, args.name, args.path),
      target = args.target
    }
  else
    error("invalid command target")
  end
end

fns.missionCommandsRemove = function(args)
  if args.target == nil then
    missionCommands.removeItem(args.path)
  elseif args.target.group ~= nil then
    local group = Group.getByName(args.target.group)
    if group == nil then
      error("no group found by name " .. args.target.group)
    end
    missionCommands.removeItemForGroup(group:getID(), args.path)
  elseif args.target.coalition ~= nil then
    missionCommands.removeItemForCoalition(args.target.coalition, args.path)
  else
    error("invalid command target")
  end

end

fns.eval = function(args)
  local fn, err = loadstring(args.code)
  if not fn then
    error(err)
  end

  local ok, result = pcall(fn)
  if not ok then
    error(result)
  end

  return result
end

unitWatcherId = 1
unitWatchers = {}

fns.unitWatcherCreate = function(args)
  local id = unitWatcherId
  unitWatcherId = unitWatcherId + 1
  unitWatchers[id] = {
    units = {}
  }

  -- todo: implement lerp
  local timeBetween = args.updateIntervalSeconds / 1

  timer.scheduleFunction(function()
    local updated = {}
    local removed = {}
    for unitName, value in pairs(unitWatchers[id].units) do
      local unit = Unit.getByName(unitName)
      if unit ~= nil then
        table.insert(updated, exportUnit(unit))
      else
        table.insert(removed, unitName)
      end
    end

    for index, removed in ipairs(removed) do
      unitWatchers[id].units[removed] = nil
    end

    if #updated == 0 and #removed == 0 then
      return timer.getTime() + timeBetween
    end

    if #updated == 0 then
      updated = nil
    end

    if #removed == 0 then
      removed = nil
    end

    if not ts.channel_send(args.channel.id, {
      updated = updated,
      removed = removed
    }) then
      unitWatchers[id] = nil
      return nil
    end

    return timer.getTime() + timeBetween
  end, nil, timer.getTime() + timeBetween)

  return id
end

fns.unitWatcherAdd = function(args)
  if unitWatchers[args.id] == nil then
    error("no such unit watcher")
  end

  for index, name in ipairs(args.names) do
    unitWatchers[args.id].units[name] = true
  end
end

fns.unitWatcherRemove = function(args)
  if unitWatchers[args.id] == nil then
    error("no such unit watcher")
  end

  for index, name in ipairs(args.names) do
    unitWatchers[args.id].units[name] = nil
  end
end

local function getController(controller)
  if controller.group ~= nil then
    local controller = Group.getByName(controller.group)
    if controller == nil then
      error("no controller")
    end
    return controller
  elseif controller.unit ~= nil then
    local controller = Unit.getByName(controller.unit)
    if controller == nil then
      error("no controller")
    end
    return controller
  else
    error("invalid controller type")
  end
end

fns.controllerSetTask = function(args)
  local controller = getController(args.controller)
  Controller.setTask(controller, args.task)
end

fns.controllerPushTask = function(args)
  local controller = getController(args.controller)
  Controller.pushTask(controller, args.task)
end

fns.controllerResetTask = function(args)
  local controller = getController(args.controller)
  Controller.resetTask(controller)
end

fns.controllerPopTask = function(args)
  local controller = getController(args.controller)
  Controller.popTask(controller)
end

fns.controllerHasTask = function(args)
  local controller = getController(args.controller)
  return Controller.hasTask(controller)
end

fns.controllerSetCommand = function(args)
  local controller = getController(args.controller)
  Controller.setCommand(controller, args.command)
end

fns.controllerSetOption = function(args)
  local controller = getController(args.controller)
  Controller.setOption(controller, args.option, args.value)
end

fns.controllerSetOnOff = function(args)
  local controller = getController(args.controller)
  Controller.setOnOff(controller, args.value)
end

local function getObject(obj)
  if obj.unit ~= nil then
    return Unit.getByName(obj.unit)
  elseif obj.group ~= nil then
    return Group.getByName(obj.group)
  elseif obj.airbase ~= nil then
    return Airbase.getByName(obj.airbase)
  elseif obj.staticObject ~= nil then
    return StaticObject.getByName(obj.staticObject)
  elseif obj.id ~= nil then
    return {
      id_ = obj.id
    }
  end
  return nil
end

fns.controllerKnowTarget = function(args)
  local controller = getController(args.controller)
  local target = getObject(args.target)
  return Controller.knowTarget(controller, target, args.typeKnown, args.distanceKnown)
end

fns.controllerIsTargetDetected = function(args)
  local controller = getController(args.controller)
  local target = getObject(args.target)
  return Controller.isTargetDetected(controller, target, unpack(args.args))
end

fns.controllerGetDetectedTargets = function(args)
  local controller = getController(args.controller)
  local targets = Controller.getDetectedTargets(controller, unpack(args.args))
  for index, target in ipairs(targets) do
    target.object = exportObject(target.object)
  end
  return targets
end

fns.objectGetDesc = function(args)
  -- scenery objects do not seem to have instances, so we must special case them
  if args.object.sceneryObject ~= nil then
    return SceneryObject.getDescByName(args.object.sceneryObject)
  else
    local object = getObject(args.object)
    local category = Object.getCategory(object)

    if category == Object.Category.WEAPON then
      return Weapon.getDesc(object)
    end

    return nil
  end
end

fns.objectGet = function(args)
  return exportObject(getObject(args.object))
end

fns.objectDestroy = function(args)
  Object.destroy(getObject(args.object))
end

fns.getMarkPanels = function(args)
  return World.getMarkPanels()
end

fns.spotCreateLaser = function(args)
  local source = getObject(args.source)
  local target = coord.LLtoLO(args.target[1], args.target[2], args.target[3])
  return exportSpot(Spot.createLaser(source, args.offset, target, args.code))
end

fns.spotCreateInfraRed = function(args)
  local source = getObject(args.source)
  local target = coord.LLtoLO(args.target[1], args.target[2], args.target[3])
  return exportSpot(Spot.spotCreateInfraRed(source, args.offset, target))
end

fns.spotSetPoint = function(args)
  local target = coord.LLtoLO(args.target[1], args.target[2], args.target[3])
  Spot.setPoint({
    id_ = args.id
  }, target)
end

fns.spotSetCode = function(args)
  Spot.setCode({
    id_ = args.id
  }, args.code)
end

fns.spotGet = function(args)
  local spot = {
    id_ = args.id
  }
  return exportSpot(spot)
end

fns.triggerActionSetUnitInternalCargo = function(args)
  trigger.action.setUnitInternalCargo(args.name, args.mass)
end

fns.triggerActionStopRadioTransmission = function(args)
  trigger.action.stopRadioTransmission(args.name)
end

fns.triggerActionRadioTransmission = function(args)
  local pos = coord.LLtoLO(args.position[1], args.position[2], args.position[3])
  trigger.action
    .radioTransmission(args.filename, pos, args.modulation, args.loop, args.frequency, args.power, args.name)
end

fns.triggerActionSignalFlare = function(args)
  local pos = coord.LLtoLO(args.position[1], args.position[2], args.position[3])
  trigger.action.signalFlare(pos, args.color, args.azimuth)
end

fns.triggerActionIlluminationBomb = function(args)
  local pos = coord.LLtoLO(args.position[1], args.position[2], args.position[3])
  trigger.action.illuminationBomb(pos, args.power)
end

fns.triggerActionEffectSmokeBig = function(args)
  local pos = coord.LLtoLO(args.position[1], args.position[2], args.position[3])
  trigger.action.effectSmokeBig(pos, args.type, args.density, args.name)
end

fns.triggerActionSmoke = function(args)
  local pos = coord.LLtoLO(args.position[1], args.position[2], args.position[3])
  trigger.action.smoke(pos, args.color)
end

fns.triggerActionExplosion = function(args)
  local pos = coord.LLtoLO(args.position[1], args.position[2], args.position[3])
  trigger.action.explosion(pos, args.power)
end

fns.triggerActionGetZone = function(args)
  local zone = trigger.action.getZone(args.name)
  if zone == nil then
    return zone
  end
  return {
    position = exportPosition(zone.point),
    radius = zone.radius
  }
end

fns.triggerActionSmokeTrail = function(args)
  trigger.action.ctfColorTag(args.name, args.color, args.altitude)
end

fns.triggerActionOutSound = function(args)
  if args.target == nil then
    trigger.action.outSound(args.name)
  elseif args.target.group ~= nil then
    trigger.action.outSoundForGroup(ensureGroup(args.target.group):getID(), args.name)
  elseif args.target.coalition ~= nil then
    trigger.action.outSoundForCoalition(args.target.coalition, args.name)
  elseif args.target.country ~= nil then
    trigger.action.outSoundForCountry(args.target.country, args.name)
  else
    error("invalid outSound target")
  end
end

fns.createEventProducer = function(args)
  local eventHandler = {}
  function eventHandler:onEvent(event)
    if args.events ~= nil then
      found = false
      for index, eventId in ipairs(args.events) do
        if eventId == event.id then
          found = true
          break
        end
      end
      if not found then
        return
      end
    end

    local eventCopy = {}
    for k, v in pairs(event) do
      eventCopy[k] = v
    end

    if event.initiator ~= nil then
      eventCopy.initiator = exportObject(event.initiator)
    end
    if event.place ~= nil then
      eventCopy.place = exportObject(event.place)
    end
    if event.target ~= nil then
      eventCopy.target = exportObject(event.target)
    end
    if event.weapon ~= nil then
      local weapon = exportObject(event.weapon)
      if weapon ~= nil then
        eventCopy.weapon = exportObject(event.weapon).weapon
      else
        eventCopy.weapon = nil
      end
    end
    if event.pos ~= nil then
      eventCopy.pos = exportPosition(event.pos)
    end
    if event.weapon_name ~= nil then
      eventCopy.weaponName = event.weapon_name
      eventCopy.weapon_name = nil
    end
    if not ts.channel_send(args.channel.id, eventCopy) then
      world.removeEventHandler(eventHandler)
    end
  end
  world.addEventHandler(eventHandler)
end

local function processQueuedTasks()
  local queuedTasks = ts.get_queued_tasks()
  if queuedTasks == nil then
    return
  end

  local taskResults = {}
  for index, value in ipairs(queuedTasks) do
    local ok, result = pcall(fns[value.target], value.args)
    local taskResult = {
      id = value.id,
      result = {
        value = result
      }
    }

    if ok then
      taskResult.result.type = "Ok"
    else
      taskResult.result.type = "Error"
    end
    table.insert(taskResults, taskResult)
  end
  if #taskResults > 0 then
    ts.add_task_results(taskResults)
  end
end

env.info("[dcs-ts] starting task bridge")
local pollingRate = 500
local stepTime = 1 / pollingRate
timer.scheduleFunction(function()
  local ok, result = pcall(processQueuedTasks)
  if not ok then
    ts.log("[dcs-ts] failed to run processQueuedTasks: " .. tostring(result))
  end
  return timer.getTime() + stepTime
end, nil, timer.getTime() + stepTime)
env.info("[dcs-ts] ready and running")
