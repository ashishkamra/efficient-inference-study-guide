import { S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as lessonById, c as useProgress, n as cn, o as lessons, s as neighbors, t as SOURCE } from "./cn-DRvXy5YS.mjs";
import { a as FlaskConical, c as ArrowLeft, o as Check, s as ArrowRight } from "../_libs/lucide-react.mjs";
import { n as Route$1 } from "./router-CRPZCUKL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lesson._id-B01UCasJ.js
var import_jsx_runtime = require_jsx_runtime();
function LessonPage() {
	const { id } = Route$1.useParams();
	const lesson = lessonById(id);
	if (!lesson) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg py-16 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-serif text-4xl",
			children: "No lesson here"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/",
			className: "mt-4 inline-flex font-semibold text-copper-deep",
			children: "Back to the path"
		})]
	});
	const { prev, next } = neighbors(lesson.id);
	const index = lessons.findIndex((l) => l.id === lesson.id);
	const complete = useProgress((s) => s.complete.includes(lesson.id));
	const mark = useProgress((s) => s.completeLesson);
	const checks = useProgress((s) => s.checks);
	const answer = useProgress((s) => s.answerCheck);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "grid gap-10 lg:grid-cols-[minmax(0,42rem)_16rem]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep",
				children: [
					"Lesson ",
					lesson.numeral,
					" · ",
					lesson.kicker
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-serif text-4xl leading-[1.08] sm:text-5xl",
				children: lesson.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-lg text-muted",
				children: lesson.summary
			}),
			lesson.video ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
				className: "mt-8 overflow-hidden rounded-card border border-line bg-ink",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					className: "aspect-video w-full bg-ink",
					controls: true,
					playsInline: true,
					preload: "metadata",
					poster: lesson.video.src.replace(/\.mp4$/, ".jpg"),
					src: lesson.video.src
				}, lesson.video.src), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
					className: "space-y-3 bg-card px-4 py-4 sm:px-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: lesson.video.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: lesson.video.caption
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "space-y-2 border-t border-line pt-3 text-sm",
							children: lesson.video.transcript.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "grid grid-cols-[1.5rem_1fr] gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs text-copper-deep",
									children: i + 1
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: line })]
							}, i))
						})
					]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 space-y-9",
				children: lesson.sections.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-serif text-3xl",
						children: section.heading
					}),
					section.paragraphs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-ink/90",
						children: p
					}, p.slice(0, 48))),
					section.formula ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 overflow-x-auto rounded-card border border-line bg-paper-2/70 px-4 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "font-mono text-sm leading-relaxed text-ink",
							children: section.formula.expr
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: section.formula.caption
						})]
					}) : null,
					section.bullets ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-2",
						children: section.bullets.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "grid grid-cols-[0.6rem_1fr] gap-3 text-ink/90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-2 size-1.5 rounded-full bg-copper" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b })]
						}, b.slice(0, 40)))
					}) : null,
					section.aside ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "mt-4 rounded-card border border-line bg-warn-soft px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-[0.14em] text-copper-deep",
							children: section.aside.kicker
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm",
							children: section.aside.body
						})]
					}) : null
				] }, section.heading))
			}),
			lesson.lab ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/labs",
				hash: lesson.lab.href.split("#")[1],
				className: "mt-8 flex items-center gap-3 rounded-card border border-line bg-card px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, {
						"aria-hidden": true,
						className: "size-5 text-copper-deep"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs font-semibold uppercase tracking-[0.12em] text-muted",
						children: "Lab"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold",
						children: lesson.lab.label
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
						"aria-hidden": true,
						className: "ml-auto size-4"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-3xl",
					children: "Check yourself"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-5",
					children: lesson.checks.map((c) => {
						const chosen = checks[c.id];
						const revealed = chosen !== void 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
							className: "rounded-card border border-line bg-card p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
									className: "px-1 font-semibold",
									children: c.prompt
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 space-y-2",
									children: c.options.map((opt, i) => {
										const selected = chosen === i;
										const correct = i === c.answer;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => answer(c.id, i),
											className: cn("flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm", !revealed && "border-line hover:border-ink/30", revealed && selected && correct && "border-moss bg-moss-soft", revealed && selected && !correct && "border-copper bg-warn-soft", revealed && !selected && correct && "border-moss", revealed && !selected && !correct && "border-line opacity-70"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-0.5 font-mono text-xs text-muted",
												children: String.fromCharCode(65 + i)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: opt })]
										}, opt);
									})
								}),
								revealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-muted",
									children: c.why
								}) : null
							]
						}, c.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-wrap items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => mark(lesson.id),
					className: cn("inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold", complete ? "bg-moss text-card" : "bg-ink text-paper"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
						"aria-hidden": true,
						className: "size-4"
					}), complete ? "Marked complete" : "Mark complete"]
				}), next ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/lesson/$id",
					params: { id: next.id },
					onClick: () => mark(lesson.id),
					className: "inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card",
					children: ["Next lesson", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
						"aria-hidden": true,
						className: "size-4"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/exam",
					className: "inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card",
					children: ["Take the exam", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
						"aria-hidden": true,
						className: "size-4"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-10 text-xs leading-relaxed text-muted",
				children: [
					"Companion notes to ",
					SOURCE.author,
					", ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: SOURCE.title }),
					", ",
					SOURCE.affiliation,
					" ",
					SOURCE.kind.toLowerCase(),
					" (",
					SOURCE.date,
					"). Not a substitute for the paper."
				]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
			className: "hidden lg:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-24 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-semibold uppercase tracking-[0.14em] text-muted",
						children: [
							index + 1,
							" of ",
							lessons.length
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1",
						children: lessons.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/lesson/$id",
							params: { id: l.id },
							className: cn("block rounded-lg px-2 py-1.5 text-sm", l.id === lesson.id ? "bg-ink text-paper" : "text-muted hover:bg-paper-2 hover:text-ink"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs opacity-70",
									children: l.numeral
								}),
								" ",
								l.title
							]
						}) }, l.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-[0.14em] text-muted",
						children: "Names"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-2 text-sm text-ink/90",
						children: lesson.papers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: p }, p))
					})] }),
					prev ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/lesson/$id",
						params: { id: prev.id },
						className: "inline-flex items-center gap-1 text-sm font-semibold text-copper-deep",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							"aria-hidden": true,
							className: "size-4"
						}), prev.title]
					}) : null
				]
			})
		})]
	});
}
//#endregion
export { LessonPage as component };
