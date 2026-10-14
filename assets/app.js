(function () {
  'use strict';

  var BASE = 'https://c4960c30.tvlist.pages.dev';

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var toastTimer;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); resolve(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var text = btn.getAttribute('data-copy');
    copyText(text).then(function () {
      var old = btn.textContent;
      btn.classList.add('done');
      btn.textContent = '已复制';
      setTimeout(function () { btn.classList.remove('done'); btn.textContent = old; }, 1200);
      toast('已复制：' + text);
    }).catch(function () {
      toast('复制失败，请手动选择复制');
    });
  });

  /* ---------- 主题 ---------- */
  var root = document.documentElement;
  var saved = localStorage.getItem('theme');
  if (saved) root.setAttribute('data-theme', saved);
  document.getElementById('themeToggle').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  /* ---------- 本站 m3u 列表 ---------- */
  var CATS = [
    { key: '轮播剧场', re: /轮播/ },
    { key: '广播电台', re: /广播电台/ },
    { key: '景区慢直播', re: /景区/ },
    { key: '央视·卫视', re: /CCTV|央视/i },
    { key: '港澳台·海外', re: /台湾|香港|澳门|海外|国外|Korea|LookChina|ZhanQi/i },
    { key: '聚合大全', re: /^\d|GGTV|国家直播源|全部有效|全部可用|全部流畅/ },
    { key: '运营商 IPTV', re: /电信|联通|移动|广电|华数|组播|rtsp|rtp|iptv|有线|校园网|教育网|易视腾|农大/i },
    { key: '国内综合', re: /国内|中国|百视|天途云|腾讯云|LeTV|乐视|china|MyTVlist|我的播放源|Lecloud/i }
  ];

  function catOf(name) {
    for (var i = 0; i < CATS.length; i++) {
      if (CATS[i].re.test(name)) return CATS[i].key;
    }
    return '其他';
  }

  var files = (window.M3U_FILES || [])
    .filter(function (f) { return /\.(m3u|m3u8)$/i.test(f); })
    .sort(function (a, b) { return a.localeCompare(b, 'zh-Hans-CN'); });

  var items = files.map(function (f) {
    return { name: f, url: BASE + '/m3u/' + encodeURI(f), cat: catOf(f) };
  });

  var state = { q: '', cat: '全部' };

  var catNames = ['全部'];
  items.forEach(function (it) { if (catNames.indexOf(it.cat) < 0) catNames.push(it.cat); });

  var grid = document.getElementById('m3uGrid');
  var empty = document.getElementById('m3uEmpty');

  function renderChips() {
    document.getElementById('m3uCats').innerHTML = catNames.map(function (c) {
      var n = c === '全部' ? items.length : items.filter(function (i) { return i.cat === c; }).length;
      return '<button class="chip' + (state.cat === c ? ' active' : '') + '" data-cat="' + esc(c) + '" type="button">' +
        esc(c) + ' <span style="opacity:.6">' + n + '</span></button>';
    }).join('');
  }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return items.filter(function (it) {
      if (state.cat !== '全部' && it.cat !== state.cat) return false;
      if (!q) return true;
      return (it.name + ' ' + it.cat).toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderList() {
    var list = filtered();
    grid.innerHTML = list.map(function (it) {
      return '<article class="card item">' +
        '<div class="name"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M17 2 12 7 7 2"/></svg>' +
        '<span>' + esc(it.name) + '</span><span class="tag">' + esc(it.cat) + '</span></div>' +
        '<div class="url">' + esc(it.url) + '</div>' +
        '<div class="row">' +
        '<button class="copy-btn" type="button" data-copy="' + esc(it.url) + '">' +
        '<svg class="ic" viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>复制链接</button>' +
        '<a class="open-btn" href="' + esc(it.url) + '" target="_blank" rel="noopener">打开</a>' +
        '</div></article>';
    }).join('');
    empty.hidden = list.length > 0;
    document.getElementById('listTotal').textContent = list.length;
  }

  document.getElementById('m3uCats').addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    state.cat = chip.getAttribute('data-cat');
    renderChips();
    renderList();
  });

  var searchTimer;
  document.getElementById('m3uSearch').addEventListener('input', function (e) {
    var v = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { state.q = v; renderList(); }, 150);
  });

  document.getElementById('copyAll').addEventListener('click', function () {
    var urls = filtered().map(function (i) { return i.url; }).join('\n');
    if (!urls) { toast('当前没有可复制的链接'); return; }
    copyText(urls).then(function () { toast('已复制 ' + urls.split('\n').length + ' 条链接'); });
  });

  renderChips();
  renderList();
  document.getElementById('statFiles').textContent = items.length;

  /* ---------- iptv-org 表格 ---------- */
  var cats = (window.IPTV_ORG_CATEGORIES || []).map(function (r) {
    return { name: r[0], count: r[1], url: r[2], epg: r[3] || '' };
  });
  var countries = (window.IPTV_ORG_COUNTRIES || []).map(function (r) {
    return { name: r[0], count: r[1], url: r[2], epg: r[3] || '' };
  });
  document.getElementById('statCountries').textContent = countries.length + '+';

  var orgTab = 'cat';
  var orgEl = document.getElementById('orgTable');
  var orgEmpty = document.getElementById('orgEmpty');

  function copyCell(url) {
    return '<button class="copy-btn" type="button" data-copy="' + esc(url) + '">复制</button>';
  }

  function renderOrg() {
    var q = document.getElementById('orgSearch').value.trim().toLowerCase();
    var data = (orgTab === 'cat' ? cats : countries).filter(function (r) {
      return !q || (r.name + r.count).toLowerCase().indexOf(q) >= 0;
    });
    orgEmpty.hidden = data.length > 0;
    var head = orgTab === 'cat'
      ? '<tr><th>类别</th><th>频道</th><th>播放列表地址</th><th></th></tr>'
      : '<tr><th>国家 / 地区</th><th>频道</th><th>播放列表地址</th><th>EPG</th></tr>';
    var body = data.map(function (r) {
      var epgCell = orgTab === 'cat' ? '' : (r.epg
        ? '<td class="url-cell">' + esc(r.epg) + '</td>'
        : '<td class="url-cell">—</td>');
      return '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.count) + '</td>' +
        '<td class="url-cell">' + esc(r.url) + '</td>' +
        (orgTab === 'cat' ? '' : epgCell) +
        '<td>' + copyCell(r.url) + (r.epg ? ' ' + copyCell(r.epg) : '') + '</td></tr>';
    }).join('');
    orgEl.innerHTML = data.length
      ? '<table><thead>' + head + '</thead><tbody>' + body + '</tbody></table>'
      : '';
  }

  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      orgTab = t.getAttribute('data-tab');
      renderOrg();
    });
  });
  document.getElementById('orgSearch').addEventListener('input', renderOrg);
  renderOrg();

  /* ---------- 播放器 ---------- */
  var PLAYERS = [
    {
      plat: 'Windows', items: [
        ['VLC for Windows', 'https://www.videolan.org/vlc/download-windows.html'],
        ['Kodi', 'https://kodi.tv/'],
        ['IPTV Simple PVR（Kodi 插件）', 'https://kodi.tv/addon/pvr-client/pvr-iptv-simple-client']
      ]
    },
    {
      plat: 'macOS', items: [
        ['VLC for Mac OS X', 'https://www.videolan.org/vlc/download-macosx.html'],
        ['IINA', 'https://iina.io/'],
        ['Kodi', 'https://kodi.tv/'],
        ['IPTV Simple PVR（Kodi 插件）', 'https://kodi.tv/addon/pvr-client/pvr-iptv-simple-client']
      ]
    },
    {
      plat: 'iOS', items: [
        ['GSE SMART IPTV', 'https://apps.apple.com/us/app/gse-smart-iptv/id1028734023'],
        ['Movie Stream: Watch Smart IPTV', 'https://apps.apple.com/us/app/movie-stream-ip-tv-films/id1450912244'],
        ['nPlayer（支持 M3U / CUE / PLS）', 'https://apps.apple.com/cn/app/nplayer/id1116905928']
      ]
    },
    {
      plat: 'Apple TV', items: [
        ['iPlayTV', 'https://apps.apple.com/us/app/iplaytv/id1072226801']
      ],
      note: 'iPlayTV 食用指南：➕ → Remote Playlist File → 第一行填名称 → 第二行粘贴播放列表地址 → Save。'
    },
    {
      plat: 'Android', items: [
        ['NET IP TV', 'https://play.google.com/store/apps/details?id=com.dnamedya.netiptv'],
        ['Kodi', 'https://kodi.tv/'],
        ['IPTV Simple PVR（Kodi 插件）', 'https://kodi.tv/addon/pvr-client/pvr-iptv-simple-client']
      ]
    },
    {
      plat: 'PlayStation 4 / Xbox One', items: [
        ['Plex', 'https://www.plex.tv/apps-devices/#modal-devices-playstation-4'],
        ['Cigaras / IPTV.bundle（Plex 插件）', 'https://github.com/Cigaras/IPTV.bundle']
      ]
    }
  ];

  document.getElementById('players').innerHTML = PLAYERS.map(function (p) {
    return '<article class="card"><h4>' + esc(p.plat) + '</h4>' +
      '<ul class="plat-list">' + p.items.map(function (i) {
        return '<li><a href="' + esc(i[1]) + '" target="_blank" rel="noopener">' + esc(i[0]) + '</a></li>';
      }).join('') + '</ul>' +
      (p.note ? '<p style="margin:10px 0 0;font-size:12px;color:var(--muted)">' + esc(p.note) + '</p>' : '') +
      '</article>';
  }).join('');

  /* ---------- Kodi 插件 ---------- */
  var KODI = [
    {
      title: '插件库下载', items: [
        'Chinese Add-ons · repository.xbmc-addons-chinese-1.2.1.zip',
        'HDPfans 中文插件库 · repository.hdpfans.xbmc-addons-chinese.zip'
      ], links: [
        'https://t00y.com/file/15911488-391805376',
        'https://t00y.com/file/15911488-391813254'
      ]
    },
    {
      title: '视频插件', items: [
        '5ivdo · plugin.video.5ivdo',
        '亚洲电视（含内地/香港/台湾直播） · plugin.video.asia-tv',
        '百度云 · plugin.video.bdyun',
        '哔哩哔哩 · plugin.video.bilibili',
        '哔哩哔哩（第二版） · plugin.video.bilibili2',
        'CNTV 直播 · plugin.video.cntv-live',
        '央视重播 · plugin.video.cntv-replay',
        '多瑙影院播放器 · plugin.video.dnvodPlayer',
        '斗鱼TV · plugin.video.douyutv2',
        '风行视频 · plugin.video.funshion',
        '酷6云中剧场 · plugin.video.ku6',
        '乐视网 · plugin.video.letv',
        '美剧猫 · plugin.video.meijumao',
        'PPS影音 · plugin.video.pps',
        'PPStream 网络电视 · plugin.video.ppstream',
        'PPTV 视频 · plugin.video.pptv',
        '奇艺视频 · plugin.video.qiyi',
        '人人美剧 · plugin.video.rrmj',
        '搜狐视频 · plugin.video.sohuvideo',
        '音悦台 MV · plugin.video.yinyuetai',
        '优酷视频 · plugin.video.youku',
        'YouKu TV · plugin.video.youkutv',
        '战旗TV · plugin.video.zhanqitv'
      ]
    },
    {
      title: '音乐插件', items: [
        '一听音乐 · plugin.audio.1ting',
        '百度随心听 · plugin.audio.baidufm',
        '百度电台联盟 · plugin.audio.baiduradio',
        '豆瓣FM · plugin.audio.doubanfm',
        '酷狗电台 · plugin.audio.kugoufm',
        '酷我音乐盒 · plugin.audio.kuwobox',
        '中国广播 · plugin.audio.radiocn'
      ]
    },
    {
      title: '程序 / 字幕 / 刮削器', items: [
        'IPTV Tool · script.iptvtool（自动配置 PVR IPTV Simple Client）',
        'Skin Font · script.skinfont（为中文字体显示提供支持）',
        'Shooter(Fake) · service.subtitles.makedie',
        'Sub HD · service.subtitles.subhd',
        'zimuku · service.subtitles.zimuku',
        'ZiMuZu · service.subtitles.zimuzu',
        'ZMS · service.subtitles.zimushe',
        'doubantv · metadata.doubantv.com（豆瓣电视刮削器）'
      ]
    }
  ];

  document.getElementById('kodiGrid').innerHTML = KODI.map(function (g) {
    return '<article class="card"><div class="kodi-head"><h4>' + esc(g.title) + '</h4>' +
      '<span class="kodi-count">' + g.items.length + '</span></div>' +
      '<ul class="kodi-list">' + g.items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      (g.links ? '<div class="row" style="margin-top:10px;display:flex;gap:6px">' +
        g.links.map(function (u, i) {
          return '<a class="mini-copy" href="' + esc(u) + '" target="_blank" rel="noopener">下载 ' + (i + 1) + '</a>' +
            '<button class="mini-copy" type="button" data-copy="' + esc(u) + '">复制</button>';
        }).join('') + '</div>' : '') +
      '</article>';
  }).join('');

  /* ---------- 其他资源 ---------- */
  var RES = [
    {
      title: '渠道数据源',
      items: [
        ['电视直播源搜索引擎', 'https://www.foodieguide.com/iptvsearch/', 'm3u8 / flv / rtsp / rtmp 等直播源每日更新'],
        ['LyngSat', 'https://www.lyngsat.com/', '卫星电视频道数据库'],
        ['LyngSat Logo', 'https://www.lyngsat-logo.com/', '电视频道台标集合'],
        ['TV Address', 'http://www.tv-address.com/', '电视频道信息']
      ]
    },
    {
      title: 'EPG 电子节目单',
      items: [
        ['EPG for IPTV', 'https://www.iptv-epg.com/', '面向全球 IPTV 的节目指南服务'],
        ['epg.streamstv.me', 'http://epg.streamstv.me/epg/', '欧亚与北美频道节目指南'],
        ['IPTVX|one', 'https://iptvx.one/viewtopic.php?f=12&t=4', '主要用于 CIS 频道'],
        ['i.mjh.nz', 'http://i.mjh.nz/', '澳大利亚、新西兰、南非频道节目指南']
      ]
    },
    {
      title: '实用工具',
      items: [
        ['WebGrab + Plus', 'http://www.webgrabplus.com/', '多站点增量 XMLTV EPG 采集器'],
        ['IPTV Checker', 'https://www.npmjs.com/package/iptv-checker', 'Node.js 播放列表可用性检查'],
        ['Streamtest', 'https://streamtest.in/', '在线流地址测试'],
        ['M3U Edit', 'https://www.gtrigonakis.com/m3u-edit', '播放列表编辑']
      ]
    },
    {
      title: '监测工具',
      items: [
        ['直播源在线监测工具', 'http://cha.znds.com', '在线检测直播源是否可用'],
        ['电视直播源管理助手', '', 'PC 端管理工具（本地软件）']
      ]
    },
    {
      title: '视频教程',
      items: [
        ['VLC 播放 m3u 文件', 'https://www.youtube.com/watch?v=WlojFZW4kP0', 'YouTube'],
        ['KODI 配置 Live TV / PVR IPTV', 'https://www.youtube.com/watch?v=Us710Pkq9U8', 'YouTube'],
        ['iPlay TV on Apple TV', 'https://www.youtube.com/watch?v=LR67jOZaPk8', 'YouTube'],
        ['IINA：macOS 现代播放器', 'https://www.youtube.com/watch?v=zmEnLV7y_hw', 'YouTube'],
        ['PLEX 安装第三方插件与免费直播频道', 'https://www.youtube.com/watch?v=uj38KzUCNvs', 'YouTube'],
        ['PLEX + IPTV 配置教程', 'https://www.youtube.com/watch?v=pC1HXkJTbzk', 'YouTube']
      ]
    },
    {
      title: '文章与项目',
      items: [
        ['IPTV M3U FREE - IPTV Links', 'https://iptvgratuit.xyz/', '外部文章'],
        ['python iptv-m3u-maker', 'https://github.com/EvilCult/iptv-m3u-maker', '自动生成播放列表'],
        ['iptv-org/iptv', 'https://github.com/iptv-org/iptv', '8000+ 公共频道上游仓库'],
        ['XBMC 中国专用脚本 / 插件 / 皮肤', 'https://github.com/taxigps/xbmc-addons-chinese', 'GitHub']
      ]
    }
  ];

  document.getElementById('resourcesGrid').innerHTML = RES.map(function (g) {
    return '<article class="card"><h4>' + esc(g.title) + '</h4><ul class="res-list">' +
      g.items.map(function (i) {
        var link = i[1]
          ? '<a href="' + esc(i[1]) + '" target="_blank" rel="noopener">' + esc(i[0]) + '</a>'
          : '<span>' + esc(i[0]) + '</span>';
        return '<li>' + link + '<span class="desc">' + esc(i[2]) + '</span>' +
          (i[1] ? '<div class="row"><button class="mini-copy" type="button" data-copy="' + esc(i[1]) + '">复制链接</button></div>' : '') +
          '</li>';
      }).join('') + '</ul></article>';
  }).join('');
})();
