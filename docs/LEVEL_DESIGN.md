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
  winds: [{ x, y, w, h, fx, fy }], // optional: pushes water inside the rect by fx,fy px/s² (700-1500 feels right)
  pipes: [{ a: [x, y], b: [x, y] }], // optional: water entering orange mouth `a` leaves blue mouth `b`, same velocity
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
3. `npm run check-levels`: every level must win 3/3, and must not play itself. The checker also plays a tiny
   doodle in each corner and fails the level (`PLAYS ITSELF`) if one of them wins.
4. Past each group's intro level, also make sure a short 40 px nub under the spring can't win it. That's legal but boring.
5. Play it yourself on a phone (`npm run dev`, open the network URL).

## Groups (30 levels)
| Levels | Idea |
|---|---|
| 1-6 | Draw a riverbed, walls, lava, ledges, flowers |
| 7-15 | Moving rocks, live drawing, short ink |
| 16-22 | Wind: it carries (16), it blows you off course (17-21), updrafts lift (22) |
| 23-28 | Pipes: intro (23), hidden routes, decoy pipes, pipe + wind |
| 29-30 | Finale: wind, rocks and pipes together |

## Rules of thumb
- One new idea per group of 4–6 levels; introduce it in an easy level, then combine it with old ideas.
- Water is fast. Ponds should sit where water lands after leaving a line, not right under the line's end.
- The obvious line should *almost* work (near misses make players retry).
- Long levels are slow. Keep the river's path short enough to finish within ~10 seconds.
- Difficulty should go up and down (easy breather after a hard level), not only up.

## Ideas for the next mechanics
Sponges that soak water, ice that melts when water touches it, gates opened by a water wheel, two springs that must merge,
a thirsty animal walking toward the pond, lines that crumble after N seconds. (Wind zones and pipes are done.)
