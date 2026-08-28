import { test } from "node:test";
import assert from "node:assert/strict";
import {
  easeInOutCubic,
  lerpPose,
  morphSquash,
  poseFor
} from "../agent/buddyPose.js";

test("poseFor happy is a squint, puzzled only shuts the left eye", () => {
  const happy = poseFor("happy");
  const puzzled = poseFor("puzzled");
  const idle = poseFor("idle");
  assert.ok(happy.leftH < idle.leftH);
  assert.ok(puzzled.leftH < puzzled.rightH);
  assert.equal(poseFor("nope").leftH, idle.leftH);
});

test("lerpPose is at the start and end, and midway is between", () => {
  const from = poseFor("idle");
  const to = poseFor("happy");
  assert.deepEqual(lerpPose(from, to, 0), from);
  assert.deepEqual(lerpPose(from, to, 1), to);
  const mid = lerpPose(from, to, 0.5);
  assert.equal(mid.leftH, (from.leftH + to.leftH) / 2);
});

test("morphSquash closes then opens", () => {
  assert.ok(morphSquash(0) > 0.95);
  assert.ok(morphSquash(0.34) < 0.2);
  assert.ok(morphSquash(1) > 0.95);
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(1), 1);
});
