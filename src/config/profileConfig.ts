import type { ProfileConfig } from "@/types/config";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 博主资料：头像 / 名称 / 简介 / 社交链接（侧栏 Profile 卡片、页脚、RSS 作者等消费）。
 * 类型见 src/types/config.ts。
 */
export const profileConfig: ProfileConfig = withUserConfig("profile", {
	avatar: "/images/avatar.png",
	name: "时孤",
	bio: "西伯利亚平原狼",
	links: [
		{
			name: "Steam",
			icon: "fa7-brands:steam",
			url: "https://steamcommunity.com/id/shigu666/",
		},
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/shigu666",
		},
		{
			name: "QQ",
			icon: "fa7-brands:qq",
			url: "https://qm.qq.com/q/DqCWkmyAg0",
		},
		{
			name: "哔哩哔哩",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/1683333823",
		},
	],
});
