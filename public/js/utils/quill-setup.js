const createEditor = (selector, hiddenInputName) => {
  const editor = document.querySelector(selector);
  if (!editor) return null;

  const quill = new Quill(selector, {
	modules: { toolbar: true },
	theme: 'snow'
  });
  
  if (hiddenInputName) {
      const hidden = document.querySelector(`[name="${hiddenInputName}"]`);
      
      if (hidden) {
          const form = editor.closest('form');
          if (form) {
            form.addEventListener('submit', () => {
              hidden.value = quill.root.innerHTML;
            });
          }
      } else {
          console.warn(`Quill editor created for "${selector}" but hidden input "[name=${hiddenInputName}]" was not found.`);
      }
  }

  return quill;
}