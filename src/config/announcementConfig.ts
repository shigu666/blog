import type { AnnouncementConfig } from "@/types/announcementConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 公告栏配置
 * 组件显示由 sidebarConfig 统一控制
 */
export const announcementConfig: AnnouncementConfig = withUserConfig(
	"announcement",
	{
		title: "内容许可协议",
		content:
			"转载内容即代表您同意本站的内容许可协议，协议内容请点击下方详情查看",
		closable: true,
		// 旧站关闭公告后永久记住，0 表示不自动重新展示。
		closeDuration: 0,
		link: {
			enable: true,
			text: "查看详情",
			url: "/license/",
			external: false,
		},
	},
);
