type RevisionWithEditedAt = {
  editedAt?: string;
};

export function getOrderedExpenseRevisions<T extends RevisionWithEditedAt>(revisions?: T[]) {
  return (revisions || [])
    .map((revision, index) => ({ index, revision }))
    .sort((left, right) => {
      const leftTime = getRevisionTime(left.revision.editedAt);
      const rightTime = getRevisionTime(right.revision.editedAt);
      return leftTime - rightTime || left.index - right.index;
    })
    .map(({ revision }) => revision);
}

function getRevisionTime(editedAt?: string) {
  const time = Date.parse(editedAt || "");

  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

export function getExpenseRevisionIndexLabel(index: number) {
  return `第 ${index + 1} 次修改`;
}
