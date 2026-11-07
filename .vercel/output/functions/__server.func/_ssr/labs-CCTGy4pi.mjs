import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as CartesianGrid, c as Tooltip, i as Line, n as YAxis, o as ReferenceDot, r as XAxis, s as ResponsiveContainer, t as ComposedChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/labs-CCTGy4pi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function kvBytes(p) {
	if (p.latentDim != null) return p.layers * p.latentDim * p.seq * p.batch * p.bytes;
	return 2 * p.layers * p.kvHeads * p.dHead * p.seq * p.batch * p.bytes;
}
function decodeIntensity(p) {
	const flops = 2 * p.params * p.batch;
	const bytes = p.params * p.weightBytes + p.kvMoved;
	const oi = bytes > 0 ? flops / bytes : 0;
	return {
		flops,
		bytes,
		oi,
		attained: Math.min(1, p.ridge > 0 ? oi / p.ridge : 0),
		bound: oi >= p.ridge ? "compute" : "memory"
	};
}
/** Independent-token acceptance model used to interpret speculative speedup. */
function speculativeSpeedup(alpha, gamma, draftCost) {
	const a = Math.min(.999, Math.max(.001, alpha));
	const expected = (1 - a ** (gamma + 1)) / (1 - a);
	const cost = draftCost * gamma + 1;
	return {
		expected,
		cost,
		speedup: expected / cost
	};
}
function formatBytes(n) {
	if (!Number.isFinite(n)) return "—";
	const units = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	];
	let v = n;
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i += 1;
	}
	const digits = v >= 100 || i === 0 ? 0 : v >= 10 ? 1 : 2;
	return `${v.toFixed(digits)} ${units[i]}`;
}
var PRESETS = [
	{
		id: "mha",
		label: "8B MHA",
		layers: 32,
		kvHeads: 32,
		dHead: 128,
		params: 8e9
	},
	{
		id: "gqa",
		label: "8B GQA",
		layers: 32,
		kvHeads: 8,
		dHead: 128,
		params: 8e9
	},
	{
		id: "mqa",
		label: "8B MQA",
		layers: 32,
		kvHeads: 1,
		dHead: 128,
		params: 8e9
	},
	{
		id: "70",
		label: "70B GQA",
		layers: 80,
		kvHeads: 8,
		dHead: 128,
		params: 7e10
	}
];
var BYTES = [
	{
		id: 2,
		label: "FP16"
	},
	{
		id: 1,
		label: "INT8"
	},
	{
		id: .5,
		label: "INT4"
	}
];
function Field({ label, value, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-baseline justify-between gap-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tabular font-semibold",
				children: value
			})]
		}), children]
	});
}
function LabsPanel() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "max-w-2xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-[0.16em] text-copper-deep",
						children: "Labs"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-serif text-4xl sm:text-5xl",
						children: "Move the terms the survey names."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-lg text-muted",
						children: "Four teaching models. They follow equations (5)–(8) and the speculative acceptance model. They are not cluster simulators, and the cascade is qualitative on purpose."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KvLab, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RooflineLab, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpecLab, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PagingLab, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CascadeLab, {})
		]
	});
}
function KvLab() {
	const [preset, setPreset] = (0, import_react.useState)("gqa");
	const base = PRESETS.find((p) => p.id === preset) ?? PRESETS[1];
	const [seq, setSeq] = (0, import_react.useState)(8192);
	const [batch, setBatch] = (0, import_react.useState)(8);
	const [bytes, setBytes] = (0, import_react.useState)(2);
	const [mla, setMla] = (0, import_react.useState)(false);
	const [latent, setLatent] = (0, import_react.useState)(512);
	const bytesOut = kvBytes({
		layers: base.layers,
		kvHeads: base.kvHeads,
		dHead: base.dHead,
		seq,
		batch,
		bytes,
		latentDim: mla ? latent : null
	});
	const pct = bytesOut / (80 * 1024 ** 3) * 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "kv",
		className: "scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-3xl",
				children: "KV footprint"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted",
				children: "Equation (5). The leading 2 is K and V. MLA replaces both with one latent, so that factor drops out — the survey’s note in §2.1, not a second copy of the same formula."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-wrap gap-2",
				children: [PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setPreset(p.id),
					className: preset === p.id ? "min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-paper" : "min-h-11 rounded-full border border-line px-4 text-sm font-semibold",
					children: p.label
				}, p.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setMla((v) => !v),
					className: mla ? "min-h-11 rounded-full bg-copper px-4 text-sm font-semibold text-card" : "min-h-11 rounded-full border border-line px-4 text-sm font-semibold",
					children: mla ? "MLA latent on" : "Use MLA latent"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid gap-6 lg:grid-cols-[1fr_16rem]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Sequence length",
							value: seq.toLocaleString(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 256,
								max: 131072,
								step: 256,
								value: seq,
								onChange: (e) => setSeq(Number(e.target.value))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Batch",
							value: String(batch),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 1,
								max: 64,
								value: batch,
								onChange: (e) => setBatch(Number(e.target.value))
							})
						}),
						mla ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Latent width d_c",
							value: String(latent),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 128,
								max: 4096,
								step: 64,
								value: latent,
								onChange: (e) => setLatent(Number(e.target.value))
							})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2 pt-1",
							children: BYTES.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setBytes(b.id),
								className: bytes === b.id ? "min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-paper" : "min-h-11 rounded-full border border-line px-4 text-sm",
								children: b.label
							}, b.label))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl bg-paper px-4 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-[0.14em] text-muted",
							children: "Cache"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-serif text-4xl tabular",
							children: formatBytes(bytesOut)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-muted",
							children: [pct.toFixed(1), "% of an illustrative 80 GB accelerator, cache only — weights not included."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 font-mono text-xs leading-relaxed text-muted",
							children: mla ? `${base.layers} · ${latent} · ${seq} · ${batch} · ${bytes}` : `2 · ${base.layers} · ${base.kvHeads} · ${base.dHead} · ${seq} · ${batch} · ${bytes}`
						})
					]
				})]
			})
		]
	});
}
function RooflineLab() {
	const [batch, setBatch] = (0, import_react.useState)(1);
	const [weightBytes, setWeightBytes] = (0, import_react.useState)(2);
	const [ridge, setRidge] = (0, import_react.useState)(300);
	const [seq, setSeq] = (0, import_react.useState)(4096);
	const point = decodeIntensity({
		params: 8e9,
		weightBytes,
		batch,
		kvMoved: kvBytes({
			layers: 32,
			kvHeads: 8,
			dHead: 128,
			seq,
			batch,
			bytes: Math.min(weightBytes, 2),
			latentDim: null
		}),
		ridge
	});
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setMounted(true), []);
	const data = (0, import_react.useMemo)(() => {
		return [
			.25,
			.5,
			1,
			2,
			4,
			8,
			16,
			32,
			64,
			128,
			256,
			512,
			1024,
			2048
		].map((oi) => ({
			oi,
			roof: Math.min(1, oi / ridge) * 100
		}));
	}, [ridge]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "roofline",
		className: "scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-3xl",
				children: "Roofline"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted",
				children: "An 8B GQA decode step. FLOPs are 2|θ| times batch. Bytes are the weights plus the KV cache from equation (5). The ridge defaults to 300 FLOP/byte, inside the “hundreds” the survey cites. The dot is your decode. Prefill would sit far to the right, on the ceiling."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 h-72 w-full",
				children: mounted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
						data,
						margin: {
							top: 10,
							right: 12,
							left: 0,
							bottom: 8
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-line)",
								vertical: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "oi",
								scale: "log",
								domain: [.2, 2200],
								type: "number",
								tick: {
									fill: "var(--color-muted)",
									fontSize: 12
								},
								tickFormatter: (v) => String(v),
								allowDataOverflow: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								domain: [0, 100],
								tick: {
									fill: "var(--color-muted)",
									fontSize: 12
								},
								tickFormatter: (v) => `${v}%`,
								width: 48
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								formatter: (v) => [`${Number(v ?? 0).toFixed(1)}% of peak`, "Roofline"],
								labelFormatter: (v) => `OI ${v} FLOP/byte`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "roof",
								stroke: "var(--color-ink)",
								strokeWidth: 2,
								dot: false,
								name: "Roofline"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReferenceDot, {
								x: Math.min(2e3, Math.max(point.oi, .25)),
								y: Math.min(100, point.attained * 100),
								r: 7,
								fill: "var(--color-copper)",
								stroke: "var(--color-card)"
							})
						]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full rounded-2xl bg-paper" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Batch",
						value: String(batch),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 1,
							max: 64,
							value: batch,
							onChange: (e) => setBatch(Number(e.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Context in the cache",
						value: seq.toLocaleString(),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 128,
							max: 32768,
							step: 128,
							value: seq,
							onChange: (e) => setSeq(Number(e.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Ridge (FLOP/byte)",
						value: String(ridge),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 50,
							max: 800,
							step: 10,
							value: ridge,
							onChange: (e) => setRidge(Number(e.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Weight dtype"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex gap-2",
						children: BYTES.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setWeightBytes(b.id),
							className: weightBytes === b.id ? "min-h-11 flex-1 rounded-full bg-ink text-sm font-semibold text-paper" : "min-h-11 flex-1 rounded-full border border-line text-sm",
							children: b.label
						}, b.label))
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-semibold tabular",
					children: [point.oi.toFixed(2), " FLOP/byte"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted",
					children: [
						" ",
						"· ",
						point.bound === "memory" ? "memory-bound, under the ridge" : "compute-bound, on the ceiling",
						" ·",
						" ",
						(point.attained * 100).toFixed(1),
						"% of peak compute. At FP16 and batch 1 with a short cache this sits near 1, matching §2.3. A long cache pulls it even lower because KV bytes join the weight traffic."
					]
				})]
			})
		]
	});
}
function SpecLab() {
	const [alpha, setAlpha] = (0, import_react.useState)(.7);
	const [gamma, setGamma] = (0, import_react.useState)(4);
	const [draftCost, setDraftCost] = (0, import_react.useState)(.15);
	const [run, setRun] = (0, import_react.useState)([]);
	const model = speculativeSpeedup(alpha, gamma, draftCost);
	function simulate() {
		const tiles = [];
		for (let i = 0; i < gamma; i += 1) if (Math.random() < alpha) tiles.push("hit");
		else {
			tiles.push("miss");
			tiles.push("fix");
			setRun(tiles);
			return;
		}
		tiles.push("fix");
		setRun(tiles);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "speculative",
		className: "scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-3xl",
				children: "Speculative step"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted",
				children: "Independent acceptance with probability α, draft length γ. Expected tokens per target forward, including the correction sampled from the target, is (1 − α^(γ+1)) / (1 − α). Cost is γ times the draft’s relative cost, plus one verification. This is the textbook reading of τ, not EAGLE’s feature-level drafter."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Acceptance α",
						value: alpha.toFixed(2),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: .05,
							max: .95,
							step: .01,
							value: alpha,
							onChange: (e) => setAlpha(Number(e.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Draft length γ",
						value: String(gamma),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 1,
							max: 8,
							step: 1,
							value: gamma,
							onChange: (e) => setGamma(Number(e.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Draft cost / target",
						value: draftCost.toFixed(2),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 0,
							max: 1,
							step: .01,
							value: draftCost,
							onChange: (e) => setDraftCost(Number(e.target.value))
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.14em] text-muted",
						children: "Expected speedup"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-serif text-4xl tabular",
						children: [model.speedup.toFixed(2), "×"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							model.expected.toFixed(2),
							" tokens / ",
							model.cost.toFixed(2),
							" target-equivalents"
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: simulate,
					className: "min-h-11 rounded-full bg-copper px-5 text-sm font-semibold text-card",
					children: "Run one step"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 flex flex-wrap gap-2",
				"aria-live": "polite",
				children: run.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-sm text-muted",
					children: "A row of draft tiles will appear here."
				}) : run.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: t === "hit" ? "flex h-12 min-w-12 items-center justify-center rounded-xl bg-moss-soft px-3 text-xs font-semibold text-moss" : t === "miss" ? "flex h-12 min-w-12 items-center justify-center rounded-xl bg-paper-2 px-3 text-xs font-semibold text-muted line-through" : "flex h-12 min-w-12 items-center justify-center rounded-xl bg-warn-soft px-3 text-xs font-semibold text-copper-deep",
					children: t === "hit" ? "kept" : t === "miss" ? "drop" : "resample"
				}, `${t}-${i}`))
			})
		]
	});
}
var REQUESTS = [
	{
		name: "A",
		tokens: 48
	},
	{
		name: "B",
		tokens: 180
	},
	{
		name: "C",
		tokens: 920
	},
	{
		name: "D",
		tokens: 64
	}
];
function PagingLab() {
	const [page, setPage] = (0, import_react.useState)(16);
	const max = 2048;
	const reserved = REQUESTS.length * max;
	const used = REQUESTS.reduce((s, r) => s + r.tokens, 0);
	const paged = REQUESTS.reduce((s, r) => s + Math.ceil(r.tokens / page) * page, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "paging",
		className: "scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-3xl",
				children: "Pages versus reservations"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted",
				children: "Four live requests. A static allocator reserves each one out to a 2,048-token maximum. PagedAttention (§6.3) hands out fixed pages as the request grows. Outputs do not change. Only the wasted reservation does."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Page size (tokens)",
				value: String(page),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 8,
					max: 64,
					step: 8,
					value: page,
					onChange: (e) => setPage(Number(e.target.value))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 space-y-3",
				children: REQUESTS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-1 flex justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Request ", r.name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular text-muted",
						children: [r.tokens, " tokens used"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-3 overflow-hidden rounded-full bg-paper-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full rounded-full bg-copper",
						style: { width: `${r.tokens / max * 100}%` }
					})
				})] }, r.name))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-5 grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Reserved contiguous",
						v: reserved.toLocaleString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Actually used",
						v: used.toLocaleString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Paged allocation",
						v: paged.toLocaleString()
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-muted",
				children: [
					"Contiguous reservation holds ",
					((1 - used / reserved) * 100).toFixed(0),
					"% empty. Paging cuts that hole to ",
					((1 - used / paged) * 100).toFixed(0),
					"% internal fragmentation."
				]
			})
		]
	});
}
function Stat({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-paper px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs uppercase tracking-[0.12em] text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "font-serif text-2xl tabular",
			children: v
		})]
	});
}
function CascadeLab() {
	const [dist, setDist] = (0, import_react.useState)(.4);
	const [sparse, setSparse] = (0, import_react.useState)(.35);
	const [quant, setQuant] = (0, import_react.useState)(.45);
	const sum = dist + sparse + quant;
	const total = sum + 6 * dist * sparse * quant;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "cascade",
		className: "scroll-mt-24 rounded-card border border-line bg-card p-4 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-3xl",
				children: "Composed error"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted",
				children: "Figure 3 is qualitative: total error much greater than the sum. The bars below are a teaching sketch of that interaction, not a coefficient from the paper. Each slider is an isolated stage error. The copper bar adds a product term, the way calibration breaks once earlier stages have moved the activations."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Distillation ε",
						value: dist.toFixed(2),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 0,
							max: 1,
							step: .01,
							value: dist,
							onChange: (e) => setDist(Number(e.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Sparsity ε",
						value: sparse.toFixed(2),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 0,
							max: 1,
							step: .01,
							value: sparse,
							onChange: (e) => setSparse(Number(e.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Quantization ε",
						value: quant.toFixed(2),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 0,
							max: 1,
							step: .01,
							value: quant,
							onChange: (e) => setQuant(Number(e.target.value))
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
					label: "Sum of isolated errors",
					width: sum / 4,
					tone: "ink"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
					label: "Stacked pipeline",
					width: total / 4,
					tone: "copper"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "Turn any stage down to zero and the extra term vanishes — one compression, evaluated alone, is exactly the story each paper reports."
			})
		]
	});
}
function Bar({ label, width, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-1 flex justify-between text-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-3 overflow-hidden rounded-full bg-paper-2",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: tone === "ink" ? "h-full rounded-full bg-ink" : "h-full rounded-full bg-copper",
			style: { width: `${Math.min(100, width * 100)}%` }
		})
	})] });
}
function LabsPage() {
	(0, import_react.useEffect)(() => {
		const id = window.location.hash.replace("#", "");
		if (!id) return;
		document.getElementById(id)?.scrollIntoView({ block: "start" });
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LabsPanel, {});
}
//#endregion
export { LabsPage as component };
