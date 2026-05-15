/**
 * 道路：支挡失效 (Retaining Structure Failure)
 * 核心逻辑：基于土压力与静水压力的抗滑/抗倾覆验算
 */
export const calculate_retaining_wall = (params: { H: number, gamma: number, phi: number, waterHeight: number, friction_base: number, wall_weight: number, wall_width: number }) => {
    const Ka = Math.pow(Math.tan((45 - params.phi / 2) * Math.PI / 180), 2);
    const Ea_soil = 0.5 * params.gamma * Math.pow(params.H, 2) * Ka;
    const Ea_water = 0.5 * 10.0 * Math.pow(params.waterHeight, 2); 
    const Total_Force_X = Ea_soil + Ea_water;
    const Resisting_Force_X = params.wall_weight * params.friction_base;
    const FS_slide = Resisting_Force_X / Total_Force_X;
    const Overturn_Moment = Ea_soil * (params.H / 3) + Ea_water * (params.waterHeight / 3);
    const Resisting_Moment = params.wall_weight * (params.wall_width / 2);
    const FS_overt = Resisting_Moment / Overturn_Moment;
    return { FS_slide, FS_overt, Total_Force_X };
};

/**
 * 桥梁：梁体垮塌/落梁 (Girder Unseating)
 * 核心逻辑：基于主梁跨径与墩顶相对偏移量的支承长度验算
 */
export const calculate_girder_unseating = (params: { span_length: number, support_length: number, pier_disp_cm: number }) => {
    // 规范临界支承长度 N_req (简易公式，单位：cm)
    const N_req = 70 + 0.5 * params.span_length; 
    // 剩余有效搭接长度
    const remaining_support = params.support_length - params.pier_disp_cm;
    // 风险系数：>1表示落梁垮塌
    const risk_ratio = params.pier_disp_cm / params.support_length;
    const is_unseated = remaining_support <= 0;
    
    return { N_req, remaining_support, risk_ratio, is_unseated };
};

/**
 * 隧道：坍塌封堵 (Collapse & Blockage)
 * 核心逻辑：基于普氏理论 (Protodyakonov arch) 计算坍塌高度与侵入限界比例
 */
export const calculate_tunnel_collapse = (params: { B: number, Ht: number, f: number, collapse_length: number }) => {
    // f 为围岩坚固系数，越破碎 f 越小
    const hq = params.B / (2 * Math.max(0.1, params.f)); // 坍塌拱高度
    const blockage_ratio = Math.min(100, (hq / params.Ht) * 100); // 堵塞限界比例
    // 预估塌方体积 (假设抛物线体)
    const volume = 0.66 * params.B * hq * params.collapse_length; 
    
    return { hq, blockage_ratio, volume };
};

/**
 * 道路：边坡失稳 (Slope Instability)
 * 核心逻辑：简化瑞典条分法抗滑稳定性判定
 */
export const calculate_slope_instability = (params: { height: number, angle: number, cohesion: number, friction_angle: number, gamma: number }) => {
    const alpha_rad = (params.angle * Math.PI) / 180;
    const phi_rad = (params.friction_angle * Math.PI) / 180;
    const weight = 0.5 * params.gamma * Math.pow(params.height, 2) / Math.tan(alpha_rad);
    const driving_force = weight * Math.sin(alpha_rad);
    const resisting_force = (weight * Math.cos(alpha_rad) * Math.tan(phi_rad)) + (params.cohesion * (params.height / Math.sin(alpha_rad)));
    const FS = resisting_force / driving_force;
    return { FS, driving_force, resisting_force };
};

/**
 * 桥梁：基础冲刷 (Foundation Scour)
 * 核心逻辑：基于 HEC-18 简化公式的局部冲刷深度预估
 */
export const calculate_pier_scour = (params: { v: number, y: number, b: number, K1: number }) => {
    // ys/y = 2.0 * K1 * (b/y)^0.65 * Fr^0.43 (Fr 为弗劳德数)
    const g = 9.81;
    const Fr = params.v / Math.sqrt(g * params.y);
    const ys = params.y * 2.0 * params.K1 * Math.pow(params.b / params.y, 0.65) * Math.pow(Fr, 0.43);
    return { ys, Fr };
};

/**
 * 隧道：突泥涌水 (Water/Mud Inflow)
 * 核心逻辑：基于 Darcy 定律与静水压力梯度的涌水量估算
 */
export const calculate_tunnel_leakage = (params: { k: number, H_water: number, A_face: number, L_tunnel: number }) => {
    // Q = k * i * A (简化达西定律)
    const i = params.H_water / params.L_tunnel; // 水力坡降
    const Q = params.k * i * params.A_face * 3600; // m³/h
    return { Q, i };
};
