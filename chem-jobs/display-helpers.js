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

if (typeof module !== 'undefined') module.exports = {educationInfo, educationMatches, educationLabel, publicJobUrl};
