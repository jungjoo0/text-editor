// js/textControls.js
import { state } from './state.js';
import { renderCanvas, positionModalNearText, updateModalControls } from './canvasRenderer.js';

export function initTextControls() {
  const txtInput = document.getElementById('textInput');
  const fontFamily = document.getElementById('fontFamily');
  const fontSize = document.getElementById('fontSize');
  const fontColor = document.getElementById('fontColor');
  const opacity = document.getElementById('opacity');
  const rotation = document.getElementById('rotation');
  const textDirection = document.getElementById('textDirection');
  const letterSpacing = document.getElementById('letterSpacing');

  // 폼 컨트롤이 준비되었는지 확인
  if (fontFamily.options.length === 0) {
    console.warn('폰트 목록이 아직 로드되지 않았습니다. 기본 글꼴을 추가합니다.');
    const opt = document.createElement('option');
    opt.value = 'sans-serif';
    opt.textContent = '기본 글꼴';
    fontFamily.appendChild(opt);
  }

  // 텍스트 추가 버튼에 이벤트 리스너 추가 (한 번만 등록)
  const addTextBtn = document.getElementById('addTextBtn');
  addTextBtn.removeEventListener('click', handleAddText); // 중복 등록 방지
  addTextBtn.addEventListener('click', handleAddText);

  function handleAddText() {
    if (!txtInput.value.trim()) {
      alert('텍스트를 입력해주세요');
      return;
    }

    // 선택된 폰트 확인 및 기본값 설정
    const selectedFont = fontFamily.value || 'sans-serif';
    
    const newText = {
      text: txtInput.value,
      x: 50,
      y: 80,
      font: selectedFont,
      size: parseInt(fontSize.value, 10) || 36,
      color: fontColor.value || '#ffffff',
      opacity: parseFloat(opacity.value) || 1,
      rotation: parseFloat(rotation.value) || 0,
      direction: textDirection.value || 'horizontal',
      letterSpacing: parseFloat(letterSpacing.value) || 0
    };
    
    console.log('텍스트 추가:', newText);
    state.textObjects.push(newText);
    renderCanvas();
    
    // 스크롤 및 모달 표시 최적화
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        state.selectedText = newText;
        updateModalControls(newText);
        positionModalNearText(newText);      
        document.getElementById('textControlModal').classList.remove('hidden');
        renderCanvas();
      }, 300); // 스크롤 완료 후 모달 표시까지 시간 단축
    });
  }

  // 이벤트 위임을 사용하여 여러 입력 필드의 이벤트를 효율적으로 처리
  const controlsContainer = document.querySelector('.controls');
  controlsContainer.addEventListener('input', handleInputChange);

  function handleInputChange(e) {
    if (!state.selectedText) return;
    
    const target = e.target;
    // 필요한 입력 요소에 대해서만 처리
    if (![txtInput, fontFamily, fontSize, fontColor, opacity, rotation, textDirection, letterSpacing].includes(target)) {
      return;
    }

    // 이전 값과 비교하여 변경된 경우에만 상태 업데이트
    let needsUpdate = false;
    
    if (target === txtInput && state.selectedText.text !== target.value) {
      state.selectedText.text = target.value;
      needsUpdate = true;
    } else if (target === fontFamily && state.selectedText.font !== target.value) {
      state.selectedText.font = target.value;
      needsUpdate = true;
    } else if (target === fontSize && state.selectedText.size !== parseInt(target.value, 10)) {
      state.selectedText.size = parseInt(target.value, 10);
      needsUpdate = true;
    } else if (target === fontColor && state.selectedText.color !== target.value) {
      state.selectedText.color = target.value;
      needsUpdate = true;
    } else if (target === opacity && state.selectedText.opacity !== parseFloat(target.value)) {
      state.selectedText.opacity = parseFloat(target.value);
      needsUpdate = true;
    } else if (target === rotation && state.selectedText.rotation !== parseFloat(target.value)) {
      state.selectedText.rotation = parseFloat(target.value);
      needsUpdate = true;
    } else if (target === textDirection && state.selectedText.direction !== target.value) {
      state.selectedText.direction = target.value;
      needsUpdate = true;
    } else if (target === letterSpacing && state.selectedText.letterSpacing !== parseFloat(target.value)) {
      state.selectedText.letterSpacing = parseFloat(target.value);
      needsUpdate = true;
    }
    
    // 변경된 경우에만 캔버스 다시 그리기
    if (needsUpdate) {
      requestAnimationFrame(renderCanvas); // 최적화된 렌더링 요청
    }
  }

  // 삭제 버튼 이벤트 리스너
  const deleteTextBtn = document.getElementById('deleteTextBtn');
  deleteTextBtn.removeEventListener('click', handleDeleteText); // 중복 등록 방지
  deleteTextBtn.addEventListener('click', handleDeleteText);

  function handleDeleteText() {
    if (state.selectedText) {
      state.textObjects = state.textObjects.filter(t => t !== state.selectedText);
      state.selectedText = null;
      renderCanvas();
    }
  }

  // 중앙 정렬 버튼 이벤트 리스너
  const centerTextBtn = document.getElementById('centerTextBtn');
  centerTextBtn.removeEventListener('click', handleCenterText); // 중복 등록 방지
  centerTextBtn.addEventListener('click', handleCenterText);

  function handleCenterText() {
    if (!state.selectedText) return;
    const canvasCenterX = (state.canvas.width / state.canvasScale) / 2;
    state.ctx.font = `${state.selectedText.size}px ${state.selectedText.font}`;

    let textWidth = state.selectedText.direction === 'vertical'
      ? state.selectedText.size
      : state.ctx.measureText(state.selectedText.text).width + (state.selectedText.letterSpacing || 0) * (state.selectedText.text.length - 1);

    state.selectedText.x = canvasCenterX - textWidth / 2;
    renderCanvas();
  }
}