import { test } from "node:test";
import assert from "node:assert/strict";
import { roomMatchesFilters, roomPlace } from "../filters.js";

const room = (over = {}) => ({
  name: "1号",
  buildingName: "奥城",
  floorName: "7层",
  capacity: 8,
  facilities: ["电视", "白板"],
  ...over
});

const filters = (over = {}) => ({
  place: "all",
  capacity: "all",
  facilities: [],
  ...over
});

test("roomPlace joins building and floor", () => {
  assert.equal(roomPlace(room()), "奥城 7层");
});

test("capacity band 1-6 keeps 6 and drops 8", () => {
  assert.equal(
    roomMatchesFilters(room({ capacity: 6 }), filters({ capacity: "1-6" })),
    true
  );
  assert.equal(roomMatchesFilters(room(), filters({ capacity: "1-6" })), false);
});

test("capacity band 7-12 keeps 8 and drops 6", () => {
  assert.equal(roomMatchesFilters(room(), filters({ capacity: "7-12" })), true);
  assert.equal(
    roomMatchesFilters(room({ capacity: 6 }), filters({ capacity: "7-12" })),
    false
  );
});

test("13+ keeps large rooms", () => {
  assert.equal(
    roomMatchesFilters(room({ capacity: 20 }), filters({ capacity: "13+" })),
    true
  );
  assert.equal(roomMatchesFilters(room(), filters({ capacity: "13+" })), false);
});

test("facilities require every selected item", () => {
  assert.equal(
    roomMatchesFilters(room(), filters({ facilities: ["电视"] })),
    true
  );
  assert.equal(
    roomMatchesFilters(room(), filters({ facilities: ["电视", "投影"] })),
    false
  );
});

test("keyword matches name or place, case-insensitive", () => {
  assert.equal(roomMatchesFilters(room(), filters(), "1号"), true);
  assert.equal(roomMatchesFilters(room(), filters(), "奥城"), true);
  assert.equal(roomMatchesFilters(room(), filters(), "生态"), false);
});

test("place filter uses building+floor", () => {
  assert.equal(
    roomMatchesFilters(room(), filters({ place: "奥城 7层" })),
    true
  );
  assert.equal(
    roomMatchesFilters(room(), filters({ place: "奥城 8层" })),
    false
  );
});
