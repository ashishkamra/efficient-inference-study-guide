import { S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as useProgress, i as glossary, n as cn, o as lessons, t as SOURCE } from "./cn-DRvXy5YS.mjs";
import { o as Check, r as Play, s as ArrowRight } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C3pA55Ez.js
var import_jsx_runtime = require_jsx_runtime();
var tutorials = lessons.filter((l) => l.video);
function Home() {
	const complete = useProgress((s) => s.complete);
	const next = lessons.find((l) => !complete.includes(l.id)) ?? lessons[0];
	const pct = Math.round(complete.length / lessons.length * 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid items-end gap-8 border-b border-line pb-8 lg:grid-cols-[1.4fr_0.8fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-semibold uppercase tracking-[0.18em] text-copper-deep",
						children: ["Area exam companion · ", SOURCE.id]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 max-w-xl font-serif text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl",
						children: "Study the full stack of efficient LLM inference."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 max-w-xl text-lg text-muted",
						children: [
							"Nine lessons, five visual tutorials, and four labs built from ",
							SOURCE.author,
							"’s survey. The organizing idea is a four-pillar taxonomy aimed at four physical bottlenecks."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-wrap items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/lesson/$id",
							params: { id: next.id },
							className: "inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-sm font-semibold text-card",
							children: [complete.length === 0 ? "Start the path" : `Continue · ${next.title}`, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								"aria-hidden": true,
								className: "size-4"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/labs",
							className: "inline-flex min-h-11 items-center rounded-full border border-line bg-card px-5 text-sm font-semibold text-ink",
							children: "Open the labs"
						})]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "rounded-card border border-line bg-card p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-[0.14em] text-muted",
							children: "Source"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 font-serif text-2xl leading-tight",
							children: SOURCE.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-muted",
							children: [
								SOURCE.author,
								", ",
								SOURCE.affiliation,
								". ",
								SOURCE.kind,
								", ",
								SOURCE.date,
								". Committee:",
								" ",
								SOURCE.committee,
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: SOURCE.url,
							className: "mt-3 inline-flex text-sm font-semibold text-copper-deep underline decoration-line underline-offset-4",
							children: "Read the area exam PDF"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-baseline justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: "Path progress"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular font-semibold",
									children: [
										complete.length,
										"/",
										lessons.length
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 h-1.5 overflow-hidden rounded-full bg-paper-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-copper",
									style: { width: `${pct}%` }
								})
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-3xl",
					children: "Visual tutorials"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Ten seconds each. The narration sits under the player."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5",
				children: tutorials.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/lesson/$id",
					params: { id: l.id },
					className: "group block overflow-hidden rounded-card border border-line bg-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "relative block bg-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: l.video?.src.replace(/\.mp4$/, ".jpg"),
							alt: "",
							className: "aspect-video w-full object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-full bg-ink/80 text-card",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								"aria-hidden": true,
								className: "size-3.5"
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block px-3 py-3 text-sm font-medium text-ink",
						children: l.video?.title.replace("Visual tutorial · ", "")
					})]
				}) }, l.id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-3xl",
					children: "The path"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-2xl text-muted",
					children: "Follow the survey’s own order. Each lesson ends with two checks. The exam at the end mixes all nine."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-5 divide-y divide-line overflow-hidden rounded-card border border-line bg-card",
					children: lessons.map((l) => {
						const done = complete.includes(l.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/lesson/$id",
							params: { id: l.id },
							className: "flex items-center gap-4 px-4 py-4 hover:bg-paper sm:px-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("flex size-10 shrink-0 items-center justify-center rounded-full border font-mono text-xs", done ? "border-moss bg-moss-soft text-moss" : "border-line bg-paper text-muted"),
									children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										"aria-hidden": true,
										className: "size-4"
									}) : l.numeral
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-xs font-semibold uppercase tracking-[0.12em] text-muted",
										children: l.kicker
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block truncate font-serif text-xl",
										children: l.title
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "hidden text-sm text-muted sm:inline",
									children: [l.minutes, " min"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
									"aria-hidden": true,
									className: "size-4 text-muted"
								})
							]
						}) }, l.id);
					})
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-8 lg:grid-cols-[0.9fr_1.1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-serif text-3xl",
						children: "Four bottlenecks"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-muted",
						children: "Table 1 of the survey. Every technique in the path is indexed by which of these it moves."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-3",
						children: [
							[
								"Capacity",
								"How many users fit",
								"Pillars 1, 3, 4"
							],
							[
								"Bandwidth",
								"How fast one user is served",
								"Pillars 1, 2, 4"
							],
							[
								"Compute",
								"Prefill and large-batch decode",
								"Pillars 2, 3"
							],
							[
								"Interconnect",
								"Sharding and phase splitting",
								"Pillar 4"
							]
						].map(([name, line, who]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-card border border-line bg-card px-4 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-serif text-xl",
									children: name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: line
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-copper-deep",
									children: who
								})
							]
						}, name))
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-serif text-3xl",
						children: "Glossary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-muted",
						children: "Short definitions in the survey’s own terms."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
						className: "mt-4 max-h-[28rem] space-y-3 overflow-auto pr-1",
						children: glossary.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-b border-line pb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "font-semibold",
								children: g.term
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "text-sm text-muted",
								children: g.def
							})]
						}, g.term))
					})
				] })]
			})
		]
	});
}
//#endregion
export { Home as component };
