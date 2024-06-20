import * as Matter from "matter-js";

interface Point {
  x: number;
  y: number;
}

// interface SevenSegmentBodies {
//   [key: number]: Matter.Body | undefined;
// }

const engine = Matter.Engine.create(),
  world = engine.world;

export class TimerAnimation {
  private staticColor = "#1976d2";
  private dynamicColor = "orange";
  // private dynamicColor = "#c4e1ff";

  private render: Matter.Render | undefined;
  private isRunning: boolean = false;
  private isDecimal: boolean = true;
  private durationMs = 0;
  private endTimeMs = 0;
  private numberOfItems = 0;
  private currentDurationMs = 0;
  private bodies: Matter.Body[] = [];
  private remainingText = "";
  // private sevenSegmentBodies: SevenSegmentBodies[] = [];

  constructor() {
    this.animate();
  }

  public initialize(element: HTMLElement) {
    if (!this.render) {
      this.render = Matter.Render.create({
        element: element,
        engine: engine,
        options: {
          width: element.clientWidth,
          height: element.clientHeight,
          wireframes: false,
          background: "transparent",
        },
      });
      engine.gravity.y = 0.2;

      Matter.Render.run(this.render);

      const runner = Matter.Runner.create();
      Matter.Runner.run(runner, engine);
    }
  }

  public set = (
    durationMs: number,
    numberOfItems: number,
    isDecimal: boolean
  ) => {
    this.pause();
    this.durationMs = durationMs;
    this.numberOfItems = numberOfItems;
    this.currentDurationMs = 0;
    this.isDecimal = isDecimal;

    Matter.Composite.clear(world, false);
    this.bodies = [];

    const r = 200;
    console.log(numberOfItems);

    const currentPoints = this.calculatePointsOnCircle(r, numberOfItems);

    if (
      currentPoints.length > 0 &&
      this.render?.options.width &&
      this.render?.options.height
    ) {
      Matter.Composite.add(world, [
        Matter.Bodies.rectangle(
          this.render.options.width / 2,
          this.render.options.height,
          this.render.options.width - 80,
          20,
          { isStatic: true, render: { fillStyle: this.staticColor } }
        ),
      ]);

      Matter.Composite.add(
        world,
        currentPoints.map((p) => {
          const b = Matter.Bodies.circle(
            p.x + this.render!.options.width! / 2,
            p.y + this.render!.options.height! / 2,
            ((Math.PI * 2 * r) / numberOfItems / 2) * 0.9,
            {
              isStatic: true,
              render: {
                fillStyle: this.staticColor,
              },
            }
          );
          this.bodies.push(b);
          return b;
        })
      );

      this.drawSegments(durationMs, true);
    }
  };

  public play() {
    this.endTimeMs = Date.now() + (this.durationMs - this.currentDurationMs);
    this.isRunning = true;
  }

  public pause() {
    this.isRunning = false;
  }

  private animate = () => {
    if (this.isRunning) {
      const remainingDurationMs = Math.max(this.endTimeMs - Date.now(), 0);
      this.currentDurationMs = this.durationMs - remainingDurationMs;
      const lockedItemsCount = Math.round(
        ((this.durationMs - this.currentDurationMs) / this.durationMs) *
          this.numberOfItems
      );

      // const lockedItems = this.bodies.slice(0, lockedItemsCount);
      const nonLockedItems = this.bodies.slice(lockedItemsCount);

      nonLockedItems
        .filter((x) => x.isStatic)
        .forEach((x) => {
          Matter.Body.setStatic(x, false);
          x.render.fillStyle = this.dynamicColor;
        });

      this.drawSegments(remainingDurationMs, false);
    }

    requestAnimationFrame(this.animate);
    // Matter.Engine.update(engine, 1000 / 60);
  };

  private drawSegments = (remainingDurationMs: number, reset: boolean) => {
    let newRemainingText = "";
    if (this.isDecimal) {
      newRemainingText = (
        (remainingDurationMs / 1000 / 60 / 60 / 24) *
        10000
      ).toFixed(1);
    } else {
      const nMinutes = Math.floor(remainingDurationMs / 1000 / 60);
      const nSeconds = Math.floor((remainingDurationMs / 1000) % 60);
      newRemainingText =
        nMinutes + ":" + (nSeconds < 10 ? "0" + nSeconds : nSeconds);
    }

    if (reset) {
      Matter.Composite.remove(
        world,
        world.bodies.filter((x) => x.label.startsWith("t-"))
      );
    } else {
      if (newRemainingText.length < this.remainingText.length) {
        newRemainingText =
          " ".repeat(this.remainingText.length - newRemainingText.length) +
          newRemainingText;
      }
    }

    let currentCharPos = 0;
    if (this.render && (reset || this.remainingText !== newRemainingText)) {
      this.remainingText = newRemainingText;
      const segmentThickness = 3;
      const segmentLength = 40;
      const segmentGap = 3;
      const charGap = 10;
      const charWidth = segmentLength + charGap + segmentGap * 2;

      const allLength =
        (this.remainingText.length - 1) * charWidth + charWidth / 2;
      const initialStart = this.render.options.width! / 2 - allLength / 2;
      for (let i = 0; i < this.remainingText.length; i++) {
        const char = this.remainingText[i];

        const startX = initialStart + currentCharPos;
        // console.log(
        //   this.render.options.width! / 2,
        //   startX,
        //   currentCharPos,
        //   allLength,
        //   charWidth
        // );

        // decimal and colon will be have the width
        const startY = (this.render.options.height! * 3) / 7;
        if (char == ".") {
          currentCharPos += charWidth / 2;
          if (world.bodies.find((x) => x.label === "t-point") === undefined) {
            Matter.Composite.add(
              world,
              Matter.Bodies.circle(
                startX + charWidth / 4,
                startY + segmentLength * 2 + segmentGap * 4,
                segmentThickness * 2,
                {
                  label: "t-point",
                  isStatic: true,
                  render: {
                    fillStyle: this.staticColor,
                  },
                }
              )
            );
          }
        } else if (char == ":") {
          currentCharPos += charWidth / 2;
          if (world.bodies.find((x) => x.label === "t-colon1") === undefined) {
            Matter.Composite.add(
              world,
              Matter.Bodies.circle(
                startX + charWidth / 4,
                startY + segmentLength / 2 + segmentGap,
                segmentThickness * 2,
                {
                  label: "t-colon1",
                  isStatic: true,
                  render: {
                    fillStyle: this.staticColor,
                  },
                }
              )
            );
            Matter.Composite.add(
              world,
              Matter.Bodies.circle(
                startX + charWidth / 4,
                startY + segmentLength + segmentLength / 2 + segmentGap * 3,
                segmentThickness * 2,
                {
                  label: "t-colon2",
                  isStatic: true,
                  render: {
                    fillStyle: this.staticColor,
                  },
                }
              )
            );
          }
        } else {
          currentCharPos += charWidth;
          const number = parseInt(char);

          //  --- 0 ---
          // |         |
          // 5         1
          // |         |
          //  --- 6 ---
          // |         |
          // 4         2
          // |         |
          //  --- 3 ---

          const activeSegments: number[] = [];
          if (number == 0) activeSegments.push(0, 1, 2, 3, 4, 5);
          else if (number == 1) activeSegments.push(1, 2);
          else if (number == 2) activeSegments.push(0, 1, 3, 4, 6);
          else if (number == 3) activeSegments.push(0, 1, 2, 3, 6);
          else if (number == 4) activeSegments.push(1, 2, 5, 6);
          else if (number == 5) activeSegments.push(0, 2, 3, 5, 6);
          else if (number == 6) activeSegments.push(0, 2, 3, 4, 5, 6);
          else if (number == 7) activeSegments.push(0, 1, 2);
          else if (number == 8) activeSegments.push(0, 1, 2, 3, 4, 5, 6);
          else if (number == 9) activeSegments.push(0, 1, 2, 3, 5, 6);

          const newComposites = [];
          for (let j = 0; j < 7; j++) {
            const sevenSegmentBodyJ = world.bodies.find(
              (x) => x.label == "t-" + i + "-" + j
            );
            if (activeSegments.includes(j)) {
              if (!sevenSegmentBodyJ) {
                const x =
                  startX +
                  charWidth / 2 +
                  ([1, 2].includes(j)
                    ? segmentLength / 2 + segmentGap
                    : [5, 4].includes(j)
                    ? -segmentLength / 2 - segmentGap
                    : 0);
                const y =
                  startY +
                  (j === 0
                    ? 0
                    : [5, 1].includes(j)
                    ? segmentLength / 2 + segmentGap
                    : j === 6
                    ? segmentLength + segmentGap * 2
                    : [4, 2].includes(j)
                    ? segmentLength * 1.5 + segmentGap * 3
                    : j === 3
                    ? segmentLength * 2 + segmentGap * 4
                    : 0);
                const width = [0, 3, 6].includes(j)
                  ? segmentLength
                  : segmentThickness;
                const height = [0, 3, 6].includes(j)
                  ? segmentThickness
                  : segmentLength;
                const b = Matter.Bodies.rectangle(x, y, width, height, {
                  label: "t-" + i + "-" + j,
                  isStatic: true,
                  render: {
                    fillStyle: this.staticColor,
                  },
                });
                newComposites.push(b);
              }
            } else {
              if (sevenSegmentBodyJ) {
                Matter.Body.setStatic(sevenSegmentBodyJ, false);
                sevenSegmentBodyJ.render.fillStyle = this.dynamicColor;
                sevenSegmentBodyJ.label = "tx";
              }
            }
          }
          Matter.Composite.add(world, newComposites);
        }
      }
    }
  };

  private calculatePointsOnCircle(radius: number, numPoints: number) {
    const points: Point[] = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * Math.PI * 2) / numPoints - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      points.push({ x, y });
    }
    return points;
  }
}
