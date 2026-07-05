// 페이지네이션 번호 목록 생성 유틸 — 현재 페이지 주변 번호를 항상 보여주고,
// 처음/끝과 멀리 떨어지면 "..."으로 생략한다. (예: 1 ... 14 15 16 ... 25)

export const DOTS = "...";

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * 0-indexed 페이지 번호 배열을 생성한다.
 * @param {number} currentPage - 0-indexed 현재 페이지
 * @param {number} totalPages - 전체 페이지 수
 * @param {number} siblingCount - 현재 페이지 좌우로 몇 개씩 보여줄지 (기본 1)
 * @returns {(number|typeof DOTS)[]} 예: [0, DOTS, 13, 14, 15, DOTS, 24]
 */
export function getPageNumbers(currentPage, totalPages, siblingCount = 1) {
  const totalPageNumbers = siblingCount * 2 + 5; // 처음 + 끝 + 현재 + 좌우 sibling + 점(...) 2개

  if (totalPageNumbers >= totalPages) {
    return range(0, totalPages - 1);
  }

  const firstPageIndex = 0;
  const lastPageIndex = totalPages - 1;

  const leftSiblingIndex = Math.max(currentPage - siblingCount, firstPageIndex);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, lastPageIndex);

  const shouldShowLeftDots = leftSiblingIndex > firstPageIndex + 1;
  const shouldShowRightDots = rightSiblingIndex < lastPageIndex - 1;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    return [...range(firstPageIndex, leftItemCount - 1), DOTS, lastPageIndex];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    return [firstPageIndex, DOTS, ...range(totalPages - rightItemCount, lastPageIndex)];
  }

  return [
    firstPageIndex,
    DOTS,
    ...range(leftSiblingIndex, rightSiblingIndex),
    DOTS,
    lastPageIndex,
  ];
}
