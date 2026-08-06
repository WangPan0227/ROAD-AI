// 文件路径: lib/tunnelCalculations.ts

import { DamageParameters, ReinforcementParameters } from '../types/schema';

export interface TunnelLiningCrackParams {
  M: number;       // 弯矩 (kN·m/m)
  N: number;       // 轴力 (kN/m)，压力为正，拉力为负
  t: number;       // 衬砌厚度 (m)
  fc: number;      // 混凝土抗压强度 (MPa, 默认 30)
  f_ctm?: number;  // 混凝土平均抗拉强度 (MPa, 默认 2.2)
  Es?: number;     // 钢筋弹性模量 (GPa, 默认 200)
  Ec?: number;     // 混凝土弹性模量 (GPa, 默认 30)
  As_ratio?: number;// 配筋率 %, 默认 1.0%
  c_nom?: number;  // 保护层净厚度 (m, 默认 0.05)
  phi?: number;    // 钢筋直径 (m, 默认 0.02)
}

/**
 * 基于 MC2010 规范与拉伸刚化效应的隧道衬砌偏心受力裂缝宽度预测引擎
 * 转换自 裂缝宽度.py
 */
export const calculate_tunnel_lining_crack_width = (p: TunnelLiningCrackParams) => {
  const M_abs = Math.abs(p.M) * 1000; // 转换为 N·m/m
  const N = p.N * 1000;               // 转换为 N/m
  const t = p.t;                      // m
  const b = 1.0;                      // 单位宽度 1m
  const Ec = (p.Ec ?? 30) * 1e9;      // Pa
  const Es = (p.Es ?? 200) * 1e9;     // Pa
  const f_ctm = (p.f_ctm ?? 2.2) * 1e6;// Pa
  const c_nom = p.c_nom ?? 0.05;      // m
  const phi = p.phi ?? 0.02;          // m
  const k_t = 0.6, k1 = 0.8, k2 = 0.5;

  const d_eff = 0.9 * t; // 受拉钢筋有效高度 (m)
  const As_ratio = (p.As_ratio ?? 1.0) / 100;
  const A_s = As_ratio * b * d_eff; // 受拉钢筋面积 (m²/m)
  const alpha_e = Es / Ec;

  let x: number;
  let sigma_s: number;

  if (N >= 0) { // 偏心受压/受弯
    const A = b / 2;
    const B = alpha_e * A_s + (N / (Ec * b * t / 2)); 
    const C = -alpha_e * A_s * d_eff;
    const delta = Math.pow(B, 2) - 4 * A * C;
    x = delta >= 0 ? (-B + Math.sqrt(delta)) / (2 * A) : d_eff / 3;
    if (x <= 0 || x >= d_eff) x = d_eff / 3;

    const lever_arm = Math.max(0.1 * d_eff, d_eff - x / 3);
    sigma_s = M_abs / (A_s * lever_arm);
  } else { // 偏心受拉
    sigma_s = Math.abs(N) / A_s + M_abs / (A_s * Math.max(0.1, d_eff - t / 2));
    x = 0;
  }

  // 有效配筋率 rho_eff
  const h_c_eff = Math.min(2.5 * (t - d_eff), t / 2);
  const A_c_eff = b * h_c_eff;
  const rho_eff = A_s / Math.max(1e-4, A_c_eff);

  // 最大裂缝间距 sr_max (m)
  const s_r_max = 3.4 * c_nom + 0.425 * k1 * k2 * (phi / Math.max(1e-4, rho_eff));

  // 平均应变差 eps_diff
  let eps_diff = 0;
  if (sigma_s > 0) {
    const term2 = k_t * f_ctm * (1 / Math.max(1e-4, rho_eff) + alpha_e);
    eps_diff = (sigma_s - term2) / Es;
    const min_eps = (0.6 * sigma_s) / Es;
    if (eps_diff < min_eps) eps_diff = min_eps;
  }

  // 最大裂缝宽度 w_max (mm)
  const w_max_m = Math.max(0, s_r_max * eps_diff);
  const w_max = w_max_m * 1000; // 换算为 mm
  const sigma_s_MPa = sigma_s / 1e6; // 换算为 MPa

  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (w_max > 0.4) status = 'critical';
  else if (w_max > 0.2) status = 'warning';

  return {
    w_max,
    sigma_s_MPa,
    s_r_max_mm: s_r_max * 1000,
    x_ratio: (x / t) * 100,
    status
  };
};

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
  damage?: DamageParameters;
  reinforcement?: ReinforcementParameters;
}

export interface TunnelEcoConfig {
  cost_grout?: [number, number];    // 高聚物注浆: [单价(元/kg), 工效]
  cost_steel?: [number, number];    // 钢拱架支护: [单价(元/m), 工效]
  cost_shotcrete?: [number, number];// 喷射混凝土: [单价(元/m²), 工效]
}

/**
 * 1. 核心计算模块：判定深浅埋并计算围岩压力
 */
export const calculate_tunnel_pressure = (
  p: TunnelEngineParams,
  damageParam?: DamageParameters,
  reinforcementParam?: ReinforcementParameters
) => {
  const damage = damageParam || p.damage;
  const reinforcement = reinforcementParam || p.reinforcement;

  let rockClass = p.rockClass;
  let dCrack = p.dCrack;
  let dLining = p.dLining;
  let hasDebris = p.hasDebris;

  // 损伤折减
  if (damage) {
    if (damage.c_factor !== undefined || damage.phi_factor !== undefined) {
      rockClass = Math.min(6, rockClass + 1);
    }
    if (damage.crack_depth) dCrack = Math.max(dCrack, damage.crack_depth * 10);
    if (damage.lining_void_angle) hasDebris = true;
  }

  // 加固增强
  if (reinforcement) {
    if (reinforcement.grouting_volume) dCrack = Math.max(0, dCrack - 200);
    if (reinforcement.steel_plate_thickness) dLining += reinforcement.steel_plate_thickness * 10;
    if (reinforcement.anchor_tension_force) hasDebris = false;
  }

  // 1. 荷载等效高度 hq 计算 (根据《公路隧道设计规范》)
  const omega = 1 + 0.1 * Math.max(0, p.B - 5);
  const hq = 0.45 * Math.pow(2, rockClass - 1) * omega;

  // 2. 深浅埋临界判定
  const h_critical = 2.5 * hq;
  const isDeep = p.H > h_critical;

  // 3. 垂直围岩压力 q (kPa)
  const q_kPa = isDeep ? (p.gamma * hq) : (p.gamma * p.H);

  // 4. 侧向围岩压力 e (kPa)
  const lambda = p.mu / Math.max(0.01, 1 - p.mu);
  const e_up_kPa = q_kPa * lambda;
  const e_down_kPa = (isDeep ? (p.gamma * (hq + p.Ht)) : (p.gamma * (p.H + p.Ht))) * lambda;

  // 5. 衬砌损伤程度判定 (Deep Rate)
  const deep_rate = dCrack / Math.max(0.01, dLining);
  let damage_level: number;

  if (hasDebris || deep_rate >= 0.7) {
    damage_level = 4;
  } else if (deep_rate >= 0.5) {
    damage_level = 3;
  } else if (deep_rate >= 0.3) {
    damage_level = 2;
  } else {
    damage_level = 1;
  }

  // 综合承载力健康度 (0-100%)
  const base_capacity = 100 * (1 - deep_rate);
  const health_score = hasDebris ? base_capacity * 0.4 : base_capacity;

  return {
    tunnel_type: isDeep ? "深埋隧道" : "浅埋隧道",
    hq,
    q_kPa,
    e_up_kPa,
    e_down_kPa,
    lambda,
    deep_rate: deep_rate * 100,
    damage_level,
    health_score: Math.max(0, health_score)
  };
};

/**
 * 2. 智能决策模块：隧道加固与处治方案正交推演
 */
export const optimize_tunnel_reinforcement = (
  baseParams: TunnelEngineParams, 
  ecoConfig: TunnelEcoConfig,
  damageParam?: DamageParameters,
  reinforcementParam?: ReinforcementParameters
) => {
  const [price_grout, eff_grout] = ecoConfig.cost_grout || [300, 200];
  const [price_steel, eff_steel] = ecoConfig.cost_steel || [4500, 10];
  const [price_shotcrete, eff_shotcrete] = ecoConfig.cost_shotcrete || [500, 50];

  const schemes = [];

  // 方案 1：高聚物背后脱空与裂隙封闭注浆
  const params_1 = { ...baseParams, hasDebris: false, dCrack: 0 };
  const res_1 = calculate_tunnel_pressure(params_1, damageParam, reinforcementParam);
  const grout_weight = baseParams.B * 50; 
  const cost1_yuan = grout_weight * price_grout;
  const cost1_wan = cost1_yuan / 10000;
  const time1 = grout_weight / Math.max(0.01, eff_grout);

  schemes.push({
      id: 'S1', name: '方案一：高聚物无损注浆',
      measures: ['脱空回填', '裂缝封闭'],
      cost: cost1_wan,
      time: time1,
      schedule: Math.round(time1),
      finalHealth: res_1.health_score,
      desc: '速凝高聚物材料回填脱空并封闭裂隙，恢复二衬受力整体性，不侵入建筑限界。'
  });

  // 方案 2：增设 H型钢/工字钢拱架支护
  const params_2 = { ...baseParams, hasDebris: false }; 
  const res_2 = calculate_tunnel_pressure(params_2, damageParam, reinforcementParam);
  const arch_length = baseParams.B * 3.14 * 0.5;
  const cost2_yuan = arch_length * price_steel;
  const cost2_wan = cost2_yuan / 10000;
  const time2 = arch_length / Math.max(0.01, eff_steel);

  schemes.push({
      id: 'S2', name: '方案二：钢拱架强力支护',
      measures: ['刚性支撑', '限界侵入'],
      cost: cost2_wan,
      time: time2,
      schedule: Math.round(time2),
      finalHealth: Math.min(100, res_2.health_score + 40),
      desc: '提供绝对的刚度支撑，适用于衬砌大范围开裂且围岩压力持续增大的危险工况，但会侵入净空。'
  });

  // 方案 3：钢筋网+喷射混凝土护面
  const params_3 = { ...baseParams, hasDebris: false, dCrack: baseParams.dCrack * 0.2, dLining: baseParams.dLining + 100 };
  const res_3 = calculate_tunnel_pressure(params_3, damageParam, reinforcementParam);
  const area_shotcrete = arch_length; 
  const cost3_yuan = area_shotcrete * price_shotcrete;
  const cost3_wan = cost3_yuan / 10000;
  const time3 = area_shotcrete / Math.max(0.01, eff_shotcrete);

  schemes.push({
      id: 'S3', name: '方案三：挂网喷射混凝土',
      measures: ['表面防护', '厚度补偿'],
      cost: cost3_wan,
      time: time3,
      schedule: Math.round(time3),
      finalHealth: res_3.health_score,
      desc: '抑制表面深度劣化并增加有效厚度，适用于掉块频发但整体未失稳的区段。'
  });

  // 排序逻辑：以健康度达到 85% 为安全阈值
  const validSchemes = schemes.filter(s => s.finalHealth >= 85);
  return validSchemes.length > 0 
      ? validSchemes.sort((a, b) => a.cost - b.cost) 
      : schemes.sort((a, b) => b.finalHealth - a.finalHealth);
};

/**
 * 3. 壁后脱空受力偏移仿真 (Tunnel Void & Stress Eccentricity)
 */
export interface TunnelWallVoidParams {
  R: number;            // 衬砌中心线半径 (m, 默认 3.0)
  t: number;            // 衬砌厚度 (m, 默认 0.3)
  E: number;            // 弹性模量 (GPa, 默认 30)
  q_v: number;          // 竖向围岩压力 (kPa, 默认 200.0)
  q_h: number;          // 水平围岩压力 (kPa, 默认 100.0)
  theta_void: number;   // 脱空中心角度 (deg, 默认 90，即拱腰)
  void_width: number;   // 脱空范围半宽 (deg, 默认 30)
  void_factor: number;  // 脱空区压力折减系数 (0.0~1.0, 默认 0.0 表示完全脱空)
}

/**
 * 隧道衬砌壁后脱空内力重分布与环向应力求解引擎
 * 融合 局部弯矩变化率.py 与 环向应力.py 算法
 */
export const calculate_tunnel_wall_void = (p: TunnelWallVoidParams) => {
  const R = p.R;
  const t = p.t;
  const q_v = p.q_v; // kPa
  const q_h = p.q_h; // kPa
  const theta_void_rad = (p.theta_void * Math.PI) / 180;
  const void_width_rad = (p.void_width * Math.PI) / 180;
  const void_factor = p.void_factor;

  const A = t;               // m²/m
  const W = (t * t) / 6;     // m³/m

  const steps = 360;
  const profile: Array<{
    angle: number;
    M0: number;
    M_void: number;
    N: number;
    sigma_inner: number;
    sigma_outer: number;
    moment_change_rate: number;
  }> = [];

  let max_sigma_outer = -Infinity;
  let max_sigma_angle = 0;
  let max_moment_rate = 0;

  for (let i = 0; i <= steps; i++) {
    const angle_deg = i;
    const theta_rad = (angle_deg * Math.PI) / 180;

    // 考虑脱空区的有效水平压力 qh_eff
    const angle_diff = Math.abs(Math.atan2(Math.sin(theta_rad - theta_void_rad), Math.cos(theta_rad - theta_void_rad)));
    const is_in_void = angle_diff <= void_width_rad;
    const qh_eff = is_in_void ? q_h * void_factor : q_h;

    // 无脱空基准弯矩 M0 (kN·m/m)
    const M0 = 0.25 * (q_v - q_h) * R * R * Math.cos(2 * theta_rad);

    // 脱空工况下弯矩 M_void (kN·m/m) 与 轴力 N (kN/m)
    const M_void = 0.25 * (q_v - qh_eff) * R * R * Math.cos(2 * theta_rad);
    const N = 0.5 * (q_v + qh_eff) * R;

    // 应力计算 (Pa -> MPa)
    // N/A 压应力为正，弯矩引发的应力 M/W
    const sigma_inner = (N / A - M_void / W) / 1000; // MPa
    const sigma_outer = (N / A + M_void / W) / 1000; // MPa

    // 局部弯矩变化率 ΔM / M0
    let rate = 0;
    if (Math.abs(M0) > 1e-3) {
      rate = (Math.abs(M_void - M0) / Math.abs(M0)) * 100;
    }

    if (sigma_outer > max_sigma_outer) {
      max_sigma_outer = sigma_outer;
      max_sigma_angle = angle_deg;
    }
    if (rate > max_moment_rate) {
      max_moment_rate = rate;
    }

    profile.push({
      angle: angle_deg,
      M0: parseFloat(M0.toFixed(2)),
      M_void: parseFloat(M_void.toFixed(2)),
      N: parseFloat(N.toFixed(1)),
      sigma_inner: parseFloat(sigma_inner.toFixed(2)),
      sigma_outer: parseFloat(sigma_outer.toFixed(2)),
      moment_change_rate: parseFloat(rate.toFixed(1))
    });
  }

  const void_arc_length = 2 * R * void_width_rad; // 脱空弧长 (m)
  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (max_sigma_outer > 1.5 || max_moment_rate > 100) status = 'critical';
  else if (max_sigma_outer > 0.5 || max_moment_rate > 30) status = 'warning';

  return {
    max_sigma_outer,
    max_sigma_angle,
    max_moment_rate,
    void_arc_length,
    profile,
    status
  };
};

export const calculate_tunnel_void = (params: {
  angle: number,   // 脱空弧度 (deg)
  depth: number,   // 空洞深度 (mm)
  radius: number,  // 隧道半径 (m)
}) => {
  return calculate_tunnel_wall_void({
    R: params.radius || 3.0,
    t: 0.3,
    E: 30,
    q_v: 200,
    q_h: 100,
    theta_void: 90,
    void_width: (params.angle || 60) / 2,
    void_factor: 0.0
  });
};

/**
 * 4. 坍塌封堵体积与高度计算 (Tunnel Collapse & Blockage)
 */
export const calculate_tunnel_collapse = (params: {
  B: number,      // 跨度
  Ht: number,     // 高度
  rockClass: number, // 围岩级别 (1-6)
  collapse_length: number // 长度
}) => {
  const f_map: Record<number, number> = { 1: 10, 2: 6, 3: 4, 4: 1.5, 5: 0.8, 6: 0.4 };
  const f = f_map[params.rockClass] || 0.5;
  
  const hq = (params.B / 2) / Math.max(0.01, f); 
  const volume = 0.66 * params.B * hq * params.collapse_length;
  const blockage_ratio = Math.min(100, (hq / Math.max(0.01, params.Ht)) * 100);
  
  return {
    hq,
    volume,
    blockage_ratio,
    status: blockage_ratio > 70 ? 'blocked' : 'restricted'
  };
};

export interface RockPlasticCollapseParams {
  E: number;             // 围岩弹性模量 (GPa, 默认 30)
  nu: number;            // 泊松比 (默认 0.2)
  sigma_y: number;       // 围岩屈服强度 (MPa, 默认 5.0)
  sigma_x0: number;      // 初始水平地应力 (MPa, 压为负，如 -0.15)
  sigma_y0: number;      // 初始竖向地应力 (MPa, 压为负，如 -0.20)
  max_strain: number;    // 最大施加竖向压缩应变 (如 -0.0015)
  tunnel_span: number;   // 隧道跨度 B (m, 默认 10.0)
  collapse_length: number; // 坍塌段长度 L (m, 默认 15.0)
}

/**
 * Mises 理想弹塑性（平面应变）围岩塑性应变与坍塌封堵体积求解引擎
 * 转换自 围岩等效塑性应变.py
 */
export const calculate_rock_plastic_collapse = (p: RockPlasticCollapseParams) => {
  const E = p.E * 1e6;       // 转换为 kPa
  const nu = p.nu;
  const sigma_y = p.sigma_y * 1000; // 转换为 kPa
  const G = E / (2 * (1 + nu));
  const K = E / (3 * (1 - 2 * nu));

  const sigma_x0 = p.sigma_x0 * 1000; // kPa
  const sigma_y0 = p.sigma_y0 * 1000; // kPa
  const sigma_z0 = nu * (sigma_x0 + sigma_y0);
  let sigma = [sigma_x0, sigma_y0, sigma_z0, 0.0]; // [sx, sy, sz, txy]

  const n_steps = 100;
  const delta_eps_y = p.max_strain / n_steps;
  let ep_eq_total = 0;
  const history: { step: number; ep_eq: number; sigma_mises: number }[] = [];

  for (let step = 0; step < n_steps; step++) {
    const d_eps = [0.0, delta_eps_y, 0.0]; // [dex, dey, dgxy]
    const d_ev = d_eps[0] + d_eps[1];
    const d_p = K * d_ev;

    const d_ed = [
      d_eps[0] - d_ev / 3,
      d_eps[1] - d_ev / 3,
      -d_ev / 3,
      d_eps[2] / 2
    ];

    const s_trial = [
      (sigma[0] - (sigma[0]+sigma[1]+sigma[2])/3) + 2*G*d_ed[0],
      (sigma[1] - (sigma[0]+sigma[1]+sigma[2])/3) + 2*G*d_ed[1],
      (sigma[2] - (sigma[0]+sigma[1]+sigma[2])/3) + 2*G*d_ed[2],
      sigma[3] + 2*G*d_ed[3]
    ];

    const p_trial = (sigma[0]+sigma[1]+sigma[2])/3 + d_p;
    const J2 = 0.5 * (s_trial[0]**2 + s_trial[1]**2 + s_trial[2]**2) + s_trial[3]**2;
    const q_trial = Math.sqrt(3 * J2);

    let d_ep_eq = 0;
    if (q_trial > sigma_y) {
      d_ep_eq = (q_trial - sigma_y) / (3 * G);
      const factor = sigma_y / Math.max(1e-6, q_trial);
      sigma = [
        s_trial[0] * factor + p_trial,
        s_trial[1] * factor + p_trial,
        s_trial[2] * factor + p_trial,
        s_trial[3] * factor
      ];
    } else {
      sigma = [
        s_trial[0] + p_trial,
        s_trial[1] + p_trial,
        s_trial[2] + p_trial,
        s_trial[3]
      ];
    }

    ep_eq_total += d_ep_eq;
    const current_J2 = 0.5 * (Math.pow(sigma[0]-(sigma[0]+sigma[1]+sigma[2])/3, 2) + Math.pow(sigma[1]-(sigma[0]+sigma[1]+sigma[2])/3, 2) + Math.pow(sigma[2]-(sigma[0]+sigma[1]+sigma[2])/3, 2)) + Math.pow(sigma[3], 2);
    
    history.push({
      step: step + 1,
      ep_eq: ep_eq_total,
      sigma_mises: Math.sqrt(3 * current_J2) / 1000 // MPa
    });
  }

  // 坍塌体积与回填需浆量估算 (m³/m 及总 m³)
  const collapse_height = Math.min(p.tunnel_span * 0.8, ep_eq_total * 2000); // 坍塌高度 (m)
  const V_collapse_per_m = 0.5 * p.tunnel_span * collapse_height; // m³/m
  const V_plugging = V_collapse_per_m * p.collapse_length * 1.25;  // 考虑到充填余量的总需浆量 (m³)

  let status: 'safe' | 'warning' | 'critical' = 'safe';
  if (ep_eq_total > 0.001) status = 'critical';
  else if (ep_eq_total > 0) status = 'warning';

  return {
    ep_eq_total,
    sigma_mises: history[history.length - 1].sigma_mises,
    V_collapse_per_m,
    V_plugging,
    history,
    final_stresses: {
      sx: (sigma[0] / 1000).toFixed(2),
      sy: (sigma[1] / 1000).toFixed(2),
      sz: (sigma[2] / 1000).toFixed(2),
      txy: (sigma[3] / 1000).toFixed(2)
    },
    status
  };
};

