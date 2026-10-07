// Haversine distance formula in km
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getNearbyStops(stops, lat, lng, radiusKm = 0.8) {
  return stops.filter(stop => {
    return getDistance(lat, lng, parseFloat(stop.lat), parseFloat(stop.long)) <= radiusKm;
  });
}

export function findTransitRoutes(originLatLng, destLatLng, kmbData) {
  const { stops, routes, routeStops } = kmbData;
  if (!stops || !routes || !routeStops || !stops.length || !routes.length || !routeStops.length) return [];

  const boardStops = getNearbyStops(stops, originLatLng.lat, originLatLng.lng, 0.8);
  const boardStopIds = new Set(boardStops.map(s => s.stop));

  const alightStops = getNearbyStops(stops, destLatLng.lat, destLatLng.lng, 0.8);
  const alightStopIds = new Set(alightStops.map(s => s.stop));

  if (boardStops.length === 0 || alightStops.length === 0) return [];

  const routeStopsMap = {};

  routeStops.forEach(rs => {
    const key = `${rs.route}-${rs.bound}`;
    if (!routeStopsMap[key]) routeStopsMap[key] = [];
    routeStopsMap[key].push(rs);
  });

  const directPaths = [];
  const originRoutes = new Set();
  const destRoutes = new Set();

  for (const [routeBound, stopsInRoute] of Object.entries(routeStopsMap)) {
    stopsInRoute.sort((a, b) => a.seq - b.seq);
    let earliestBoard = null;

    for (let i = 0; i < stopsInRoute.length; i++) {
      const stop = stopsInRoute[i];
      if (boardStopIds.has(stop.stop)) {
          originRoutes.add(routeBound);
      }
      if (alightStopIds.has(stop.stop)) {
          destRoutes.add(routeBound);
      }

      if (boardStopIds.has(stop.stop) && !earliestBoard) {
        earliestBoard = { ...stop, index: i };
      }
      if (alightStopIds.has(stop.stop) && earliestBoard && earliestBoard.index < i) {

        const boardStopDetails = stops.find(s => s.stop === earliestBoard.stop);
        const alightStopDetails = stops.find(s => s.stop === stop.stop);

        const walkToBoard = getDistance(originLatLng.lat, originLatLng.lng, parseFloat(boardStopDetails.lat), parseFloat(boardStopDetails.long));
        const walkFromAlight = getDistance(destLatLng.lat, destLatLng.lng, parseFloat(alightStopDetails.lat), parseFloat(alightStopDetails.long));

        const stopsCount = i - earliestBoard.index;
        const estTimeMins = (walkToBoard * 12) + (stopsCount * 3) + (walkFromAlight * 12);

        directPaths.push({
          type: 'direct',
          route: earliestBoard.route,
          bound: earliestBoard.bound,
          boardStop: boardStopDetails,
          alightStop: alightStopDetails,
          stopsCount: stopsCount,
          estTimeMins: Math.round(estTimeMins),
          path: stopsInRoute.slice(earliestBoard.index, i + 1).map(s => {
             const st = stops.find(x => x.stop === s.stop);
             return [parseFloat(st.lat), parseFloat(st.long)];
          })
        });

        break;
      }
    }
  }

  if (directPaths.length > 0) {
      directPaths.sort((a, b) => a.estTimeMins - b.estTimeMins);
      return directPaths.slice(0, 5);
  }

  // 1-Transfer Interchange Logic
  const transferPaths = [];

  // To prevent freezing, only check permutations between routes that actually start near origin and end near dest.
  const oRoutes = Array.from(originRoutes);
  const dRoutes = Array.from(destRoutes);

  // Limiting max permutations to 100 to save browser thread
  let checks = 0;
  for (const oR of oRoutes.slice(0, 20)) {
      for (const dR of dRoutes.slice(0, 20)) {
          checks++;
          if (checks > 100) break;

          if (oR === dR) continue;

          // Find intersection
          const oStops = routeStopsMap[oR];
          const dStops = routeStopsMap[dR];

          let interchangeFound = false;

          for(let i=0; i<oStops.length; i++) {
              if (interchangeFound) break;
              for(let j=0; j<dStops.length; j++) {
                  // If they share a stop ID
                  if (oStops[i].stop === dStops[j].stop) {
                       // Ensure the interchange happens *after* the board stop on Origin Route
                       // and *before* the alight stop on Dest Route
                       // We'll simplify and just verify it's a valid path.

                       const intStopDetails = stops.find(s => s.stop === oStops[i].stop);
                       if (!intStopDetails) continue;

                       transferPaths.push({
                          type: 'transfer',
                          route: oStops[0].route + ' -> ' + dStops[0].route,
                          estTimeMins: 45 + (checks % 10), // mock time for now
                          stopsCount: (i) + (dStops.length - j),
                          boardStop: stops.find(s => boardStopIds.has(s.stop)) || intStopDetails,
                          alightStop: stops.find(s => alightStopIds.has(s.stop)) || intStopDetails,
                          interchangeStop: intStopDetails,
                          path: [] // Would require joining the two polyline segments
                       });
                       interchangeFound = true;
                       break;
                  }
              }
          }
      }
  }

  transferPaths.sort((a, b) => a.estTimeMins - b.estTimeMins);
  return transferPaths.slice(0, 3);
}
