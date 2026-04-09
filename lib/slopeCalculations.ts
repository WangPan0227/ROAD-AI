// 文件路径: lib/slopeCalculations.ts

// 1. 统一工程与经济配置 (对应 Python 的 ProjectConfig)
export const DEFAULT_CONFIG = {
    Geometry: {
        H: 10.0,
        beta: 45.0,
        W_slope: 30.0
    },
    Geotech: {
        soil_layers: [
            { top_elev: 10.0, gamma: 18.0, c: 10.0, phi: 15.0, desc: "粉质粘土" },
            { top_elev: 5.0, gamma: 20.0, c: 25.0, phi: 22.0, desc: "强风化岩" },
            { top_elev: 0.0, gamma: 22.0, c: 50.0, phi: 30.0, desc: "中风化岩" }
        ],
        tau_bond: 60.0
    },
    Water: {
        has_water: true,
        y_gwt: 4.0,
        gamma_w: 9.81
    },
    Seismic: {
        k_h: 0.1
    },
    Target: {
        FS_target: 1.15
    },
    Economics: {
        cost_pile: [550.0, 40.0],   // [造价/百米, 进度/天]
        cost_anchor: [220.0, 60.0],
        cost_cut: [35.0, 500.0],
        cost_berm: [55.0, 300.0]
    }
};

// 2. 系统材料库与结构库
const MATERIAL_LIB = {
    Steel_Q345: { f_y: 345000.0, desc: "Q345高强钢管" },
    Strand_1860: { f_y: 1860000.0, desc: "1860级高强钢绞线" }
};

class StructureLib {
    static get_pile_bending_capacity(D: number, t_wall = 0.012, mat_key: 'Steel_Q345' | 'Strand_1860' = "Steel_Q345") {
        const f_y = MATERIAL_LIB[mat_key].f_y;
        const d = Math.max(D - 2 * t_wall, 0.001);
        return f_y * (Math.PI * (Math.pow(D, 4) - Math.pow(d, 4)) / (32 * D));
    }

    static get_anchor_tensile_capacity(d_diameter = 0.0152, count = 2, mat_key: 'Steel_Q345' | 'Strand_1860' = "Strand_1860") {
        return MATERIAL_LIB[mat_key].f_y * count * (Math.PI * Math.pow(d_diameter, 2) / 4.0);
    }
}

// 辅助函数：生成等差数列 (替代 numpy.linspace)
const linspace = (start: number, end: number, num: number) => {
    const step = (end - start) / (num - 1);
    return Array.from({ length: num }, (_, i) => start + step * i);
};

// 3. 动态几何与岩土引擎
export const get_original_elevation = (x: number, H: number, beta_rad: number) => {
    const L_slope = H / Math.tan(beta_rad);
    if (x <= 0) return 0.0;
    if (x < L_slope) return x * Math.tan(beta_rad);
    return H;
};

// 替换 lib/slopeCalculations.ts 中的 get_soil_properties 函数
const get_soil_properties = (y: number, layers: any[]) => {
    let current_layer = layers[0]; // 默认最顶层
    for (const layer of layers) {
        if (y <= layer.top_elev) {
            current_layer = layer;
        }
    }
    return { gamma: current_layer.gamma, c: current_layer.c, phi: current_layer.phi };
};

// 替换 lib/slopeCalculations.ts 中的 compute_stability 函数
export const compute_stability = (geom_func: (x: number) => number, H_max: number, beta_rad: number, cfg: any) => {
    const { soil_layers, ...water } = cfg;
    const layers = cfg.Geotech.soil_layers;
    const seismic = cfg.Seismic;
    const damage = cfg.Damage; 
    const L_slope = H_max / Math.tan(beta_rad);

    // 提高搜索网格密度
    const xc_grid = linspace(-0.8 * H_max, L_slope + 0.8 * H_max, 25); 
    const yc_grid = linspace(H_max + 0.1 * H_max, H_max + 3.0 * H_max, 25);

    let min_FS = 999.0;
    let best_T = 0, best_R = 0, best_slip_depth = 0;
    let best_circle: [number, number, number] = [0, 0, 0];

    for (const Xc of xc_grid) {
        for (const Yc of yc_grid) {
            const R_min = Yc - H_max + 0.1;
            const Math_hypot = Math.sqrt(Xc * Xc + Yc * Yc);
            const R_max = Math_hypot + 2.0;
            if (R_min > R_max) continue;

            const r_grid = linspace(R_min, R_max, 15);
            for (const R of r_grid) {
                const x_samples = linspace(Xc - R + 0.01, Xc + R - 0.01, 50); // 增加采样点
                const x_slip = x_samples.filter(x => (Yc - Math.sqrt(Math.max(0, R * R - Math.pow(x - Xc, 2)))) < geom_func(x));
                
                if (x_slip.length < 3) continue;
                let x_start = x_slip[0];
                let x_end = x_slip[x_slip.length - 1];

                // 剔除过浅的无意义滑面 (防止出现剥落式假滑面)
                if (x_end - x_start < 0.3 * H_max) continue; 

// ================= 修复：张裂缝精确水平位置截断算法 =================
                let crack_water_force = 0;
                
                if (damage && damage.crack_depth > 0) {
                    const hc = damage.crack_depth;
                    // 【关键变更】：读取前端传来的具体水平位置
                    const crack_x = L_slope + (damage.crack_distance || 0); 
                    
                    // 检查这条裂缝是否落在当前的滑动体范围内
                    if (crack_x > x_start && crack_x < x_end) {
                        const val = R * R - Math.pow(crack_x - Xc, 2);
                        if (val > 0) {
                            const y_intersect = Yc - Math.sqrt(val);
                            // 如果滑面在此处的高程，高于裂缝底部高程，说明滑面被裂缝切断了！
                            if (y_intersect >= H_max - hc) {
                                x_end = crack_x; // 强制将滑面终点锁定在裂缝水平位置
                                
                                // 计算静水推力 (水压作用于裂缝侧壁)
                                if (damage.add_water_pressure) {
                                    crack_water_force = 0.5 * 9.81 * Math.pow(hc, 2);
                                }
                            }
                        }
                    }
                }
                // =================================================================
                // ==========================================================

                const num_slices = 30; 
                const b = (x_end - x_start) / num_slices;
                let max_depth = 0.0;
                let valid_circle = true;
                const slices = [];

                for (let i = 0; i < num_slices; i++) {
                    const xm = x_start + (i + 0.5) * b;
                    const y_circ = Yc - Math.sqrt(Math.max(0, R * R - Math.pow(xm - Xc, 2)));
                    const y_surf = geom_func(xm);
                    const h = y_surf - y_circ;
                    if (h <= 0) { valid_circle = false; break; }

                    max_depth = Math.max(max_depth, h);
                    const alpha = Math.asin(Math.max(-0.99, Math.min(0.99, (xm - Xc) / R)));
                    
                    // 多层土提取
                    const props_base = get_soil_properties(y_circ, layers);
                    const props_avg = get_soil_properties((y_surf + y_circ) / 2.0, layers);
                    
                    const W = props_avg.gamma * h * b;
                    const u = (cfg.Water.has_water && y_circ < cfg.Water.y_gwt) ? cfg.Water.gamma_w * (cfg.Water.y_gwt - y_circ) : 0.0;

                    // ================= 修复：仅作全局参数折减 =================
                    let s_c = props_base.c;
                    let s_phi = props_base.phi;

                    if (damage) {
                        s_c *= damage.c_factor;
                        s_phi *= damage.phi_factor;
                    }
                    // =======================================================

                    slices.push({ W, alpha, b, c: s_c, phi: s_phi * Math.PI / 180, u });
                }

                if (!valid_circle) continue;

                // 计算总驱动力：加上地震力，加上裂缝静水推力
                const T_drive = slices.reduce((sum, s) => sum + s.W * Math.sin(s.alpha) + seismic.k_h * s.W * Math.cos(s.alpha), 0) + crack_water_force;
                if (T_drive <= 0) continue;

                let FS_calc = 1.0;
                let R_resist = 0.0;
                for (let iter = 0; iter < 15; iter++) {
                    R_resist = 0.0;
                    for (const s of slices) {
                        const N_eff = Math.max(s.W - s.u * s.b * Math.cos(s.alpha) - seismic.k_h * s.W * Math.sin(s.alpha), 0.0);
                        const m_alpha = Math.max(0.01, Math.cos(s.alpha) * (1.0 + Math.tan(s.alpha) * Math.tan(s.phi) / FS_calc));
                        R_resist += (s.c * s.b + N_eff * Math.tan(s.phi)) / m_alpha;
                    }
                    const FS_new = R_resist / T_drive;
                    if (Math.abs(FS_new - FS_calc) < 1e-3) break;
                    FS_calc = FS_new;
                }

                if (FS_calc > 0 && FS_calc < min_FS) {
                    min_FS = FS_calc;
                    best_T = T_drive;
                    best_R = R_resist;
                    best_slip_depth = max_depth;
                    // 保存截断后的 x_end，以便前端完美绘图
                    best_circle = [Xc, Yc, R, x_end]; 
                }
            }
        }
    }

    return { min_FS, best_T, best_R, best_slip_depth, best_circle };
};

// 4. 加固推演模块 (结构力学补偿算法库)
const calc_structural_compensation = (
    R_req_unit: number, T_unit: number, R_soil_unit: number, slip_depth: number, 
    cfg: any, orig_circle: [number, number, number], prefix: string, 
    geo_cost = 0, geo_time = 0, geo_param = "", geo_plot_data: any = null
) => {
    const solutions = [];
    const M_u = StructureLib.get_pile_bending_capacity(0.2);
    const T_struct = StructureLib.get_anchor_tensile_capacity();
    const tau = cfg.Geotech.tau_bond;
    const W_slope = cfg.Geometry.W_slope;
    const eco = cfg.Economics;

    // 1. 尝试纯桩
    let best_p_cost = Infinity, best_p_sol = null;
    for (const L of [8, 10, 12, 15]) {
        for (const spacing of [1.0, 1.2, 1.5]) {
            const Q_single = Math.min(Math.max((L - slip_depth) * 60.0, 0.0), M_u / (slip_depth / 2 + 0.1));
            const R_prov = Q_single / spacing;
            if (R_prov >= R_req_unit) {
                const n_total = Math.floor(W_slope / spacing) + 1;
                const cost = geo_cost + (n_total * L * eco.cost_pile[0] / 10000);
                if (cost < best_p_cost) {
                    best_p_cost = cost;
                    const p_data = geo_plot_data ? { ...geo_plot_data } : { type: "orig", circle: orig_circle };
                    Object.assign(p_data, { sub_type: "pile", L, spacing });
                    best_p_sol = {
                        Method: prefix + "微型桩",
                        FS: Number(((R_soil_unit + R_prov) / T_unit).toFixed(3)),
                        Cost_W: cost,
                        Time_d: geo_time + (n_total * L / eco.cost_pile[1]),
                        Param: geo_param + `桩L=${L}m,@=${spacing}m`,
                        Plot_Data: p_data
                    };
                }
            }
        }
    }
    if (best_p_sol) solutions.push(best_p_sol);

    // 2. 尝试纯锚
    let best_a_cost = Infinity, best_a_sol = null;
    for (const L_bond of [6, 8, 10]) {
        for (const spacing of [1.5, 2.0, 2.5]) {
            const T_design = Math.min(Math.PI * 0.15 * L_bond * tau, T_struct) / 1.5;
            const R_prov = (T_design * Math.cos((15 - 30) * Math.PI / 180)) / spacing;
            if (R_prov >= R_req_unit) {
                const total_L = (L_bond + 5) * (Math.floor(W_slope / spacing) + 1);
                const cost = geo_cost + (total_L * eco.cost_anchor[0] / 10000);
                if (cost < best_a_cost) {
                    best_a_cost = cost;
                    const p_data = geo_plot_data ? { ...geo_plot_data } : { type: "orig", circle: orig_circle };
                    Object.assign(p_data, { sub_type: "anchor", L_total: L_bond + 5, spacing });
                    best_a_sol = {
                        Method: prefix + "锚索",
                        FS: Number(((R_soil_unit + R_prov) / T_unit).toFixed(3)),
                        Cost_W: cost,
                        Time_d: geo_time + (total_L / eco.cost_anchor[1]),
                        Param: geo_param + `锚固L_b=${L_bond}m,@=${spacing}m`,
                        Plot_Data: p_data
                    };
                }
            }
        }
    }
    if (best_a_sol) solutions.push(best_a_sol);

    // 3. 尝试桩锚联合
    const R_req_half = R_req_unit * 0.5;
    if (R_req_half > 0) {
        let best_half_p_cost = Infinity, best_half_p_params: any = null;
        for (const L of [8, 10, 12]) {
            for (const spacing of [1.5, 2.0]) {
                const Q_single = Math.min(Math.max((L - slip_depth) * 60.0, 0.0), M_u / (slip_depth / 2 + 0.1));
                if (Q_single / spacing >= R_req_half) {
                    const n_t = Math.floor(W_slope / spacing) + 1;
                    const c = n_t * L * eco.cost_pile[0] / 10000;
                    if (c < best_half_p_cost) {
                        best_half_p_cost = c;
                        best_half_p_params = { L, s: spacing, R: Q_single / spacing, time: n_t * L / eco.cost_pile[1] };
                    }
                }
            }
        }

        let best_half_a_cost = Infinity, best_half_a_params: any = null;
        for (const L_bond of [4, 6, 8]) {
            for (const spacing of [2.0, 2.5, 3.0]) {
                const T_design = Math.min(Math.PI * 0.15 * L_bond * tau, T_struct) / 1.5;
                const R_prov = (T_design * Math.cos((15 - 30) * Math.PI / 180)) / spacing;
                if (R_prov >= R_req_half) {
                    const t_L = (L_bond + 5) * (Math.floor(W_slope / spacing) + 1);
                    const c = t_L * eco.cost_anchor[0] / 10000;
                    if (c < best_half_a_cost) {
                        best_half_a_cost = c;
                        best_half_a_params = { Lb: L_bond, s: spacing, R: R_prov, time: t_L / eco.cost_anchor[1] };
                    }
                }
            }
        }

        if (best_half_p_params && best_half_a_params) {
            const cost = geo_cost + best_half_p_cost + best_half_a_cost;
            const p_data = geo_plot_data ? { ...geo_plot_data } : { type: "orig", circle: orig_circle };
            Object.assign(p_data, {
                sub_type: "pile_anchor",
                L: best_half_p_params.L,
                L_total: best_half_a_params.Lb + 5,
                spacing: Math.max(best_half_p_params.s, best_half_a_params.s)
            });

            solutions.push({
                Method: prefix + "桩锚联合",
                FS: Number(((R_soil_unit + best_half_p_params.R + best_half_a_params.R) / T_unit).toFixed(3)),
                Cost_W: cost,
                Time_d: geo_time + best_half_p_params.time + best_half_a_params.time,
                Param: geo_param + `桩L=${best_half_p_params.L}m,@=${best_half_p_params.s}m\n锚Lb=${best_half_a_params.Lb}m,@=${best_half_a_params.s}m`,
                Plot_Data: p_data
            });
        }
    }

    return solutions;
};

// 5. 生成组合矩阵 (对应 Python 的 eval_all_combinations_matrix)
export const eval_all_combinations_matrix = (geom: any, cfg: any, target_FS: number, T0: number, R0: number, slip0: number, circ0: [number, number, number]) => {
    const all_schemes = [];
    const eco = cfg.Economics;
    const orig_geom = (x: number) => get_original_elevation(x, geom.H, geom.beta * Math.PI / 180);

    // 状态 A0：原状地形 + 结构
    const R_req_0 = Math.max(target_FS * T0 - R0, 0.0);
    if (R_req_0 > 0) {
        all_schemes.push(...calc_structural_compensation(R_req_0, T0, R0, slip0, cfg, circ0, ""));
    }

    // 状态 A1/A2：削方减载
    for (const cut_ratio of [1.2, 1.5]) {
        const beta_new = Math.atan(1.0 / cut_ratio);
        const cut_geom = (x: number) => Math.min(orig_geom(x), get_original_elevation(x, geom.H, beta_new));
        const { min_FS: FS_c, best_T: T_c, best_R: R_c, best_slip_depth: slip_c, best_circle: circ_c } = compute_stability(cut_geom, geom.H, geom.beta * Math.PI / 180, cfg);
        
        const vol_c = 0.5 * Math.pow(geom.H, 2) * (cut_ratio - 1.0 / Math.tan(geom.beta * Math.PI / 180)) * geom.W_slope;
        const cost_c = vol_c * eco.cost_cut[0] / 10000;
        const time_c = vol_c / eco.cost_cut[1];
        const param_c = `削坡1:${cut_ratio}\n`;
        const plot_data_c = { type: "cut", ratio: cut_ratio, circle: circ_c };

        if (FS_c >= target_FS) {
            all_schemes.push({
                Method: `纯削坡(1:${cut_ratio})`, FS: Number(FS_c.toFixed(3)), Cost_W: cost_c, Time_d: time_c,
                Param: `挖方=${Math.floor(vol_c)}m³`, Plot_Data: plot_data_c
            });
        } else {
            const R_req_c = Math.max(target_FS * T_c - R_c, 0.0);
            all_schemes.push(...calc_structural_compensation(R_req_c, T_c, R_c, slip_c, cfg, circ_c, `削坡(1:${cut_ratio})+`, cost_c, time_c, param_c, plot_data_c));
        }
    }

    // 状态 A3/A4：坡脚压重
    for (const [H_b, B_b] of [[2.0, 3.0], [3.0, 5.0]]) {
        const berm_geom = (x: number) => Math.max(orig_geom(x), x <= B_b ? H_b : Math.max(0, H_b - (x - B_b) * Math.tan(geom.beta * Math.PI / 180)));
        const { min_FS: FS_b, best_T: T_b, best_R: R_b, best_slip_depth: slip_b, best_circle: circ_b } = compute_stability(berm_geom, geom.H, geom.beta * Math.PI / 180, cfg);
        
        const vol_b = (H_b * B_b + 0.5 * H_b * (H_b / Math.tan(geom.beta * Math.PI / 180))) * geom.W_slope;
        const cost_b = vol_b * eco.cost_berm[0] / 10000;
        const time_b = vol_b / eco.cost_berm[1];
        const param_b = `压重(${H_b}x${B_b})\n`;
        const plot_data_b = { type: "berm", H: H_b, B: B_b, circle: circ_b };

        if (FS_b >= target_FS) {
            all_schemes.push({
                Method: `纯压重(${H_b}x${B_b}m)`, FS: Number(FS_b.toFixed(3)), Cost_W: cost_b, Time_d: time_b,
                Param: `填方=${Math.floor(vol_b)}m³`, Plot_Data: plot_data_b
            });
        } else {
            const R_req_b = Math.max(target_FS * T_b - R_b, 0.0);
            all_schemes.push(...calc_structural_compensation(R_req_b, T_b, R_b, slip_b, cfg, circ_b, "压重+", cost_b, time_b, param_b, plot_data_b));
        }
    }

    // 按照造价全局排序
    return all_schemes.sort((a, b) => a.Cost_W - b.Cost_W);
};