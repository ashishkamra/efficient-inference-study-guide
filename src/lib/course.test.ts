import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  exam,
  formulas,
  glossary,
  glossaryLessonIds,
  glossarySlug,
  lessonById,
  lessonStudy,
  lessons,
  neighbors,
  oralPrompts,
  traps,
} from "./course.ts";

const lessonIds = new Set(lessons.map((lesson) => lesson.id));
const allChecks = [...lessons.flatMap((lesson) => lesson.checks), ...exam];
const glossaryTerms = new Set(glossary.map((entry) => entry.term));

describe("course content", () => {
  it("has unique lesson ids, numerals, and titles", () => {
    const ids = lessons.map((lesson) => lesson.id);
    const numerals = lessons.map((lesson) => lesson.numeral);
    const titles = lessons.map((lesson) => lesson.title);
    assert.equal(new Set(ids).size, ids.length, "lesson id");
    assert.equal(new Set(numerals).size, numerals.length, "lesson numeral");
    assert.equal(new Set(titles).size, titles.length, "lesson title");
  });

  it("keeps lesson numerals in reading order", () => {
    const values = lessons.map((lesson) => Number(lesson.numeral));
    values.forEach((value, index) => {
      assert.ok(Number.isFinite(value), `lesson ${index} has a numeric numeral`);
      if (index > 0) assert.ok(value > values[index - 1], "numerals ascend with lesson order");
    });
  });

  it("gives every lesson a body, papers, and study material", () => {
    for (const lesson of lessons) {
      assert.ok(lesson.summary.trim().length > 40, `${lesson.id}: summary`);
      assert.ok(lesson.minutes > 0, `${lesson.id}: minutes`);
      assert.ok(lesson.sections.length >= 2, `${lesson.id}: sections`);
      assert.ok(lesson.papers.length >= 2, `${lesson.id}: papers`);
      assert.ok(lessonStudy[lesson.id], `${lesson.id}: study entry`);
      for (const section of lesson.sections) {
        assert.ok(section.heading.trim().length > 0, `${lesson.id}: section heading`);
        assert.ok(section.paragraphs.length > 0, `${lesson.id}: section paragraphs`);
      }
    }
  });

  it("has a study entry for every lesson and no orphans", () => {
    assert.deepEqual(Object.keys(lessonStudy).sort(), [...lessonIds].sort());
    for (const [id, study] of Object.entries(lessonStudy)) {
      assert.ok(study.survey.trim().length > 0, `${id}: survey reference`);
      assert.ok(study.objectives.length >= 2, `${id}: objectives`);
      assert.ok(study.takeaways.length >= 2, `${id}: takeaways`);
      for (const line of [...study.objectives, ...study.takeaways]) {
        assert.ok(line.trim().length > 20, `${id}: empty study line`);
      }
    }
  });

  it("gives every lesson at least three practice checks", () => {
    for (const lesson of lessons) {
      assert.ok(
        lesson.checks.length >= 3,
        `${lesson.id} has ${lesson.checks.length} checks, expected at least 3`,
      );
    }
    assert.ok(
      lessons.reduce((sum, lesson) => sum + lesson.checks.length, 0) >= 27,
      "at least 27 practice checks",
    );
  });

  it("uses globally unique check ids", () => {
    const ids = allChecks.map((check) => check.id);
    assert.equal(new Set(ids).size, ids.length, "check id");
  });

  it("gives every check a valid answer and non-empty text", () => {
    for (const check of allChecks) {
      assert.ok(check.prompt.trim().length > 0, `${check.id}: prompt`);
      assert.ok(check.options.length >= 2, `${check.id}: options`);
      assert.ok(
        Number.isInteger(check.answer) && check.answer >= 0 && check.answer < check.options.length,
        `${check.id}: answer index ${check.answer} outside 0..${check.options.length - 1}`,
      );
      assert.equal(
        new Set(check.options).size,
        check.options.length,
        `${check.id}: duplicate option text`,
      );
      for (const option of check.options) {
        assert.ok(option.trim().length > 0, `${check.id}: empty option`);
      }
      assert.ok(check.why.trim().length > 20, `${check.id}: explanation`);
    }
  });

  it("scopes every check to a real lesson", () => {
    for (const check of allChecks) {
      if (check.lessonId === undefined) continue;
      assert.ok(lessonIds.has(check.lessonId), `${check.id}: unknown lesson ${check.lessonId}`);
    }
    for (const lesson of lessons) {
      for (const check of lesson.checks) {
        if (check.lessonId !== undefined) {
          assert.equal(check.lessonId, lesson.id, `${check.id}: lesson mismatch`);
        }
      }
    }
  });

  it("keeps the exam at a useful length", () => {
    assert.ok(exam.length >= 16, `exam has ${exam.length} questions`);
    assert.ok(
      new Set(exam.map((question) => question.lessonId)).size >= 6,
      "exam covers at least six lessons",
    );
  });

  it("has unique glossary terms and anchors", () => {
    assert.ok(glossary.length >= 25, `glossary has ${glossary.length} terms`);
    assert.equal(new Set(glossary.map((entry) => entry.term)).size, glossary.length, "glossary term");
    const anchors = glossary.map((entry) => glossarySlug(entry.term));
    assert.equal(new Set(anchors).size, anchors.length, "glossary anchor");
    for (const entry of glossary) {
      assert.ok(entry.def.trim().length > 20, `${entry.term}: definition`);
      assert.match(glossarySlug(entry.term), /^[a-z0-9-]+$/, `${entry.term}: anchor shape`);
    }
  });

  it("maps every glossary term to real lessons", () => {
    assert.deepEqual(Object.keys(glossaryLessonIds).sort(), [...glossaryTerms].sort());
    for (const [term, ids] of Object.entries(glossaryLessonIds)) {
      assert.ok(ids.length > 0, `${term}: no lessons`);
      assert.equal(new Set(ids).size, ids.length, `${term}: duplicate lesson link`);
      for (const id of ids) {
        assert.ok(lessonIds.has(id), `${term}: unknown lesson ${id}`);
      }
    }
  });

  it("keeps formula, trap, and oral references valid", () => {
    for (const formula of formulas) {
      assert.ok(lessonIds.has(formula.lessonId), `${formula.name}: unknown lesson`);
      assert.ok(formula.expr.trim().length > 0, `${formula.name}: expression`);
      assert.ok(formula.note.trim().length > 20, `${formula.name}: note`);
    }
    assert.equal(new Set(formulas.map((formula) => formula.name)).size, formulas.length);
    for (const trap of traps) {
      assert.ok(lessonIds.has(trap.lessonId), `${trap.trap}: unknown lesson`);
      assert.ok(trap.fix.trim().length > 20, `${trap.trap}: fix`);
    }
    assert.equal(new Set(traps.map((trap) => trap.trap)).size, traps.length);
    for (const prompt of oralPrompts) {
      assert.ok(lessonIds.has(prompt.lessonId), `${prompt.prompt}: unknown lesson`);
      assert.ok(prompt.sketch.trim().length > 20, `${prompt.prompt}: sketch`);
    }
    assert.equal(new Set(oralPrompts.map((prompt) => prompt.prompt)).size, oralPrompts.length);
  });

  it("navigates lessons in both directions", () => {
    const first = lessons[0];
    const last = lessons.at(-1);
    assert.ok(first && last);
    assert.equal(lessonById(first.id)?.title, first.title);
    assert.equal(lessonById("not-a-lesson"), undefined);
    assert.deepEqual(neighbors(first.id), { prev: undefined, next: lessons[1] });
    assert.deepEqual(neighbors(last.id), { prev: lessons.at(-2), next: undefined });
    assert.deepEqual(neighbors("not-a-lesson"), { prev: undefined, next: undefined });
  });
});
