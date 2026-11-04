import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { Board } from '../../../src/game/board';
import { PhaseTwo } from '../../../src/game/phaseTwo';
import { DEFAULT_WORDS, makeLevel } from '../../support/levels';

interface AuditWorld {
  board: Board;
  phase: PhaseTwo;
  rowsBefore: string[];
}

// Both in ZEBRA's row, the second row: its pool has both letters (story 23).
Given('a Z held from the pool and an A placed', function (this: AuditWorld) {
  this.board = new Board(makeLevel(DEFAULT_WORDS));
  this.board.selectRow(1);
  this.board.pickUpFromPool('A');
  this.board.dropOnCell(1, 0);
  this.board.pickUpFromPool('Z');
});

When('Recall All is asked for', function (this: AuditWorld) {
  this.board.recallAll();
});

Then('the A stays placed', function (this: AuditWorld) {
  assert.deepEqual(this.board.rows[1].cells[0], { kind: 'placed', character: 'A' });
});

Then('the Z is still held', function (this: AuditWorld) {
  assert.equal(this.board.drag?.character, 'Z');
});

Given('phase two before the reordering tutorial, with the top row selected', function (this: AuditWorld) {
  this.phase = new PhaseTwo(DEFAULT_WORDS, 'ZLK', false);
  this.phase.selectedRow = 0;
  this.rowsBefore = this.phase.rows.map((row) => row.word);
});

When('the player presses Shift and Down', function (this: AuditWorld) {
  this.phase.key('ArrowDown', true);
});

Then("the rows haven't moved", function (this: AuditWorld) {
  assert.deepEqual(this.phase.rows.map((row) => row.word), this.rowsBefore);
});
