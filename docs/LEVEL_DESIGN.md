# Level design

Levels live in `src/game/levels.ts`. Coordinates are in the 400 x 640 playfield (y grows downward).

```ts
{
  tap: { x, y },                 // spring. Water appears just below it
  cup: { x, y, w, h },           // dry pond. x,y = top-left of the opening
  walls: [
    [x1, y1, x2, y2],                                // fixed rock line
    { p: [x1, y1, x2, y2], mx: 60, my: 0, per: 3 },  // moving rock: slides ±mx/±my every `per` seconds
  ],
  lava: [{ x, y, w, h }],        // destroys water
  flowers: [[x, y]],             // bonus: water must touch each one
  drops: 140, goal: 60,          // water released / needed in the pond
  ink: 400,                      // total line length the player gets
  live: true,                    // optional: player may keep drawing after the river starts
  hint: 'One short sentence',
  ghost: [[x1, y1], [x2, y2]],   // optional dashed tutorial line
  solution: [[[x, y], [x, y]]],  // known winning strokes, checked by npm run check-levels
}
```

## Stars
1 star for filling the pond, +1 if every flower bloomed, +1 if the player used ≤ 60% of the ink (`THRIFTY` in config).
The 3-star condition should need a cleverer line than the obvious one. That is what brings players back.

## Workflow
1. Sketch the level and add it to `levels.ts`.
2. `npm run search-level -- <index> 400` to see if random lines can win. Copy a good result into `solution`.
3. `npm run check-levels`: every level must win 3/3.
4. Make sure it does not play itself: a tiny line in a corner must lose.
5. Play it yourself on a phone (`npm run dev`, open the network URL).

## Rules of thumb
- One new idea per group of 4–6 levels; introduce it in an easy level, then combine it with old ideas.
- Water is fast. Ponds should sit where water lands after leaving a line, not right under the line's end.
- The obvious line should *almost* work (near misses make players retry).
- Long levels are slow. Keep the river's path short enough to finish within ~10 seconds.
- Difficulty should go up and down (easy breather after a hard level), not only up.

## Ideas for the next mechanics
Sponges that soak water, ice that melts when water touches it, gates opened by a water wheel, two springs that must merge,
a thirsty animal walking toward the pond, wind zones, lines that crumble after N seconds.
