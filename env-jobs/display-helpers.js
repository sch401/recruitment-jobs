function educationInfo(raw) {
  const original = String(raw || '').normalize('NFKC').trim();
  const table = /详见|见.{0,8}(?:公告|岗位表|附件|招聘表)|具体.{0,8}(?:公告|岗位表|附件)/.test(original);
  if (!original || /^(?:原文)?未(?:注明|说明|明确)|^待核实$/.test(original)) return {levels: [], kind: 'unspecified'};
  if (/学历不限|不限学历|不限制学历|无学历要求|^(?:不限|不限制)$/.test(original)) return {levels: [], kind: 'unrestricted'};
  let value = original;
  if (value.length > 140 || /学校简介|学位授予|申报硕士|升本以来|学院肇始/.test(value)) {
    value = value.split(/[。；;\n]/).filter(line => {
      if (/配偶|家属|夫妻|成绩单|周岁|年龄|ESI|学位授予|申报硕士|学校设有|学校简介|学院肇始|本科院校/.test(line)) return false;
      return /(?:学历|学位|应聘|具有|具备|取得).{0,45}(?:大专|专科|本科|硕士|博士|研究生)|(?:大专|专科|本科|硕士|博士|研究生).{0,14}(?:学历|学位|毕业|及以上)/.test(line);
    }).join('；');
  }
  value = value.replace(/(?:本科|硕士|博士|研究生)(?:或(?:本科|硕士|博士|研究生))?(?:阶段)?专业[^，,；;。\n]*/g, '');
  const levels = [];
  if (/大专|专科/.test(value)) levels.push('大专');
  if (/本科|本硕(?:博)?/.test(value)) levels.push('本科');
  if (/硕士|硕博|本硕(?:博)?/.test(value)) levels.push('硕士');
  if (/博士|硕博|本硕博/.test(value)) levels.push('博士');
  if (/研究生/.test(value.replace(/(?:硕士|博士)\s*研究生/g, ''))) {
    for (const level of ['硕士', '博士']) if (!levels.includes(level)) levels.push(level);
  }
  if (levels.length) return {levels, kind: 'explicit'};
  return {levels: [], kind: table ? 'table' : 'review'};
}

function educationMatches(raw, selected) {
  if (!selected) return true;
  const info = educationInfo(raw);
  if (info.kind === 'unrestricted') return true;
  return info.levels.includes(selected) || info.kind === selected;
}

function educationLabel(raw) {
  const info = educationInfo(raw);
  if (info.levels.length) {
    const value = String(raw || '').trim();
    if (value.length <= 24 && !/本硕|硕博/.test(value)) return value.split(/[,，;；/、\r\n]+/).map(part => part.trim()).filter(Boolean).join('、');
    return info.levels.join('、') + (info.levels.length === 1 && /及以上|以上学历/.test(value) ? '及以上' : '');
  }
  return {unspecified: '未注明', table: '详见公告表', unrestricted: '不限学历', review: '学历需核实'}[info.kind];
}

function majorLabel(raw) {
  const value = String(raw || '').trim();
  const ordinal = /^(?:[0-9]{1,3}(?=(?:全日制|本科|硕士|博士|大专|专科|研究生))|[（(][0-9一二三四五六七八九十]{1,3}[)）]|(?:[0-9]{1,3}|[一二三四五六七八九十]{1,3})[.．、])\s*/;
  const degree = /^(?:具有|具备|拥有|要求|须有)?(?:全日制|统招|大学)?(?:博士后|博士研究生|硕士研究生|博士|硕士|本科|学士|大专|专科|研究生)(?:或(?:博士|硕士|本科))?(?:及以上|或以上|以上)?(?:学历(?:学位)?|学位|文凭|毕业生?|优先考虑|优先)?(?:者)?\s*/;
  const parts = value.split(/[。；;\r\n]+/).flatMap(part => {
    part = part.trim().replace(ordinal, '').replace(/^(?:职位描述|任职要求|学历与专业|专业要求|专业需求|招聘专业|所需专业|教育背景)\s*[:：]\s*/, '');
    if (/专业(?:要求|需求)\s*[:：]/.test(part)) part = part.replace(/^.*?专业(?:要求|需求)\s*[:：]\s*/, '');
    part = part.replace(/^(?:(?:20)?[0-9]{2}[、,，])*(?:20)?[0-9]{2}届(?:毕业生)?\s*/, '');
    return part.split(/[，,]+/).map(item => {
      item = item.trim().replace(ordinal, '').replace(degree, '').trim();
      return item.replace(/(?:本科|硕士|博士|研究生)(?:及以上|或以上|以上)?(?:学历|学位|文凭|毕业)\s*$/, '').replace(/^[、：:]+|[、：:]+$/g, '').trim();
    }).filter(item => item && !(/学历|学位|毕业生/.test(item) && !/专业|学科|研究方向|研究领域/.test(item)) && !/^(?:硕士|博士)?优先(?:考虑)?$|^(?:学历|学位|专业|教育背景|本科专业|硕士专业|博士专业)$|^(?:CET\s*[-－]?\s*[46]|英语|大学英语|通过.{0,6}英语|年龄|周岁|研究生阶段所学专业)/i.test(item));
  });
  return [...new Set(parts)].join('、') || '专业要求见原公告';
}

function publicJobUrl(value) {
  const url = new URL(value, typeof location === 'undefined' ? 'https://bcbpd.top/chem-jobs/' : location.href);
  let match;
  if (url.hostname === 'job.nju.edu.cn' && (match = url.pathname.match(/^\/(?:api\/career\/job|career)\/recruitments\/(\d+)$/))) {
    return 'https://job.nju.edu.cn/career/jobs-v2?fullTime=true&recruitmentId=' + match[1];
  }
  if (url.hostname === 'jiuye.uestc.edu.cn') {
    match = url.pathname.match(/^\/career\/api\/home\/recruitment\/(\d+)$/);
    if (match) return 'https://jiuye.uestc.edu.cn/career/recruitment/online/' + BigInt(match[1]).toString(36);
    match = url.pathname.match(/^\/career\/recruitment\/([^/]+)\/(\d{8,})$/);
    if (match) return url.origin + '/career/recruitment/' + match[1] + '/' + BigInt(match[2]).toString(36) + url.search;
  }
  return url.href;
}

if (typeof module !== 'undefined') module.exports = {majorLabel, educationInfo, educationMatches, educationLabel, publicJobUrl};
