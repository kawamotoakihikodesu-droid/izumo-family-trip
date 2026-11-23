/**
 * 出雲・松江 家族旅行プランニング メインスクリプト
 * ドーミーイン出雲連泊・プラン連動マップ・地図ジャンプ・進捗バー・ScrollSpy
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Lucide Icons 初期化
  if (window.lucide) {
    lucide.createIcons();
  }

  // 2. モバイルメニュー トグル
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

  // 3. 印刷ボタン（ヘッダー＆モバイルドロワー）
  const printBtn = document.getElementById('printBtn');
  const drawerPrintBtn = document.getElementById('drawerPrintBtn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());
  if (drawerPrintBtn) drawerPrintBtn.addEventListener('click', () => window.print());

  // 4. URL共有モーダル
  initShareModal();

  // 5. プラン切り替え（レンタカーあり vs 公共交通）
  initPlanSwitcher();

  // 6. 旅程表タブ切り替え
  initItineraryTabs();

  // 7. Leaflet 観光マップ（プラン連動＆スポットジャンプ対応）
  initMap();

  // 8. 持ち物チェックリスト（LocalStorage＆進捗バー）
  initChecklist();

  // 9. ScrollSpy & トップへ戻るボタン
  initScrollEnhancements();
});

/* ==========================================================================
   プラン切り替え（レンタカーあり vs なし）一元管理
   ========================================================================== */
let currentPlan = 'car'; // 'car' | 'transit'

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
    if (leadDesc) leadDesc.textContent = '初日は空港から出雲市駅前へ。2日目に出雲大社・稲佐の浜・松江城・宍道湖夕日を車で効率よく巡ります。';
    if (tabSub1) tabSub1.textContent = '15:55着 ➔ 車で宿へ';
    if (tabSub2) tabSub2.textContent = '稲佐の浜・大社・松江';
    if (tabSub3) tabSub3.textContent = '朝観光 ➔ 12:05便';
  } else {
    if (mainHeading) mainHeading.textContent = '【プランB：レンタカーなし（公共交通）】3日間の旅程表';
    if (subHeading) subHeading.textContent = 'PUBLIC TRANSIT & TRAIN ITINERARY';
    if (leadDesc) leadDesc.textContent = '駅前の立地を最大限に活用。一畑電車（ばたでん）や特急やくもを乗り継ぎ、全員がお酒を楽しめる鉄道旅情コースです。';
    if (tabSub1) tabSub1.textContent = '15:55着 ➔ バスで宿へ';
    if (tabSub2) tabSub2.textContent = '一畑電車・松江・特急';
    if (tabSub3) tabSub3.textContent = '朝食満喫 ➔ 12:05便';
  }

  // 現在アクティブな日程タブを維持したまま新プランのパネルを表示
  syncActiveDayPanel();

  // マップもプランに合わせて更新
  if (window.updateMapPlan) {
    window.updateMapPlan(plan);
  }
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

/* ==========================================================================
   旅程表 日付タブ切り替え
   ========================================================================== */
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

  const closeModal = () => {
    modal.classList.remove('active');
  };

  if (shareBtn) shareBtn.addEventListener('click', openModal);
  if (mobileShareBtn) mobileShareBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
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
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 3000);
  }
}

/* ==========================================================================
   Leaflet マップ初期化（プランA/B連動 ＆ スポットジャンプ対応）
   ========================================================================== */
function initMap() {
  const mapElement = document.getElementById('izumoMap');
  if (!mapElement || typeof L === 'undefined') return;

  const centerCoord = [35.425, 132.85];
  const map = L.map('izumoMap', { scrollWheelZoom: false }).setView(centerCoord, 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
  }).addTo(map);

  const spots = [
    {
      id: 'dormy-hotel',
      name: '天然温泉 八雲の湯 ドーミーイン出雲（連泊）',
      lat: 35.3606,
      lng: 132.7561,
      day: 'hotel',
      plans: ['car', 'transit'],
      category: '★宿泊拠点（2連泊）',
      desc: 'JR出雲市駅南口徒歩1分。最上階天然温泉＆サウナ、夜鳴きそば無料、朝食バイキング。',
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
      desc: '11/27 15:55着、11/29 12:05発。レンタカー受取・直行バス発着。',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'inasa',
      name: '稲佐の浜（弁天島）',
      lat: 35.3996,
      lng: 132.6718,
      day: 'day2',
      plans: ['car'],
      category: '🚗 車限定：お砂取り',
      desc: '国譲り神話の浜。砂をいただき出雲大社の素鵞社で御砂と交換します。無料駐車場完備。',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'taisha',
      name: '出雲大社（御本殿・神楽殿）',
      lat: 35.4014,
      lng: 132.6855,
      day: 'day2',
      plans: ['car', 'transit'],
      category: '2日目：縁結び正式参拝',
      desc: '二礼四拍手一礼で参拝。神楽殿の5.2トン巨大注連縄は必見の迫力！',
      image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'taisha-station',
      name: '一畑電車 出雲大社前駅',
      lat: 35.3965,
      lng: 132.6862,
      day: 'day2',
      plans: ['transit'],
      category: '🚌 公共交通：有形文化財駅舎',
      desc: 'プランBの玄関口。昭和レトロな美しいステンドグラス洋風駅舎。',
      image: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'matsue-castle',
      name: '国宝 松江城 ＆ 堀川めぐり',
      lat: 35.4751,
      lng: 133.0506,
      day: 'day2',
      plans: ['car', 'transit'],
      category: '2日目：国宝天守＆こたつ船',
      desc: '山陰唯一の現存国宝天守。11月下旬はお堀をめぐるぽかぽか「こたつ船」が人気！',
      image: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'sunset-spot',
      name: '宍道湖夕日スポット（とるPA）',
      lat: 35.4526,
      lng: 133.0519,
      day: 'day2',
      plans: ['car'],
      category: '🚗 車限定：日本の夕陽百選PA',
      desc: '国道9号沿い。車を横付けして嫁ヶ島と茜色の空を眺める特等席。',
      image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'art-museum',
      name: '島根県立美術館（宍道湖うさぎ）',
      lat: 35.4608,
      lng: 133.0503,
      day: 'day2',
      plans: ['transit'],
      category: '🚌 公共交通：夕日スポット',
      desc: 'レイクラインバスで直行。湖畔芝生で「宍道湖うさぎ」を撫でて夕日鑑賞。',
      image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'winery',
      name: '島根ワイナリー',
      lat: 35.3923,
      lng: 132.7093,
      day: 'day3',
      plans: ['car'],
      category: '🚗 車限定：3日目朝プチ観光',
      desc: 'ワイン・ぶどうジュース試飲とお土産選び。空港まで車25分。',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80'
    }
  ];

  function createCustomIcon(day) {
    let color = '#c43d27';
    if (day === 'hotel') color = '#f39c12';
    else if (day === 'day2') color = '#1e3a5f';
    else if (day === 'day3') color = '#27ae60';

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

  // プランA（車）とプランB（公共交通）別のルートライン
  const routes = {
    car: {
      day1: L.polyline([[35.4136, 132.8894], [35.3606, 132.7561]], { color: '#c43d27', weight: 3, dashArray: '6, 6', opacity: 0.8 }),
      day2: L.polyline([[35.3606, 132.7561], [35.3996, 132.6718], [35.4014, 132.6855], [35.4751, 133.0506], [35.4526, 133.0519], [35.3606, 132.7561]], { color: '#1e3a5f', weight: 3, dashArray: '6, 6', opacity: 0.8 }),
      day3: L.polyline([[35.3606, 132.7561], [35.3923, 132.7093], [35.4136, 132.8894]], { color: '#27ae60', weight: 3, dashArray: '6, 6', opacity: 0.8 })
    },
    transit: {
      day1: L.polyline([[35.4136, 132.8894], [35.3606, 132.7561]], { color: '#c43d27', weight: 3, dashArray: '4, 8', opacity: 0.8 }),
      day2: L.polyline([[35.3606, 132.7561], [35.3965, 132.6862], [35.4014, 132.6855], [35.4751, 133.0506], [35.4608, 133.0503], [35.3606, 132.7561]], { color: '#1e3a5f', weight: 3, dashArray: '4, 8', opacity: 0.8 }),
      day3: L.polyline([[35.3606, 132.7561], [35.4136, 132.8894]], { color: '#27ae60', weight: 3, dashArray: '4, 8', opacity: 0.8 })
    }
  };

  let activeFilter = 'all';

  function renderMapLayers(fitToBounds = false) {
    const bounds = [];

    // マーカー表示制御（選択中のプラン ＆ 日程フィルターに一致するもの）
    markerObjects.forEach(marker => {
      const spot = marker.spotData;
      const inPlan = spot.plans.includes(currentPlan);
      const inFilter = (activeFilter === 'all') || (spot.day === activeFilter) || (spot.day === 'hotel');

      if (inPlan && inFilter) {
        if (!map.hasLayer(marker)) map.addLayer(marker);
        bounds.push([spot.lat, spot.lng]);
      } else {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      }
    });

    // 全ルートラインを一旦クリアして、該当プランの該当ラインのみ表示
    ['car', 'transit'].forEach(planKey => {
      ['day1', 'day2', 'day3'].forEach(dayKey => {
        const line = routes[planKey][dayKey];
        const shouldShow = (planKey === currentPlan) && (activeFilter === 'all' || activeFilter === dayKey);
        if (shouldShow) {
          if (!map.hasLayer(line)) map.addLayer(line);
        } else {
          if (map.hasLayer(line)) map.removeLayer(line);
        }
      });
    });

    // 説明文更新
    const mapDesc = document.getElementById('map-plan-desc');
    if (mapDesc) {
      mapDesc.innerHTML = currentPlan === 'car'
        ? '現在表示中：<strong>🚗 プランA（レンタカーあり）</strong>のルート。ピンをタップすると写真と詳細が開きます。'
        : '現在表示中：<strong>🚌 プランB（レンタカーなし・公共交通）</strong>のルート。ピンをタップすると写真と詳細が開きます。';
    }

    if (fitToBounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    }
  }

  // 初回描画
  renderMapLayers(false);

  // フィルターボタン
  const filterBtns = document.querySelectorAll('.map-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.getAttribute('data-filter');
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMapLayers(true);
    });
  });

  // プラン切り替え時のコールバック
  window.updateMapPlan = function() {
    renderMapLayers(false);
    map.invalidateSize();
  };

  // スポットカードの「地図で見る」ボタン連携
  const jumpBtns = document.querySelectorAll('.map-jump-btn');
  jumpBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const spotId = btn.getAttribute('data-spot');
      const marker = markerMap[spotId];
      if (!marker) return;

      // フィルターを「全スポット」に戻して確実に表示させる
      activeFilter = 'all';
      filterBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === 'all'));
      renderMapLayers(false);

      const mapSection = document.getElementById('map-section');
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      setTimeout(() => {
        map.setView(marker.getLatLng(), 14, { animate: true });
        marker.openPopup();
      }, 450);
    });
  });
}

/* ==========================================================================
   持ち物チェックリスト（LocalStorage同期 ＆ 進捗プログレスバー）
   ========================================================================== */
function initChecklist() {
  const STORAGE_KEY = 'izumo_dormy_checklist_v3';
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
    setTimeout(() => {
      saveStatus.style.opacity = '0';
    }, 2000);
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
          setTimeout(() => {
            saveStatus.style.opacity = '0';
          }, 2000);
        }
      }
    });
  }
}

/* ==========================================================================
   ScrollSpy（現在位置ハイライト）＆ トップへ戻るボタン
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

    // トップへ戻るボタン表示制御
    if (backToTopBtn) {
      backToTopBtn.classList.toggle('visible', scrollY > 400);
    }

    // 現在表示中のセクションを判定
    let currentSectionId = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 130;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentSectionId = sec.id;
      }
    });

    navLinks.forEach(link => {
      const target = link.getAttribute('data-section');
      link.classList.toggle('active', target === currentSectionId);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
