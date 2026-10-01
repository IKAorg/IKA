import assert from "node:assert/strict";
import test from "node:test";

import { validateDirectorDeletion } from "./director-deletion.ts";

test("rejects a missing target director", () => {
  assert.equal(
    validateDirectorDeletion({
      targetId: "",
      currentDirectorId: "director-current",
      targetIsActive: true,
      activeDirectorCount: 2,
    }),
    "Falta el admin que quieres eliminar.",
  );
});

test("rejects deleting the current PIN identity", () => {
  assert.equal(
    validateDirectorDeletion({
      targetId: "director-current",
      currentDirectorId: "director-current",
      targetIsActive: true,
      activeDirectorCount: 2,
    }),
    "No puedes eliminar la identidad PIN con la que estas conectado.",
  );
});

test("rejects deleting the last active director", () => {
  assert.equal(
    validateDirectorDeletion({
      targetId: "director-target",
      currentDirectorId: "director-current",
      targetIsActive: true,
      activeDirectorCount: 1,
    }),
    "No puedes eliminar el ultimo admin activo.",
  );
});

test("allows deleting another director when access remains", () => {
  assert.equal(
    validateDirectorDeletion({
      targetId: "director-target",
      currentDirectorId: "director-current",
      targetIsActive: true,
      activeDirectorCount: 2,
    }),
    null,
  );
});

test("allows deleting an inactive director", () => {
  assert.equal(
    validateDirectorDeletion({
      targetId: "director-target",
      currentDirectorId: "director-current",
      targetIsActive: false,
      activeDirectorCount: 1,
    }),
    null,
  );
});
