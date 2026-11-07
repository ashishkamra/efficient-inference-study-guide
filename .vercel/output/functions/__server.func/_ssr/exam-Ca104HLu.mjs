import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as useProgress, n as cn, r as exam } from "./cn-DRvXy5YS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/exam-Ca104HLu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ExamPage() {
	const answers = useProgress((s) => s.exam);
	const submitted = useProgress((s) => s.examSubmitted);
	const answer = useProgress((s) => s.answerExam);
	const submit = useProgress((s) => s.submitExam);
	const reset = useProgress((s) => s.resetExam);
	const [cursor, setCursor] = (0, import_react.useState)(0);
	const q = exam[cursor];
	const score = exam.filter((item) => answers[item.id] === item.answer).length;
	const answered = exam.filter((item) => answers[item.id] !== void 0).length;
	if (submitted) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep",
				children: "Exam"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "mt-2 font-serif text-4xl sm:text-5xl",
				children: [
					score,
					" / ",
					exam.length
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: score >= 10 ? "That is a working command of the taxonomy. Reread any miss against the section it cites." : score >= 7 ? "The spine is there. The misses are worth a second pass on the lesson they point at." : "Treat this as a map of what to reread, not a grade. Start with bottlenecks and the KV equation."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-8 space-y-4",
				children: exam.map((item, i) => {
					const ok = answers[item.id] === item.answer;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-card border border-line bg-card p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs font-semibold uppercase tracking-[0.12em] text-muted",
								children: [
									i + 1,
									" · ",
									ok ? "Correct" : "Review"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-semibold",
								children: item.prompt
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm",
								children: ok ? item.options[item.answer] : `Answer: ${item.options[item.answer]}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: item.why
							})
						]
					}, item.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: reset,
				className: "mt-6 min-h-11 rounded-full border border-line bg-card px-5 text-sm font-semibold",
				children: "Retake"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep",
				children: [
					"Exam · ",
					cursor + 1,
					" of ",
					exam.length
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-serif text-4xl leading-tight",
				children: q.prompt
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-copper",
					style: { width: `${answered / exam.length * 100}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 space-y-2",
				children: q.options.map((opt, i) => {
					const selected = answers[q.id] === i;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => answer(q.id, i),
						className: cn("flex w-full items-start gap-3 rounded-card border px-4 py-3 text-left", selected ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink/30"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs opacity-70",
							children: String.fromCharCode(65 + i)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: opt })]
					}, opt);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-wrap gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: cursor === 0,
						onClick: () => setCursor((c) => Math.max(0, c - 1)),
						className: "min-h-11 rounded-full border border-line bg-card px-5 text-sm font-semibold disabled:opacity-40",
						children: "Back"
					}),
					cursor < exam.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setCursor((c) => c + 1),
						className: "min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-paper",
						children: "Next"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: answered < exam.length,
						onClick: submit,
						className: "min-h-11 rounded-full bg-copper px-5 text-sm font-semibold text-card disabled:opacity-40",
						children: answered < exam.length ? `Answer all ${exam.length}` : "Submit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex min-h-11 items-center px-2 text-sm font-semibold text-muted",
						children: "Return to the path"
					})
				]
			})
		]
	});
}
//#endregion
export { ExamPage as component };
