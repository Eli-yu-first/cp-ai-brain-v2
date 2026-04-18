export type Viewport = {
  startIndex: number;
  endIndex: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createTrailingViewport(length: number, preferredWindow = 10): Viewport {
  if (length <= 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  const windowSize = clamp(preferredWindow, 1, length);
  return {
    startIndex: length - windowSize,
    endIndex: length - 1,
  };
}

export function normalizeViewport(length: number, viewport: Viewport): Viewport {
  if (length <= 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  const safeStart = clamp(viewport.startIndex, 0, length - 1);
  const safeEnd = clamp(viewport.endIndex, safeStart, length - 1);
  return { startIndex: safeStart, endIndex: safeEnd };
}

export function shiftViewport(length: number, viewport: Viewport, offset: number): Viewport {
  if (length <= 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  const normalized = normalizeViewport(length, viewport);
  const windowSize = normalized.endIndex - normalized.startIndex;
  let nextStart = normalized.startIndex + offset;
  let nextEnd = normalized.endIndex + offset;

  if (nextStart < 0) {
    nextEnd += -nextStart;
    nextStart = 0;
  }

  if (nextEnd > length - 1) {
    const overflow = nextEnd - (length - 1);
    nextStart -= overflow;
    nextEnd = length - 1;
  }

  nextStart = clamp(nextStart, 0, Math.max(0, length - 1 - windowSize));
  nextEnd = clamp(nextStart + windowSize, nextStart, length - 1);

  return { startIndex: nextStart, endIndex: nextEnd };
}

export function zoomViewport(length: number, viewport: Viewport, direction: "in" | "out", step = 2): Viewport {
  if (length <= 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  const normalized = normalizeViewport(length, viewport);
  const currentWindow = normalized.endIndex - normalized.startIndex + 1;
  const targetWindow = direction === "in"
    ? clamp(currentWindow - step, 4, length)
    : clamp(currentWindow + step, 4, length);

  const center = (normalized.startIndex + normalized.endIndex) / 2;
  let nextStart = Math.round(center - targetWindow / 2);
  let nextEnd = nextStart + targetWindow - 1;

  if (nextStart < 0) {
    nextStart = 0;
    nextEnd = targetWindow - 1;
  }

  if (nextEnd > length - 1) {
    nextEnd = length - 1;
    nextStart = Math.max(0, nextEnd - targetWindow + 1);
  }

  return { startIndex: nextStart, endIndex: nextEnd };
}
