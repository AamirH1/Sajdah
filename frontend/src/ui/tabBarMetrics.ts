export const FLOATING_TAB_BAR_HEIGHT = 70;
export const FLOATING_TAB_BAR_MIN_BOTTOM_GAP = 16;
export const FLOATING_TAB_BAR_EXTRA_CONTENT_GAP = 24;

export const getFloatingTabBarOffset = (bottomInset: number) =>
  Math.max(bottomInset, FLOATING_TAB_BAR_MIN_BOTTOM_GAP);

export const getFloatingTabBarContentPadding = (bottomInset: number) =>
  FLOATING_TAB_BAR_HEIGHT + getFloatingTabBarOffset(bottomInset) + FLOATING_TAB_BAR_EXTRA_CONTENT_GAP;
