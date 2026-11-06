# M04-02: Slide a word horizontally (was story 8)

**Status:** 🟢 Approved by the designer on 2026-10-31, along with its scenarios in [features/4-phase-two/m04-02-slide-a-word.feature](../../../features/4-phase-two/m04-02-slide-a-word.feature). Built on 2026-10-31.

*As a player, I want to slide a solved word left and right, so that I can bring the letter I need into the column.*

**Key:** 🟦 Rule · 🟩 Example · 🟥 Question

All examples use the answers ZEBRA, LEMUR and KANGAROO, unless they say otherwise. Phase two has started, so every word's first letter is in the column, and the rows are LEMUR, ZEBRA, KANGAROO.

Reordering rows is M04-03, and checking for a win is M04-04.

**Terms:** a *letter* here means any letter or digit, not a special character.

---

## Rules and examples

### 🟦 R1. The player can grab any part of a word and drag the whole word

No particular letter or handle is needed.

- 🟩 Grabbing LEMUR by its M and dragging left moves all 5 tiles
- 🟩 Grabbing it by its L does the same

**Confirmed:** ☑

### 🟦 R2. A word moves only left and right, smoothly following the pointer

*Includes Q1.* Moving the pointer up or down during a drag doesn't move the word.

- 🟩 Dragging diagonally moves LEMUR by the sideways part only

**Confirmed:** ☑

### 🟦 R3. A word always keeps a cell in the column (D13)

It stops when its first letter or last letter reaches the column (Q7).

- 🟩 With L in the column, LEMUR can slide up to 4 cells left, and not right at all
- 🟩 With M in the column, it can slide 2 cells left or 2 cells right
- 🟩 With R in the column, it can slide up to 4 cells right, and not left at all
- 🟩 KANGAROO can slide up to 7 cells left from its starting position
- 🟩 'TIS stops at its T, and ROCKIN' stops at its N, so an apostrophe is never in the column

**Confirmed:** ☑

### 🟦 R4. On release, the word snaps so that its nearest letter sits exactly in the column

The player doesn't need to be exact. The snap is a quick bounce-out tween of 0.1 seconds (Q2).

- 🟩 Releasing LEMUR with its E nearly in the column snaps the E into place

**Confirmed:** ☑

### 🟦 R5. Only a letter can stop in the column, never a special character

*Changed by the designer.* A word snaps to its nearest letter, so it passes over special characters.

- 🟩 Releasing HOT DOG with its space in the column snaps it to the T or the D, whichever is nearer

**Confirmed:** ☑

### 🟦 R6. Only the dragged word moves

- 🟩 Sliding ZEBRA leaves LEMUR and KANGAROO where they are

**Confirmed:** ☑

### 🟦 R7. Words may go off screen (D20)

The column is centred and every word keeps a cell in it, so every word can always be grabbed.

- 🟩 With KANGAROO's last O in the column, most of the word is off the left of the screen on a small screen, and the O can still be grabbed

**Confirmed:** ☑

### 🟦 R8. Mouse and touch work the same way, one drag at a time

- 🟩 Dragging with a mouse or a finger gives the same result
- 🟩 On a touchscreen, a second finger on another word is ignored while the first is dragging

**Confirmed:** ☑

### 🟦 R9. Rotating a device cancels a slide (D29)

- 🟩 Rotating while sliding LEMUR puts it back where it was before the drag

**Confirmed:** ☑

### 🟦 R10. Tapping a word does nothing

- 🟩 Pressing and releasing LEMUR without moving leaves it where it is

**Confirmed:** ☑

### 🟦 R11. Dragging past the end of a word's range stretches it slightly, and it springs back

*From Q3.*

- 🟩 Dragging LEMUR right with L in the column moves it a little, and it springs back on release

**Confirmed:** ☑

### 🟦 R12. A fast flick keeps the word gliding for a moment before it snaps

*From Q4, and the test audit.* It stops at the end of its range. It eases to a stop on its nearest letter over 0.25 seconds, with no bounce (D39).

- 🟩 Flicking LEMUR left carries it on after release, then it eases to a stop
- 🟩 A slow release doesn't glide

**Confirmed:** ☑

### 🟦 R13. Letters in the column look the same until the right word is found

*From Q5.* When the final word is found, they get their own look, which is M04-04.

- 🟩 During play, letters in the column look like any other tile

**Confirmed:** ☑

### 🟦 R14. The Up and Down arrows select a row in phase two

*From Q6 and Q8.* No row is selected when phase two starts, and the first arrow selects the top row. Up and Down wrap around, as in M03-05.

- 🟩 Pressing Down at the start selects the top row
- 🟩 With the top row selected, Up selects the bottom row

**Confirmed:** ☑

### 🟦 R15. The Left and Right arrows slide the selected row one letter at a time

*From Q6, corrected by the designer.* They skip special characters, and they don't wrap around: a word can't slide past its first or last letter (R3). They use the same bounce-out tween as a snap.

- 🟩 With LEMUR selected and L in the column, Left brings the E into the column
- 🟩 With HOT DOG selected and T in the column, Left skips the space and brings the D into the column
- 🟩 With LEMUR selected and L in the column, Right does nothing
- 🟩 With LEMUR selected and R in the column, Left does nothing

**Confirmed:** ☑

### 🟦 R16. With no row selected, Left or Right selects the top row and slides it

*From Q8.* It works like M03-05's R11, where the first input selects a row and also takes effect.

- 🟩 At the start of phase two, Left selects LEMUR's row and brings its E into the column
- 🟩 At the start of phase two, Right selects LEMUR's row, and the word stays where it is, because its first letter is in the column

**Confirmed:** ☑

### 🟦 R17. A drag hides the selection, and the next arrow brings it back

*From Q8.* It works like M03-05's R13. Tapping a word doesn't select it (R10).

- 🟩 With ZEBRA selected, dragging KANGAROO hides the mark, and pressing Left shows ZEBRA selected again and slides it

**Confirmed:** ☑

---

## Answered questions

### 🟥 Q1. How does a word move during a drag?

**Answer:** Smoothly, following the pointer, then snapping on release (R2).

### 🟥 Q2. How does the snap look?

**Answer:** Quick tweening, bounce out, 0.1 seconds (R4).

### 🟥 Q3. What happens at the end of a word's range?

**Answer:** It stretches slightly and springs back (R11).

### 🟥 Q4. Does a fast flick keep the word moving?

**Answer:** Yes, it glides on for a moment before snapping (R12).

### 🟥 Q5. Does the letter in the column stand out?

**Answer:** Only when the right word is found (R13).

### 🟥 Q6. Can the keyboard slide words?

**Answer:** Yes, with a row selected by Up and Down, and Left and Right to slide it. Only Up and Down wrap around (R14, R15).

### 🟥 Q7. What if a word starts or ends with a special character?

**Answer:** Use the first and last letters. Phase two starts with each word's first letter in the column, and a word's range ends at its last letter. D19, M02-01's R14 and M04-01's R2 changed to match (R3).

### 🟥 Q8. How does keyboard selection work alongside the mouse?

**Answer:** Like M03-05, but the first word is selected automatically if Left or Right is used. Dragging hides the selection, and Left or Right brings it back (R16, R17).
