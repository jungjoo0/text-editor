// js/fontLoader.js
export const fontFiles = [
  '강원교육현옥샘.ttf',
  '강원교육모두.ttf',
  '강원교육새음.ttf',
  '학교안심우산.ttf',
  '학교안심우주.ttf',
  '학교안심여행.ttf',
  '상상토끼꽃길.ttf',
  '더페이스샵.ttf',
  '마포꽃섬.ttf',
  '바른히피.ttf',
  '빙그레싸만코.ttf',
  '배달의민족연성체.ttf',
  '배달의민족도현.ttf',
  '배달의민족을지로체.ttf',
  '배달의민족한나체Air.ttf',
  '배달의민족한나체Pro.ttf',
  '배달의민족주아체.ttf',
  '평창평화체.ttf'
];

// 폰트 로드 완료를 추적하기 위한 Promise 
export let fontsLoadedPromise;

// 폰트 로드 상태 캐싱
const fontLoadStatus = {
  loaded: new Set(), // 이미 로드된 폰트 추적
  loading: new Set() // 현재 로드 중인 폰트 추적
};

export function loadFonts() {
  const statusDiv = document.createElement('div');
  statusDiv.id = 'fontLoadStatus';
  statusDiv.style.cssText = 'font-size:12px;color:#666;margin-top:5px;';
  const fontFamily = document.getElementById('fontFamily');
  const modalFontFamily = document.getElementById('modalFontFamily');
  
  // 이미 상태 표시 요소가 있는지 확인
  const existingStatus = document.getElementById('fontLoadStatus');
  if (!existingStatus) {
    fontFamily.parentNode.insertAdjacentElement('afterend', statusDiv);
  }
  statusDiv.textContent = '폰트 로드 중...';

  let loadedCount = 0, failedCount = 0;
  const loadedFonts = [];

  // 폰트 로딩 최적화 - 병렬 처리 제한
  const MAX_PARALLEL_LOADS = 4;
  let activeLoads = 0;
  let fontQueue = [...fontFiles];

  // Promise로 폰트 로딩 완료 시점을 추적
  fontsLoadedPromise = new Promise((resolve) => {
    // 폰트 로딩 프로세스 시작
    processNextFont();

    // 폰트 로드 함수
    function loadFont(file) {
      const name = file.replace(/\.[^.]+$/, '');
      
      // 이미 로드된 폰트면 바로 성공 처리
      if (fontLoadStatus.loaded.has(name)) {
        processResult({ name, success: true });
        return;
      }
      
      // 이미 로드 중인 폰트는 건너뛰기
      if (fontLoadStatus.loading.has(name)) {
        return;
      }
      
      fontLoadStatus.loading.add(name);
      activeLoads++;
      
      new FontFace(name, `url(./Fonts/${encodeURIComponent(file)})`)
        .load()
        .then(face => {
          document.fonts.add(face);
          fontLoadStatus.loaded.add(name);
          processResult({ name, face, success: true });
        })
        .catch(() => {
          processResult({ name, success: false });
        });
    }
    
    // 결과 처리 함수
    function processResult(result) {
      activeLoads--;
      fontLoadStatus.loading.delete(result.name);
      
      if (result.success) {
        loadedCount++;
        if (result.face) loadedFonts.push({ name: result.name, face: result.face });
      } else {
        failedCount++;
      }
      
      statusDiv.textContent = `폰트 로드: ${loadedCount}개 성공, ${failedCount}개 실패`;
      
      // 다음 폰트 처리
      processNextFont();
      
      // 모든 폰트 처리 완료 확인
      checkCompletion();
    }
    
    // 다음 폰트 로드 처리
    function processNextFont() {
      if (activeLoads < MAX_PARALLEL_LOADS && fontQueue.length > 0) {
        const nextFont = fontQueue.shift();
        loadFont(nextFont);
        
        // 여유가 있으면 계속해서 처리
        if (activeLoads < MAX_PARALLEL_LOADS) {
          setTimeout(processNextFont, 0);
        }
      }
    }
    
    // 완료 확인
    function checkCompletion() {
      if (loadedCount + failedCount === fontFiles.length) {
        finalizeFontLoading();
      }
    }
    
    // 폰트 로딩 완료 처리
    function finalizeFontLoading() {
      loadedFonts.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      
      // 모든 폰트 선택 요소 업데이트
      const selectElements = [fontFamily, modalFontFamily].filter(Boolean);
      
      if (selectElements.length > 0) {
        // 옵션 엘리먼트를 한 번만 생성하여 메모리 효율 향상
        const fragment = document.createDocumentFragment();
        loadedFonts.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f.name;
          opt.textContent = f.name;
          opt.style.fontFamily = f.name;
          fragment.append(opt);
        });
        
        selectElements.forEach(select => {
          select.innerHTML = '';
          select.appendChild(fragment.cloneNode(true));
        });
      }
      
      statusDiv.textContent = `폰트 로드 완료: ${loadedFonts.length}개`;
      setTimeout(() => statusDiv.remove(), 1800);
      
      // 모든 폰트 로딩 완료 후 resolve 호출
      resolve(loadedFonts);
    }
    
    // 타임아웃 설정 - 너무 오래 기다리지 않도록
    setTimeout(() => {
      if (loadedCount + failedCount < fontFiles.length) {
        console.warn('일부 폰트 로딩 타임아웃 발생');
        finalizeFontLoading();
      }
    }, 5000);
  });

  // 로딩 중에도 기본 폰트를 추가하여 빈 드롭다운이 안 보이도록 함
  [fontFamily, modalFontFamily].forEach(select => {
    if (select && select.options.length === 0) {
      select.innerHTML = '<option value="sans-serif">기본 글꼴</option>';
    }
  });
  
  return fontsLoadedPromise;
}