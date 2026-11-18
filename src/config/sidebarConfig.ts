/**
 * 侧边栏布局配置（数据驱动编排）。
 *
 * 迁移自 Mizuki 旧站：左侧为 profile / announcement / categories / tags，
 * 文章页右侧保留 sidebar TOC；旧站未显示的 stats / calendar / music /
 * series 组件保持关闭。
 */
import type { SidebarConfig } from "@/types/sidebarConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

export const sidebarConfig: SidebarConfig = withUserConfig("sidebar", {
	enable: true,
	arrangement: "dual",
	side: "left",
	components: [
		{ type: "profile", enable: true, slot: "top" },
		{ type: "announcement", enable: true, slot: "top" },
		{
			type: "categories",
			enable: true,
			slot: "sticky",
			collapseAfter: 5,
		},
		{
			type: "tags",
			enable: true,
			slot: "sticky",
			collapseAfter: 20,
		},
		{
			type: "toc",
			enable: true,
			slot: "sticky",
			column: "secondary",
			pages: ["post"],
		},
	],
});
