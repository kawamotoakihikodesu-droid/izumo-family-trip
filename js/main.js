/**
 * 出雲・松江 家族旅行プランニング メインスクリプト
 * ドーミーイン出雲連泊・希望8スポット完全反映・見送り候補距離マップ・進捗バー・ScrollSpy
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // モバイルメニュー
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('active');
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 印刷ボタン
  const printBtn = document.getElementById('printBtn');
  const drawerPrintBtn = document.getElementById('drawerPrintBtn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());
  if (drawerPrintBtn) drawerPrintBtn.addEventListener('click', () => window.print());

  initShareModal();
  initPlanSwitcher();
  initItineraryTabs();
  initMap();
  initChecklist();
  initScrollEnhancements();
});

/* ==========================================================================
   プラン切り替え（レンタカーあり vs なし）
   ========================================================================== */
let currentPlan = 'car';

function switchPlan(plan) {
  if (currentPlan === plan) return;
  currentPlan = plan;

  const btnCar = document.getElementById('btnPlanCar');
  const btnTransit = document.getElementById('btnPlanTrain');
  const stickyPills = document.querySelectorAll('.sticky-pill');
  const wrapperCar = document.getElementById('wrapper-car');
  const wrapperTransit = document.getElementById('wrapper-transit');
  const mainHeading = document.getElementById('itinerary-mainheading');
  const subHeading = document.getElementById('itinerary-subheading');
  const leadDesc = document.getElementById('itinerary-leaddesc');
  const tabSub1 = document.getElementById('tab-sub-day1');
  const tabSub2 = document.getElementById('tab-sub-day2');
  const tabSub3 = document.getElementById('tab-sub-day3');

  const isCar = plan === 'car';

  if (btnCar && btnTransit) {
    btnCar.classList.toggle('active', isCar);
    btnCar.setAttribute('aria-pressed', String(isCar));
    btnTransit.classList.toggle('active', !isCar);
    btnTransit.setAttribute('aria-pressed', String(!isCar));
  }

  stickyPills.forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('data-plan-switch') === plan);
  });

  if (wrapperCar && wrapperTransit) {
    wrapperCar.style.display = isCar ? 'block' : 'none';
    wrapperTransit.style.display = isCar ? 'none' : 'block';
  }

  if (isCar) {
    if (mainHeading) mainHeading.textContent = '【プランA：レンタカー利用】3日間の旅程表';
    if (subHeading) subHeading.textContent = 'CAR RENTAL ITINERARY';
    if (leadDesc) leadDesc.textContent = '希望8スポットのうち6箇所（出西・万九千・木綿街道・歴博・松江城・亀田山喫茶室）＋出雲大社を美しく繋ぐ黄金ルートです。';
    if (tabSub1) tabSub1.textContent = '空港➔出西village➔宿';
    if (tabSub2) tabSub2.textContent = '大社・歴博・木綿・松江城';
    if (tabSub3) tabSub3.textContent = '万九千・出西パン➔空港';
  } else {
    if (mainHeading) mainHeading.textContent = '【プランB：レンタカーなし（公共交通）】3日間の旅程表';
    if (subHeading) subHeading.textContent = 'PUBLIC TRANSIT & TRAIN ITINERARY';
    if (leadDesc) leadDesc.textContent = '一畑電車と特急やくもを活用し、希望スポット4箇所（歴博・木綿街道・松江城・亀田山喫茶室）＋出雲大社を満喫する鉄道旅情コースです。';
    if (tabSub1) tabSub1.textContent = '空港➔バスで宿直行';
    if (tabSub2) tabSub2.textContent = '電車・木綿・松江城・特急';
    if (tabSub3) tabSub3.textContent = '朝食満喫➔空港バス';
  }

  syncActiveDayPanel();
  if (window.updateMapPlan) window.updateMapPlan(plan);
}

function initPlanSwitcher() {
  const btnCar = document.getElementById('btnPlanCar');
  const btnTransit = document.getElementById('btnPlanTrain');
  const stickyPills = document.querySelectorAll('.sticky-pill');

  if (btnCar) btnCar.addEventListener('click', () => switchPlan('car'));
  if (btnTransit) btnTransit.addEventListener('click', () => switchPlan('transit'));

  stickyPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetPlan = pill.getAttribute('data-plan-switch');
      if (targetPlan) switchPlan(targetPlan);
    });
  });
}

function syncActiveDayPanel() {
  const activeTab = document.querySelector('.itinerary-tabs .tab-btn.active');
  const targetDay = activeTab ? activeTab.getAttribute('data-day') : 'day1';
  const activeWrapper = document.getElementById(`wrapper-${currentPlan}`);
  if (!activeWrapper) return;

  const dayPanels = activeWrapper.querySelectorAll('.day-panel');
  if (targetDay === 'all') {
    dayPanels.forEach(panel => {
      panel.classList.add('active');
      panel.style.display = 'block';
    });
  } else {
    dayPanels.forEach(panel => {
      if (panel.id === `${currentPlan}-panel-${targetDay}`) {
        panel.classList.add('active');
        panel.style.display = 'block';
      } else {
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    });
  }
}

function initItineraryTabs() {
  const tabBtns = document.querySelectorAll('.itinerary-tabs .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      syncActiveDayPanel();
    });
  });
}

/* ==========================================================================
   URL共有モーダル
   ========================================================================== */
function initShareModal() {
  const shareBtn = document.getElementById('shareUrlBtn');
  const mobileShareBtn = document.getElementById('mobileShareBtn');
  const modal = document.getElementById('shareModal');
  const closeBtn = document.getElementById('shareModalCloseBtn');
  const copyBtn = document.getElementById('copyShareBtn');
  const input = document.getElementById('shareUrlInput');
  const feedback = document.getElementById('copyFeedback');

  if (!modal) return;

  const currentUrl = window.PUBLIC_URL || window.location.href;
  if (input) input.value = currentUrl;

  const openModal = () => {
    if (input) input.value = window.PUBLIC_URL || window.location.href;
    modal.classList.add('active');
  };
  const closeModal = () => modal.classList.remove('active');

  if (shareBtn) shareBtn.addEventListener('click', openModal);
  if (mobileShareBtn) mobileShareBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!input) return;
      input.select();
      input.setSelectionRange(0, 99999);
      const textToCopy = input.value;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(showCopied);
      } else {
        document.execCommand('copy');
        showCopied();
      }
    });
  }

  function showCopied() {
    if (!feedback) return;
    feedback.style.display = 'block';
    setTimeout(() => { feedback.style.display = 'none'; }, 3000);
  }
}

/* ==========================================================================
   Leaflet マップ初期化（希望8スポット＋見送り候補距離確認対応）
   ========================================================================== */
function initMap() {
  const mapElement = document.getElementById('izumoMap');
  if (!mapElement || typeof L === 'undefined') return;

  const centerCoord = [35.43, 132.88];
  const map = L.map('izumoMap', { scrollWheelZoom: false }).setView(centerCoord, 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
  }).addTo(map);

  const spots = [
    {
      id: 'dormy-hotel',
      name: '天然温泉 八雲の湯 ドーミーイン出雲（2連泊）',
      lat: 35.3606,
      lng: 132.7561,
      day: 'hotel',
      plans: ['car', 'transit'],
      category: '★宿泊拠点（JR出雲市駅徒歩1分）',
      desc: '最上階天然温泉「八雲の湯」＆夜鳴きそば無料。2連泊で荷造り不要！',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'airport',
      name: '出雲縁結び空港',
      lat: 35.4136,
      lng: 132.8894,
      day: 'day1',
      plans: ['car', 'transit'],
      category: '発着拠点（JAL283/280）',
      desc: '11/27 15:55着、11/29 12:05発。出西・万九千神社まで車10〜15分！',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'shussai',
      name: '出西くらしのvillage（出西窯・パン）',
      lat: 35.3663,
      lng: 132.8334,
      day: 'day1',
      plans: ['car'],
      category: '🚗 希望スポット（1日目夕＆3日目朝）',
      desc: '出西窯・Bshopは18時迄、ル コションドール出西（パン＆珈琲）は朝9:30〜！',
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'taisha',
      name: '出雲大社（御本殿・神楽殿）',
      lat: 35.4014,
      lng: 132.6855,
      day: 'day2',
      plans: ['car', 'transit'],
      category: '2日目：縁結び正式参拝',
      desc: '二礼四拍手一礼で参拝。神楽殿の5.2トン巨大注連縄は必見！',
      image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'rekihaku',
      name: '島根県立古代出雲歴史博物館',
      lat: 35.3986,
      lng: 132.6908,
      day: 'day2',
      plans: ['car', 'transit'],
      category: '★希望スポット（2026年10月リニューアル）',
      desc: '出雲大社の東隣（徒歩5分）。新設の神話シアターや国宝銅剣358本、古代本殿模型が圧巻。',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'momen',
      name: '木綿街道（平田）',
      lat: 35.4307,
      lng: 132.8206,
      day: 'day2',
      plans: ['car', 'transit'],
      category: '★希望スポット（江戸の町並み）',
      desc: '醤油ソフト・生姜糖の食べ歩き。一畑電車「雲州平田駅」徒歩10分で電車でもOK！',
      image: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'matsue-castle',
      name: '国宝 松江城 ＆ 亀田山喫茶室（興雲閣1F）',
      lat: 35.4751,
      lng: 133.0506,
      day: 'day2',
      plans: ['car', 'transit'],
      category: '★希望スポット×2（天守＆洋館カフェ）',
      desc: '亀田山喫茶室は松江城敷地内の明治洋館「興雲閣」1階（土日L.O. 16:30）。',
      image: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'sunset-spot',
      name: '宍道湖夕日スポット（とるPA）',
      lat: 35.4526,
      lng: 133.0519,
      day: 'day2',
      plans: ['car'],
      category: '🚗 車限定：日本の夕陽百選',
      desc: '嫁ヶ島と茜色の夕日を車からすぐ眺められる絶景スポット。',
      image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'mankusen',
      name: '万九千神社（まんくせんじんじゃ）',
      lat: 35.3941,
      lng: 132.8511,
      day: 'day3',
      plans: ['car'],
      category: '🚗 希望スポット（3日目朝参拝）',
      desc: '神在月の最後に神々が旅立つ神社。出雲空港から車でわずか10分！',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'karakama',
      name: '韓竈神社（差替オプション候補）',
      lat: 35.4488,
      lng: 132.7429,
      day: 'optional',
      plans: ['car', 'transit'],
      category: '△ 差替候補（レンタカー・晴天時）',
      desc: '山奥の秘境。急な石段300段＆幅45cmの岩戸くぐり。木綿街道と入れ替えなら可能。',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'mizuki',
      name: '水木しげるロード（鳥取県境港市・今回は見送り推奨）',
      lat: 35.5453,
      lng: 133.2248,
      day: 'optional',
      plans: ['car', 'transit'],
      category: '× 優先度最低（遠距離のため見送り）',
      desc: '出雲市駅から車で往復約3時間・電車往復約5時間。次回「鳥取・米子旅」のメインに！',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=500&q=80'
    }
  ];

  function createCustomIcon(day) {
    let color = '#c43d27';
    if (day === 'hotel') color = '#f39c12';
    else if (day === 'day2') color = '#1e3a5f';
    else if (day === 'day3') color = '#27ae60';
    else if (day === 'optional') color = '#7f8c8d';

    const svgHtml = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34">
        <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="3.2" fill="#ffffff"/>
      </svg>
    `;

    return L.divIcon({
      html: svgHtml,
      className: 'custom-map-pin',
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34]
    });
  }

  const markerMap = {};
  const markerObjects = [];

  spots.forEach(spot => {
    const icon = createCustomIcon(spot.day);
    const marker = L.marker([spot.lat, spot.lng], { icon });

    const popupContent = `
      <div class="popup-card">
        <img src="${spot.image}" alt="${spot.name}" loading="lazy">
        <div class="popup-body">
          <span class="popup-tag ${spot.day}">${spot.category}</span>
          <h4 class="popup-title">${spot.name}</h4>
          <p class="popup-desc">${spot.desc}</p>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.spotData = spot;
    markerObjects.push(marker);
    markerMap[spot.id] = marker;
  });

  // プランA（車）とプランB（公共交通）のルートライン
  const routes = {
    car: {
      day1: L.polyline([[35.4136, 132.8894], [35.3663, 132.8334], [35.3606, 132.7561]], { color: '#c43d27', weight: 3, dashArray: '6, 6', opacity: 0.85 }),
      day2: L.polyline([[35.3606, 132.7561], [35.4014, 132.6855], [35.3986, 132.6908], [35.4307, 132.8206], [35.4751, 133.0506], [35.4526, 133.0519], [35.3606, 132.7561]], { color: '#1e3a5f', weight: 3, dashArray: '6, 6', opacity: 0.85 }),
      day3: L.polyline([[35.3606, 132.7561], [35.3941, 132.8511], [35.3663, 132.8334], [35.4136, 132.8894]], { color: '#27ae60', weight: 3, dashArray: '6, 6', opacity: 0.85 })
    },
    transit: {
      day1: L.polyline([[35.4136, 132.8894], [35.3606, 132.7561]], { color: '#c43d27', weight: 3, dashArray: '4, 8', opacity: 0.85 }),
      day2: L.polyline([[35.3606, 132.7561], [35.4014, 132.6855], [35.3986, 132.6908], [35.4307, 132.8206], [35.4751, 133.0506], [35.3606, 132.7561]], { color: '#1e3a5f', weight: 3, dashArray: '4, 8', opacity: 0.85 }),
      day3: L.polyline([[35.3606, 132.7561], [35.4136, 132.8894]], { color: '#27ae60', weight: 3, dashArray: '4, 8', opacity: 0.85 })
    }
  };

  let activeFilter = 'all';

  function renderMapLayers(fitToBounds = false) {
    const bounds = [];

    markerObjects.forEach(marker => {
      const spot = marker.spotData;
      const inPlan = spot.plans.includes(currentPlan);
      let inFilter = false;

      if (activeFilter === 'all') {
        inFilter = (spot.day !== 'optional');
      } else if (activeFilter === 'optional') {
        inFilter = true;
      } else {
        inFilter = (spot.day === activeFilter) || (spot.day === 'hotel');
      }

      if (inPlan && inFilter) {
        if (!map.hasLayer(marker)) map.addLayer(marker);
        bounds.push([spot.lat, spot.lng]);
      } else {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      }
    });

    ['car', 'transit'].forEach(planKey => {
      ['day1', 'day2', 'day3'].forEach(dayKey => {
        const line = routes[planKey][dayKey];
        const shouldShow = (planKey === currentPlan) && (activeFilter === 'all' || activeFilter === 'optional' || activeFilter === dayKey);
        if (shouldShow) {
          if (!map.hasLayer(line)) map.addLayer(line);
        } else {
          if (map.hasLayer(line)) map.removeLayer(line);
        }
      });
    });

    const mapDesc = document.getElementById('map-plan-desc');
    if (mapDesc) {
      mapDesc.innerHTML = currentPlan === 'car'
        ? '現在表示中：<strong>🚗 プランA（レンタカーあり）</strong>のルート。「見送り/差替候補も比較」を押すと水木しげるロードの遠さも一目で分かります。'
        : '現在表示中：<strong>🚌 プランB（レンタカーなし・公共交通）</strong>のルート。「見送り/差替候補も比較」を押すと距離感が一目で分かります。';
    }

    if (fitToBounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    }
  }

  renderMapLayers(false);

  const filterBtns = document.querySelectorAll('.map-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.getAttribute('data-filter');
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMapLayers(true);
    });
  });

  window.updateMapPlan = function() {
    renderMapLayers(false);
    map.invalidateSize();
  };

  // 「地図で見る」ジャンプボタン（見送り候補へのジャンプにも対応）
  const jumpBtns = document.querySelectorAll('.map-jump-btn');
  jumpBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const spotId = btn.getAttribute('data-spot');
      const marker = markerMap[spotId];
      if (!marker) return;

      const isOptional = marker.spotData.day === 'optional';
      activeFilter = isOptional ? 'optional' : 'all';
      filterBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === activeFilter));
      renderMapLayers(false);

      const mapSection = document.getElementById('map-section');
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      setTimeout(() => {
        map.setView(marker.getLatLng(), isOptional ? 10 : 13, { animate: true });
        marker.openPopup();
      }, 450);
    });
  });
}

/* ==========================================================================
   持ち物チェックリスト（進捗プログレスバー付き）
   ========================================================================== */
function initChecklist() {
  const STORAGE_KEY = 'izumo_dormy_checklist_v4';
  const checkboxes = document.querySelectorAll('#checklist input[type="checkbox"]');
  const resetBtn = document.getElementById('resetChecklistBtn');
  const saveStatus = document.getElementById('saveStatus');
  const progressCount = document.getElementById('progressCount');
  const progressFill = document.getElementById('progressFill');
  const completeMsg = document.getElementById('progressCompleteMsg');

  function updateProgress() {
    const total = checkboxes.length;
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

    if (progressCount) progressCount.textContent = `${checked} / ${total} 完了 (${pct}%)`;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (completeMsg) completeMsg.style.display = (checked === total && total > 0) ? 'block' : 'none';
  }

  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    checkboxes.forEach(cb => {
      const key = cb.getAttribute('data-key');
      if (savedState[key]) cb.checked = true;
    });
  } catch (e) {
    console.error('LocalStorage load error', e);
  }

  updateProgress();

  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      saveChecklistState();
      updateProgress();
      showSaveFeedback();
    });
  });

  function saveChecklistState() {
    const state = {};
    checkboxes.forEach(cb => {
      const key = cb.getAttribute('data-key');
      state[key] = cb.checked;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('LocalStorage save error', e);
    }
  }

  function showSaveFeedback() {
    if (!saveStatus) return;
    saveStatus.textContent = '✓ 自動保存しました';
    saveStatus.style.opacity = '1';
    setTimeout(() => { saveStatus.style.opacity = '0'; }, 2000);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('チェックリストをすべてリセットしますか？')) {
        checkboxes.forEach(cb => cb.checked = false);
        localStorage.removeItem(STORAGE_KEY);
        updateProgress();
        if (saveStatus) {
          saveStatus.textContent = 'リセットしました';
          saveStatus.style.opacity = '1';
          setTimeout(() => { saveStatus.style.opacity = '0'; }, 2000);
        }
      }
    });
  }
}

/* ==========================================================================
   ScrollSpy ＆ トップへ戻るボタン
   ========================================================================== */
function initScrollEnhancements() {
  const backToTopBtn = document.getElementById('backToTopBtn');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[data-section], .mobile-bottom-bar a[data-section]');

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function onScroll() {
    const scrollY = window.scrollY;
    if (backToTopBtn) backToTopBtn.classList.toggle('visible', scrollY > 400);

    let currentSectionId = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 130;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) currentSectionId = sec.id;
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-section') === currentSectionId);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
