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
		const newEpithets = checkEpithetRules(updatedStats, current.epithets, actor.id ?? "");
		await actor.setFlag(MODULE_ID, "record", {
			...current,
			stats: updatedStats,
			epithets: newEpithets
		});
	});
}
async function incrementStats(actor, delta) {
	return enqueue(actor, async () => {
		const current = getRecord(actor);
		const updatedStats = { ...current.stats };
		for (const key of Object.keys(delta)) {
			const amount = delta[key];
			if (typeof amount === "number" && amount !== 0) updatedStats[key] += amount;
		}
		const newEpithets = checkEpithetRules(updatedStats, current.epithets, actor.id ?? "");
		await actor.setFlag(MODULE_ID, "record", {
			...current,
			stats: updatedStats,
			epithets: newEpithets
		});
	});
}
async function refreshEpithets(actor) {
	return enqueue(actor, async () => {
		const current = getRecord(actor);
		const newEpithets = checkEpithetRules(current.stats, current.epithets, actor.id ?? "");
		await actor.setFlag(MODULE_ID, "record", {
			...current,
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
function evaluateCondition(stats, condition) {
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
function evaluateRule(stats, rule) {
	if (rule.conditions.length === 0) return false;
	if (rule.conditionMode === "all") return rule.conditions.every((c) => evaluateCondition(stats, c));
	return rule.conditions.some((c) => evaluateCondition(stats, c));
}
function checkEpithetRules(stats, current, actorId) {
	const rules = getRules(actorId);
	const auto = [];
	for (const rule of rules) if (evaluateRule(stats, rule)) auto.push({
		label: rule.label,
		color: rule.color,
		icon: rule.icon,
		auto: true,
		ruleId: rule.id
	});
	const autoLabels = new Set(auto.map((e) => e.label));
	const manual = current.filter((e) => !e.auto && !autoLabels.has(e.label));
	const previous = new Set(current.filter((e) => e.auto).map((e) => e.ruleId));
	for (const epithet of auto) if (!previous.has(epithet.ruleId)) ui.notifications?.info(`Codex | ${game.i18n?.format("CODEX.NotifEpithet", { label: epithet.label })}`);
	return [...manual, ...auto];
}
//#endregion
//#region src/data/trackingActor.ts
var trackingActorId = "";
function setTrackingActorId(id) {
	trackingActorId = id;
}
function getTrackingActor() {
	if (!trackingActorId) return null;
	return game.actors?.get(trackingActorId) ?? null;
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
	const die = getRollDice(roll)[0] ?? findD20(roll);
	if (!die) return false;
	const faces = die.faces ?? 20;
	return dieResults(die).some((r) => r === faces);
}
function isNatural1OnMainDie(roll) {
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
		const attackFlavor = getSettings().attackFlavor;
		if (matchesAttackFlavor(message, attackFlavor)) {
			const attackRoll = rolls[0];
			const damageRoll = rolls[1];
			const isCritical = isD20Critical(attackRoll);
			const isCriticalFail = isD20CritFail(attackRoll);
			const damageDealt = damageRoll?.total ?? 0;
			await incrementStats(actor, {
				criticals: isCritical ? 1 : 0,
				criticalFails: isCriticalFail ? 1 : 0,
				damageDealt
			});
			if (isCritical) ui.notifications?.info(`Codex | ${game.i18n?.format("CODEX.NotifCritical", { name: actor.name })}`);
			return;
		}
		const roll = rolls[0];
		const isCritical = isMaxOnMainDie(roll);
		const isCritFail = isNatural1OnMainDie(roll);
		await incrementStats(actor, {
			criticals: isCritical ? 1 : 0,
			criticalFails: isCritFail ? 1 : 0
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
		if (!actor.hasPlayerOwner) return;
		const delta = getHpDelta(actor, diff, getSettings().hpPath);
		if (delta === void 0) return;
		incrementStats(actor, { damageTaken: delta });
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
	return getTrackingActor();
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
		const settings = getSettings();
		const globalRules = settings.rules.filter((r) => r.scope === "global");
		return {
			actors: (game.actors?.contents ?? []).filter((a) => a.hasPlayerOwner).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")).map((a) => ({
				id: a.id ?? "",
				record: getRecord(a),
				actorRules: settings.rules.filter((r) => r.scope === "actor" && r.actorId === a.id)
			})),
			isGM: game.user?.isGM ?? false,
			settings,
			globalRules
		};
	}
	async _onRender(context, options) {
		await super._onRender(context, options);
		const targetId = this._activeActorId || this.element.querySelector(".codex-actor-item")?.dataset.actorId || "";
		this._selectActor(targetId);
		this.element.querySelectorAll(".rule-label[data-color]").forEach((el) => {
			const color = el.dataset.color;
			if (color) el.style.color = color;
		});
		this.element.querySelectorAll(".epithet[data-color]").forEach((el) => {
			const color = el.dataset.color;
			if (!color) return;
			el.style.color = color;
			el.style.borderColor = color;
		});
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
		this.element.querySelectorAll("[data-action='save-system-settings']").forEach((el) => {
			el.addEventListener("click", async () => {
				const settingsPanel = el.closest("[data-panel='settings']");
				const hpPath = settingsPanel?.querySelector("[data-setting='hpPath']")?.value.trim() ?? "";
				const attackFlavor = settingsPanel?.querySelector("[data-setting='attackFlavor']")?.value.trim() ?? "";
				if (hpPath) await saveSettings({
					hpPath,
					attackFlavor
				});
				ui.notifications?.info("Codex | Settings saved.");
			});
		});
		this.element.querySelectorAll("[data-action='new-global-rule'], [data-action='new-actor-rule']").forEach((el) => {
			el.addEventListener("click", () => {
				const actorId = el.dataset.actorId;
				this._openRuleEditor(null, actorId || void 0);
			});
		});
		this.element.querySelectorAll("[data-action='edit-rule']").forEach((el) => {
			el.addEventListener("click", () => {
				const ruleId = el.dataset.ruleId ?? "";
				const rule = getSettings().rules.find((r) => r.id === ruleId) ?? null;
				this._openRuleEditor(rule);
			});
		});
		this.element.querySelectorAll("[data-action='delete-rule']").forEach((el) => {
			el.addEventListener("click", async () => {
				const ruleId = el.dataset.ruleId ?? "";
				const rule = getSettings().rules.find((r) => r.id === ruleId);
				if (!await foundry.applications.api.DialogV2.confirm({
					window: { title: "Delete Rule" },
					content: "<p>Delete this epithet rule? Characters who earned it will keep their epithet.</p>"
				})) return;
				await deleteRule(ruleId);
				await this._refreshRuleActors(rule?.scope === "actor" ? rule.actorId : void 0);
				this.render();
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
	async _openRuleEditor(rule, actorId) {
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
		const conditionHTML = (c, i) => `
      <div class="rule-condition-row" data-index="${i}">
        <select class="cond-stat" data-index="${i}">
          ${[
			"killCount",
			"criticals",
			"criticalFails",
			"damageDealt",
			"damageTaken"
		].map((s) => `<option value="${s}" ${c.stat === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <select class="cond-op" data-index="${i}">
          ${[
			">=",
			"<=",
			"==",
			">",
			"<"
		].map((op) => `<option value="${op}" ${c.operator === op ? "selected" : ""}>${op}</option>`).join("")}
        </select>
        <input class="cond-threshold codex-input" type="number" min="0" step="1" value="${c.threshold}" data-index="${i}"/>
        <button class="codex-btn-icon remove-condition" type="button" data-index="${i}">🗑️</button>
      </div>
    `;
		const onRuleEditorClick = (event) => {
			if (!(event.target instanceof HTMLElement)) return;
			const addButton = event.target.closest("#add-condition");
			if (addButton) {
				event.preventDefault();
				event.stopPropagation();
				const conditions = addButton.closest(".codex-rule-editor")?.querySelector("#rule-conditions");
				const index = conditions?.querySelectorAll(".rule-condition-row").length ?? 0;
				conditions?.insertAdjacentHTML("beforeend", conditionHTML({
					stat: "killCount",
					operator: ">=",
					threshold: 1
				}, index));
				return;
			}
			const removeButton = event.target.closest(".remove-condition");
			if (removeButton) {
				event.preventDefault();
				event.stopPropagation();
				removeButton.closest(".rule-condition-row")?.remove();
			}
		};
		const conditionsHTML = current.conditions.map(conditionHTML).join("");
		document.addEventListener("click", onRuleEditorClick, true);
		let result = null;
		try {
			result = await foundry.applications.api.DialogV2.prompt({
				window: { title: isNew ? "New Epithet Rule" : "Edit Epithet Rule" },
				content: `
          <div class="codex-rule-editor">
            <div class="rule-main-row">
              <input id="rule-icon"  type="text"  value="${current.icon}" placeholder="⚔️"/>
              <input id="rule-label" type="text"  value="${current.label}" placeholder="Epithet name"/>
              <input id="rule-color" type="color" value="${current.color}"/>
            </div>
            <div class="rule-mode-row">
              <label>Conditions match:</label>
              <select id="rule-mode">
                <option value="all" ${current.conditionMode === "all" ? "selected" : ""}>ALL (AND)</option>
                <option value="any" ${current.conditionMode === "any" ? "selected" : ""}>ANY (OR)</option>
              </select>
            </div>
            <div id="rule-conditions">${conditionsHTML}</div>
            <button id="add-condition" class="codex-btn" type="button">+ Add Condition</button>
          </div>
        `,
				ok: {
					label: "Save",
					callback: (_event, _btn, dialog) => {
						const el = dialog.element;
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
				}
			});
		} finally {
			document.removeEventListener("click", onRuleEditorClick, true);
		}
		if (!result?.label) return;
		const savedRule = {
			...current,
			...result
		};
		await saveRule(savedRule);
		await this._refreshRuleActors(savedRule.scope === "actor" ? savedRule.actorId : void 0);
		this.render();
	}
	async _refreshRuleActors(actorId) {
		if (actorId) {
			const actor = game.actors?.get(actorId);
			if (actor) await refreshEpithets(actor);
			return;
		}
		const actors = (game.actors?.contents ?? []).filter((actor) => actor.hasPlayerOwner);
		await Promise.all(actors.map((actor) => refreshEpithets(actor)));
	}
	_selectActor(actorId, tab) {
		this._activeActorId = actorId;
		setTrackingActorId(actorId);
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