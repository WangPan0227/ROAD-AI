
import { Indicator, Disease, ReinforcementMeasure, CaseStudy, HistoricalCase } from './types';

export const INDICATORS: Indicator[] = [
  {
    name: '路基技术状况指数',
    symbol: 'SCI',
    description: '表征路基完好程度的综合指数。由路肩(VSCI)、路堤与路床(ESCI)、边坡(SSCI)、防护及支挡(RSCI)、排水设施(DSCI)五个分项指标组成。',
    method: '根据路基病害扣分标准计算：SCI = VSCI×ω_V + ESCI×ω_E + SSCI×ω_S + RSCI×ω_R + DSCI×ω_D。',
    standard: '优≥90, 良≥80, 中≥70, 次≥60, 差<60',
    category: '综合评价指标'
  },
  {
    name: '抗剪强度',
    symbol: 'τ (c, φ)',
    description: '土体抵抗剪切破坏的极限能力，由黏聚力(c)和内摩擦角(φ)组成。长时间饱水会造成土体软化，抗剪强度显著降低，是诱发路基边坡失稳的核心力学指标。',
    method: '直剪试验、三轴压缩试验。',
    standard: '根据具体土质和设计要求确定。饱水状态下c、φ值通常大幅衰减。',
    category: '力学强度指标'
  },
  {
    name: '加州承载比',
    symbol: 'CBR',
    description: '反映路基土抵抗局部剪切破坏能力的指标。路基换填改良时，填料的CBR值必须满足规范要求。',
    method: '室内或现场CBR试验 (JTG E40)。',
    standard: '高速/一级公路：路床(0-30cm)≥8%，路堤≥4% (填方)。',
    category: '力学强度指标'
  },
  {
    name: '压实度',
    symbol: 'K',
    description: '土或其他筑路材料压实后的干密度与标准最大干密度之比。压实度不足是导致路堤不均匀沉降的主要原因之一。',
    method: '灌砂法、环刀法、核子密度仪法。',
    standard: '高速/一级公路：上路床≥96%, 上路堤≥94%, 下路堤≥93%。',
    category: '力学强度指标'
  },
  {
    name: '路面回弹模量',
    symbol: 'E',
    description: '表征路基路面整体刚度和承载能力的指标。常用于评价路基注浆加固、换填改良等处治措施的效果。',
    method: '承载板法、贝克曼梁法、落锤式弯沉仪(FWD)。',
    standard: '注浆加固后，路基强度应达到原路基的强度水平（粉土/粘土养护≥3d，砂土≥5d）。',
    category: '力学强度指标'
  },
  {
    name: '边坡稳定性系数',
    symbol: 'Fs',
    description: '沿假定滑裂面的抗滑力与下滑力之比。用于评估边坡在自重、降雨、地下水等工况下的稳定状态。',
    method: '极限平衡法 (如Bishop法、Janbu法) 或 有限元强度折减法。',
    standard: '正常工况一般≥1.30；暴雨或地震等非正常工况≥1.15。',
    category: '变形与稳定指标'
  },
  {
    name: '路基沉降量',
    symbol: 'S',
    description: '路基表面或内部的垂直变形量。差异沉降大于4cm或局部沉陷大于5cm/m时，判定为不均匀沉降病害。',
    method: '水准仪测量、沉降板监测或静力水准仪自动化监测。',
    standard: '工后沉降：桥头≤10cm, 一般路段≤30cm。',
    category: '变形与稳定指标'
  },
  {
    name: '孔隙水压力',
    symbol: 'u',
    description: '土体孔隙中水的压力。持续降雨导致地下水位上升，孔隙水压力增大，有效应力降低，是诱发滑坡（如梅大高速塌方）的关键水文因素。',
    method: '渗压计、孔隙水压力计现场监测。',
    standard: '需结合有效应力原理进行边坡稳定性验算，无统一固定限值。',
    category: '水文地质指标'
  },
  {
    name: '渗透系数',
    symbol: 'k',
    description: '反映土体透水性能的指标。渗透性差异会导致地下水在特定地层富集，形成软弱滑动面。',
    method: '常水头或变水头渗透试验、现场抽水/注水试验。',
    standard: '根据防排水设计需要确定。防渗层要求k值极小，排水层要求k值较大。',
    category: '水文地质指标'
  }
];

export const DISEASES: Disease[] = [
  {
    name: '路肩或路缘石缺损',
    category: '路肩',
    indicators: ['VSCI下降', '路肩宽度减小', '路缘石丢失'],
    description: '路肩一侧宽度小于设计宽度10cm及以上，路肩出现20cm×10cm以上的缺口，路缘石丢失、损坏、倾倒或与路面脱离透水等。',
    characteristics: '路肩边缘不齐，路缘石破损或缺失，可能导致路面边缘失去支撑。'
  },
  {
    name: '阻挡路面排水',
    category: '路肩',
    indicators: ['VSCI下降', '路面积水'],
    description: '路肩高于路面，从而阻挡路面排水。',
    characteristics: '雨后路面边缘积水，路肩处有明显阻水现象。'
  },
  {
    name: '路肩不洁',
    category: '路肩',
    indicators: ['VSCI下降', '杂物杂草'],
    description: '路肩有堆积杂物、未经修剪且高于15cm的杂草。',
    characteristics: '路肩外观脏乱，杂草丛生或有垃圾堆积。'
  },
  {
    name: '杂物堆积',
    category: '路堤与路床',
    indicators: ['ESCI下降', '垃圾堆积'],
    description: '人为倾倒的垃圾、堆积的秸秆等杂物。',
    characteristics: '路基边坡或路基范围内存在明显的人为废弃物。'
  },
  {
    name: '不均匀沉降',
    category: '路堤与路床',
    indicators: ['ESCI下降', '路面纵向波浪', '路面裂缝'],
    description: '路基出现大于4cm的差异沉降，或大于5cm/m的局部沉陷。',
    characteristics: '路面呈现波浪状或碟状凹陷，严重时伴随纵向裂缝。'
  },
  {
    name: '开裂滑移',
    category: '路堤与路床',
    indicators: ['ESCI下降', '弧形裂缝', '侧向位移'],
    description: '沿道路纵向出现弧形开裂，路基产生侧向滑动趋势。',
    characteristics: '路肩或路面出现弧形裂缝，裂缝宽度随时间增加，路基边缘下错。'
  },
  {
    name: '冻胀翻浆',
    category: '路堤与路床',
    indicators: ['ESCI下降', '路面隆起', '冒浆'],
    description: '季节性冰冻引起的路面隆起、变形，春融或多雨地区的路基在行车荷载作用下造成路面变形、破裂、冒浆等。',
    characteristics: '冬季路面冻胀隆起，春季路面松软、弹簧，车轮碾压后冒出泥浆。'
  },
  {
    name: '坡面冲刷',
    category: '边坡',
    indicators: ['SSCI下降', '冲沟深度'],
    description: '由雨水冲刷坡面形成的深度10cm以上的沟槽（含坡脚缺口）。',
    characteristics: '边坡表面出现明显的流水冲刷沟痕，严重时可能危及路基稳定。'
  },
  {
    name: '碎落崩塌',
    category: '边坡',
    indicators: ['SSCI下降', '坡面坑洞', '落石'],
    description: '路堑边坡因表层风化等产生的碎石滚落、局部崩塌等。',
    characteristics: '边坡表面有碎石滑落，坡脚处有碎石堆积，坡面形成坑洞或缺陷。'
  },
  {
    name: '局部坍塌',
    category: '边坡',
    indicators: ['SSCI下降', '坡面滑塌'],
    description: '因边坡表面松散破碎或雨水冲刷而引起的坡面滑塌。',
    characteristics: '边坡局部土体或岩体滑落，形成明显的滑塌区域。'
  },
  {
    name: '滑坡',
    category: '边坡',
    indicators: ['SSCI下降', '整体滑动', '水平位移'],
    description: '边坡发生整体剪切破坏引起的坡体下滑，或有明显水平位移。',
    characteristics: '边坡土体沿某一滑动面整体向下滑动，常伴有裂缝和下错台阶。'
  },
  {
    name: '表观破损',
    category: '既有防护及支挡结构物',
    indicators: ['RSCI下降', '勾缝脱落', '钢筋外露'],
    description: '勾缝或沉降缝损坏、表面破损、钢筋外露和锈蚀等。',
    characteristics: '结构物表面出现裂缝、剥落，钢筋锈蚀，影响美观和耐久性。'
  },
  {
    name: '排(泄)水孔淤塞',
    category: '既有防护及支挡结构物',
    indicators: ['RSCI下降', '排水不畅'],
    description: '排（泄）水孔被杂物堵塞，造成排水不畅。',
    characteristics: '挡土墙或护坡上的排水孔被泥土、杂草堵塞，孔口无水流出或有水渍渗出。'
  },
  {
    name: '局部损坏',
    category: '既有防护及支挡结构物',
    indicators: ['RSCI下降', '基础淘空', '墙体脱空'],
    description: '局部出现的基础淘空、墙体脱空、脱落、鼓肚、轻度裂缝、下沉等。',
    characteristics: '结构物局部失去支撑或发生变形，可能进一步发展为结构失稳。'
  },
  {
    name: '结构失稳',
    category: '既有防护及支挡结构物',
    indicators: ['RSCI下降', '开裂', '倾斜', '倒塌'],
    description: '结构物整体出现的开裂、倾斜、滑移、倒塌等。',
    characteristics: '结构物失去原有支挡或防护功能，严重威胁路基安全。'
  },
  {
    name: '排水设施堵塞（含涵洞）',
    category: '排水设施',
    indicators: ['DSCI下降', '排水不畅', '积水'],
    description: '排水设施内有杂物、垃圾、淤积等，造成排水不畅或设施堵塞。',
    characteristics: '边沟、截水沟等排水设施内有积水或淤泥，无法正常排水。'
  },
  {
    name: '排水设施损坏（不含涵洞）',
    category: '排水设施',
    indicators: ['DSCI下降', '设施破损'],
    description: '排水设施出现勾缝严重脱落，排水沟、截水沟、急流槽等设施的破损。',
    characteristics: '排水设施结构破损，可能导致水流渗入路基内部。'
  }
];


export const SOIL_TYPES = [
  { value: 'granite', label: '花岗岩残积土 (Granite Residual Soil)' },
  { value: 'clay', label: '黏土 (Clay)' },
  { value: 'soft_rock', label: '软岩 (Soft Rock)' },
  { value: 'sand', label: '砂土 (Sand)' },
  { value: 'loess', label: '黄土 (Loess)' },
  { value: 'saline_soil', label: '盐渍土 (Saline Soil)' },
  { value: 'expansive_soil', label: '膨胀土 (Expansive Soil)' }
];

export const REINFORCEMENT_MEASURES: ReinforcementMeasure[] = [
  {
    id: 'm1',
    name: '换填改良 (Replacement)',
    suitability: ['软土路基', '翻浆', '浅层病害'],
    bestFor: ['冻胀翻浆', '路基水毁', '轻微沉降'],
    suitableDiseases: ['embankment_frost', 'slope_erosion', 'embankment_debris'],
    unitCostCNY: 120,
    costIndex: 4,
    timeIndex: 6,
    difficultyIndex: 4,
    description: '挖除病害土体，换填透水性好的砂砾或改良土，彻底解决浅层土质问题。',
    technicalReliability: 8,
    durability: 8,
    ecoFriendliness: 5,
    requiredMachinery: ['挖掘机', '压路机', '自卸车']
  },
  {
    id: 'm3',
    name: '抗滑桩 (Anti-slide Piles)',
    suitability: ['深层滑坡', '边坡失稳'],
    bestFor: ['边坡滑塌/垮塌'],
    suitableDiseases: ['slope_landslide', 'slope_local_collapse', 'protection_instability'],
    unitCostCNY: 800,
    costIndex: 9,
    timeIndex: 9,
    difficultyIndex: 9,
    description: '设置于滑坡前缘，利用桩身抗剪强度阻挡土体滑移，是处理深层滑坡最可靠手段。',
    technicalReliability: 9.5,
    durability: 10,
    ecoFriendliness: 4,
    requiredMachinery: ['旋挖钻机', '吊车', '混凝土罐车']
  },
  {
    id: 'm5',
    name: '土钉/锚杆支护 (Soil Nailing)',
    suitability: ['边坡加固', '危岩体'],
    bestFor: ['路基滑移', '陡坡加固'],
    suitableDiseases: ['slope_collapse', 'embankment_crack'],
    unitCostCNY: 350,
    costIndex: 5,
    timeIndex: 5,
    difficultyIndex: 6,
    description: '钻孔置入钢筋锚杆并注浆，结合喷射混凝土面板，从内部加固土体。',
    isNewTech: false,
    technicalReliability: 7.5,
    durability: 8,
    ecoFriendliness: 6,
    requiredMachinery: ['锚杆钻机', '注浆泵', '喷射混凝土机']
  },
  {
    id: 'nm1',
    name: '高聚物注浆技术 (Polymer Grouting)',
    suitability: ['路基空洞', '脱空', '快速加固'],
    bestFor: ['不均匀沉降', '基础脱空', '裂缝修复'],
    suitableDiseases: ['embankment_settlement', 'protection_local_damage', 'embankment_crack'],
    unitCostCNY: 450,
    costIndex: 6,
    timeIndex: 2,
    difficultyIndex: 5,
    description: '采用非水反应高聚物材料，膨胀倍率大，固化极快(15-30min)，适合应急抢修。',
    isNewTech: true,
    technicalReliability: 8.5,
    durability: 7,
    ecoFriendliness: 7,
    requiredMachinery: ['高聚物注浆设备', '手持钻机']
  },
  {
    id: 'nm2',
    name: '气泡轻质土换填 (Foam Light Soil)',
    suitability: ['高填方', '软基', '桥头跳车'],
    bestFor: ['路基垮塌', '大面积沉降', '快速重建'],
    suitableDiseases: ['embankment_settlement', 'slope_local_collapse'],
    unitCostCNY: 550,
    costIndex: 7,
    timeIndex: 3,
    difficultyIndex: 4,
    description: '轻质、直立性好、无需压实。可大幅减轻荷载，适合快速填充塌方区。',
    isNewTech: true,
    technicalReliability: 9,
    durability: 9,
    ecoFriendliness: 8,
    requiredMachinery: ['泡沫土制备站', '泵送设备', '模板']
  },
  {
    id: 'nm3',
    name: '凹形竖曲线通过法 (Concave Curve Method)',
    suitability: ['大面积塌方', '临时保通'],
    bestFor: ['严重垮塌', '路面断裂'],
    suitableDiseases: ['slope_landslide', 'slope_local_collapse'],
    unitCostCNY: 150,
    costIndex: 3,
    timeIndex: 2,
    difficultyIndex: 3,
    description: '在塌方段利用推土机快速推平形成凹形便道，铺设钢板或临时路面，优先恢复通行。',
    isNewTech: true,
    technicalReliability: 6, // Temporary
    durability: 3,
    ecoFriendliness: 5,
    requiredMachinery: ['推土机', '起重机(铺设钢板)']
  },
  {
    id: 'nm4',
    name: '冷拌冷铺沥青 (Cold Mix Paving)',
    suitability: ['路面修补', '应急抢修'],
    bestFor: ['路面坑槽', '便道铺装'],
    suitableDiseases: ['shoulder_defect', 'embankment_crack'],
    unitCostCNY: 300,
    costIndex: 5,
    timeIndex: 1,
    difficultyIndex: 2,
    description: '无需加热，直接摊铺压实，受雨天影响小，适合快速恢复路面平整度。',
    isNewTech: true,
    technicalReliability: 7,
    durability: 5,
    ecoFriendliness: 9,
    requiredMachinery: ['小型压路机', '平板夯']
  },
  {
    id: 'nm5',
    name: '微型桩群 (Micro-piles)',
    suitability: ['受限空间', '边坡加固'],
    bestFor: ['路基滑移', '应急抗滑'],
    suitableDiseases: ['slope_local_collapse', 'embankment_crack'],
    unitCostCNY: 400,
    costIndex: 6,
    timeIndex: 4,
    difficultyIndex: 6,
    description: '小直径钻孔灌注桩，设备轻便，成桩速度快，形成复合地基或抗滑结构。',
    isNewTech: true,
    technicalReliability: 8,
    durability: 8.5,
    ecoFriendliness: 7,
    requiredMachinery: ['小型钻机', '空压机', '注浆泵']
  },
  {
    id: 'nm6',
    name: '装配式路基模块 (Prefabricated Modules)',
    suitability: ['全断面对接', '快速重建'],
    bestFor: ['路基损毁', '断路修复'],
    suitableDiseases: ['slope_landslide', 'slope_local_collapse'],
    unitCostCNY: 1200,
    costIndex: 10,
    timeIndex: 2,
    difficultyIndex: 8,
    description: '工厂预制的混凝土或钢结构路基模块，现场吊装拼接，受天气影响极小。',
    isNewTech: true,
    technicalReliability: 9.5,
    durability: 9.5,
    ecoFriendliness: 8,
    requiredMachinery: ['大型吊车', '平板运输车']
  }
];


export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'case-001',
    title: '广东梅大高速茶阳路段“5·1”塌方灾害',
    date: '2024年5月1日 凌晨1时57分',
    location: '梅大高速东延线 K11+900～K11+950',
    description: '往东方向半幅路堤发生塌方，导致23辆车掉落，造成52人死亡，30人受伤。灾害点路段为“倒三角形”沟谷地貌斜坡路堤。',
    cause: '长时间持续性降水与多种因素叠加耦合作用。连续14天强降雨导致地下水持续累积、水位升高。此外，公路建设改变了自然山坡汇水流域，可能形成了跨流域调水，导致大量地表径流汇入。',
    mechanism: '长时间饱水造成路堤底部及基底（完全风化花岗岩土体）软化，抗剪强度降低。暂态性地下水动静水压力、浮托力和渗透力持续增大。路堤中下部及护脚墙突然滑动变形，引发路堤上部填土塌方。',
    damageStats: {
      length: 221.31,
      width: 51.79,
      area: 434.58,
      depth: 13.01,
      volume: 20675,
      casualties: '52人死亡，30人受伤'
    },
    environment: {
      rainfall: 422.5,
      geology: '完全风化花岗岩土体（坡残积层砂质黏土及冲洪积黏性土）'
    },
    measuresUsed: [
      '现场应急救援与人员搜救',
      '车辆起吊与现场清理',
      '边坡水毁修复与加固',
      '完善综合防排水系统设计'
    ],
    lessonsLearned: [
      '对高填路基的风险重视不够，对长时间持续性降水的危害性认识不足。',
      '地下水风险防范意识淡薄，智能监测预警手段严重不足。',
      '需高度重视公路跨流域调水对路基边坡稳定性的影响。',
      '建设疏于管理，重建设轻管养，日常隐患排查治理流于形式。'
    ],
    imageUrl: 'https://via.placeholder.com/600x400?text=Mei-Da+Expressway+Landslide'
  },
  {
    id: 'case-002',
    title: '某山区高速公路高边坡垮塌',
    date: '2023年7月',
    location: '西南山区某高速 K230+100',
    description: '强降雨诱发顺层岩质边坡滑塌，阻断交通。',
    cause: '岩体破碎，降雨入渗降低裂隙面强度。',
    mechanism: '顺层平面滑动。',
    damageStats: {
      length: 45,
      width: 15,
      area: 675,
      depth: 12
    },
    environment: {
      rainfall: 120,
      geology: '砂泥岩互层'
    },
    measuresUsed: [
      '清理塌方体',
      '抗滑桩加固',
      '锚索框格梁'
    ],
    lessonsLearned: [
      '顺层边坡需重点关注锚固深度。',
      '快速清理需配合大型机械，并注意二次塌方风险。'
    ]
  }
];

export const HISTORICAL_CASES: HistoricalCase[] = [
    {
        id: 'h001',
        subgradeType: 'fill',
        compaction: 92,
        width: 26,
        height: 8,
        rainfall: 120,
        groundWater: 1.2,
        temperature: 20,
        load: 5,
        rockType: 'granite',
        hasVisualFeatures: true,
        disasterArea: 200,
        collapseRatio: 40,
        settlementLevel: 'heavy',
        crackDensity: 0.8,
        disasterType: '路基沉降',
        actualMeasures: ['nm2', 'm3'], 
        repairTime: 28, 
        successRate: 0.95
    },
    {
        id: 'h002',
        subgradeType: 'cut',
        compaction: 94,
        width: 24,
        height: 5,
        rainfall: 80,
        groundWater: 3.0,
        temperature: 15,
        load: 4,
        rockType: 'clay',
        hasVisualFeatures: true,
        disasterArea: 50,
        collapseRatio: 5,
        settlementLevel: 'medium',
        crackDensity: 0.3,
        disasterType: '边坡滑坡',
        actualMeasures: ['nm1'], 
        repairTime: 4,
        successRate: 0.98
    },
    {
        id: 'h003',
        subgradeType: 'half',
        compaction: 90,
        width: 28,
        height: 12,
        rainfall: 150,
        groundWater: 0.8,
        temperature: 10,
        load: 6,
        rockType: 'soft_rock',
        hasVisualFeatures: true,
        disasterArea: 400,
        collapseRatio: 15,
        settlementLevel: 'heavy',
        crackDensity: 1.2,
        disasterType: '冻胀翻浆',
        actualMeasures: ['nm5', 'm5'], 
        repairTime: 20,
        successRate: 0.92
    },
    {
        id: 'h004',
        subgradeType: 'fill',
        compaction: 96,
        width: 26,
        height: 4,
        rainfall: 20,
        groundWater: 5.0,
        temperature: 25,
        load: 3,
        rockType: 'sand',
        hasVisualFeatures: false,
        disasterArea: null,
        collapseRatio: null,
        settlementLevel: null,
        crackDensity: null,
        disasterType: null,
        actualMeasures: ['无'],
        repairTime: 0,
        successRate: 1.0
    }
];
