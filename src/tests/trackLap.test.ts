import { describe, it, expect } from 'vitest';
import { TRACK_CONFIGS, getTrackById } from '../game/tracks/trackConfigs';
import { TrackBuilder } from '../game/tracks/trackBuilder';

describe('Track & Environment System', () => {
  it('defines 4 distinct, fully configured playable tracks', () => {
    expect(TRACK_CONFIGS.length).toBe(4);
    const trackIds = TRACK_CONFIGS.map(t => t.id);
    expect(trackIds).toContain('neon-city');
    expect(trackIds).toContain('desert-storm');
    expect(trackIds).toContain('alpine-rush');
    expect(trackIds).toContain('coastline-x');
  });

  it('builds a continuous closed 3D spline and checkpoints for every track', () => {
    TRACK_CONFIGS.forEach(trackConfig => {
      const built = TrackBuilder.buildTrack(trackConfig);

      expect(built.spline).toBeDefined();
      expect(built.checkpoints.length).toBeGreaterThanOrEqual(10);
      expect(built.startPosition).toBeDefined();
      expect(built.aiWaypoints.length).toBe(100);

      // Verify spline closes back on start
      const startPt = built.spline.getPointAt(0);
      const endPt = built.spline.getPointAt(1);
      expect(startPt.distanceTo(endPt)).toBeLessThan(1.0);

      // Verify cleanup disposal
      expect(() => built.dispose()).not.toThrow();
    });
  });

  it('retrieves track by ID correctly with fallback', () => {
    const neon = getTrackById('neon-city');
    expect(neon.name).toContain('Neon City');

    const fallback = getTrackById('unknown-id');
    expect(fallback).toBe(TRACK_CONFIGS[0]);
  });
});

