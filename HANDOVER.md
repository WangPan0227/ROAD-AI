# InfraGard AI (道路与土木工程灾害防治决策平台) - 项目迁移与交接文档

## 1. 项目简介 (Project Overview)

**InfraGard AI**（又名 RoadbedGuard）是一套面向公路与土木工程设施（包括**边坡、挡土墙、隧道、桥梁、路基**）的智能化灾害评估、病害诊治与防护工程决策支撑系统。系统集成了各工程领域的计算引擎（极限平衡法、土压力计算、梁体落梁风险、衬砌受力分析等）、病害知识图谱、典型/经典工程案例库以及交互式可视化面板。

---

## 2. 技术栈与依赖 (Technology Stack)

* **核心框架**: React 18 + TypeScript + Vite 6
* ** UI & 样式**: Tailwind CSS (含 PostCSS/Autoprefixer)
* **图标库**: Lucide React (`lucide-react`)
* **图表库**: Recharts (`recharts`)
* **3D 可视化**: Three.js + `@react-three/fiber` + `@react-three/drei`
* **代码规范**: ESLint + `@typescript-typescript/eslint-plugin`
* **大模型扩展**: `@google/genai` (已预留接口)

---

## 3. 项目目录结构 (Directory Structure)

```text
/
├── App.tsx                     # 主界面布局、设施类型切换与 Tab 路由管理
├── index.html                  # 应用入口 HTML
├── index.tsx                   # React DOM 渲染入口
├── index.css                   # 全局 Tailwind CSS 样式文件
├── package.json                # 项目依赖与运行脚本配置
├── vite.config.ts              # Vite 构建配置
├── tsconfig.json               # TypeScript 编译选项
├── constants.ts                # 全局常量定义
├── types.ts                    # 通用 TypeScript 数据类型定义
├── services/                   # 服务层
│   └── geminiService.ts        # Gemini 大模型 API 服务封装
├── lib/                        # 核心工程计算引擎与理论力学算法库
│   ├── slopeCalculations.ts    # 边坡极限平衡法(Bishop/Fellenius)与稳定性系数FS计算引擎
│   ├── retainingCalculations.ts# 挡土墙库仑/朗肯土压力及抗滑移/抗倾覆计算引擎
│   ├── tunnelCalculations.ts   # 隧道围岩压力、衬砌受力与脱空塌方风险引擎
│   ├── bridgeCalculations.ts   # 桥梁梁体移位落梁风险、频率衰减与构件损伤计算引擎
│   ├── roadbedCalculations.ts  # 路基承载力、沉降与含水率软化计算引擎
│   ├── disasterMechanisms.ts   # 灾害演化机制与损伤矩阵数据
│   └── formatUtils.ts          # 数据格式化与辅助工具函数
├── components/                 # 页面组件库
│   ├── SlopeAnalysis.tsx       # 边坡灾害智能评估核心组件
│   ├── SlopeDiseaseAtlas.tsx   # 边坡病害知识图谱
│   ├── SlopeClassicCases.tsx   # 边坡经典工程案例
│   ├── SlopeTypicalCases.tsx   # 边坡典型工况库
│   ├── SlopeHistoryLibrary.tsx # 边坡评估历史记录库
│   ├── SlopeMeasureLibrary.tsx # 边坡处治措施图谱
│   ├── Roadbed3DModel.tsx      # 路基与边坡 3D 可视化模型组件
│   ├── DisasterSimulation.tsx  # 灾害演化过程模拟组件
│   ├── SmartDecisionModel.tsx  # 智能决策推理模型组件
│   ├── bridge/                 # 桥梁设施专项组件集
│   │   ├── BridgeAnalysis.tsx
│   │   ├── BridgeGirderAnalysis.tsx
│   │   ├── BridgeComponentAnalysis.tsx
│   │   ├── BridgeDiseaseAtlas.tsx
│   │   ├── BridgeClassicCases.tsx
│   │   ├── BridgeTypicalCases.tsx
│   │   ├── BridgeHistoryLibrary.tsx
│   │   └── BridgeMeasureLibrary.tsx
│   ├── retaining/              # 挡土墙设施专项组件集
│   │   ├── RetainingAnalysis.tsx
│   │   ├── RetainingDiseaseAtlas.tsx
│   │   ├── RetainingClassicCases.tsx
│   │   ├── RetainingTypicalCases.tsx
│   │   ├── RetainingHistoryLibrary.tsx
│   │   └── RetainingMeasureLibrary.tsx
│   ├── roadbed/                # 路基设施专项组件集
│   │   ├── RoadbedAnalysis.tsx
│   │   ├── RoadbedDiseaseAtlas.tsx
│   │   ├── RoadbedClassicCases.tsx
│   │   ├── RoadbedTypicalCases.tsx
│   │   ├── RoadbedHistoryLibrary.tsx
│   │   └── RoadbedMeasureLibrary.tsx
│   └── tunnel/                 # 隧道设施专项组件集
│       ├── TunnelAnalysis.tsx
│       ├── TunnelCollapseAnalysis.tsx
│       ├── TunnelVoidAnalysis.tsx
│       ├── TunnelDiseaseAtlas.tsx
│       ├── TunnelClassicCases.tsx
│       ├── TunnelTypicalCases.tsx
│       ├── TunnelHistoryLibrary.tsx
│       └── TunnelMeasureLibrary.tsx
```

---

## 4. 核心功能与计算引擎说明 (Core Engine & Modules)

### 4.1 核心计算力学引擎 (`/lib/`)
系统所有计算逻辑均采用纯 TypeScript 实现，零服务端依赖，具备实时响应与离线计算能力：
1. **边坡稳定性引擎 (`slopeCalculations.ts`)**:
   - 算法: 简化 Bishop 法与瑞典圆弧法（Fellenius）。
   - 计算项: 自动搜索最危险滑动面、安全系数 $F_s$、孔隙水压力影响、地震荷载系数、抗剪强度折减。
2. **挡土墙抗倾抗滑引擎 (`retainingCalculations.ts`)**:
   - 算法: 库仑主动/被动土压力理论、朗肯土压力理论。
   - 计算项: 抗滑移安全系数 $K_c$、抗倾覆安全系数 $K_0$、基底偏心距与倾覆风险。
3. **隧道结构分析引擎 (`tunnelCalculations.ts`)**:
   - 算法: 泰沙基围岩压力理论、新奥法(NATM)衬砌受力分析模型。
   - 计算项: 拱顶下沉、两帮收敛、衬砌脱空应力集中系数及塌方预警指标。
4. **桥梁结构与防落梁引擎 (`bridgeCalculations.ts`)**:
   - 算法: 梁体震害移位几何动能模型、基频衰减模型、构件多维病害扣分权重法。
   - 计算项: 支座搭接长度安全裕度、落梁概率、自振频率衰减率。
5. **路基承载力与沉降引擎 (`roadbedCalculations.ts`)**:
   - 算法: 分层总和法沉降计算、含水率软化修正模型。
   - 计算项: 工后沉降量、路基回弹模量衰减与极限承载力。

### 4.2 本地数据持久化 (Local Storage Keys)
各模块的诊断记录与图谱修改通过浏览器的 `localStorage` 进行本地持久化：
- `roadbedguard_slope_history`: 边坡诊断历史记录
- `roadbedguard_bridge_history`: 桥梁诊断历史记录
- `roadbedguard_retaining_history`: 挡土墙诊断历史记录
- `roadbedguard_roadbed_history`: 路基诊断历史记录
- `roadbedguard_tunnel_history`: 隧道诊断历史记录
- `roadbedguard_slope_disease_matrix`: 边坡病害矩阵及劣化配置

---

## 5. 本地开发与项目迁移指南 (Deployment & Migration Guide)

### 5.1 环境要求
* **Node.js**: >= 18.0.0 (推荐 v20.x LTS)
* **包管理器**: `npm` (>= 9.x) 或 `bun` / `pnpm` / `yarn`

### 5.2 安装与运行步骤

1. **克隆/解压源码**:
   将打包好的源代码拷贝至目标服务器或本地开发环境。

2. **安装依赖**:
   ```bash
   npm install
   ```

3. **启动本地开发服务器**:
   ```bash
   npm run dev
   ```
   启动后访问控制台输出的本地地址（默认端口为 `3000` 或 Vite 自动指定的端口）。

4. **打包构建生产环境资源**:
   ```bash
   npm run build
   ```
   构建产物将输出至根目录下的 `dist/` 文件夹中，直接部署至 Nginx、Apache 或静态托管服务（如 Cloudflare Pages, Vercel, AWS S3+CloudFront）即可。

5. **代码静态检查 (Lint)**:
   ```bash
   npm run lint
   ```

---

## 6. 后续扩展建议 (Future Enhancements)

1. **后端数据库对接**:
   目前历史记录及病例库基于 `localStorage`，若需要多用户协作，可将 `/lib/*Calculations.ts` 的计算结果通过 REST/GraphQL API 同步存储至 PostgreSQL 或 MongoDB。
2. **大模型能力激活**:
   在 `/services/geminiService.ts` 中配置 `GEMINI_API_KEY` 环境变量，可激活基于 Gemini 的智能报告撰写与病害问答助手。
3. **BIM/GIS 接口集成**:
   当前 `Roadbed3DModel.tsx` 使用 Three.js 构建了参数化 3D 几何图形，后续可扩展加载 IFC (BIM) 或 GeoJSON (GIS) 格式文件。
