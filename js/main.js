// js/main.js
import { initPopup } from './popup.js';
import { loadFonts, fontsLoadedPromise } from './fontLoader.js';
import { initImageLoader } from './imageLoader.js';
import { initTextControls } from './textControls.js';
import { initModalControls } from './modalControls.js';
import { initDragAndDrop } from './dragAndDrop.js';
import { initSaveAndShare } from './saveAndShare.js';
import { initFontPicker } from './fontPicker.js';

// 성능 측정용 타이머
const perfMetrics = {
  start: performance.now(),
  phases: {}
};

// 앱 초기화 상태 관리
const appState = {
  initialized: false,
  fontsLoaded: false,
  uiReady: false
};

// 지연 로드할 모듈들 (중요도가 낮은 기능)
const lazyModules = [
  { name: 'saveAndShare', init: initSaveAndShare }
];

document.addEventListener('DOMContentLoaded', async () => {
  perfMetrics.phases.domLoaded = performance.now();
  
  // 팝업 모달 초기화 (사용자 상호작용 필요한 UI가 먼저 표시되어야 함)
  initPopup();
  
  // 필수 모듈 병렬 초기화 - 사용자 경험에 중요한 것들
  const essentialPromises = [
    // 폰트 로드 (비동기)
    loadFonts().then(() => {
      appState.fontsLoaded = true;
      perfMetrics.phases.fontsLoaded = performance.now();
    }),
    
    // 이미지 로더 초기화
    Promise.resolve().then(() => {
      initImageLoader();
      perfMetrics.phases.imageLoaderInit = performance.now();
    })
  ];
  
  // 필수 모듈들 모두 준비될 때까지 대기
  await Promise.all(essentialPromises);
  
  // 폰트 로드에 의존하는 모듈들 초기화
  try {
    // 남은 기본 UI 모듈 초기화
    initTextControls();
    initModalControls();
    initDragAndDrop();
    initFontPicker();
    
    appState.uiReady = true;
    perfMetrics.phases.uiReady = performance.now();
    console.log('모든 UI 컨트롤 초기화 완료');
    
    // 비필수 모듈은 약간 지연 로드 (UI 부드러움 확보)
    setTimeout(() => {
      lazyModules.forEach(module => {
        module.init();
        perfMetrics.phases[`${module.name}Loaded`] = performance.now();
      });
      
      appState.initialized = true;
      perfMetrics.phases.fullyInitialized = performance.now();
      
      // 디버그용 성능 로깅
      console.log('앱 초기화 성능:', {
        total: perfMetrics.phases.fullyInitialized - perfMetrics.start,
        phases: Object.entries(perfMetrics.phases).reduce((acc, [key, time]) => {
          acc[key] = Math.round(time - perfMetrics.start);
          return acc;
        }, {})
      });
    }, 100);
    
    // UI 준비 완료 알림
    showInitializedNotification();
    
  } catch (error) {
    console.error('초기화 중 오류 발생:', error);
    
    // 오류가 있어도 기본 기능은 동작하도록 복구
    if (!appState.uiReady) {
      initTextControls();
      initModalControls();
      initDragAndDrop();
      initFontPicker();
      appState.uiReady = true;
    }
    
    // 지연 로드 모듈들도 초기화 시도
    lazyModules.forEach(module => {
      try {
        module.init();
      } catch (e) {
        console.error(`${module.name} 초기화 실패:`, e);
      }
    });
    
    // 사용자에게 알림
    showErrorNotification();
  }
});

// UI 알림 함수
function showInitializedNotification() {
  const statusElem = document.createElement('div');
  statusElem.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#59b4ad; color:white; padding:10px; border-radius:5px; z-index:1000; opacity:0; transition:opacity 0.3s;';
  statusElem.textContent = '에디터가 준비되었습니다';
  document.body.appendChild(statusElem);
  
  // 애니메이션 최적화 - requestAnimationFrame 사용
  requestAnimationFrame(() => {
    statusElem.style.opacity = '1';
    setTimeout(() => {
      statusElem.style.opacity = '0';
      statusElem.addEventListener('transitionend', () => statusElem.remove());
    }, 2000);
  });
}

// 오류 알림
function showErrorNotification() {
  const errorElem = document.createElement('div');
  errorElem.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#ff3b30; color:white; padding:10px; border-radius:5px; z-index:1000; opacity:0; transition:opacity 0.3s;';
  errorElem.textContent = '일부 기능이 제한될 수 있습니다';
  document.body.appendChild(errorElem);
  
  requestAnimationFrame(() => {
    errorElem.style.opacity = '1';
    setTimeout(() => {
      errorElem.style.opacity = '0';
      errorElem.addEventListener('transitionend', () => errorElem.remove());
    }, 3000);
  });
}