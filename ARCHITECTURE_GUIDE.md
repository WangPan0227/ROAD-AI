# InfraGuard AI 架构重构与数据流打通说明文档

本文档详细说明 InfraGuard AI（结构灾毁智能仿真与加固模拟平台）基于 **“3大工程板块 × 3大场景 × 4大统一模块”** 的全新系统架构重构与交互数据流规范。

---

## 一、 整体架构层级设计 (3 × 3 × 4 矩阵)

```
InfraGuard AI 平台架构
├── 1. 第一级导航：工程板块 (Engineering Sectors)
│   ├── 道路工程 (Road Engineering)
│   ├── 桥梁工程 (Bridge Engineering)
│   └── 隧道工程 (Tunnel Engineering)
│
├── 2. 第二级导航：灾毁场景 (Simulation Scenarios)
│   ├── [道路工程] ➔ 【路基沉降】 | 【边坡失稳】 | 【支挡结构】
│   ├── [桥梁工程] ➔ 【桥墩碰撞】 | 【梁体落梁】 | 【构件腐蚀】
│   └── [隧道工程] ➔ 【围岩压力】 | 【衬砌脱空】 | 【拱顶坍方】
│
└── 3. 第三级导航：统一功能模块 (4 Universal Feature Tabs)
    ├── Tab 1: 仿真计算 (Simulation Engine)
    ├── Tab 2: 病害等级 (Damage Level & Disease Atlas)
    ├── Tab 3: 加固措施 (Reinforcement Measures)
    └── Tab 4: 案例知识 (Case & Knowledge Library)
```

---

## 二、 层级模块详细定义

### 1. 第一级导航：工程板块 (Sector Navigation)
在系统顶部主导航栏（Header）中进行一级板块切换：
* **道路工程 (Road)**：涵盖路基不均匀沉降、边坡失稳下滑、支挡结构倾覆等土木基础设施灾毁。
* **桥梁工程 (Bridge)**：涵盖车船碰撞动力响应、地震与偏位导致的梁体落梁、混凝土与钢筋构件腐蚀衰减。
* **隧道工程 (Tunnel)**：涵盖深/浅埋隧道围岩压力演化、衬砌壁后脱空局域应力集中、拱顶坍方塌落圈发展。

### 2. 第二级导航：场景切换 (Scenario Selector)
在二级导航栏中，根据选中的工程板块动态响应对应的 3 个典型灾毁场景：

| 工程板块 | 场景 1 | 场景 2 | 场景 3 |
| :--- | :--- | :--- | :--- |
| **道路工程** | **路基沉降** (`subgrade_settlement`) | **边坡失稳** (`slope_instability`) | **支挡结构** (`retaining_structure`) |
| **桥梁工程** | **桥墩碰撞** (`pier_impact`) | **梁体落梁** (`girder_unseating`) | **构件腐蚀** (`component_corrosion`) |
| **隧道工程** | **围岩压力** (`rock_pressure`) | **衬砌脱空** (`lining_void`) | **拱顶坍方** (`crown_collapse`) |

### 3. 第三级导航：4 大统一功能模块 (Feature Modules)
每个场景内部固定提供标准的 4 大功能模块（左侧侧边栏固定 4 Tab 切换）：
1. **仿真计算 (`simulation`)**：基于高精度物理/力学数值引擎，提供三维/二维几何建模、参数调谐、云图绘制与临界安全系数 (FoS) 实时计算。
2. **病害等级 (`disease`)**：展示该场景的典型病害判据、损伤演化图谱、分级指标及阈值判断控制台。
3. **加固措施 (`reinforcement`)**：提供工程抗灾加固方案库，计算加固后的承载力提升、技术经济比选与方案一键注入。
4. **案例知识 (`knowledge`)**：整合典型工程案例、历史灾毁训练样本与经典加固工程知识库，支持搜索、筛选、编辑与自定义案例新增。

---

## 三、 数据流打通与联动机制 (Data Flow Integration)

为了实现“病害诊断 ➔ 加固设计 ➔ 仿真验证”的完整闭环，系统打通了场景间的全局状态控制机制：

```
                    ┌─────────────────────────┐
                    │    全局 ScenarioState   │
                    │ (diseaseLevel, measure) │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Tab 2: 病害等级  │   │  Tab 3: 加固措施  │   │  Tab 1: 仿真计算  │
│                  │   │                  │   │                  │
│ 用户调整病害等级  │   │ 用户选择加固方案 │   │ 实时读取病害折减 │
│ ➔ 更新损伤状态   │   │ ➔ 注入加固参数   │   │ 与加固抗力增益   │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      ▲
         └──────────────────────┴──────────────────────┘
                   自动联动更新物理仿真云图
```

### 关键数据流实现逻辑：

1. **病害等级 ➔ 仿真引擎数据流**：
   * 用户在【病害等级】模块选择或调整病害等级（0级无损、Ⅰ级轻微、Ⅱ级中度、Ⅲ级严重、Ⅳ级失稳）。
   * 系统通过全局状态 `scenarioStates[activeScenario]` 实时更新当前场景的病害折减系数。
   * 【仿真计算】引擎实时感知该损伤，自动调整结构材料强度（如弹性模量 $E$、粘聚力 $c$、内摩擦角 $\varphi$ 等），并在可视化视图中呈现裂缝或损伤云图。

2. **加固措施 ➔ 仿真引擎数据流**：
   * 用户在【加固措施】模块选择加固方案（如预应力锚索、高压注浆、钢套管补强、CFG桩等）。
   * 系统自动向【仿真计算】引擎注入加固参数（如锚固力 $F_{anchor}$、注浆固结体模量提升、阻尼比增加等）。
   * 仿真引擎实时重新求解安全系数 $FoS$ 或应力集中程度，可视化呈现加固后的支护结构与应力重分布效果。

3. **快捷交互 Toast 提示**：
   * 当用户在【病害等级】或【加固措施】控制台更新配置后，系统会自动触发响应式交互 Toast 提示框，并提供“一键前往【仿真计算】查看效果”的快捷跳转按钮。

---

## 四、 核心代码文件映射

* **主框架与导航总控**：`App.tsx`
* **统一数据类型定义**：`types.ts`
* **案例知识库公共组件**：`components/common/CaseKnowledgeLibrary.tsx`
* **灾毁仿真模块组件**：
  * 道路：`components/roadbed/RoadbedAnalysis.tsx`, `SlopeAnalysis.tsx`, `RetainingAnalysis.tsx`
  * 桥梁：`components/bridge/BridgeAnalysis.tsx`, `BridgeGirderAnalysis.tsx`, `BridgeComponentAnalysis.tsx`
  * 隧道：`components/tunnel/TunnelAnalysis.tsx`, `TunnelVoidAnalysis.tsx`, `TunnelCollapseAnalysis.tsx`
* **病害等级图谱组件**：
  * `RoadbedDiseaseAtlas.tsx`, `SlopeDiseaseAtlas.tsx`, `RetainingDiseaseAtlas.tsx`, `BridgeDiseaseAtlas.tsx`, `TunnelDiseaseAtlas.tsx`
* **加固措施方案库组件**：
  * `RoadbedMeasureLibrary.tsx`, `SlopeMeasureLibrary.tsx`, `RetainingMeasureLibrary.tsx`, `BridgeMeasureLibrary.tsx`, `TunnelMeasureLibrary.tsx`
