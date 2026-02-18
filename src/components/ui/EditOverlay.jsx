/**
 * Edit-mode overlay rendered on top of each card.
 * Contains move, edit, visibility, resize, delete buttons and the drag handle.
 *
 * Extracted from the inline `getControls` function in App.jsx.
 */
import { memo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  GripVertical,
  Maximize2,
  Minimize2,
  Trash2,
} from '../../icons';

/** Prefixes for cards that support size toggling. */
const RESIZABLE_PREFIXES = [
  'light_', 'light.', 'vacuum.', 'automation.', 'climate_card_',
  'cost_card_', 'weather_temp_', 'androidtv_card_', 'calendar_card_',
  'todo_card_', 'nordpool_card_', 'car_card_', 'cover_card_', 'camera_card_',
];

/** Prefixes that cycle through 3 sizes (small → medium → large). */
const TRIPLE_SIZE_PREFIXES = ['calendar_card_', 'todo_card_'];

function canResize(editId, settings) {
  if (editId === 'car') return true;
  if (['entity', 'toggle', 'sensor'].includes(settings?.type)) return true;
  return RESIZABLE_PREFIXES.some(p => editId.startsWith(p));
}

function getNextSize(editId, currentSize) {
  if (TRIPLE_SIZE_PREFIXES.some(p => editId.startsWith(p))) {
    return currentSize === 'small' ? 'medium' : (currentSize === 'medium' ? 'large' : 'small');
  }
  return currentSize === 'small' ? 'large' : 'small';
}

function EditOverlay({
  _cardId,
  editId,
  _settingsKey,
  isHidden,
  currentSize,
  currentColSpan,
  maxColSpan,
  settings,
  canRemove,
  onMoveLeft,
  onMoveRight,
  onEdit,
  onToggleVisibility,
  onSaveSize,
  onSaveColSpan,
  onRemove,
  dragHandleProps,
  t,
}) {
  const resizeRef = useRef(null);
  const isSpacerCard = editId?.startsWith('spacer_card_');
  const isCompactSpacer = isSpacerCard && Number(settings?.heightPx || 0) > 0 && Number(settings?.heightPx || 0) <= 56;
  const showResize = canResize(editId, settings);
  const isSmall = currentSize === 'small';
  const isTriple = TRIPLE_SIZE_PREFIXES.some(p => editId.startsWith(p));
  const allowColResize = Number(maxColSpan || 1) > 1;
  const sizeOrder = isTriple ? ['small', 'medium', 'large'] : ['small', 'large'];
  const normalizedSize = sizeOrder.includes(currentSize) ? currentSize : sizeOrder[sizeOrder.length - 1];
  const colMin = 1;
  const colMax = Math.max(1, Number(maxColSpan || 1));
  const rowThreshold = 90;
  const colThreshold = 120;
  const stepCooldownMs = 90;
  const topOffsetClass = isCompactSpacer ? 'top-1' : 'top-2';
  const sideOffsetClass = isCompactSpacer ? 'left-1' : 'left-2';
  const rightOffsetClass = isCompactSpacer ? 'right-1' : 'right-2';
  const gapClass = isCompactSpacer ? 'gap-1' : 'gap-2';
  const buttonClass = isCompactSpacer
    ? 'p-1 rounded-full text-white border border-white/20 shadow-lg bg-black/60'
    : 'p-2 rounded-full text-white border border-white/20 shadow-lg bg-black/60';
  const hoverButtonClass = isCompactSpacer
    ? 'p-1 rounded-full transition-colors hover:bg-blue-500/80 text-white border border-white/20 shadow-lg bg-black/60'
    : 'p-2 rounded-full transition-colors hover:bg-blue-500/80 text-white border border-white/20 shadow-lg bg-black/60';
  const iconClass = isCompactSpacer ? 'w-3 h-3' : 'w-4 h-4';
  const dragHandleClass = isCompactSpacer
    ? 'flex items-center justify-center p-1.5 rounded-full bg-black/50 border border-white/10 text-white/80 shadow-lg pointer-events-auto'
    : 'flex items-center justify-center p-3 rounded-full bg-black/50 border border-white/10 text-white/80 shadow-lg pointer-events-auto';
  const dragIconClass = isCompactSpacer ? 'w-4 h-4' : 'w-5 h-5';

  const clearResizeSession = () => {
    resizeRef.current = null;
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    }
  };

  function handleWindowPointerMove(event) {
    const state = resizeRef.current;
    if (!state || event.pointerId !== state.pointerId) return;
    event.preventDefault();
    const now = Date.now();
    const cooldownActive = now - (state.lastStepAt || 0) < stepCooldownMs;

    const deltaX = (event.clientX - state.lastX) * state.horizontalDir;
    const deltaY = (event.clientY - state.lastY) * state.verticalDir;

    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.accX += deltaX;
    state.accY += deltaY;

    if (allowColResize && !cooldownActive) {
      if (state.accX >= colThreshold) {
        state.accX -= colThreshold;
        const nextCol = Math.min(colMax, state.colSpan + 1);
        if (nextCol !== state.colSpan) {
          state.colSpan = nextCol;
          onSaveColSpan?.(nextCol);
          state.lastStepAt = now;
        }
      }

      if (state.accX <= -colThreshold) {
        state.accX += colThreshold;
        const nextCol = Math.max(colMin, state.colSpan - 1);
        if (nextCol !== state.colSpan) {
          state.colSpan = nextCol;
          onSaveColSpan?.(nextCol);
          state.lastStepAt = now;
        }
      }
    }

    if (showResize && !cooldownActive) {
      if (state.accY >= rowThreshold) {
        state.accY -= rowThreshold;
        const nextIndex = Math.min(sizeOrder.length - 1, state.sizeIndex + 1);
        if (nextIndex !== state.sizeIndex) {
          state.sizeIndex = nextIndex;
          onSaveSize?.(sizeOrder[nextIndex]);
          state.lastStepAt = now;
        }
      }

      if (state.accY <= -rowThreshold) {
        state.accY += rowThreshold;
        const nextIndex = Math.max(0, state.sizeIndex - 1);
        if (nextIndex !== state.sizeIndex) {
          state.sizeIndex = nextIndex;
          onSaveSize?.(sizeOrder[nextIndex]);
          state.lastStepAt = now;
        }
      }
    }
  }

  function handleWindowPointerUp(event) {
    const state = resizeRef.current;
    if (!state || event.pointerId !== state.pointerId) return;
    event.preventDefault();
    clearResizeSession();
  }

  const startCornerResize = (event, corner) => {
    if (!showResize && !allowColResize) return;
    event.stopPropagation();
    event.preventDefault();

    const horizontalDir = corner.includes('right') ? 1 : -1;
    const verticalDir = corner.includes('bottom') ? 1 : -1;
    const currentIndex = sizeOrder.indexOf(normalizedSize);

    resizeRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      accX: 0,
      accY: 0,
      horizontalDir,
      verticalDir,
      sizeIndex: currentIndex >= 0 ? currentIndex : sizeOrder.length - 1,
      colSpan: Math.max(colMin, Math.min(colMax, Number(currentColSpan || 1))),
      lastStepAt: 0,
    };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
      window.addEventListener('pointerup', handleWindowPointerUp, { passive: false });
      window.addEventListener('pointercancel', handleWindowPointerUp, { passive: false });
    }
  };

  const cornerHandleClass = isCompactSpacer
    ? 'absolute z-50 w-3 h-3 rounded-sm border border-white/40 bg-black/60 backdrop-blur-sm'
    : 'absolute z-50 w-4 h-4 rounded-md border border-white/40 bg-black/60 backdrop-blur-sm';
  const showCornerHandles = showResize || allowColResize;

  return (
    <>
      {/* Move buttons – top left */}
      <div className={`absolute ${topOffsetClass} ${sideOffsetClass} z-50 flex ${gapClass}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveLeft(); }}
          className={hoverButtonClass}
          title={t('tooltip.moveLeft')}
        >
          <ChevronLeft className={iconClass} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveRight(); }}
          className={hoverButtonClass}
          title={t('tooltip.moveRight')}
        >
          <ChevronRight className={iconClass} />
        </button>
      </div>

      {/* Action buttons – top right */}
      <div className={`absolute ${topOffsetClass} ${rightOffsetClass} z-50 flex ${gapClass}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className={buttonClass}
          title={t('tooltip.editCard')}
        >
          <Edit2 className={iconClass} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className={`${isCompactSpacer ? 'p-1' : 'p-2'} rounded-full transition-colors hover:bg-white/20 text-white border border-white/20 shadow-lg`}
          style={{ backgroundColor: isHidden ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 0, 0, 0.6)' }}
          title={isHidden ? t('tooltip.showCard') : t('tooltip.hideCard')}
        >
          {isHidden ? <EyeOff className={iconClass} /> : <Eye className={iconClass} />}
        </button>
        {showResize && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSaveSize(getNextSize(editId, currentSize));
            }}
            className={`${isCompactSpacer ? 'p-1' : 'p-2'} rounded-full transition-colors hover:bg-purple-500/80 text-white border border-white/20 shadow-lg`}
            style={{ backgroundColor: isSmall ? 'rgba(168, 85, 247, 0.8)' : 'rgba(0, 0, 0, 0.6)' }}
            title={isTriple ? 'Bytt storleik' : (isSmall ? t('tooltip.largeSize') : t('tooltip.smallSize'))}
          >
            {isSmall ? <Maximize2 className={iconClass} /> : <Minimize2 className={iconClass} />}
          </button>
        )}
        {canRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className={`${isCompactSpacer ? 'p-1' : 'p-2'} rounded-full transition-colors hover:bg-red-500/80 text-white border border-white/20 shadow-lg bg-black/60`}
            title={t('tooltip.removeCard')}
          >
            <Trash2 className={iconClass} />
          </button>
        )}
      </div>

      {/* Central drag handle */}
      <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
        <div
          data-drag-handle
          {...dragHandleProps}
          style={{ touchAction: 'none' }}
          className={dragHandleClass}
        >
          <GripVertical className={dragIconClass} />
        </div>
      </div>

      {showCornerHandles && (
        <>
          <button
            type="button"
            className={`${cornerHandleClass} top-1 left-1 cursor-nwse-resize`}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={(event) => startCornerResize(event, 'top-left')}
            aria-label="Resize card from top left"
            title={t('tooltip.resizeCard') || 'Resize card'}
          />
          <button
            type="button"
            className={`${cornerHandleClass} top-1 right-1 cursor-nesw-resize`}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={(event) => startCornerResize(event, 'top-right')}
            aria-label="Resize card from top right"
            title={t('tooltip.resizeCard') || 'Resize card'}
          />
          <button
            type="button"
            className={`${cornerHandleClass} bottom-1 left-1 cursor-nesw-resize`}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={(event) => startCornerResize(event, 'bottom-left')}
            aria-label="Resize card from bottom left"
            title={t('tooltip.resizeCard') || 'Resize card'}
          />
          <button
            type="button"
            className={`${cornerHandleClass} bottom-1 right-1 cursor-nwse-resize`}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={(event) => startCornerResize(event, 'bottom-right')}
            aria-label="Resize card from bottom right"
            title={t('tooltip.resizeCard') || 'Resize card'}
          />
        </>
      )}
    </>
  );
}

export default memo(EditOverlay);
