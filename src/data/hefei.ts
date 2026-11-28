/**
 * 合肥轨道线网种子数据（2026-11 运营线网）。
 *
 * 站点与线序来源：中文维基百科各线条目与高德地图线网，两条线交会处按同一站名合并；
 * 换乘关系由线序重算，不依赖任何单一线路制作组的标注。
 * 官方线色见 `palette.ts`。
 *
 * 数据边界（已核实）：
 * - 6 号线市博物馆站暂缓开通，保留为「暂缓开通」状态；
 * - 3 号线馆驿站、4 号线紫云湖站缓建，7 号线义城、合肥四中在建，均未收录；
 * - 合肥轨道站名没有公开的编号体系，因此不生成车站编号。
 */

import type { InterchangeLine, Line, Network, Station } from '@/core/model'
import { getPaletteEntry, themeOf } from './palette'

interface LineSeed {
  id: string
  /** 中文线名与英文线名。 */
  name: { zh: string; en: string }
  /** 站点：中文名与官方英文名，按站序排列。 */
  stations: [zh: string, en: string][]
  /** 暂缓开通的站点。 */
  suspended?: string[]
  /** 出站换乘的同站名区分，例如两条线在同一路口的两个站。 */
  aliases?: Record<string, string>
}

export const LINE_SEEDS: LineSeed[] = [
  {
    id: 'hf1',
    name: { zh: '1号线', en: 'Line 1' },
    stations: [
      ['张洼', 'Zhangwa'],
      ['兴华苑', 'Xinghuayuan'],
      ['瑶海公园', 'Yaohai Gongyuan'],
      ['合肥火车站', 'Hefei Railway Station'],
      ['长淮', 'Changhuai'],
      ['明光路', 'Mingguang Lu'],
      ['大东门', 'Dadongmen'],
      ['包公园', 'Baogongyuan'],
      ['合工大南区', 'Hefei University of Technology South Campus'],
      ['朱岗', 'Zhugang'],
      ['秋浦河路', 'Qiupuhe Lu'],
      ['葛大店', 'Gedadian'],
      ['望湖城', 'Wanghucheng'],
      ['合肥南站', 'Hefei South Railway Station'],
      ['南站南广场', 'South Railway Station Square'],
      ['骆岗', 'Luogang'],
      ['高王', 'Gaowang'],
      ['滨湖会展中心', 'Binhu International Convention Center'],
      ['紫庐', 'Zilu'],
      ['塘西河公园', 'Tangxihe Gongyuan'],
      ['金斗公园', 'Jindou Gongyuan'],
      ['云谷路', 'Yungu Lu'],
      ['万达城', 'Wanda City'],
      ['万年埠', 'Wannianbu'],
      ['丙子铺', 'Bingzipu'],
      ['九联圩', 'Jiulianwei'],
    ],
  },
  {
    id: 'hf2',
    name: { zh: '2号线', en: 'Line 2' },
    stations: [
      ['南岗', 'Nangang'],
      ['桂庄', 'Guizhuang'],
      ['汽车西站', 'Qiche West Station'],
      ['振兴路', 'Zhenxing Lu'],
      ['蜀山西', 'Shushanxi'],
      ['大蜀山', 'Dashushan'],
      ['天柱路', 'Tianzhu Lu'],
      ['科学大道', 'Kexue Dadao'],
      ['十里庙', 'Shilimiao'],
      ['西七里塘', 'Xiqilitang'],
      ['五里墩', 'Wulidun'],
      ['三里庵', 'Sanli’an'],
      ['安农大', 'Annongda'],
      ['三孝口', 'Sanxiaokou'],
      ['四牌楼', 'Sipailou'],
      ['大东门', 'Dadongmen'],
      ['三里街', 'Sanlijie'],
      ['东五里井', 'Dongwulijing'],
      ['东七里', 'Dongqili'],
      ['漕冲', 'Caochong'],
      ['东二十埠', 'Dong’ershibu'],
      ['龙岗', 'Longgang'],
      ['王岗', 'Wanggang'],
      ['三十埠', 'Sanshibu'],
      ['三十埠东', 'Sanshibudong'],
      ['祥和', 'Xianghe'],
      ['桂王', 'Guiwang'],
      ['对河', 'Duihe'],
      ['店埠河', 'Dianbuhe'],
      ['排头', 'Paitou'],
      ['肥东站', 'Feidong Railway Station'],
      ['和睦湖', 'Hemuhu'],
      ['马桥', 'Maqiao'],
      ['南沙河', 'Nanshahe'],
      ['撮镇', 'Cuozhen'],
    ],
  },
  {
    id: 'hf3',
    name: { zh: '3号线', en: 'Line 3' },
    stations: [
      ['相城路', 'Xiangcheng Lu'],
      ['职教城东', 'Zhijiaochengdong'],
      ['职教城', 'Zhijiaocheng'],
      ['幼儿师范', 'You’er Shifan'],
      ['文浍苑', 'Wenhuiyuan'],
      ['勤劳村', 'Qinlaocun'],
      ['新海大道', 'Xinhai Dadao'],
      ['窦桥湾', 'Douqiaowan'],
      ['方庙', 'Fangmiao'],
      ['竹丝滩', 'Zhusitan'],
      ['合肥火车站', 'Hefei Railway Station'],
      ['鸭林冲', 'Yalinchong'],
      ['淮南路', 'Huainan Lu'],
      ['一里井', 'Yilijing'],
      ['海棠', 'Haitang'],
      ['郑河', 'Zhenghe'],
      ['四泉桥', 'Siquanqiao'],
      ['杏花村', 'Xinghuacun'],
      ['合肥西站', 'Hefei West Railway Station'],
      ['南新庄', 'Nanxinzhuang'],
      ['西七里塘', 'Xiqilitang'],
      ['国防科技大学', 'National University of Defense Technology'],
      ['洪岗', 'Honggang'],
      ['市政务中心', 'City Government Affairs Center'],
      ['合肥大剧院', 'Hefei Grand Theatre'],
      ['图书馆', 'Library'],
      ['省博物院', 'Anhui Museum'],
      ['安医大二附院', 'Anhui Medical University Second Affiliated Hospital'],
      ['繁华大道', 'Fanhua Dadao'],
      ['大学城北', 'Daxuecheng North'],
      ['工大翡翠湖校区', 'Hefei University of Technology Feicuihu Campus'],
      ['安大磬苑校区', 'Anhui University Qingyuan Campus'],
      ['幸福坝', 'Xingfuba'],
      ['安医一附院南区', 'First Affiliated Hospital of Anhui Medical University South District'],
      ['凉亭', 'Liangting'],
      ['李湾', 'Liwan'],
      ['四十埠', 'Sishibu'],
      ['芮祠', 'Ruici'],
      ['乐平', 'Leping'],
      ['省儿童医院新区', 'Anhui Provincial Children’s Hospital New District'],
    ],
  },
  {
    id: 'hf4',
    name: { zh: '4号线', en: 'Line 4' },
    stations: [
      ['烧脉岗', 'Shaomaigang'],
      ['魏庄', 'Weizhuang'],
      ['铜锣寨路', 'Tongluozhai Lu'],
      ['金小郢', 'Jinxiaoying'],
      ['桃花潭', 'Taohuatan'],
      ['长安集', 'Chang’anji'],
      ['复兴集', 'Fuxingji'],
      ['北雁湖', 'Beiyanhu'],
      ['玉兰大道', 'Yulan Dadao'],
      ['金桂', 'Jingui'],
      ['柳树塘', 'Liushutang'],
      ['图书馆', 'Library'],
      ['天鹅湖', 'Tian’ehu'],
      ['天鹅湖东', 'Tian’ehudong'],
      ['姚公庙', 'Yaogongmiao'],
      ['南屏路', 'Nanping Lu'],
      ['薛河', 'Xuehe'],
      ['竹西', 'Zhuxi'],
      ['淝南', 'Feinan'],
      ['合肥南站', 'Hefei South Railway Station'],
      ['望湖城南', 'Wanghuchengnan'],
      ['葛大店南', 'Gedadiannan'],
      ['工经学院', 'Anhui Technical College of Industry and Economy'],
      ['尧渡河路', 'Yaoduhe Lu'],
      ['五里庙', 'Wulimiao'],
      ['唐桥', 'Tangqiao'],
      ['东七里', 'Dongqili'],
      ['站塘', 'Zhantang'],
      ['方庙', 'Fangmiao'],
      ['新海公园', 'Xinhai Gongyuan'],
      ['十里村', 'Shilicun'],
      ['陶冲湖东', 'Taochonghudong'],
      ['安医一附院北区', 'First Affiliated Hospital of Anhui Medical University North District'],
      ['综保区', 'Comprehensive Bonded Zone'],
    ],
  },
  {
    id: 'hf5',
    name: { zh: '5号线', en: 'Line 5' },
    stations: [
      ['汲桥路', 'Jiqiao Lu'],
      ['六中菱湖校区', 'Hefei No.6 Middle School Linghu Campus'],
      ['菱湖公园', 'Linghu Gongyuan'],
      ['北五里井', 'Beiwulijing'],
      ['海棠', 'Haitang'],
      ['白水坝', 'Baishuiba'],
      ['杏花公园', 'Xinghua Gongyuan'],
      ['三孝口', 'Sanxiaokou'],
      ['稻香楼', 'Daoxianglou'],
      ['中国科大东区', 'USTC East Campus'],
      ['市第三医院', 'Hefei Third People’s Hospital'],
      ['休宁路', 'Xiuning Lu'],
      ['凌大塘', 'Lingdatang'],
      ['望湖城西', 'Wangchenghuxi'],
      ['合肥南站', 'Hefei South Railway Station'],
      ['盛大', 'Shengda'],
      ['包河苑', 'Baoheyuan'],
      ['义兴', 'Yixing'],
      ['大连路', 'Dalian Lu'],
      ['花园大道', 'Huayuan Dadao'],
      ['黄河路', 'Huanghe Lu'],
      ['扬子江路', 'Yangzijiang Lu'],
      ['义城', 'Yicheng'],
      ['省行政中心东', 'Anhui Provincial Administrative Center East'],
      ['方兴湖', 'Fangxinghu'],
      ['渡江纪念馆', 'Yangtze-Crossing Campaign Memorial Museum'],
      ['沈湾', 'Shenwan'],
      ['华山路', 'Huashan Lu'],
      ['云谷路', 'Yungu Lu'],
      ['清水冲', 'Qingshuichong'],
      ['云川公园', 'Yunchuan Gongyuan'],
      ['滨湖竹园', 'Binhu Zhuyuan'],
      ['贵阳路', 'Guiyang Lu'],
    ],
  },
  {
    id: 'hf6',
    name: { zh: '6号线', en: 'Line 6' },
    suspended: ['市博物馆'],
    stations: [
      ['青龙岗', 'Qinglonggang'],
      ['合肥七中', 'Hefei No.7 High School'],
      ['量子科学中心', 'Quantum Science Center'],
      ['科大先研院', 'USTC Institute of Advanced Technology'],
      ['北雁湖', 'Beiyanhu'],
      ['开福寺', 'Kaifusi'],
      ['梦城', 'Mengcheng'],
      ['松荫桥', 'Songyinqiao'],
      ['洪岗', 'Honggang'],
      ['陆军兵种大学', 'Army Arms University'],
      ['南七里', 'Nanqili'],
      ['市第三医院', 'Hefei Third People’s Hospital'],
      ['卫岗', 'Weigang'],
      ['朱岗', 'Zhugang'],
      ['尧渡河路', 'Yaoduhe Lu'],
      ['唐大楼', 'Tangdalou'],
      ['市儿童医院', 'Hefei Children’s Hospital'],
      ['市博物馆', 'Hefei Museum'],
      ['钢红', 'Ganghong'],
      ['大兴集', 'Daxingji'],
      ['伏龙', 'Fulong'],
      ['龙塘', 'Longtang'],
    ],
  },
  {
    id: 'hf7',
    name: { zh: '7号线', en: 'Line 7' },
    stations: [
      ['翡翠公园', 'Feicui Gongyuan'],
      ['繁华大道', 'Fanhua Dadao'],
      ['徽园', 'Huiyuan'],
      ['明珠广场', 'Mingzhu Guangchang'],
      ['天都路', 'Tiandu Lu'],
      ['南艳湖北', 'Nanyanhu Bei'],
      ['一六八中学', 'Hefei No.168 Middle School'],
      ['合肥大学', 'Hefei University'],
      ['南艳湖南', 'Nanyanhu Nan'],
      ['要素大市场', 'Elements Market'],
      ['滨湖医院', 'Binhu Hospital'],
      ['紫庐', 'Zilu'],
      ['嵩山路', 'Songshan Lu'],
      ['省文化和非遗馆', 'Anhui Provincial Culture and Intangible Cultural Heritage Museum'],
    ],
  },
  {
    id: 'hf8',
    name: { zh: '8号线', en: 'Line 8' },
    stations: [
      ['北城高铁站', 'Beicheng High-speed Railway Station'],
      ['省立医院北区', 'Anhui Provincial Hospital North District'],
      ['双墩', 'Shuangdun'],
      ['北城世纪城', 'Beicheng Shijicheng'],
      ['梅冲湖', 'Meichonghu'],
      ['金梅路', 'Jinmei Lu'],
      ['双凤', 'Shuangfeng'],
      ['荷塘路', 'Hetang Lu'],
      ['六中菱湖校区', 'Hefei No.6 Middle School Linghu Campus'],
      ['庐阳经开区', 'Luyang Economic Development Zone'],
      ['杏林', 'Xinglin'],
      ['一里井', 'Yilijing'],
    ],
  },
  {
    id: 'hfs1',
    name: { zh: 'S1号线', en: 'Line S1' },
    stations: [
      ['新桥2号航站楼', 'Xinqiao Terminal 2'],
      ['迎宾大道', 'Yingbin Dadao'],
      ['未来湖', 'Weihaihu'],
      ['长兴湖', 'Changxinghu'],
      ['未来大科学城', 'Weilai Dakexuecheng'],
      ['岗集', 'Gangji'],
      ['大杨', 'Dayang'],
      ['庐州公园', 'Luzhou Gongyuan'],
      ['合肥西站', 'Hefei West Railway Station'],
      ['省中医院西区', 'Provincial Hospital of Traditional Chinese Medicine West District'],
    ],
  },
]

const stationId = (zh: string) => `s-${zh}`

/**
 * 生成线网：站点按中文名合并，换乘线路由「出现在哪些线的站序中」推导。
 */
export const buildSeedNetwork = (): Network => {
  const stations: Record<string, Station> = {}
  // 同一座换乘站在多条线中只建一次；编号类信息取第一次出现的线路
  const idByKey = new Map<string, string>()
  const memberships = new Map<string, string[]>()
  const lines: Line[] = []

  for (const seed of LINE_SEEDS) {
    for (const [zh, en] of seed.stations) {
      // 换乘站以中文名识别；同名但分属不同站的情况用 `aliases` 区分
      const key = seed.aliases?.[zh] ?? zh
      const id = stationId(key)
      idByKey.set(zh, id)
      stations[id] ??= {
        id,
        name: { zh, en },
        transfers: [],
        services: ['local'],
        noService: seed.suspended?.includes(zh) ? 'under-construction' : undefined,
      }
      memberships.set(id, [...(memberships.get(id) ?? []), seed.id])
    }
    lines.push({
      id: seed.id,
      name: seed.name,
      theme: themeOf(seed.id),
      stations: seed.stations.map(([zh]) => idByKey.get(zh) ?? stationId(zh)),
    })
  }

  // 换乘信息：其余线路的线名与线色
  for (const [id, lineIds] of memberships) {
    if (lineIds.length < 2) continue
    const interchanges: InterchangeLine[] = lineIds
      .filter((lineId) => lineId !== lineIds[0])
      .map((lineId) => {
        const palette = getPaletteEntry(lineId)
        return {
          theme: themeOf(lineId),
          name: palette ? { zh: palette.name.zh, en: palette.name.en } : { zh: lineId },
        }
      })
    stations[id].transfers = [{ kind: 'in-station', paidArea: true, lines: interchanges }]
  }

  return { id: 'hefei', name: '合肥轨道', lines, stations }
}

export const buildSeedProject = () => {
  const network = buildSeedNetwork()
  return {
    network,
    pov: {
      lineId: 'hf1',
      currentStationId: stationId('大东门'),
      direction: 'l' as const,
      doorSide: 'left' as const,
    },
  }
}
