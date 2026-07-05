import { describe, expect, it } from 'vitest';
import { dealDamage } from '../src/sim/combat/damage';
import { Sim } from '../src/sim/sim';
import type { SimContext } from '../src/sim/sim_context';
import {
  ENTITY_DEAD_COLLISION_HEIGHT_SCALE,
  ENTITY_LIVING_COLLISION_HEIGHT_SCALE,
  type Entity,
} from '../src/sim/types';

function simContext(sim: Sim): SimContext {
  return (sim as unknown as { ctx: SimContext }).ctx;
}

function firstLivingMob(sim: Sim): Entity {
  const mob = [...sim.entities.values()].find((e) => e.kind === 'mob' && !e.dead);
  if (!mob) throw new Error('expected a living mob in the seeded sim');
  return mob;
}

function killMob(sim: Sim, mob: Entity): void {
  dealDamage(simContext(sim), sim.player, mob, mob.maxHp + 100, false, 'physical', null, 'hit');
}

describe('corpse collision bounds', () => {
  it('flattens a killed mob interaction hitbox in handleDeath', () => {
    const sim = new Sim({ seed: 42, playerClass: 'warrior', autoEquip: true });
    const mob = firstLivingMob(sim);

    expect(mob.collisionHeightScale).toBe(ENTITY_LIVING_COLLISION_HEIGHT_SCALE);

    killMob(sim, mob);

    expect(mob.dead).toBe(true);
    expect(mob.aiState).toBe('dead');
    expect(mob.collisionHeightScale).toBe(ENTITY_DEAD_COLLISION_HEIGHT_SCALE);
    expect(mob.collisionHeightScale).toBeLessThan(ENTITY_LIVING_COLLISION_HEIGHT_SCALE * 0.25);
  });

  it('restores the standing interaction hitbox when a mob respawns', () => {
    const sim = new Sim({ seed: 43, playerClass: 'warrior', autoEquip: true });
    const mob = firstLivingMob(sim);
    const ctx = simContext(sim);

    killMob(sim, mob);
    expect(mob.collisionHeightScale).toBe(ENTITY_DEAD_COLLISION_HEIGHT_SCALE);

    ctx.respawnMob(mob);

    expect(mob.dead).toBe(false);
    expect(mob.collisionHeightScale).toBe(ENTITY_LIVING_COLLISION_HEIGHT_SCALE);
  });
});
