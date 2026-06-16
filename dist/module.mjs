//#region src/constants.ts
var MODULE_ID = "codex";
var DEFAULT_RULES = [
	{
		id: "kc-25",
		label: "Cabeça quente",
		color: "#e8b84b",
		icon: "⚔️",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "killCount",
			operator: ">=",
			threshold: 25
		}]
	},
	{
		id: "kc-50",
		label: "Assassino",
		color: "#c9922a",
		icon: "⚔️",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "killCount",
			operator: ">=",
			threshold: 50
		}]
	},
	{
		id: "kc-75",
		label: "Carniceiro",
		color: "#8b1a1a",
		icon: "💀",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "killCount",
			operator: ">=",
			threshold: 75
		}]
	},
	{
		id: "kc-100",
		label: "Sedento por sangue",
		color: "#8b1a1a",
		icon: "💀",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "killCount",
			operator: ">=",
			threshold: 100
		}]
	},
	{
		id: "cr-10",
		label: "Sortudo",
		color: "#4a9e4a",
		icon: "🍀",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "criticals",
			operator: ">=",
			threshold: 10
		}]
	},
	{
		id: "cr-25",
		label: "Abençoado pelo Caio",
		color: "#4a9e4a",
		icon: "✨",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "criticals",
			operator: ">=",
			threshold: 25
		}]
	},
	{
		id: "cr-50",
		label: "Roda da fortuna",
		color: "#4a9e4a",
		icon: "🎡",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "criticals",
			operator: ">=",
			threshold: 50
		}]
	},
	{
		id: "cf-10",
		label: "Aqui travou",
		color: "#666",
		icon: "💥",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "criticalFails",
			operator: ">=",
			threshold: 10
		}]
	},
	{
		id: "cf-25",
		label: "Fã do duo bigode",
		color: "#666",
		icon: "💥",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "criticalFails",
			operator: ">=",
			threshold: 25
		}]
	},
	{
		id: "cf-50",
		label: "Atomizado pelo dado",
		color: "#666",
		icon: "💥",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "criticalFails",
			operator: ">=",
			threshold: 50
		}]
	},
	{
		id: "dt-75",
		label: "Amigo da onça",
		color: "#8b4513",
		icon: "🐆",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "damageTaken",
			operator: ">=",
			threshold: 75
		}]
	},
	{
		id: "dt-250",
		label: "Amigo do dano",
		color: "#8b4513",
		icon: "🛡️",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "damageTaken",
			operator: ">=",
			threshold: 250
		}]
	},
	{
		id: "dt-500",
		label: "Amigo do roteiro",
		color: "#8b4513",
		icon: "📜",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "damageTaken",
			operator: ">=",
			threshold: 500
		}]
	},
	{
		id: "dd-100",
		label: "Bate forte",
		color: "#c9922a",
		icon: "💪",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "damageDealt",
			operator: ">=",
			threshold: 100
		}]
	},
	{
		id: "dd-250",
		label: "Lamina afiada",
		color: "#c9922a",
		icon: "🗡️",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "damageDealt",
			operator: ">=",
			threshold: 250
		}]
	},
	{
		id: "dd-500",
		label: "Vingador",
		color: "#c9922a",
		icon: "⚡",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "damageDealt",
			operator: ">=",
			threshold: 500
		}]
	},
	{
		id: "dd-1000",
		label: "O Catiço",
		color: "#e8b84b",
		icon: "👑",
		scope: "global",
		conditionMode: "all",
		conditions: [{
			stat: "damageDealt",
			operator: ">=",
			threshold: 1e3
		}]
	}
];
//#endregion
//#region src/data/SettingsManager.ts
var SETTINGS_KEY = "codexSettings";
var DEFAULT_SETTINGS = {
	hpPath: "system.attributes.hp.value",
	attackFlavor: "attacking",
	rules: DEFAULT_RULES
};
function registerSettings() {
	game.settings?.register(MODULE_ID, SETTINGS_KEY, {
		scope: "world",
		config: false,
		type: Object,
		default: DEFAULT_SETTINGS
	});
}
function getSettings() {
	const saved = game.settings?.get(MODULE_ID, SETTINGS_KEY);
	return {
		...DEFAULT_SETTINGS,
		...saved
	};
}
async function saveSettings(patch) {
	const current = getSettings();
	await game.settings?.set(MODULE_ID, SETTINGS_KEY, {
		...current,
		...patch
	});
}
function getRules(actorId) {
	const { rules } = getSettings();
	if (!actorId) return rules.filter((r) => r.scope === "global");
	return rules.filter((r) => r.scope === "global" || r.scope === "actor" && r.actorId === actorId);
}
async function saveRule(rule) {
	const { rules } = getSettings();
	await saveSettings({ rules: rules.findIndex((r) => r.id === rule.id) >= 0 ? rules.map((r) => r.id === rule.id ? rule : r) : [...rules, rule] });
}
async function deleteRule(ruleId) {
	const { rules } = getSettings();
	await saveSettings({ rules: rules.filter((r) => r.id !== ruleId) });
}
//#endregion
//#region src/engine/RuleEngine.ts
var RuleEngine = class {
	static evaluateCondition(stats, condition) {
		const value = stats[condition.stat];
		switch (condition.operator) {
			case ">=": return value >= condition.threshold;
			case "<=": return value <= condition.threshold;
			case "==": return value === condition.threshold;
			case ">": return value > condition.threshold;
			case "<": return value < condition.threshold;
			default: return false;
		}
	}
	static evaluateRule(stats, rule) {
		if (rule.conditions.length === 0) return false;
		if (rule.conditionMode === "all") return rule.conditions.every((c) => this.evaluateCondition(stats, c));
		return rule.conditions.some((c) => this.evaluateCondition(stats, c));
	}
	static apply(stats, rules, current) {
		const manual = current.filter((e) => !e.auto);
		const previousRuleIds = new Set(current.filter((e) => e.auto).map((e) => e.ruleId));
		const auto = [];
		const newlyUnlocked = [];
		for (const rule of rules) {
			if (!this.evaluateRule(stats, rule)) continue;
			const epithet = {
				label: rule.label,
				color: rule.color,
				icon: rule.icon,
				auto: true,
				ruleId: rule.id
			};
			auto.push(epithet);
			if (!previousRuleIds.has(rule.id)) newlyUnlocked.push(epithet);
		}
		return {
			epithets: [...manual, ...auto],
			newlyUnlocked
		};
	}
};
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
	return actor.getFlag("codex", "record") ?? EMPTY_RECORD();
}
async function initRecord(actor) {
	if (actor.getFlag("codex", "record")) return;
	await actor.setFlag(MODULE_ID, "record", {
		...EMPTY_RECORD(),
		name: actor.name ?? "",
		img: actor.img ?? ""
	});
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
		const rules = getRules(actor.id ?? "");
		const { epithets, newlyUnlocked } = RuleEngine.apply(updatedStats, rules, current.epithets);
		for (const epithet of newlyUnlocked) ui.notifications?.info(`Codex | ${game.i18n?.format("CODEX.NotifEpithet", { label: epithet.label })}`);
		await actor.setFlag(MODULE_ID, "record", {
			...current,
			stats: updatedStats,
			epithets
		});
	});
}
function enqueue(actor, fn) {
	const id = actor.id ?? "";
	const next = (updateQueue.get(id) ?? Promise.resolve()).then(fn).catch((err) => {
		console.error(`Codex | erro ao atualizar ${actor.name}:`, err);
		ui.notifications?.error(`Codex | Failed to update ${actor.name}. See console for details.`);
	});
	updateQueue.set(id, next);
	return next;
}
//#endregion
//#region src/data/rollUtils.ts
function stripHtml(text) {
	return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function getMessageFlavor(message) {
	const raw = message.flavor;
	if (typeof raw !== "string" || !raw) return "";
	return stripHtml(raw).toLowerCase();
}
function parseRoll(data) {
	if (data instanceof Roll) return data;
	try {
		if (typeof data === "string") return Roll.fromJSON(data);
		if (typeof data === "object" && data !== null) return Roll.fromData(data);
	} catch {
		return null;
	}
	return null;
}
function getMessageRolls(message) {
	const source = message._source?.rolls ?? message.rolls ?? [];
	if (!source?.length) return [];
	return source.map(parseRoll).filter((roll) => roll !== null);
}
function getRollDice(roll) {
	const dice = roll.dice;
	if (dice?.length) return dice;
	return (roll.terms ?? []).filter((term) => typeof term?.faces === "number");
}
function dieResults(die) {
	if (die.results?.length) return die.results.map((r) => r.result ?? r);
	if (typeof die.total === "number") return [die.total];
	return [];
}
function findD20(roll) {
	if (!roll) return void 0;
	return getRollDice(roll).find((d) => d.faces === 20);
}
function isD20Critical(roll) {
	const d20 = findD20(roll);
	if (!d20) return false;
	return dieResults(d20).some((r) => r === 20);
}
function isD20CritFail(roll) {
	const d20 = findD20(roll);
	if (!d20) return false;
	return dieResults(d20).some((r) => r === 1);
}
function isMaxOnMainDie(roll) {
	if (!roll) return false;
	const die = getRollDice(roll)[0] ?? findD20(roll);
	if (!die) return false;
	const faces = die.faces ?? 20;
	return dieResults(die).some((r) => r === faces);
}
function isNatural1OnMainDie(roll) {
	if (!roll) return false;
	const die = getRollDice(roll)[0] ?? findD20(roll);
	if (!die) return false;
	return dieResults(die).some((r) => r === 1);
}
function matchesAttackFlavor(message, attackFlavor) {
	const needle = attackFlavor.trim().toLowerCase();
	if (!needle) return false;
	if (getMessageFlavor(message).includes(needle)) return true;
	return getMessageRolls(message).some((roll) => {
		return (typeof roll.options?.flavor === "string" ? stripHtml(roll.options.flavor).toLowerCase() : "").includes(needle);
	});
}
function getHpDelta(actor, diff, hpPath) {
	const newHp = getNestedValueFromDiff(diff, hpPath);
	if (newHp === void 0) return void 0;
	const oldHp = getNestedValueFromDiff(actor, hpPath);
	if (typeof oldHp !== "number" || typeof newHp !== "number") return void 0;
	const delta = oldHp - newHp;
	return delta > 0 ? delta : void 0;
}
function getNestedValueFromDiff(obj, path) {
	const nested = path.split(".").reduce((acc, key) => acc?.[key], obj);
	if (nested !== void 0) return nested;
	if (obj?.[path] !== void 0) return obj[path];
}
//#endregion
//#region src/data/hooks.ts
function registerHooks() {
	Hooks.on("createChatMessage", async (message) => {
		if (!message.isAuthor) return;
		if (!message.isRoll && !message.rolls?.length) return;
		const actor = getActorFromMessage(message);
		if (!actor?.hasPlayerOwner) return;
		const rolls = getMessageRolls(message);
		if (!rolls.length) return;
		const current = getRecord(actor);
		const attackFlavor = getSettings().attackFlavor;
		if (matchesAttackFlavor(message, attackFlavor)) {
			const attackRoll = rolls[0];
			const damageRoll = rolls[1];
			const isCritical = isD20Critical(attackRoll);
			const isCriticalFail = isD20CritFail(attackRoll);
			const damageDealt = damageRoll?.total ?? 0;
			await updateStats(actor, {
				criticals: current.stats.criticals + (isCritical ? 1 : 0),
				criticalFails: current.stats.criticalFails + (isCriticalFail ? 1 : 0),
				damageDealt: current.stats.damageDealt + damageDealt
			});
			if (isCritical) ui.notifications?.info(`Codex | ${game.i18n?.format("CODEX.NotifCritical", { name: actor.name })}`);
			return;
		}
		const roll = rolls[0];
		const isCritical = isMaxOnMainDie(roll);
		const isCritFail = isNatural1OnMainDie(roll);
		await updateStats(actor, {
			criticals: current.stats.criticals + (isCritical ? 1 : 0),
			criticalFails: current.stats.criticalFails + (isCritFail ? 1 : 0)
		});
		if (isCritical) ui.notifications?.info(`Codex | ${game.i18n?.format("CODEX.NotifCritical", { name: actor.name })}`);
	});
	Hooks.on("updateActor", async (actor, diff) => {
		if (!diff.name && !diff.img) return;
		const current = getRecord(actor);
		await updateRecord(actor, {
			name: actor.name ?? current.name,
			img: actor.img ?? current.img
		});
	});
	Hooks.on("preUpdateActor", (actor, diff) => {
		if (!actor.hasPlayerOwner) return;
		const delta = getHpDelta(actor, diff, getSettings().hpPath);
		if (delta === void 0) return;
		updateStats(actor, { damageTaken: getRecord(actor).stats.damageTaken + delta });
	});
}
function getActorFromMessage(message) {
	const speakerActor = message.speakerActor;
	if (speakerActor) return speakerActor;
	const speakerId = message.speaker?.actor;
	if (speakerId) return game.actors?.get(speakerId) ?? null;
	const tokenId = message.speaker?.token;
	if (tokenId) {
		const token = canvas?.tokens?.get(tokenId);
		if (token?.actor) return token.actor;
	}
	const authorId = typeof message.author === "string" ? message.author : message.author?.id;
	if (authorId) {
		const user = game.users?.get(authorId);
		if (user?.character) return user.character;
	}
	const controlled = canvas?.tokens?.controlled ?? [];
	if (controlled.length === 1 && controlled[0]?.actor) return controlled[0].actor;
	return null;
}
//#endregion
//#region src/ui/panels/StatsPanel.ts
var StatsPanel = class {
	static activate(root, state, signal) {
		root.querySelectorAll(".stat-edit").forEach((el) => {
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
				if (!editing) return;
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
				input.addEventListener("blur", save, {
					once: true,
					signal
				});
				input.addEventListener("keydown", (ev) => {
					if (ev.key === "Enter") input.blur();
					if (ev.key === "Escape") {
						input.style.display = "none";
						display.style.display = "";
					}
				}, {
					once: true,
					signal
				});
			}, { signal });
		});
		root.querySelectorAll("[data-action='reset-stats']").forEach((el) => {
			el.addEventListener("click", async () => {
				const actorId = el.dataset.actorId ?? "";
				const actor = game.actors?.get(actorId);
				if (!actor) return;
				if (!await foundry.applications.api.DialogV2.confirm({
					window: { title: game.i18n?.localize("CODEX.ResetConfirmTitle") || "" },
					content: game.i18n?.format("CODEX.ResetConfirmContent", { name: actor.name }) || ""
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
			}, { signal });
		});
	}
	static refresh(root, actorId, record) {
		const stats = record ?? getRecord(game.actors?.get(actorId));
		const detail = root.querySelector(`[data-detail="${actorId}"]`);
		if (!detail) return;
		detail.querySelectorAll(".stat-edit").forEach((el) => {
			const stat = el.dataset.stat;
			if (!stat) return;
			const li = el.closest("li");
			const display = li?.querySelector(".stat-display");
			const input = li?.querySelector(".stat-input");
			if (display) display.textContent = String(stats.stats[stat]);
			if (input && document.activeElement !== input) input.value = String(stats.stats[stat]);
		});
	}
};
//#endregion
//#region src/ui/dialogs/JournalEntryDialog.ts
var JournalEntryDialog = class {
	static async create(actorId) {
		return this._open({
			title: game.i18n?.localize("CODEX.NewEntryTitle") || "",
			initialTitle: "",
			initialContent: "",
			initialTags: ""
		});
	}
	static async edit(entry) {
		return this._open({
			title: game.i18n?.localize("CODEX.EditEntryTitle") || "",
			initialTitle: entry.title,
			initialContent: entry.content,
			initialTags: entry.tags.join(", ")
		});
	}
	static async _open(opts) {
		const result = await foundry.applications.api.DialogV2.prompt({
			window: { title: opts.title },
			content: `
        <div style="display:flex;flex-direction:column;gap:8px;padding:8px">
          <input id="entry-title" type="text"
            value="${opts.initialTitle}"
            placeholder="${game.i18n?.localize("CODEX.EntryTitlePlaceholder") || ""}"
            style="width:100%"/>
          <textarea id="entry-content" rows="6"
            placeholder="${game.i18n?.localize("CODEX.EntryContentPlaceholder") || ""}"
            style="width:100%;resize:vertical">${opts.initialContent}</textarea>
          <div>
            <label style="font-size:12px;color:#aaa">
              ${game.i18n?.localize("CODEX.EntryTagsLabel") || ""}
            </label>
            <input id="entry-tags" type="text"
              value="${opts.initialTags}"
              placeholder="${game.i18n?.localize("CODEX.EntryTagsPlaceholder") || ""}"
              style="width:100%"/>
          </div>
        </div>
      `,
			ok: {
				label: game.i18n?.localize("CODEX.EntrySave") || "",
				callback: (_e, _btn, dialog) => {
					const el = dialog.element;
					return {
						title: el.querySelector("#entry-title").value.trim(),
						content: el.querySelector("#entry-content").value.trim(),
						tags: el.querySelector("#entry-tags").value.split(",").map((t) => t.trim()).filter(Boolean)
					};
				}
			}
		});
		if (!result) return null;
		return {
			title: result.title || game.i18n?.localize("CODEX.EntryNoTitle") || "",
			content: result.content,
			tags: result.tags
		};
	}
};
//#endregion
//#region src/ui/panels/JournalPanel.ts
var escapeHtml$3 = (value) => foundry.utils.escapeHTML(value);
var JournalPanel = class {
	static activate(root, signal) {
		root.querySelectorAll("[data-action='new-entry']").forEach((el) => {
			el.addEventListener("click", async () => {
				const actorId = el.dataset.actorId ?? "";
				const actor = game.actors?.get(actorId);
				if (!actor) return;
				const result = await JournalEntryDialog.create(actorId);
				if (!result) return;
				const record = getRecord(actor);
				const entry = {
					id: foundry.utils.randomID(),
					createdAt: Date.now(),
					...result
				};
				await updateRecord(actor, { journal: [...record.journal, entry] });
			}, { signal });
		});
		root.querySelectorAll("[data-action='edit-entry']").forEach((el) => {
			el.addEventListener("click", async () => {
				const actorId = el.dataset.actorId ?? "";
				const entryId = el.dataset.entryId ?? "";
				const actor = game.actors?.get(actorId);
				if (!actor) return;
				const record = getRecord(actor);
				const entry = record.journal.find((e) => e.id === entryId);
				if (!entry) return;
				const result = await JournalEntryDialog.edit(entry);
				if (!result) return;
				await updateRecord(actor, { journal: record.journal.map((e) => e.id === entryId ? {
					...e,
					...result
				} : e) });
			}, { signal });
		});
		root.querySelectorAll("[data-action='delete-entry']").forEach((el) => {
			el.addEventListener("click", async () => {
				const actorId = el.dataset.actorId ?? "";
				const entryId = el.dataset.entryId ?? "";
				const actor = game.actors?.get(actorId);
				if (!actor) return;
				if (!await foundry.applications.api.DialogV2.confirm({
					window: { title: game.i18n?.localize("CODEX.DeleteEntryTitle") || "" },
					content: game.i18n?.localize("CODEX.DeleteEntryContent") || ""
				})) return;
				await updateRecord(actor, { journal: getRecord(actor).journal.filter((e) => e.id !== entryId) });
			}, { signal });
		});
	}
	static refresh(root, actorId, record) {
		const journal = record?.journal ?? getRecord(game.actors?.get(actorId)).journal;
		const container = root.querySelector(`[data-detail="${actorId}"] [data-panel="journal"] .codex-entries`);
		if (!container) return;
		if (!journal.length) {
			container.innerHTML = `<p class="codex-empty">${escapeHtml$3(game.i18n?.localize("CODEX.EntryEmpty") ?? "")}</p>`;
			return;
		}
		container.innerHTML = journal.map((entry) => `
      <div class="codex-entry" data-entry-id="${escapeHtml$3(entry.id)}">
        <div class="codex-entry-header">
          <span class="codex-entry-title">${escapeHtml$3(entry.title)}</span>
          <div class="codex-entry-actions">
            <button class="codex-btn-icon" data-action="edit-entry" data-entry-id="${escapeHtml$3(entry.id)}" data-actor-id="${escapeHtml$3(actorId)}">✏️</button>
            <button class="codex-btn-icon" data-action="delete-entry" data-entry-id="${escapeHtml$3(entry.id)}" data-actor-id="${escapeHtml$3(actorId)}">🗑️</button>
          </div>
        </div>
        <p class="codex-entry-content">${escapeHtml$3(entry.content)}</p>
        <div class="codex-entry-tags">
          ${entry.tags.map((tag) => `<span class="codex-tag">${escapeHtml$3(tag)}</span>`).join("")}
        </div>
      </div>
    `).join("");
	}
};
//#endregion
//#region src/ui/panels/EpithetsPanel.ts
var escapeHtml$2 = (value) => foundry.utils.escapeHTML(value);
var EpithetsPanel = class {
	static activate(root, signal) {
		root.querySelectorAll("[data-action='add-epithet']").forEach((el) => {
			el.addEventListener("click", async () => {
				const actorId = el.dataset.actorId ?? "";
				const input = root.querySelector(`.codex-input[data-actor-id="${actorId}"]`);
				const label = input?.value.trim();
				if (!label) return;
				const actor = game.actors?.get(actorId);
				if (!actor) return;
				const record = getRecord(actor);
				if (record.epithets.some((e) => e.label === label)) return;
				const epithet = {
					label,
					auto: false
				};
				await updateRecord(actor, { epithets: [...record.epithets, epithet] });
				input.value = "";
			}, { signal });
		});
		root.querySelectorAll("[data-action='remove-epithet']").forEach((el) => {
			el.addEventListener("click", async () => {
				const actorId = el.dataset.actorId ?? "";
				const label = el.dataset.label ?? "";
				const actor = game.actors?.get(actorId);
				if (!actor) return;
				await updateRecord(actor, { epithets: getRecord(actor).epithets.filter((e) => e.label !== label) });
			}, { signal });
		});
	}
	static refresh(root, actorId, record) {
		const epithets = record?.epithets ?? getRecord(game.actors?.get(actorId)).epithets;
		const list = root.querySelector(`[data-detail="${actorId}"] [data-panel="epithets"] .codex-epithets-list`);
		if (!list) return;
		if (!epithets.length) {
			list.innerHTML = `<p class="codex-empty">${escapeHtml$2(game.i18n?.localize("CODEX.EpithetEmpty") ?? "")}</p>`;
			return;
		}
		list.innerHTML = epithets.map((e) => this._renderRow(e, actorId)).join("");
	}
	static _renderRow(e, actorId) {
		const icon = e.icon ? escapeHtml$2(e.icon) : e.auto ? "🎲" : "✍️";
		const colorAttr = e.color ? ` data-color="${escapeHtml$2(e.color)}"` : "";
		const removeBtn = e.auto ? "" : `
      <button class="codex-btn-icon" data-action="remove-epithet" data-label="${escapeHtml$2(e.label)}" data-actor-id="${escapeHtml$2(actorId)}">🗑️</button>`;
		return `
      <div class="codex-epithet-row">
        <span class="epithet ${e.auto ? "auto" : ""}"${colorAttr}>
          ${icon} ${escapeHtml$2(e.label)}
        </span>
        ${removeBtn}
      </div>`;
	}
};
//#endregion
//#region src/ui/dialogs/RuleEditorDialog.ts
var STATS = [
	"killCount",
	"criticals",
	"criticalFails",
	"damageDealt",
	"damageTaken"
];
var OPS = [
	">=",
	"<=",
	"==",
	">",
	"<"
];
var escapeHtml$1 = (value) => foundry.utils.escapeHTML(value);
var RuleEditorDialog = class {
	static async open(rule, actorId) {
		const isNew = !rule;
		const current = rule ?? {
			id: foundry.utils.randomID(),
			label: "",
			color: "#c9922a",
			icon: "⚔️",
			scope: actorId ? "actor" : "global",
			actorId,
			conditionMode: "all",
			conditions: [{
				stat: "killCount",
				operator: ">=",
				threshold: 1
			}]
		};
		const result = await foundry.applications.api.DialogV2.prompt({
			window: { title: isNew ? "New Epithet Rule" : "Edit Epithet Rule" },
			content: `
        <div class="codex-rule-editor">
          <div class="rule-main-row">
            <input id="rule-icon" class="codex-rule-input" type="text"
              value="${escapeHtml$1(current.icon)}" placeholder="⚔️"/>
            <input id="rule-label" class="codex-rule-input" type="text"
              value="${escapeHtml$1(current.label)}" placeholder="Epithet name"/>
            <input id="rule-color" type="color" value="${escapeHtml$1(current.color)}"/>
          </div>
          <div class="rule-mode-row">
            <label>Conditions match:</label>
            <select id="rule-mode" class="codex-rule-input">
              <option value="all" ${current.conditionMode === "all" ? "selected" : ""}>ALL (AND)</option>
              <option value="any" ${current.conditionMode === "any" ? "selected" : ""}>ANY (OR)</option>
            </select>
          </div>
          <div id="rule-conditions">
            ${current.conditions.map((c, i) => this._conditionRowHTML(c, i)).join("")}
          </div>
          <button type="button" id="add-condition" class="codex-btn codex-btn-dialog">
            + Add Condition
          </button>
        </div>
      `,
			render: (_event, dialog) => {
				this._wireDialog(dialog.element);
			},
			ok: {
				label: "Save",
				callback: (_e, _btn, dialog) => this._readForm(dialog.element)
			}
		});
		if (!result?.label) return null;
		return {
			...current,
			...result
		};
	}
	static _wireDialog(el) {
		el.querySelector("#add-condition")?.addEventListener("click", (e) => {
			e.preventDefault();
			this._addConditionRow(el);
		});
		el.querySelectorAll(".remove-condition").forEach((btn) => {
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				btn.closest(".rule-condition-row")?.remove();
			});
		});
	}
	static _addConditionRow(el) {
		const container = el.querySelector("#rule-conditions");
		if (!container) return;
		const row = document.createElement("div");
		row.innerHTML = this._conditionRowHTML({
			stat: "killCount",
			operator: ">=",
			threshold: 1
		}, 0);
		const element = row.firstElementChild;
		element.querySelector(".remove-condition")?.addEventListener("click", (e) => {
			e.preventDefault();
			element.remove();
		});
		container.appendChild(element);
	}
	static _conditionRowHTML(c, _i) {
		return `
      <div class="rule-condition-row">
        <select class="cond-stat codex-rule-input">
          ${STATS.map((s) => `<option value="${s}" ${c.stat === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <select class="cond-op codex-rule-input">
          ${OPS.map((op) => `<option value="${op}" ${c.operator === op ? "selected" : ""}>${op}</option>`).join("")}
        </select>
        <input class="cond-threshold codex-rule-input" type="number"
          value="${c.threshold}" min="0"/>
        <button type="button" class="codex-btn-icon remove-condition">🗑️</button>
      </div>`;
	}
	static _readForm(el) {
		const label = el.querySelector("#rule-label").value.trim();
		const color = el.querySelector("#rule-color").value;
		const icon = el.querySelector("#rule-icon").value.trim();
		const conditionMode = el.querySelector("#rule-mode").value;
		const conditions = [];
		el.querySelectorAll(".rule-condition-row").forEach((row) => {
			const stat = row.querySelector(".cond-stat").value;
			const operator = row.querySelector(".cond-op").value;
			const threshold = parseInt(row.querySelector(".cond-threshold").value) || 0;
			conditions.push({
				stat,
				operator,
				threshold
			});
		});
		return {
			label,
			color,
			icon,
			conditionMode,
			conditions
		};
	}
};
//#endregion
//#region src/ui/panels/SettingsPanel.ts
var escapeHtml = (value) => foundry.utils.escapeHTML(value);
function formatConditions(rule) {
	return rule.conditions.map((c, i) => {
		const join = i < rule.conditions.length - 1 ? ` ${rule.conditionMode} ` : "";
		return `${c.stat} ${c.operator} ${c.threshold}${join}`;
	}).join("");
}
function renderRuleRow(rule) {
	return `
    <div class="settings-rule-row" data-rule-id="${escapeHtml(rule.id)}">
      <span class="rule-icon">${escapeHtml(rule.icon ?? "")}</span>
      <span class="rule-label" data-color="${escapeHtml(rule.color ?? "")}">${escapeHtml(rule.label)}</span>
      <span class="rule-conditions">${escapeHtml(formatConditions(rule))}</span>
      <div class="rule-actions">
        <button class="codex-btn-icon" data-action="edit-rule" data-rule-id="${escapeHtml(rule.id)}">✎</button>
        <button class="codex-btn-icon" data-action="delete-rule" data-rule-id="${escapeHtml(rule.id)}">🗑️</button>
      </div>
    </div>`;
}
function renderRulesList(rules, emptyMessage) {
	if (!rules.length) return `<p class="codex-empty">${escapeHtml(emptyMessage)}</p>`;
	return rules.map(renderRuleRow).join("");
}
var SettingsPanel = class {
	static activate(root, signal) {
		root.addEventListener("click", (e) => void this._handleClick(root, e), { signal });
	}
	static refresh(root) {
		const settings = getSettings();
		const globalRules = settings.rules.filter((r) => r.scope === "global");
		root.querySelectorAll(".codex-settings-panel").forEach((panel) => {
			const actorId = panel.closest(".codex-detail")?.dataset.detail ?? "";
			const actorRules = settings.rules.filter((r) => r.scope === "actor" && r.actorId === actorId);
			panel.querySelector(".settings-global-rules-list").innerHTML = renderRulesList(globalRules, "No global rules yet.");
			panel.querySelector(".settings-actor-rules-list").innerHTML = renderRulesList(actorRules, "No rules for this character yet.");
			this._syncSystemInputs(panel, settings);
		});
	}
	static _syncSystemInputs(panel, settings) {
		const hpInput = panel.querySelector("[data-setting=\"hpPath\"]");
		const flavorInput = panel.querySelector("[data-setting=\"attackFlavor\"]");
		if (hpInput && document.activeElement !== hpInput) hpInput.value = settings.hpPath;
		if (flavorInput && document.activeElement !== flavorInput) flavorInput.value = settings.attackFlavor;
	}
	static async _handleClick(root, e) {
		const target = e.target.closest("[data-action]");
		if (!target?.closest(".codex-settings-panel")) return;
		switch (target.dataset.action) {
			case "save-system-settings":
				await this._saveSystemSettings(root);
				break;
			case "new-global-rule":
				await this._saveNewRule(root, null);
				break;
			case "new-actor-rule":
				await this._saveNewRule(root, target.dataset.actorId ?? "");
				break;
			case "edit-rule":
				await this._editRule(root, target.dataset.ruleId ?? "");
				break;
			case "delete-rule":
				await this._deleteRule(root, target.dataset.ruleId ?? "");
				break;
		}
	}
	static async _saveSystemSettings(root) {
		const panel = root.querySelector(".codex-settings-panel");
		const hpPath = (panel?.querySelector("[data-setting=\"hpPath\"]"))?.value.trim();
		const attackFlavor = (panel?.querySelector("[data-setting=\"attackFlavor\"]"))?.value.trim();
		if (!hpPath) return;
		await saveSettings({
			hpPath,
			attackFlavor
		});
		this.refresh(root);
		ui.notifications?.info("Codex | Settings saved.");
	}
	static async _saveNewRule(root, actorId) {
		const rule = await RuleEditorDialog.open(null, actorId ?? void 0);
		if (!rule) return;
		await saveRule(rule);
		this.refresh(root);
		ui.notifications?.info("Codex | Rule saved.");
	}
	static async _editRule(root, ruleId) {
		const existing = getSettings().rules.find((r) => r.id === ruleId) ?? null;
		const rule = await RuleEditorDialog.open(existing);
		if (!rule) return;
		await saveRule(rule);
		this.refresh(root);
		ui.notifications?.info("Codex | Rule saved.");
	}
	static async _deleteRule(root, ruleId) {
		if (!await foundry.applications.api.DialogV2.confirm({
			window: { title: "Delete Rule" },
			content: "<p>Delete this epithet rule? Characters who earned it will keep their epithet.</p>"
		})) return;
		await deleteRule(ruleId);
		this.refresh(root);
		ui.notifications?.info("Codex | Rule deleted.");
	}
};
//#endregion
//#region src/ui/CodexApp.ts
var { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
var CodexApp = class extends HandlebarsApplicationMixin(ApplicationV2) {
	_state = {
		activeActorId: "",
		activeTab: "stats"
	};
	_hookId = -1;
	_settingsHookId = -1;
	_abortController = null;
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
		const settings = getSettings();
		const globalRules = settings.rules.filter((r) => r.scope === "global");
		const actors = (game.actors?.contents ?? []).filter((a) => a.hasPlayerOwner).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")).map((a) => ({
			id: a.id ?? "",
			record: getRecord(a),
			actorRules: settings.rules.filter((r) => r.scope === "actor" && r.actorId === a.id)
		}));
		await Promise.all((game.actors?.contents ?? []).filter((a) => a.hasPlayerOwner).map((a) => initRecord(a)));
		return {
			actors,
			isGM: game.user?.isGM ?? false,
			settings,
			globalRules
		};
	}
	async _onRender(context, options) {
		await super._onRender(context, options);
		this._abortController?.abort();
		this._abortController = new AbortController();
		const { signal } = this._abortController;
		const targetId = this._state.activeActorId || this.element.querySelector(".codex-actor-item")?.dataset.actorId || "";
		this._selectActor(targetId);
		this.element.querySelectorAll(".codex-actor-item").forEach((el) => {
			el.addEventListener("click", () => {
				this._state.activeTab = "stats";
				this._selectActor(el.dataset.actorId ?? "");
			}, { signal });
		});
		this.element.querySelectorAll(".codex-tab").forEach((el) => {
			el.addEventListener("click", () => {
				const tab = el.dataset.tab ?? "";
				const detail = el.closest(".codex-detail");
				if (detail) this._switchTab(detail, tab);
			}, { signal });
		});
		StatsPanel.activate(this.element, this._state, signal);
		JournalPanel.activate(this.element, signal);
		EpithetsPanel.activate(this.element, signal);
		if (game.user?.isGM) SettingsPanel.activate(this.element, signal);
		if (this._hookId !== -1) Hooks.off("updateActor", this._hookId);
		this._hookId = Hooks.on("updateActor", (actor) => {
			if (this._state.activeTab === "settings") {
				this._patchActorView(actor.id ?? "");
				return;
			}
			this.render();
		});
		if (this._settingsHookId !== -1) Hooks.off("clientSettingChanged", this._settingsHookId);
		this._settingsHookId = Hooks.on("clientSettingChanged", (module, key) => {
			if (module !== "codex" || key !== "codexSettings") return;
			SettingsPanel.refresh(this.element);
		});
	}
	async _onClose(options) {
		await super._onClose(options);
		this._abortController?.abort();
		if (this._hookId !== -1) Hooks.off("updateActor", this._hookId);
		if (this._settingsHookId !== -1) Hooks.off("clientSettingChanged", this._settingsHookId);
	}
	_patchActorView(actorId) {
		if (!actorId) return;
		const actor = game.actors?.get(actorId);
		if (!actor) return;
		const record = getRecord(actor);
		StatsPanel.refresh(this.element, actorId, record);
		JournalPanel.refresh(this.element, actorId, record);
		EpithetsPanel.refresh(this.element, actorId, record);
		this._patchSidebarActor(actorId, record);
	}
	_patchSidebarActor(actorId, record) {
		const item = this.element.querySelector(`.codex-actor-item[data-actor-id="${actorId}"]`);
		if (!item) return;
		const img = item.querySelector("img");
		const name = item.querySelector("span");
		if (img) img.src = record.img;
		if (name) name.textContent = record.name;
	}
	_selectActor(actorId) {
		this._state.activeActorId = actorId;
		this.element.querySelectorAll(".codex-actor-item").forEach((el) => el.classList.remove("active"));
		this.element.querySelector(`[data-actor-id="${actorId}"]`)?.classList.add("active");
		this.element.querySelectorAll(".codex-detail").forEach((el) => el.style.display = "none");
		const detail = this.element.querySelector(`[data-detail="${actorId}"]`);
		if (detail) {
			detail.style.display = "flex";
			this._switchTab(detail, this._state.activeTab);
		}
	}
	_switchTab(detail, tab) {
		this._state.activeTab = tab;
		detail.querySelectorAll(".codex-tab").forEach((el) => el.classList.remove("active"));
		detail.querySelector(`[data-tab="${tab}"]`)?.classList.add("active");
		detail.querySelectorAll(".codex-panel").forEach((el) => el.style.display = "none");
		const panel = detail.querySelector(`[data-panel="${tab}"]`);
		if (panel) panel.style.display = "block";
	}
};
//#endregion
//#region src/module.ts
Hooks.once("init", () => {
	console.log(`${MODULE_ID} | init`);
	registerSettings();
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