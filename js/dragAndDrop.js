// js/dragAndDrop.js
import { state } from './state.js';
import { getEventPos } from './utils.js';
import { renderCanvas, positionModalNearText, updateModalControls, findTextAtPosition } from './canvasRenderer.js';

// 드래그 이벤트 최적화를 위한 변수들
let lastRenderTime = 0;
const RENDER_THROTTLE = 16; // 약 60fps

export function initDragAndDrop() {
  const canvas = state.canvas;
  
  // 이전 이벤트 리스너 제거 (중복 방지)
  canvas.removeEventListener('mousedown', handleStart);
  canvas.removeEventListener('mousemove', handleMove);
  canvas.removeEventListener('mouseup', handleEnd);
  canvas.removeEventListener('touchstart', handleStart);
  canvas.removeEventListener('touchmove', handleMove);
  canvas.removeEventListener('touchend', handleEnd);

  // 이벤트 리스너 등록
  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseup', handleEnd);
  canvas.addEventListener('touchstart', handleStart, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchend', handleEnd);
  
  // 캔버스 영역을 벗어나도 드래그가 계속되도록 window에도 이벤트 리스너 추가
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  function handleStart(e) {
    const { x, y } = getEventPos(e);
    const hit = findTextAtPosition(x, y);
    if (hit) {
      state.selectedText = hit;
      state.isDragging = true;
      state.dragOffset.x = x - hit.x;
      state.dragOffset.y = y - hit.y;
      updateModalControls(hit);
      const modal = document.getElementById('textControlModal');
      if (modal.classList.contains('hidden')) {
        positionModalNearText(hit);
      }
      modal.classList.remove('hidden');
      renderCanvas();
      e.preventDefault();
    } else {
      state.selectedText = null;
      document.getElementById('textControlModal').classList.add('hidden');
      renderCanvas();
    }
  }

  function handleMove(e) {
    if (!state.isDragging || !state.selectedText) return;
    
    const { x, y } = getEventPos(e);
    state.selectedText.x = x - state.dragOffset.x;
    state.selectedText.y = y - state.dragOffset.y;
    
    // 렌더링 스로틀링 적용
    const now = performance.now();
    if (now - lastRenderTime > RENDER_THROTTLE) {
      // 모달 위치도 함께 업데이트
      positionModalNearText(state.selectedText);
      requestAnimationFrame(renderCanvas);
      lastRenderTime = now;
    }
    
    e.preventDefault();
  }

  function handleEnd(e) {
    if (state.isDragging) {
      // 드래그가 끝나면 최종 위치에서 한 번 더 렌더링하여 부드러운 마무리
      positionModalNearText(state.selectedText);
      renderCanvas();
      state.isDragging = false;
    }
  }
}
