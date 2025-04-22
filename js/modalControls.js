// js/modalControls.js
import { state } from './state.js';
import { renderCanvas, positionModalNearText } from './canvasRenderer.js';

export function initModalControls() {
  const modal = document.getElementById('textControlModal');
  
  // 모든 입력 요소를 효율적으로 처리하기 위한 설정
  const controlConfigs = [
    { id: 'modalFontFamily', prop: 'font', event: 'change', parser: v => v },
    { id: 'modalFontSize', prop: 'size', event: 'input', parser: v => parseInt(v, 10) },
    { id: 'modalFontColor', prop: 'color', event: 'input', parser: v => v },
    { id: 'modalOpacity', prop: 'opacity', event: 'input', parser: v => parseFloat(v) },
    { id: 'modalLetterSpacing', prop: 'letterSpacing', event: 'input', parser: v => parseFloat(v) },
    { id: 'modalRotation', prop: 'rotation', event: 'input', parser: v => parseFloat(v) },
    { id: 'modalTextDirection', prop: 'direction', event: 'change', parser: v => v }
  ];
  
  // 이벤트 리스너 등록을 최적화
  controlConfigs.forEach(config => {
    const element = document.getElementById(config.id);
    if (!element) return;
    
    element.addEventListener(config.event, e => {
      if (!state.selectedText) return;
      
      // 불필요한 렌더링 방지를 위해 값 변경 검사
      const newValue = config.parser(e.target.value);
      if (state.selectedText[config.prop] !== newValue) {
        state.selectedText[config.prop] = newValue;
        renderCanvas();
        
        // 변경사항을 로깅 (디버깅용)
        if (config.prop === 'font') {
          console.log('Font changed to:', e.target.value);
        } else if (config.prop === 'size') {
          console.log('Size changed to:', e.target.value);
        }
      }
    });
  });

  // 특수 버튼 이벤트 처리
  document.getElementById('modalCenterBtn').addEventListener('click', () => {
    const centerBtn = document.getElementById('centerTextBtn');
    if (centerBtn) {
      centerBtn.click();
      if (state.selectedText) positionModalNearText(state.selectedText);
    }
  });

  document.getElementById('modalDeleteBtn').addEventListener('click', () => {
    const deleteBtn = document.getElementById('deleteTextBtn');
    if (deleteBtn) {
      deleteBtn.click();
      modal.classList.add('hidden');
    }
  });

  document.getElementById('modalCloseBtn').addEventListener('click', () => {
    modal.classList.add('hidden');
    state.selectedText = null; // 선택 해제 추가
    renderCanvas();
  });

  // 이벤트 위임을 사용하여 모달 외부 클릭 처리 최적화
  document.addEventListener('mousedown', e => {
    if (!modal.classList.contains('hidden') && 
        !modal.contains(e.target) && 
        e.target !== state.canvas) {
      modal.classList.add('hidden');
      state.selectedText = null;
      renderCanvas();
    }
  });
}