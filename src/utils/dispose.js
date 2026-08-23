// Recursively free GPU resources owned by an Object3D subtree.

function disposeMaterial(material) {
  for (const key of Object.keys(material)) {
    const value = material[key];
    if (value && typeof value === 'object' && value.isTexture) {
      value.dispose();
    }
  }
  material.dispose();
}

export function disposeObject(root) {
  if (!root) return;
  root.traverse((node) => {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      if (Array.isArray(node.material)) node.material.forEach(disposeMaterial);
      else disposeMaterial(node.material);
    }
  });
  if (root.parent) root.parent.remove(root);
}
