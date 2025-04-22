// js/canvasRenderer.js
import { state } from './state.js';

// 렌더링 최적화를 위한 변수
let renderPending = false;

export function renderCanvas() {
  if (renderPending) return; // 이미 렌더링이 예약된 경우 중복 요청 방지
  
  renderPending = true;
  
  // 다음 프레임에 렌더링 작업 스케줄링
  requestAnimationFrame(() => {
    renderPending = false;
    performRender();
  });
}

function performRender() {
  const { ctx, canvas, img, textObjects, canvasScale } = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 이미지가 있는 경우에만 그리기
  if (img.complete && img.src) {
    const w = canvas.width / canvasScale;
    const h = canvas.height / canvasScale;
    ctx.drawImage(img, 0, 0, w, h);
  }
  
  // 텍스트 객체 렌더링
  textObjects.forEach(t => {
    // 화면 밖에 있는 텍스트는 렌더링 생략 (최적화)
    const canvasWidth = canvas.width / canvasScale;
    const canvasHeight = canvas.height / canvasScale;
    
    // 화면 좌표를 벗어난 텍스트 객체를 렌더링하지 않음
    const padding = Math.max(t.size * 2, 200); // 충분한 여백을 두어 회전된 텍스트도 고려
    if (t.x < -padding || t.x > canvasWidth + padding || 
        t.y < -padding || t.y > canvasHeight + padding) {
      return; // 화면 밖 텍스트는 렌더링 건너뛰기
    }
    
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.globalAlpha = t.opacity;
    ctx.font = `${t.size}px ${t.font}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = t.color;

    // 텍스트 방향에 따라 다르게 렌더링
    const spacing = t.letterSpacing || 0;
    if (t.direction === 'vertical') {
      renderVerticalText(ctx, t.text, spacing, t.size);
    } else {
      renderHorizontalText(ctx, t.text, spacing);
    }

    // 선택된 텍스트에 테두리 효과 적용
    if (t === state.selectedText) {
      renderSelectionBorder(ctx, t);
    }
    
    ctx.restore();
  });
}

// 수직 텍스트 렌더링 함수
function renderVerticalText(ctx, text, spacing, fontSize) {
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], 0, i * (fontSize + spacing));
  }
}

// 수평 텍스트 렌더링 함수
function renderHorizontalText(ctx, text, spacing) {
  if (!spacing) {
    ctx.fillText(text, 0, 0);
    return;
  }
  
  let xPos = 0;
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], xPos, 0);
    xPos += ctx.measureText(text[i]).width + spacing;
  }
}

// 선택 테두리 렌더링 함수
function renderSelectionBorder(ctx, t) {
  let textWidth = t.direction === 'vertical'
    ? t.size
    : ctx.measureText(t.text).width + (t.letterSpacing || 0) * (t.text.length - 1);
  let textHeight = t.direction === 'vertical'
    ? t.text.length * (t.size + (t.letterSpacing || 0))
    : t.size;
  
  // 패딩 추가
  const padding = Math.max(4, t.size * 0.08);
  
  // 반투명 배경 그리기
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#59b4ad';
  ctx.beginPath();
  roundRect(ctx, -padding, -padding, textWidth + padding*2, textHeight + padding*2, padding/2);
  ctx.fill();
  
  // 테두리 그리기
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#59b4ad';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  roundRect(ctx, -padding, -padding, textWidth + padding*2, textHeight + padding*2, padding/2);
  ctx.stroke();
  
  // 모서리 포인트 그리기
  const cornerSize = Math.max(4, t.size * 0.07);
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#59b4ad';
  ctx.lineWidth = 1;
  
  // 코너 포인트를 텍스트 모서리에 더 가깝게 배치
  [
    [-padding/2, -padding/2], // 왼쪽 위
    [textWidth + padding/2, -padding/2], // 오른쪽 위
    [-padding/2, textHeight + padding/2], // 왼쪽 아래
    [textWidth + padding/2, textHeight + padding/2] // 오른쪽 아래
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, cornerSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

// Canvas API에 roundRect가 없는 브라우저를 위한 폴리필
function roundRect(ctx, x, y, width, height, radius) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  
  // 폴리필 구현
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
}

export function positionModalNearText(textObj) {
  const canvasRect = state.canvas.getBoundingClientRect();
  const modalWidth = 280;
  const textScreenX = canvasRect.left + textObj.x;
  const textScreenY = canvasRect.top + textObj.y;

  state.ctx.font = `${textObj.size}px ${textObj.font}`;
  let textWidth, textHeight;
  if (textObj.direction === 'vertical') {
    textWidth = textObj.size;
    textHeight = textObj.text.length * textObj.size;
  } else {
    textWidth = state.ctx.measureText(textObj.text).width;
    textHeight = textObj.size;
  }

  let modalX = textScreenX + textWidth / 2 - modalWidth / 2;
  let modalY = textScreenY + textHeight + 20;
  if (modalX < 10) modalX = 10;
  if (modalX + modalWidth > window.innerWidth - 10) {
    modalX = window.innerWidth - modalWidth - 10;
  }

  const modal = document.getElementById('textControlModal');
  modal.style.left = `${modalX}px`;
  modal.style.top = `${modalY}px`;
}

export function updateModalControls(textObj) {
  document.getElementById('modalFontFamily').value = textObj.font;
  
  // 모달 폰트 디스플레이 업데이트
  const modalFontDisplay = document.getElementById('modalFontDisplay');
  if (modalFontDisplay) {
    const fontFamily = document.getElementById('fontFamily');
    const option = Array.from(fontFamily.options).find(opt => opt.value === textObj.font);
    if (option) {
      modalFontDisplay.textContent = option.textContent;
      modalFontDisplay.style.fontFamily = option.value;
    }
  }
  
  document.getElementById('modalFontSize').value = textObj.size;
  document.getElementById('modalFontColor').value = textObj.color;
  document.getElementById('modalOpacity').value = textObj.opacity;
  document.getElementById('modalLetterSpacing').value = textObj.letterSpacing || 0;
  document.getElementById('modalRotation').value = textObj.rotation;
  document.getElementById('modalTextDirection').value = textObj.direction;
}

export function updateControlsFromText(textObj) {
  document.getElementById('textInput').value = textObj.text;
  document.getElementById('fontFamily').value = textObj.font;
  document.getElementById('fontSize').value = textObj.size;
  document.getElementById('fontColor').value = textObj.color;
  document.getElementById('opacity').value = textObj.opacity;
  document.getElementById('rotation').value = textObj.rotation;
  document.getElementById('textDirection').value = textObj.direction;
  document.getElementById('letterSpacing').value = textObj.letterSpacing || 0;
}

export function findTextAtPosition(x, y) {
  // 텍스트 히트 테스트 최적화
  const hitPadding = 15; // 터치 영역 확대
  
  // 최근에 렌더링된 텍스트부터 검사 (맨 위에 있는 텍스트)
  for (let i = state.textObjects.length - 1; i >= 0; i--) {
    const t = state.textObjects[i];
    
    // 빠른 경계 박스 검사 (rotation 고려 X)
    const boxWidth = t.direction === 'vertical' ? t.size : state.ctx.measureText(t.text).width + 2 * hitPadding;
    const boxHeight = t.direction === 'vertical' ? t.text.length * (t.size + (t.letterSpacing || 0)) : t.size;
    
    // 회전을 고려하지 않은 빠른 배제 검사
    const fastReject = x < t.x - boxWidth || 
                       x > t.x + boxWidth || 
                       y < t.y - boxHeight || 
                       y > t.y + boxHeight;
                       
    if (fastReject) continue;
    
    // 상세 히트 테스트
    state.ctx.save();
    state.ctx.font = `${t.size}px ${t.font}`;
    state.ctx.textBaseline = 'top';

    let textWidth, textHeight;
    const spacing = t.letterSpacing || 0;
    
    if (t.direction === 'vertical') {
      textWidth = t.size;
      textHeight = t.text.length * (t.size + spacing);
    } else {
      textWidth = state.ctx.measureText(t.text).width + spacing * (t.text.length - 1);
      textHeight = t.size;
    }
    
    // 패딩 추가 (터치 감도 향상)
    const padding = Math.max(8, t.size * 0.15);
    textWidth += padding * 2;
    textHeight += padding * 2;

    // 회전을 고려한 좌표 변환
    const dx = x - t.x + padding;
    const dy = y - t.y + padding;
    const angle = (-t.rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
    state.ctx.restore();

    if (
      rotatedX >= 0 && rotatedX <= textWidth &&
      rotatedY >= 0 && rotatedY <= textHeight
    ) {
      return t;
    }
  }
  return null;
}