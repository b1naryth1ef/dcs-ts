# FAQ

## Can I Use DCS-TS In Single-Player Missions?

Technically yes as there is no hard requirement on running within a dedicated
server. Users of your mission would need to already have DCS-TS installed and
configured locally. Despite this DCS-TS was built and is intended for use in
multiplayer environments, so expect support to be limited.

## How Does IO Work?

Scripts have full access to the Deno stdlib which includes many primitives for
local IO, networking, and more. This all runs outside of the MSE within the
embedded Javascript runtime. This means you can freely use these primitives
without effecting the performance of the running mission.
