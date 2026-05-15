
/**
 * 支挡失效物理引擎 (Retaining Wall Failure Physics Engine)
 * 核心逻辑：基于土压力、水压力与墙身自重的抗滑、抗倾覆稳定性验算
 */

export interface RetainingParams {
  H: number;           // 墙高 (m)
  gamma: number;       // 填土重度 (kN/m3)
  phi: number;         // 填土内摩擦角 (deg)
  c: number;           // 填土粘聚力 (kPa)
  delta: number;       // 墙背摩擦角 (deg), 通常取 phi/2 或 0
  waterHeight: number; // 墙后积水位高度 (m)
  friction_base: number; // 基底摩擦系数 mu
  wall_weight: number; // 墙身自重 (kN/m)
  wall_width: number;  // 墙身底宽 (m)
}

export interface RetainingResult {
  Ea: number;          // 主动土压力 (kN/m)
  Ew: number;          // 静水压力 (kN/m)
  Total_Driving_Force: number; // 总推力 (kN/m)
  Resisting_Force: number;     // 抗滑力 (kN/m)
  FS_slide: number;    // 抗滑安全系数
  Overturn_Moment: number;     // 倾覆力矩 (kN.m/m)
  Resisting_Moment: number;    // 抗倾覆力矩 (kN.m/m)
  FS_overt: number;    // 抗倾覆安全系数
  status: 'safe' | 'warning' | 'danger';
}

export const calculate_retaining_wall = (params: RetainingParams): RetainingResult => {
  const { H, gamma, phi, c, delta = 0, waterHeight, friction_base, wall_weight, wall_width } = params;
  
  // 1. 朗肯主动土压力系数 Ka (简化考虑，不考虑粘聚力对 Ka 的复杂影响，仅用于基本示例)
  // 更加准确的 Ka 应考虑 c，但这里按简易土压力模型：pa = gamma*z*Ka - 2c*sqrt(Ka)
  const phi_rad = (phi * Math.PI) / 180;
  const Ka = Math.pow(Math.tan((45 - phi / 2) * Math.PI / 180), 2);
  
  // 主动土压力 Ea (合力)
  // Ea = 0.5 * gamma * H^2 * Ka - 2c * sqrt(Ka) * H
  // 注意：如果 2c*sqrt(Ka)*H 过大，Ea 可能为负，通常取 0
  let Ea = 0.5 * gamma * Math.pow(H, 2) * Ka - 2 * c * Math.sqrt(Ka) * H;
  if (Ea < 0) Ea = 0;
  
  // 2. 静水压力 Ew
  // Ew = 0.5 * gamma_w * hw^2, gamma_w = 10.0 kN/m3
  const gamma_w = 10.0;
  const Ew = 0.5 * gamma_w * Math.pow(waterHeight, 2);
  
  // 3. 总水平推力
  const Total_Driving_Force = Ea + Ew;
  
  // 4. 抗滑力
  // Fr = W * mu
  const Resisting_Force = wall_weight * friction_base;
  const FS_slide = Resisting_Force / Math.max(0.001, Total_Driving_Force);
  
  // 5. 力矩计算 (以墙趾为支点)
  // 倾覆力矩 Mo
  // 土压力作用点 H/3, 水压力作用点 waterH/3
  const Mo = Ea * (H / 3) + Ew * (waterHeight / 3);
  
  // 抗倾覆力矩 Mr
  // W 作用于 wall_width/2 (假设重力式挡墙重心居中)
  const Mr = wall_weight * (wall_width / 2.0);
  
  const FS_overt = Mr / Math.max(0.001, Mo);
  
  // 6. 状态研判
  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (FS_slide < 1.1 || FS_overt < 1.3) status = 'danger';
  else if (FS_slide < 1.3 || FS_overt < 1.5) status = 'warning';
  
  return {
    Ea,
    Ew,
    Total_Driving_Force,
    Resisting_Force,
    FS_slide,
    Overturn_Moment: Mo,
    Resisting_Moment: Mr,
    FS_overt,
    status
  };
};
