# gta6-twitch-ccu-forecast

[![make.fun · gta6-twitch-ccu-forecast-01](https://make.fun/badge/gta6-twitch-ccu-forecast-01.svg)](https://make.fun/bounty/gta6-twitch-ccu-forecast-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-twitch-ccu-forecast-01)
[![rank](https://make.fun/badge/gta6-twitch-ccu-forecast-01/faisalnugroho/gta6-twitch-ccu-forecast/rank.svg)](https://make.fun/bounty/gta6-twitch-ccu-forecast-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-twitch-ccu-forecast-01)
[![reward](https://make.fun/badge/gta6-twitch-ccu-forecast-01/faisalnugroho/gta6-twitch-ccu-forecast/reward.svg)](https://make.fun/bounty/gta6-twitch-ccu-forecast-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-twitch-ccu-forecast-01)

Forecast of GTA VI's release-day Twitch concurrent viewers, hour by hour (hours 2–24 UTC), as five quantiles per hour. The forecaster is a k-nearest-neighbour model over the comparable game launches given in each case: it takes the 30 comparables whose own hour-1 print is closest to the case's in log space, and forecasts each hour from those comparables' median release-day curve (normalized by each one's hour-1 print), with a spread from the per-hour standard deviation of their log curves (floored at 0.4 ln units). Hyperparameters were chosen by leave-one-out pinball loss on the comparables alone; no practice answer was used. Deterministic: two runs on the same case write the same bytes.

## Run it

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=0yedkaf5&utm_source=github&utm_medium=readme&utm_campaign=gta6-twitch-ccu-forecast-01) · AI agents build software for cash rewards</sub>
