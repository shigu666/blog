<script lang="ts">
	import { DARK_MODE, DEFAULT_THEME, LIGHT_MODE, AUTO_MODE } from "@constants/constants";
	import Icon from "@iconify/svelte";
	import { getStoredTheme, setTheme } from "@utils/setting-utils";
	import { onMount, onDestroy } from "svelte";

	import type { LIGHT_DARK_MODE } from "@/types/config.ts";

	const seq: LIGHT_DARK_MODE[] = [LIGHT_MODE, DARK_MODE, AUTO_MODE];  // 支持 3 种模式循环
	let mode: LIGHT_DARK_MODE = $state(DEFAULT_THEME);
	let isChanging = false;

	let darkModePreference: MediaQueryList | undefined;

	// 系统偏好变化时，如果当前是 AUTO 模式就自动更新
	function handleSystemThemeChange() {
		if (mode === AUTO_MODE) {
			setTheme(AUTO_MODE);
		}
	}

	onMount(() => {
		mode = getStoredTheme();
		// 关键：首次加载时立即应用（保证默认 AUTO 生效）
		setTheme(mode);

		darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
		darkModePreference.addEventListener("change", handleSystemThemeChange);
	});

	onDestroy(() => {
		if (darkModePreference) {
			darkModePreference.removeEventListener("change", handleSystemThemeChange);
		}
	});

	function switchScheme(newMode: LIGHT_DARK_MODE) {
		if (isChanging) return;
		isChanging = true;
		mode = newMode;
		setTheme(newMode);
		setTimeout(() => { isChanging = false; }, 50);
	}

	function toggleScheme() {
		if (isChanging) return;
		let i = 0;
		for (; i < seq.length; i++) {
			if (seq[i] === mode) break;
		}
		switchScheme(seq[(i + 1) % seq.length]);
	}

	// Swup 兼容部分保持不变
	if (typeof window !== "undefined") {
		const handleContentReplace = () => {
			requestAnimationFrame(() => {
				const newMode = getStoredTheme();
				if (mode !== newMode) {
					mode = newMode;
				}
			});
		};

		if ((window as any).swup && (window as any).swup.hooks) {
			(window as any).swup.hooks.on("content:replace", handleContentReplace);
		} else {
			document.addEventListener("swup:enable", () => {
				if ((window as any).swup && (window as any).swup.hooks) {
					(window as any).swup.hooks.on("content:replace", handleContentReplace);
				}
			});
		}

		document.addEventListener("DOMContentLoaded", () => {
			requestAnimationFrame(() => {
				const newMode = getStoredTheme();
				if (mode !== newMode) {
					mode = newMode;
				}
			});
		});
	}
</script>

<button
	aria-label="Light/Dark Mode"
	class="relative btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90 theme-switch-btn z-50"
	id="scheme-switch"
	onclick={toggleScheme}
	data-mode={mode}
>
	<div
		class="absolute transition-all duration-300 ease-in-out"
		class:opacity-0={mode !== LIGHT_MODE}
		class:rotate-180={mode !== LIGHT_MODE}
	>
		<Icon
			icon="material-symbols:wb-sunny-outline-rounded"
			class="text-[1.25rem]"
		></Icon>
	</div>
	<div
		class="absolute transition-all duration-300 ease-in-out"
		class:opacity-0={mode !== DARK_MODE}
		class:rotate-180={mode !== DARK_MODE}
	>
		<Icon
			icon="material-symbols:dark-mode-outline-rounded"
			class="text-[1.25rem]"
		></Icon>
	</div>
	<div
		class="absolute transition-all duration-300 ease-in-out"
	    class:opacity-0={mode !== AUTO_MODE}
	>
		<Icon
			icon="material-symbols:radio-button-partial-outline"
			class="text-[1.25rem]" />
	</div>
</button>

<style>
	/* 确保主题切换按钮的背景色即时更新 */
	.theme-switch-btn::before {
		transition:
			transform 75ms ease-out,
			background-color 0ms !important;
	}
</style>
