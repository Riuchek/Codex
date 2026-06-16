//#region src/constants.ts
var MODULE_ID = "codex";
function getNestedValue(obj, path) {
	return path.split(".").reduce((acc, key) => acc?.[key], obj);
}
var EPITHET_RULES = [
	{
		threshold: 25,
		label: "Cabeça quente",
		stat: "killCount"
	},
	{
		threshold: 50,
		label: "Assassino",
		stat: "killCount"
	},
	{
		threshold: 75,
		label: "Carniceiro",
		stat: "killCount"
	},
	{
		threshold: 100,
		label: "Sedento por sangue",
		stat: "killCount"
	},
	{
		threshold: 10,
		label: "Sortudo",
		stat: "criticals"
	},
	{
		threshold: 25,
		label: "Abençoado pelo Caio",
		stat: "criticals"
	},
	{
		threshold: 50,
		label: "Roda da fortuna",
		stat: "criticals"
	},
	{
		threshold: 10,
		label: "Aqui travou",
		stat: "criticalFails"
	},
	{
		threshold: 25,
		label: "Fã do duo bigode",
		stat: "criticalFails"
	},
	{
		threshold: 50,
		label: "Atomizado pelo dado",
		stat: "criticalFails"
	},
	{
		threshold: 75,
		label: "Amigo da onça",
		stat: "damageTaken"
	},
	{
		threshold: 250,
		label: "Amigo do dano",
		stat: "damageTaken"
	},
	{
		threshold: 500,
		label: "Amigo do roteiro",
		stat: "damageTaken"
	},
	{
		threshold: 100,
		label: "Bate forte",
		stat: "damageDealt"
	},
	{
		threshold: 250,
		label: "Lamina afiada",
		stat: "damageDealt"
	},
	{
		threshold: 500,
		label: "Vingador",
		stat: "damageDealt"
	},
	{
		threshold: 1e3,
		label: "O Catiço",
		stat: "damageDealt"
	}
];
//#endregion
//#region src/data/ActorRecord.ts
var updateQueue = /* @__PURE__ */ new Map();
var EMPTY_RECORD = () => ({
	name: "",
	img: "",
	stats: {
		damageDealt: 0,
		damageTaken: 0,
		criticals: 0,
		criticalFails: 0,
		killCount: 0
	},
	epithets: [],
	journal: []
});
function getRecord(actor) {
	const existing = actor.getFlag(MODULE_ID, "record");
	if (!existing) {
		const fresh = {
			...EMPTY_RECORD(),
			name: actor.name ?? "",
			img: actor.img ?? ""
		};
		actor.setFlag(MODULE_ID, "record", fresh);
		return fresh;
	}
	return existing;
}
async function updateRecord(actor, patch) {
	return enqueue(actor, async () => {
		const current = getRecord(actor);
		await actor.setFlag(MODULE_ID, "record", {
			...current,
			...patch
		});
	});
}
async function updateStats(actor, patch) {
	return enqueue(actor, async () => {
		const current = getRecord(actor);
		const updatedStats = {
			...current.stats,
			...patch
		};
		const newEpithets = checkEpithetRules(updatedStats, current.epithets);
		await actor.setFlag(MODULE_ID, "record", {
			...current,
			stats: updatedStats,
			epithets: newEpithets
		});
	});
}
function enqueue(actor, fn) {
	const id = actor.id ?? "";
	const next = (updateQueue.get(id) ?? Promise.resolve()).then(fn).catch((err) => {
		console.error(`Codex | erro ao atualizar ${actor.name}:`, err);
	});
	updateQueue.set(id, next);
	return next;
}
function checkEpithetRules(stats, current) {
	const manual = current.filter((e) => !e.auto);
	const auto = [];
	for (const rule of EPITHET_RULES) if (stats[rule.stat] >= rule.threshold) auto.push({
		label: rule.label,
		auto: true
	});
	const previous = new Set(current.filter((e) => e.auto).map((e) => e.label));
	for (const epithet of auto) if (!previous.has(epithet.label)) ui.notifications?.info(`Codex | Nova alcunha desbloqueada: ${epithet.label}!`);
	return [...manual, ...auto];
}
//#endregion
//#region src/data/hooks.ts
function registerHooks() {
	Hooks.on("createChatMessage", async (message) => {
		if (!message.isRoll) return;
		const actor = getActorFromMessage(message);
		if (!actor) return;
		const current = getRecord(actor);
		const flavor = message.flavor?.toLowerCase() ?? "";
		const attackFlavor = (game.settings?.get("codex", "attackFlavor") ?? "attacking").toLowerCase();
		if (flavor.includes(attackFlavor)) {
			const attackRoll = message.rolls?.[0];
			const damageRoll = message.rolls?.[1];
			const d20 = attackRoll?.dice.find((d) => d.faces === 20);
			const isCritical = d20?.total === 20;
			const isCriticalFail = d20?.total === 1;
			const damageDealt = damageRoll?.total ?? 0;
			await updateStats(actor, {
				criticals: current.stats.criticals + (isCritical ? 1 : 0),
				criticalFails: current.stats.criticalFails + (isCriticalFail ? 1 : 0),
				damageDealt: current.stats.damageDealt + damageDealt
			});
			if (isCritical) ui.notifications?.info(`Codex | ${game.i18n?.format("CODEX.NotifCritical", { name: actor.name })}`);
			return;
		}
		const roll = message.rolls?.[0];
		if (!roll) return;
		const mainDie = roll.dice[0];
		const total = mainDie?.total ?? 0;
		const isCritical = total === (mainDie?.faces ?? 20);
		const isCritFail = total === 1;
		await updateStats(actor, {
			criticals: current.stats.criticals + (isCritical ? 1 : 0),
			criticalFails: current.stats.criticalFails + (isCritFail ? 1 : 0)
		});
		if (isCritical) ui.notifications?.info(`Codex | ${game.i18n?.format("CODEX.NotifCritical", { name: actor.name })}`);
	});
	Hooks.on("updateActor", async (actor, diff) => {
		if (!diff.name && !diff.img) return;
		const current = getRecord(actor);
		await actor.setFlag(MODULE_ID, "record", {
			...current,
			name: actor.name ?? current.name,
			img: actor.img ?? current.img
		});
	});
	Hooks.on("preUpdateActor", (actor, diff) => {
		const hpPath = game.settings?.get("codex", "hpPath") ?? "system.attributes.hp.value";
		const newHp = getNestedValue(diff, hpPath);
		if (newHp === void 0) return;
		const oldHp = getNestedValue(actor, hpPath);
		if (oldHp === void 0) return;
		const delta = oldHp - newHp;
		if (delta <= 0) return;
		handleDamageTaken(actor, delta);
	});
	async function handleDamageTaken(actor, delta) {
		await updateStats(actor, { damageTaken: getRecord(actor).stats.damageTaken + delta });
	}
}
function getActorFromMessage(message) {
	const speakerId = message.speaker?.actor;
	if (speakerId) return game.actors?.get(speakerId) ?? null;
	const tokenId = message.speaker?.token;
	if (tokenId) return (canvas?.tokens?.get(tokenId))?.actor ?? null;
	return null;
}
//#endregion
//#region src/ui/CodexApp.ts
var { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
var CodexApp = class extends HandlebarsApplicationMixin(ApplicationV2) {
	_hookId = -1;
	_activeActorId = "";
	_activeTab = "stats";
	static DEFAULT_OPTIONS = {
		id: "codex-app",
		window: {
			title: "Codex",
			resizable: true
		},
		position: {
			width: 720,
			height: 560
		}
	};
	static PARTS = { main: { template: `modules/${MODULE_ID}/templates/codex.html` } };
	async _prepareContext(_options) {
		return {
			actors: (game.actors?.contents ?? []).filter((a) => a.hasPlayerOwner).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")).map((a) => ({
				id: a.id ?? "",
				record: getRecord(a)
			})),
			isGM: game.user?.isGM ?? false
		};
	}
	async _onRender(context, options) {
		await super._onRender(context, options);
		const targetId = this._activeActorId || this.element.querySelector(".codex-actor-item")?.dataset.actorId || "";
		this._selectActor(targetId);
		this.element.querySelectorAll("[data-action='reset-stats']").forEach((el) => {
			el.addEventListener("click", async () => {
				const actorId = el.dataset.actorId ?? "";
				const actor = game.actors?.get(actorId);
				if (!actor) return;
				if (!await foundry.applications.api.DialogV2.confirm({
					window: { title: game.i18n?.localize("CODEX.ResetConfirmTitle") },
					content: game.i18n?.format("CODEX.ResetConfirmContent", { name: actor.name })
				})) return;
				await updateRecord(actor, {
					stats: {
						damageDealt: 0,
						damageTaken: 0,
						criticals: 0,
						criticalFails: 0,
						killCount: 0
					},
					epithets: getRecord(actor).epithets.filter((e) => !e.auto)
				});
			});
		});
		this.element.querySelectorAll(".codex-actor-item").forEach((el) => {
			el.addEventListener("click", () => {
				const id = el.dataset.actorId ?? "";
				this._activeTab = "stats";
				this._selectActor(id);
			});
		});
		this.element.querySelectorAll(".codex-tab").forEach((el) => {
			el.addEventListener("click", () => {
				const tab = el.dataset.tab ?? "";
				const detail = el.closest(".codex-detail");
				if (detail) this._switchTab(detail, tab);
			});
		});
		this.element.querySelectorAll("[data-action='new-entry']").forEach((el) => {
			el.addEventListener("click", () => {
				const actorId = el.dataset.actorId ?? "";
				this._newJournalEntry(actorId);
			});
		});
		this.element.querySelectorAll("[data-action='edit-entry']").forEach((el) => {
			el.addEventListener("click", () => {
				const actorId = el.dataset.actorId ?? "";
				const entryId = el.dataset.entryId ?? "";
				this._editJournalEntry(actorId, entryId);
			});
		});
		this.element.querySelectorAll("[data-action='delete-entry']").forEach((el) => {
			el.addEventListener("click", () => {
				const actorId = el.dataset.actorId ?? "";
				const entryId = el.dataset.entryId ?? "";
				this._deleteJournalEntry(actorId, entryId);
			});
		});
		this.element.querySelectorAll("[data-action='add-epithet']").forEach((el) => {
			el.addEventListener("click", () => {
				const actorId = el.dataset.actorId ?? "";
				const input = this.element.querySelector(`.codex-input[data-actor-id="${actorId}"]`);
				if (input?.value.trim()) {
					this._addEpithet(actorId, input.value.trim());
					input.value = "";
				}
			});
		});
		this.element.querySelectorAll("[data-action='remove-epithet']").forEach((el) => {
			el.addEventListener("click", () => {
				const actorId = el.dataset.actorId ?? "";
				const label = el.dataset.label ?? "";
				this._removeEpithet(actorId, label);
			});
		});
		this.element.querySelectorAll(".stat-edit").forEach((el) => {
			el.addEventListener("click", (e) => {
				e.stopPropagation();
				const li = el.closest("li");
				const display = li.querySelector(".stat-display");
				const input = li.querySelector(".stat-input");
				const actorId = el.dataset.actorId ?? "";
				const stat = el.dataset.stat ?? "";
				const editing = input.style.display === "none";
				display.style.display = editing ? "none" : "";
				input.style.display = editing ? "" : "none";
				if (editing) {
					input.focus();
					input.select();
					const save = async () => {
						const val = parseInt(input.value) || 0;
						const actor = game.actors?.get(actorId);
						if (!actor) return;
						await updateStats(actor, {
							...getRecord(actor).stats,
							[stat]: val
						});
					};
					input.addEventListener("blur", save, { once: true });
					input.addEventListener("keydown", (ev) => {
						if (ev.key === "Enter") input.blur();
						if (ev.key === "Escape") {
							input.style.display = "none";
							display.style.display = "";
						}
					}, { once: true });
				}
			});
		});
		if (this._hookId !== -1) Hooks.off("updateActor", this._hookId);
		this._hookId = Hooks.on("updateActor", () => {
			this.render();
		});
	}
	async _onClose(options) {
		await super._onClose(options);
		if (this._hookId !== -1) Hooks.off("updateActor", this._hookId);
	}
	_selectActor(actorId, tab) {
		this._activeActorId = actorId;
		this.element.querySelectorAll(".codex-actor-item").forEach((el) => el.classList.remove("active"));
		this.element.querySelector(`[data-actor-id="${actorId}"]`)?.classList.add("active");
		this.element.querySelectorAll(".codex-detail").forEach((el) => el.style.display = "none");
		const detail = this.element.querySelector(`[data-detail="${actorId}"]`);
		if (detail) {
			detail.style.display = "flex";
			this._switchTab(detail, tab ?? this._activeTab);
		}
	}
	_switchTab(detail, tab) {
		this._activeTab = tab;
		detail.querySelectorAll(".codex-tab").forEach((el) => el.classList.remove("active"));
		detail.querySelector(`[data-tab="${tab}"]`)?.classList.add("active");
		detail.querySelectorAll(".codex-panel").forEach((el) => el.style.display = "none");
		const panel = detail.querySelector(`[data-panel="${tab}"]`);
		if (panel) panel.style.display = "block";
	}
	async _newJournalEntry(actorId) {
		const actor = game.actors?.get(actorId);
		if (!actor) return;
		const result = await foundry.applications.api.DialogV2.prompt({
			window: { title: game.i18n?.localize("CODEX.NewEntryTitle") },
			content: `
        <div style="display:flex;flex-direction:column;gap:8px;padding:8px">
          <input id="entry-title" type="text" placeholder="${game.i18n?.localize("CODEX.EntryTitlePlaceholder")}" style="width:100%"/>
          <textarea id="entry-content" rows="6" placeholder="${game.i18n?.localize("CODEX.EntryContentPlaceholder")}" style="width:100%;resize:vertical"></textarea>
          <div>
            <label style="font-size:12px;color:#aaa">${game.i18n?.localize("CODEX.EntryTagsLabel")}</label>
            <input id="entry-tags" type="text" placeholder="${game.i18n?.localize("CODEX.EntryTagsPlaceholder")}" style="width:100%"/>
          </div>
        </div>
      `,
			ok: {
				label: game.i18n?.localize("CODEX.EntrySave"),
				callback: (_event, _btn, dialog) => {
					const el = dialog.element;
					return {
						title: el.querySelector("#entry-title").value.trim(),
						content: el.querySelector("#entry-content").value.trim(),
						tags: el.querySelector("#entry-tags").value.split(",").map((t) => t.trim()).filter(Boolean)
					};
				}
			}
		});
		if (!result?.title && !result?.content) return;
		const record = getRecord(actor);
		const entry = {
			id: foundry.utils.randomID(),
			title: result.title ?? game.i18n?.localize("CODEX.EntryNoTitle") ?? "",
			content: result.content,
			createdAt: Date.now(),
			tags: result.tags
		};
		await updateRecord(actor, { journal: [...record.journal, entry] });
		this.render();
	}
	async _editJournalEntry(actorId, entryId) {
		const actor = game.actors?.get(actorId);
		if (!actor) return;
		const record = getRecord(actor);
		const entry = record.journal.find((e) => e.id === entryId);
		if (!entry) return;
		const result = await foundry.applications.api.DialogV2.prompt({
			window: { title: "Editar entrada" },
			content: `
        <div style="display:flex;flex-direction:column;gap:8px;padding:8px">
          <input id="entry-title" type="text" value="${entry.title}" style="width:100%"/>
          <textarea id="entry-content" rows="6" style="width:100%;resize:vertical">${entry.content}</textarea>
          <input id="entry-tags" type="text" value="${entry.tags.join(", ")}" style="width:100%"/>
        </div>
      `,
			ok: {
				label: "Salvar",
				callback: (_event, _btn, dialog) => {
					const el = dialog.element;
					return {
						title: el.querySelector("#entry-title").value.trim(),
						content: el.querySelector("#entry-content").value.trim(),
						tags: el.querySelector("#entry-tags").value.split(",").map((t) => t.trim()).filter(Boolean)
					};
				}
			}
		});
		if (!result) return;
		await updateRecord(actor, { journal: record.journal.map((e) => e.id === entryId ? {
			...e,
			...result
		} : e) });
		this.render();
	}
	async _deleteJournalEntry(actorId, entryId) {
		const actor = game.actors?.get(actorId);
		if (!actor) return;
		if (!await foundry.applications.api.DialogV2.confirm({
			window: { title: game.i18n?.localize("CODEX.DeleteEntryTitle") },
			content: game.i18n?.format("CODEX.DeleteEntryContent", { name: actor.name })
		})) return;
		await updateRecord(actor, { journal: getRecord(actor).journal.filter((e) => e.id !== entryId) });
		this.render();
	}
	async _addEpithet(actorId, label) {
		const actor = game.actors?.get(actorId);
		if (!actor) return;
		const record = getRecord(actor);
		if (record.epithets.some((e) => e.label === label)) return;
		await updateRecord(actor, { epithets: [...record.epithets, {
			label,
			auto: false
		}] });
		this.render();
	}
	async _removeEpithet(actorId, label) {
		const actor = game.actors?.get(actorId);
		if (!actor) return;
		await updateRecord(actor, { epithets: getRecord(actor).epithets.filter((e) => e.label !== label) });
		this.render();
	}
};
//#endregion
//#region src/module.ts
Hooks.once("init", () => {
	console.log(`${MODULE_ID} | init`);
	game.settings?.register(MODULE_ID, "hpPath", {
		name: "CODEX.SettingHpPath",
		hint: "CODEX.SettingHpPathHint",
		scope: "world",
		config: true,
		type: String,
		default: "system.attributes.hp.value"
	});
	game.settings?.register(MODULE_ID, "attackFlavor", {
		name: "CODEX.SettingAttackFlavor",
		hint: "CODEX.SettingAttackFlavorHint",
		scope: "world",
		config: true,
		type: String,
		default: "attacking"
	});
});
Hooks.once("ready", () => {
	console.log(`${MODULE_ID} | ready`);
	registerHooks();
});
Hooks.on("renderSceneControls", (_app, html) => {
	const menu = html.querySelector("menu[data-application-part='layers']");
	if (!menu) return;
	if (menu.querySelector("[data-control='codex']")) return;
	const li = document.createElement("li");
	const btn = document.createElement("button");
	btn.type = "button";
	btn.classList.add("control", "ui-control", "layer", "icon", "fa-solid", "fa-book");
	btn.dataset.control = "codex";
	btn.setAttribute("aria-label", "Codex");
	btn.setAttribute("data-tooltip", "Codex");
	btn.addEventListener("click", () => new CodexApp().render(true));
	li.appendChild(btn);
	menu.appendChild(li);
});
//#endregion

//# sourceMappingURL=module.mjs.map