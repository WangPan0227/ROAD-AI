/**
 * InfraGard AI - 标准强类型 Schema 体系 (types/schema.ts)
 * 为工程灾害评估、物理/力学仿真、病害劣化、加固决策及案例知识库提供统一类型定义。
 */

// ============================================================================
// 1. 三级架构枚举与联合类型 (Three-Tier Architecture Types)
// ============================================================================

/**
 * 一级架构：工程领域 (Engineering Sector)
 */
export type EngineeringSector = 'road' | 'bridge' | 'tunnel';

/**
 * 道路工程仿真场景 (Road Simulation Scenarios)
 */
export type RoadSimulationScenario = 
  | 'subgrade_settlement' // 路基沉降与承载力衰减
  | 'slope_instability'   // 边坡滑动与失稳
  | 'retaining_structure'; // 挡土墙抗滑移/抗倾覆失稳

/**
 * 桥梁工程仿真场景 (Bridge Simulation Scenarios)
 */
export type BridgeSimulationScenario = 
  | 'pier_impact'        // 桥墩偏位
  | 'girder_unseating'   // 梁体垮塌
  | 'component_corrosion'; // 构件损伤

/**
 * 隧道工程仿真场景 (Tunnel Simulation Scenarios)
 */
export type TunnelSimulationScenario = 
  | 'rock_pressure'      // 围岩压力与变形
  | 'lining_void'        // 衬砌背部脱空与应力集中
  | 'crown_collapse';    // 拱顶塌方与失稳预警

/**
 * 二级架构：仿真场景联合类型 (Simulation Scenario)
 */
export type SimulationScenario = 
  | RoadSimulationScenario 
  | BridgeSimulationScenario 
  | TunnelSimulationScenario;

/**
 * 三级架构：功能模块 (Functional Module)
 */
export type FunctionalModule = 
  | 'simulation'      // 物理/力学仿真计算
  | 'disease_level'   // 病害诊断与劣化矩阵评估
  | 'reinforcement'   // 加固工程决策与效果对比
  | 'case_knowledge';  // 案例知识库 (历史快照/V&V验证/事故RAG)


// ============================================================================
// 2. 统一场景状态与参数 Interface (Scenario States & Parameters)
// ============================================================================

/**
 * 损伤折减参数 Interface (Damage Parameters)
 * 包含通用及各专属场景下的物理力学折减因子与几何损伤指标
 */
export interface DamageParameters {
  /** 黏聚力折减系数 (c factor, 0 ~ 1) */
  c_factor?: number;
  /** 内摩擦角折减系数 (phi factor, 0 ~ 1) */
  phi_factor?: number;
  /** 弹性模量/变形模量折减系数 (E factor, 0 ~ 1) */
  E_factor?: number;
  /** 裂缝深度 (m) */
  crack_depth?: number;
  /** 裂缝距边缘/坡顶距离 (m) */
  crack_distance?: number;
  /** 衬砌/背部脱空弧度或角度 (度/弧度) */
  void_arc_angle?: number;
  /** 衬砌脱空深度与厚度比率 (0 ~ 1) */
  void_depth_ratio?: number;
  /** 是否考虑裂缝充水/动水压力 */
  add_water_pressure?: boolean;
  /** 地震拟静力水平加速度系数 (k_h) */
  seismic_coefficient?: number;
  /** 构件损伤/腐蚀截面比例 (0 ~ 1) */
  component_damage_ratio?: number;
  /** 钢筋/钢构件腐蚀深度 (mm) */
  corrosion_depth?: number;
  /** 桥墩受撞击或墩顶偏位量 (m) */
  impact_displacement?: number;
  /** 撞击作用力 (kN) */
  impact_force?: number;
  /** 病害等级描述 */
  disease_description?: string;
  /** 自定义扩展损伤因子 */
  custom_damage_factors?: Record<string, number>;
}

/**
 * 加固增强参数 Interface (Reinforcement Parameters)
 * 包含结构增强、支护力学与防渗减灾等工程加固指标
 */
export interface ReinforcementParameters {
  /** 箍筋/主筋配置放大倍数 (大于等于 1.0) */
  stirrup_amplification_factor?: number;
  /** 渗流阻隔/排水防渗因子 (0 ~ 1) */
  seepage_barrier_factor?: number;
  /** 预应力锚索/锚杆拉力 (kN) */
  anchor_tension_force?: number;
  /** 土钉/锚杆布置密度 (根/m²) */
  soil_nail_density?: number;
  /** 注浆压力 (MPa) */
  grouting_pressure?: number;
  /** 注浆体积/饱满度 (%) */
  grouting_volume?: number;
  /** 衬砌/套拱加厚量 (mm) */
  lining_thickening?: number;
  /** 防落梁挡块/盖梁加宽值 (mm) */
  bearing_block_extension?: number;
  /** 排水系统能力提升系数 */
  drainage_capacity_factor?: number;
  /** 推荐加固措施名称列表 */
  recommended_measures?: string[];
  /** 自定义扩展加固参数 */
  custom_reinforcement_params?: Record<string, number | string | boolean>;
}

/**
 * 风险等级枚举/联合类型 (Risk Level)
 */
export type RiskLevel = 'safe' | 'warning' | 'danger';

/**
 * 通用仿真计算结果 Interface (Simulation Result)
 */
export interface SimulationResult {
  /** 稳定性安全系数 Fs (抗滑动/抗倾覆/综合FS) */
  factor_of_safety?: number;
  /** 极限/容许承载力 (kPa) */
  bearing_capacity?: number;
  /** 最大位移/沉降量/移位值 (mm 或 m) */
  displacement?: number;
  /** 最大应力/压应力/拉应力 (MPa) */
  stress?: number;
  /** 自振频率衰减率 (%) */
  natural_frequency_decay?: number;
  /** 结构综合健康度得分 (0 ~ 100) */
  health_score: number;
  /** 统一风险等级 */
  risk_level: RiskLevel;
  /** 是否满足规范要求 / 是否合格 */
  is_qualified: boolean;
  /** 详细计算中间结果字典 */
  calculation_details?: Record<string, number | string | boolean>;
  /** 专家/AI 处置与防控建议 */
  recommendation?: string;
}


// ============================================================================
// 3. 统一案例知识 Interface (Case Knowledge Interface)
// ============================================================================

/**
 * 案例知识分类枚举/联合类型
 * - `history_snapshot`: 历史计算快照与实测记录
 * - `typical_validation`: V&V (Verification & Validation) 典型验证工况
 * - `classic_rag`: 经典灾害事故 RAG (检索增强生成) 案例
 */
export type CaseKnowledgeType = 'history_snapshot' | 'typical_validation' | 'classic_rag';

/**
 * RAG 灾害事故元数据 Interface
 */
export interface CaseRAGMetadata {
  /** 事故主因 */
  failure_cause?: string;
  /** 破坏演化机制 */
  failure_mechanism?: string;
  /** 灾害损失统计 */
  damage_statistics?: {
    affected_area_m2?: number;
    volume_m3?: number;
    casualties?: string;
    economic_loss_cny?: number;
  };
  /** 经验教训总结 */
  lessons_learned?: string[];
  /** 实际采用的抢险/治害措施 */
  actual_measures_used?: string[];
  /** 相关现场照片/图表 URL */
  image_urls?: string[];
}

/**
 * V&V 典型工况验证基准数据 Interface
 */
export interface CaseBenchmarkData {
  /** 规范/解析解/有限元基准安全系数或目标值 */
  benchmark_value: number;
  /** 本软件仿真计算值 */
  simulated_value: number;
  /** 相对误差百分比 (%) */
  error_percentage: number;
  /** 理论依据或权威规范来源 */
  source_reference?: string;
}

/**
 * 统一案例知识条目 Interface (CaseKnowledgeItem)
 * 整合原有的 HistoryCase、TypicalCase 与 ClassicCase
 */
export interface CaseKnowledgeItem {
  /** 唯一标识符 */
  id: string;
  /** 案例知识类型 */
  case_type: CaseKnowledgeType;
  /** 所属工程领域 */
  sector: EngineeringSector;
  /** 所属仿真场景 */
  scenario: SimulationScenario;
  /** 案例标题/名称 */
  title: string;
  /** 发生日期或记录时间 */
  date?: string;
  /** 地理位置/工程桩号 */
  location?: string;
  /** 详细工程概况与描述 */
  description: string;
  /** 地质条件或结构特征说明 */
  geology_or_structure?: string;
  /** 原始工况与物理输入参数字典 */
  input_parameters: Record<string, number | string | boolean>;
  /** 绑定的损伤状态参数 */
  damage_params?: DamageParameters;
  /** 绑定的加固防范参数 */
  reinforcement_params?: ReinforcementParameters;
  /** 仿真计算输出结果 */
  calculated_result?: SimulationResult;
  /** V&V 验证基准对比 (当 case_type === 'typical_validation' 时有效) */
  benchmark_data?: CaseBenchmarkData;
  /** RAG 灾害知识元数据 (当 case_type === 'classic_rag' 时有效) */
  rag_metadata?: CaseRAGMetadata;
  /** 检索标签 (如 '高速公路', '软岩', '高边坡') */
  tags?: string[];
  /** 创建或更新时间戳 */
  created_at?: string;
}
