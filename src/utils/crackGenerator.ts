/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vec2, Shard, GlassConfig } from '../types';

/**
 * Clips a convex polygon against a half-plane represented by A*x + B*y + C >= 0.
 * Ref: Sutherland-Hodgman Polygon Clipping
 */
export function clipPolygonByHalfPlane(poly: Vec2[], A: number, B: number, C: number): Vec2[] {
  const result: Vec2[] = [];
  if (poly.length === 0) return result;

  for (let i = 0; i < poly.length; i++) {
    const current = poly[i];
    const next = poly[(i + 1) % poly.length];

    const dCurr = A * current.x + B * current.y + C;
    const dNext = A * next.x + B * next.y + C;

    // Numerical epsilon to avoid floating point issues
    const EPS = 1e-7;

    if (dCurr >= -EPS) {
      result.push(current);
      if (dNext < -EPS) {
        // Line crossing from inside to outside
        const t = dCurr / (dCurr - dNext);
        result.push({
          x: current.x + t * (next.x - current.x),
          y: current.y + t * (next.y - current.y),
        });
      }
    } else if (dNext >= EPS) {
      // Line crossing from outside to inside
      const t = dCurr / (dCurr - dNext);
      result.push({
        x: current.x + t * (next.x - current.x),
        y: current.y + t * (next.y - current.y),
      });
    }
  }

  return result;
}

/**
 * Clips a polygon by the canvas bounding box [0, 0, width, height]
 */
export function clipPolygonToViewport(poly: Vec2[], width: number, height: number): Vec2[] {
  let result = poly;
  // Left: x >= 0
  result = clipPolygonByHalfPlane(result, 1, 0, 0);
  // Right: w - x >= 0  => -x + w >= 0
  result = clipPolygonByHalfPlane(result, -1, 0, width);
  // Top: y >= 0
  result = clipPolygonByHalfPlane(result, 0, 1, 0);
  // Bottom: h - y >= 0 => -y + h >= 0
  result = clipPolygonByHalfPlane(result, 0, -1, height);
  return result;
}

/**
 * Calculates the polygon centroid (center of mass) and area
 */
export function calculateCentroid(poly: Vec2[]): { centroid: Vec2; area: number } {
  if (poly.length < 3) {
    // Fallback to geometric average
    if (poly.length === 0) return { centroid: { x: 0, y: 0 }, area: 0 };
    let sx = 0, sy = 0;
    poly.forEach(p => { sx += p.x; sy += p.y; });
    return {
      centroid: { x: sx / poly.length, y: sy / poly.length },
      area: 1
    };
  }

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    
    // Cross product factor
    const factor = p1.x * p2.y - p2.x * p1.y;
    area += factor;
    cx += (p1.x + p2.x) * factor;
    cy += (p1.y + p2.y) * factor;
  }

  area = area / 2;
  if (Math.abs(area) < 1e-5) {
    let sx = 0, sy = 0;
    poly.forEach(p => { sx += p.x; sy += p.y; });
    return {
      centroid: { x: sx / poly.length, y: sy / poly.length },
      area: 0.1
    };
  }

  // Centroid calculations
  cx = cx / (6 * area);
  cy = cy / (6 * area);

  return {
    centroid: { x: cx, y: cy },
    area: Math.abs(area)
  };
}

/**
 * GENERATOR A: Radial Tempered Spiderweb
 * Bounded by concentric rings and sector division lines, clipped to bounds.
 */
export function generateRadialShards(
  impactX: number,
  impactY: number,
  width: number,
  height: number,
  config: GlassConfig
): Shard[] {
  const shards: Shard[] = [];
  const rayCount = Math.max(8, Math.round(config.crackDensity * config.shardCount));
  const ringCount = Math.max(2, Math.round(config.ringCount * config.shardCount));
  const maxRadius = config.fractureSpreadRadius;

  // 1. Generate sector angles with subtle organic noise
  const angles: number[] = [];
  const sectorSize = (Math.PI * 2) / rayCount;
  for (let i = 0; i < rayCount; i++) {
    const jitter = (Math.random() - 0.5) * 0.3 * sectorSize;
    angles.push(i * sectorSize + jitter);
  }

  // 2. Generate ring distances (distributed for tighter segments near the impact)
  const ringRadii: number[] = [0];
  for (let j = 1; j <= ringCount; j++) {
    const t = j / ringCount;
    // Exponential distribution for high density near center
    const radius = Math.pow(t, 1.4) * maxRadius;
    const jitter = (Math.random() - 0.5) * 0.12 * (maxRadius / ringCount);
    ringRadii.push(Math.max(5, radius + jitter));
  }

  // Add an outer virtual ring that encompasses the entire viewport
  const viewportDiagonal = Math.sqrt(width * width + height * height);
  ringRadii.push(viewportDiagonal * 2.5);

  // 3. Grid representation of points
  // points[j][i] is the point at ring j, ray i
  const points: Vec2[][] = [];
  for (let j = 0; j < ringRadii.length; j++) {
    points[j] = [];
    const r = ringRadii[j];
    for (let i = 0; i < rayCount; i++) {
      if (j === 0) {
        points[j].push({ x: impactX, y: impactY });
      } else {
        const theta = angles[i];
        // Jitter angle per ring to render organic, wandering cracks
        const angleJitter = (Math.random() - 0.5) * 0.05;
        const finalTheta = theta + angleJitter;
        points[j].push({
          x: impactX + r * Math.cos(finalTheta),
          y: impactY + r * Math.sin(finalTheta)
        });
      }
    }
  }

  let shardId = 0;

  // 4. Construct shards from sectors
  for (let j = 0; j < ringRadii.length - 1; j++) {
    for (let i = 0; i < rayCount; i++) {
      const nextI = (i + 1) % rayCount;
      let rawPoints: Vec2[] = [];

      if (j === 0) {
        // Centermost shards are triangles
        rawPoints = [
          points[0][i],      // Impact center
          points[1][i],      // Next ring, current ray
          points[1][nextI]   // Next ring, next ray
        ];
      } else {
        // Outer shards are quadrilaterals
        rawPoints = [
          points[j][i],
          points[j + 1][i],
          points[j + 1][nextI],
          points[j][nextI]
        ];
      }

      // Clip individual shards to the viewport boundaries
      const clippedPoints = clipPolygonToViewport(rawPoints, width, height);

      // Skip vanishingly small clipped elements
      if (clippedPoints.length < 3) continue;

      const { centroid, area } = calculateCentroid(clippedPoints);
      const distToImpact = Math.hypot(centroid.x - impactX, centroid.y - impactY);
      const angle = Math.atan2(centroid.y - impactY, centroid.x - impactX);

      shards.push({
        id: shardId++,
        originalPoints: clippedPoints,
        currentPoints: [...clippedPoints],
        originCenter: centroid,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        depth: 0,
        depthVelocity: 0,
        rotation: 0,
        angularVelocity: 0,
        tiltX: 0,
        tiltY: 0,
        tiltVelX: 0,
        tiltVelY: 0,
        mass: Math.sqrt(area) * 0.1, // Mass based on dimension
        isBroken: false,
        distanceToImpact: distToImpact,
        impactAngle: angle,
        friction: 0.95 - (Math.random() * 0.05)
      });
    }
  }

  return shards;
}

/**
 * GENERATOR B: Pure Organic Voronoi
 * Uses O(N^2) half-plane bisector clipping to create premium, shattered crystal networks.
 */
export function generateVoronoiShards(
  impactX: number,
  impactY: number,
  width: number,
  height: number,
  config: GlassConfig,
  existingSeeds: Vec2[] = []
): { shards: Shard[]; seeds: Vec2[] } {
  const seeds: Vec2[] = [...existingSeeds];
  
  // Decide the number of new seeds to introduce on click
  // Inner core gets dense seed concentration, outer regions sparse
  const seedCount = Math.max(30, Math.round(50 * config.shardCount));
  const maxRadius = config.fractureSpreadRadius;

  // 1. Generate concentric distribution of seeds specifically clustered near the impact coordinates
  for (let i = 0; i < seedCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Exponential dampening ensures seed density concentrates right under the cursor
    const r = Math.pow(Math.random(), 1.6) * maxRadius;
    seeds.push({
      x: impactX + r * Math.cos(angle),
      y: impactY + r * Math.sin(angle)
    });
  }

  // To prevent boundary gaps, we sprinkle a few anchor seeds along the canvas edge
  const margin = 50;
  const borderSeeds = 8;
  for (let i = 0; i < borderSeeds; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    // Push toward edges
    const xTarget = x < width / 2 ? -margin : width + margin;
    const yTarget = y < height / 2 ? -margin : height + margin;
    seeds.push({
      x: Math.random() > 0.5 ? xTarget : x,
      y: Math.random() > 0.5 ? y : yTarget
    });
  }

  const shards: Shard[] = [];
  let shardId = 0;

  // 2. Perform Voronoi Cell computation for each seed
  for (let k = 0; k < seeds.length; k++) {
    const cand = seeds[k];
    
    // Ignore seeds completely outside reasonable tracking boundaries
    if (cand.x < -200 || cand.x > width + 200 || cand.y < -200 || cand.y > height + 200) {
      continue;
    }

    // Initialize cellular border boundaries with the full canvas bounding box
    let cell: Vec2[] = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
    ];

    // Clip this cell polygon by the bisector lines of all other seeds
    for (let j = 0; j < seeds.length; j++) {
      if (k === j) continue;
      const other = seeds[j];

      // Perpendicular bisector geometry equations
      const mx = (cand.x + other.x) / 2;
      const my = (cand.y + other.y) / 2;

      // Normal pointing back towards cand
      const nx = cand.x - other.x;
      const ny = cand.y - other.y;

      // equation of line: nx * (x - mx) + ny * (y - my) >= 0 => nx*x + ny*y - (mx*nx + my*ny) >= 0
      const A = nx;
      const B = ny;
      const C = -(mx * nx + my * ny);

      cell = clipPolygonByHalfPlane(cell, A, B, C);
      if (cell.length < 3) break; // Cell is fully obscured/empty
    }

    if (cell.length >= 3) {
      const { centroid, area } = calculateCentroid(cell);
      
      // Calculate geometric distance metrics relative to primary interaction points
      const distToImpact = Math.hypot(centroid.x - impactX, centroid.y - impactY);
      const angle = Math.atan2(centroid.y - impactY, centroid.x - impactX);

      shards.push({
        id: shardId++,
        originalPoints: cell,
        currentPoints: [...cell],
        originCenter: centroid,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        depth: 0,
        depthVelocity: 0,
        rotation: 0,
        angularVelocity: 0,
        tiltX: 0,
        tiltY: 0,
        tiltVelX: 0,
        tiltVelY: 0,
        mass: Math.sqrt(area) * 0.1, // Mass based on surface area
        isBroken: false,
        distanceToImpact: distToImpact,
        impactAngle: angle,
        friction: 0.94 - (Math.random() * 0.04)
      });
    }
  }

  return { shards, seeds };
}
