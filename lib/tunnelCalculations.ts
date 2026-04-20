// 文件路径: lib/tunnelCalculations.ts

export interface TunnelEngineParams {
  B: number;           // 隧道开挖跨度 (m)
  Ht: number;          // 隧道开挖高度 (m)
  H: number;           // 隧道拱顶埋深 (m)
  rockClass: number;   // 围岩级别 (1:I级 - 6:VI级)
  gamma: number;       // 围岩重度 (kN/m³)
  mu: number;          // 围岩泊松比
  dLining: number;     // 衬砌设计厚度 (mm)
  dCrack: number;      // 衬砌表观裂隙深度 (mm)
  hasDebris: boolean;  // 拱顶是否存在掉块脱空
}

export interface TunnelEcoConfig {
  cost_grout?: [number, number];    // 高聚物注浆: [单价(元/kg), 工效]
  cost_steel?: [number, number];    // 钢拱架支护: [单价(元/m), 工效]
  cost_shotcrete?: [number, number];// 喷射混凝土: [单价(元/m²), 工效]
}

/**
 * 1. 核心计算模块：判定深浅埋并计算围岩压力
 */
export const calculate_tunnel_pressure = (p: TunnelEngineParams) => {
  // 1. 荷载等效高度 hq 计算 (根据《公路隧道设计规范》)
  const omega = 1 + 0.1 * Math.max(0, p.B - 5);
  const hq = 0.45 * Math.pow(2, p.rockClass - 1) * omega;

  // 2. 深浅埋临界判定
  const h_critical = 2.5 * hq;
  const isDeep = p.H > h_critical;

  // 3. 垂直围岩压力 q (kPa)
  let q_kPa = 0;
  if (isDeep) {
    q_kPa = p.gamma * hq;
  } else {
    // 浅埋非偏压近似计算
    q_kPa = p.gamma * p.H;
  }

  // 4. 侧向围岩压力 e (kPa)
  // 采用泊松比估算侧压力系数 lambda
  const lambda = p.mu / (1 - p.mu);
  const e_up_kPa = q_kPa * lambda;
  const e_down_kPa = (isDeep ? (p.gamma * (hq + p.Ht)) : (p.gamma * (p.H + p.Ht))) * lambda;

  // 5. 衬砌损伤程度判定 (Deep Rate)
  let deep_rate = p.dCrack / p.dLining;
  let damage_level = 1; // 1:轻微, 2:中度, 3:严重, 4:灾难性

  if (p.hasDebris || deep_rate >= 0.7) {
    damage_level = 4;
  } else if (deep_rate >= 0.5) {
    damage_level = 3;
  } else if (deep_rate >= 0.3) {
    damage_level = 2;
  } else {
    damage_level = 1;
  }

  // 综合承载力健康度 (0-100%)
  // 裂隙越深，有效承载截面越小；掉块直接导致承载力暴跌
  const base_capacity = 100 * (1 - deep_rate);
  const health_score = p.hasDebris ? base_capacity * 0.4 : base_capacity;

  return {
    tunnel_type: isDeep ? "深埋隧道" : "浅埋隧道",
    hq,
    q_kPa,
    e_up_kPa,
    e_down_kPa,
    lambda,
    deep_rate: deep_rate * 100, // 转化为百分比
    damage_level,
    health_score: Math.max(0, health_score)
  };
};

/**
 * 2. 智能决策模块：隧道加固与处治方案正交推演
 */
export const optimize_tunnel_reinforcement = (
  baseParams: TunnelEngineParams, 
  ecoConfig: TunnelEcoConfig
) => {
  const [price_grout, eff_grout] = ecoConfig.cost_grout || [300, 200];      // 300元/kg
  const [price_steel, eff_steel] = ecoConfig.cost_steel || [4500, 10];      // 4500元/延米
  const [price_shotcrete, eff_shotcrete] = ecoConfig.cost_shotcrete || [500, 50]; // 500元/m²

  const schemes = [];

  // 方案 1：高聚物背后脱空与裂隙封闭注浆
  // 物理映射：消除脱空掉块影响，修复表观裂隙深度至 0
  const params_1 = { ...baseParams, hasDebris: false, dCrack: 0 };
  const res_1 = calculate_tunnel_pressure(params_1);
  const grout_weight = baseParams.B * 50; // 假设每延米需要50kg材料
  schemes.push({
      id: 'S1', name: '方案一：高聚物无损注浆',
      measures: ['脱空回填', '裂缝封闭'],
      cost: grout_weight * price_grout, time: grout_weight / eff_grout,
      finalHealth: res_1.health_score,
      desc: '速凝高聚物材料回填脱空并封闭裂隙，恢复二衬受力整体性，不侵入建筑限界。'
  });

  // 方案 2：增设 H型钢/工字钢拱架支护
  // 物理映射：极大增强结构抗力上限，允许一定程度的衬砌损伤继续存在
  const params_2 = { ...baseParams, hasDebris: false }; 
  const res_2 = calculate_tunnel_pressure(params_2);
  const arch_length = baseParams.B * 3.14 * 0.5; // 半圆周长
  schemes.push({
      id: 'S2', name: '方案二：钢拱架强力支护',
      measures: ['刚性支撑', '限界侵入'],
      cost: arch_length * price_steel, time: arch_length / eff_steel,
      finalHealth: Math.min(100, res_2.health_score + 40), // 强行补偿40%健康度
      desc: '提供绝对的刚度支撑，适用于衬砌大范围开裂且围岩压力持续增大的危险工况，但会侵入净空。'
  });

  // 方案 3：钢筋网+喷射混凝土护面
  // 物理映射：修复表面病害，增加局部厚度
  const params_3 = { ...baseParams, hasDebris: false, dCrack: baseParams.dCrack * 0.2, dLining: baseParams.dLining + 100 };
  const res_3 = calculate_tunnel_pressure(params_3);
  const area_shotcrete = arch_length; 
  schemes.push({
      id: 'S3', name: '方案三：挂网喷射混凝土',
      measures: ['表面防护', '厚度补偿'],
      cost: area_shotcrete * price_shotcrete, time: area_shotcrete / eff_shotcrete,
      finalHealth: res_3.health_score,
      desc: '抑制表面深度劣化并增加有效厚度，适用于掉块频发但整体未失稳的区段。'
  });

  // 排序逻辑：以健康度达到 85% 为安全阈值
  const validSchemes = schemes.filter(s => s.finalHealth >= 85);
  return validSchemes.length > 0 
      ? validSchemes.sort((a, b) => a.cost - b.cost) 
      : schemes.sort((a, b) => b.finalHealth - a.finalHealth);
};